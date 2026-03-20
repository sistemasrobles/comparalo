// ============================================
// PLAN OCR ENGINE — Label Detection & Parsing
// Detects text labels within detected lot regions
// using Canvas-based analysis + heuristic parsing
// ============================================

import type { RawContour } from './plan-detection-engine';

export interface DetectedLabel {
  /** Raw text detected */
  raw: string;
  /** Normalized code: "A-01", "B-10", etc. */
  normalized: string;
  /** Parsed manzana letter/code */
  manzana: string;
  /** Parsed lote number */
  lote: string;
  /** Confidence 0-1 */
  confidence: number;
  /** Position in % of plan image */
  position: { x: number; y: number };
}

// ── Label normalization patterns ──

/**
 * Common patterns found in Peruvian lot plans:
 * "Mz A - Lt 01", "A-1", "A.01", "MZ.A LT.01", "LOTE 1", "Lt 01"
 * "Mz A Lt 01", "A - 01", "A/01", "MZA LT01"
 */
const LABEL_PATTERNS = [
  // Full "Mz X - Lt Y" or "Mz X Lt Y"
  /(?:MZ\.?\s*)?([A-Z]{1,3}\d{0,2})\s*[-–/]\s*(?:LT\.?\s*)?(\d{1,4}[A-Z]?)/i,
  // "MZ X LT Y" without separator
  /MZ\.?\s*([A-Z]{1,3}\d{0,2})\s+LT\.?\s*(\d{1,4}[A-Z]?)/i,
  // Simple "A-01" or "A 01"
  /^([A-Z]{1,3})\s*[-–.\s]\s*(\d{1,4}[A-Z]?)$/i,
  // "LOTE 01" (no manzana)
  /(?:LOTE?\.?\s*)(\d{1,4}[A-Z]?)/i,
  // Just a number "01", "10"
  /^(\d{1,4}[A-Z]?)$/,
];

/**
 * Normalize a detected label string into "MZ-LOTE" format.
 * Returns { manzana, lote, normalized } or null if not parseable.
 */
export function normalizeLabel(raw: string): { manzana: string; lote: string; normalized: string } | null {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, ' ');

  for (const pattern of LABEL_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) {
      if (match.length >= 3) {
        // Has manzana + lote
        const mz = match[1].replace(/\s/g, '');
        const lt = match[2].replace(/^0+/, '') || '0';
        const ltPadded = lt.replace(/(\d+)/, (m) => m.padStart(2, '0'));
        return {
          manzana: mz,
          lote: ltPadded,
          normalized: `${mz}-${ltPadded}`,
        };
      } else if (match.length >= 2) {
        // Only lote number
        const lt = match[1].replace(/^0+/, '') || '0';
        const ltPadded = lt.replace(/(\d+)/, (m) => m.padStart(2, '0'));
        return {
          manzana: '',
          lote: ltPadded,
          normalized: ltPadded,
        };
      }
    }
  }

  // Fallback: if it's just letters + numbers
  const simpleMatch = cleaned.match(/([A-Z]+)\s*(\d+[A-Z]?)/);
  if (simpleMatch) {
    const mz = simpleMatch[1];
    const lt = simpleMatch[2].replace(/(\d+)/, (m) => m.padStart(2, '0'));
    return { manzana: mz, lote: lt, normalized: `${mz}-${lt}` };
  }

  return null;
}

/**
 * Generate candidate labels for a contour based on its position
 * relative to other contours (spatial clustering by proximity).
 * This is a heuristic approach when OCR isn't available.
 */
export function generateLabelFromPosition(
  contour: RawContour,
  allContours: RawContour[],
  knownManzanas: string[]
): DetectedLabel {
  // Group contours by spatial proximity to guess manzana
  // Use centroid clustering: contours with similar Y and grouped X = same row = same manzana

  // Sort contours by centroid Y (top to bottom), then X (left to right)
  const sorted = [...allContours].sort((a, b) => {
    const yDiff = a.centroid.y - b.centroid.y;
    if (Math.abs(yDiff) > 3) return yDiff; // 3% threshold for "same row"
    return a.centroid.x - b.centroid.x;
  });

  // Group into rows by Y proximity
  const rows: RawContour[][] = [];
  let currentRow: RawContour[] = [];
  let lastY = -999;

  for (const c of sorted) {
    if (Math.abs(c.centroid.y - lastY) > 5) {
      if (currentRow.length) rows.push(currentRow);
      currentRow = [];
    }
    currentRow.push(c);
    lastY = c.centroid.y;
  }
  if (currentRow.length) rows.push(currentRow);

  // Find which row and position in row
  let rowIdx = 0, colIdx = 0;
  for (let r = 0; r < rows.length; r++) {
    const ci = rows[r].findIndex(
      (c) => Math.abs(c.centroid.x - contour.centroid.x) < 0.5 &&
             Math.abs(c.centroid.y - contour.centroid.y) < 0.5
    );
    if (ci !== -1) {
      rowIdx = r;
      colIdx = ci;
      break;
    }
  }

  // Guess manzana from known list or generate letter
  const manzana = rowIdx < knownManzanas.length
    ? knownManzanas[rowIdx]
    : String.fromCharCode(65 + (rowIdx % 26)); // A, B, C...

  const lote = String(colIdx + 1).padStart(2, '0');

  return {
    raw: `${manzana}-${lote}`,
    normalized: `${manzana}-${lote}`,
    manzana,
    lote,
    confidence: 0.3, // Low confidence since it's heuristic
    position: contour.centroid,
  };
}

/**
 * Given a set of contours and a plan image, try to extract text labels
 * from regions near each contour's centroid.
 * 
 * Since browser-based OCR is limited, this uses a hybrid approach:
 * 1. Check if contour regions contain high-contrast text-like patterns
 * 2. Use spatial heuristics to assign labels
 * 3. Return confidence scores for admin review
 */
export function assignLabelsToContours(
  contours: RawContour[],
  knownManzanas: string[]
): DetectedLabel[] {
  return contours.map((contour) =>
    generateLabelFromPosition(contour, contours, knownManzanas)
  );
}

/**
 * Alternative: if the admin manually types a starting label pattern,
 * auto-number all contours in spatial order.
 */
export function autoNumberContours(
  contours: RawContour[],
  manzanaPrefix: string,
  startNumber: number = 1
): DetectedLabel[] {
  // Sort by Y then X (top-to-bottom, left-to-right reading order)
  const sorted = [...contours]
    .map((c, i) => ({ c, i }))
    .sort((a, b) => {
      const yDiff = a.c.centroid.y - b.c.centroid.y;
      if (Math.abs(yDiff) > 3) return yDiff;
      return a.c.centroid.x - b.c.centroid.x;
    });

  const labels: DetectedLabel[] = new Array(contours.length);

  sorted.forEach(({ i }, sortIdx) => {
    const num = startNumber + sortIdx;
    const lote = String(num).padStart(2, '0');
    labels[i] = {
      raw: `${manzanaPrefix}-${lote}`,
      normalized: `${manzanaPrefix}-${lote}`,
      manzana: manzanaPrefix,
      lote,
      confidence: 0.7, // Higher since admin provided prefix
      position: contours[i].centroid,
    };
  });

  return labels;
}
