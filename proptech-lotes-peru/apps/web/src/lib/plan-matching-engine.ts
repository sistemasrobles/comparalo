// ============================================
// PLAN MATCHING ENGINE
// Matches detected polygons + OCR labels with
// Excel inventory (LotData[])
// ============================================

import type { LotData, DetectedPlanLot, DetectionReviewStatus } from './projects-data';
import type { RawContour } from './plan-detection-engine';
import type { DetectedLabel } from './plan-ocr-engine';
import { lotLikenessScore } from './plan-detection-engine';

export interface MatchResult {
  detections: DetectedPlanLot[];
  stats: {
    total: number;
    matched: number;
    ambiguous: number;
    unmatched: number;
  };
}

/** Generate a unique ID */
function genDetectionId(): string {
  return `det_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Normalize a lot label for comparison.
 * "Mz A - Lt 01" → "A-01"
 * "A-1" → "A-01"
 * "A.01" → "A-01"
 */
function normalizeLotLabel(label: string): string {
  const cleaned = label
    .toUpperCase()
    .replace(/MZ\.?\s*/g, '')
    .replace(/LT\.?\s*/g, '')
    .replace(/LOTE?\s*/g, '')
    .replace(/\s*[-–./]\s*/g, '-')
    .replace(/\s+/g, '-')
    .trim();

  // Pad lote number
  const match = cleaned.match(/^([A-Z]+\d{0,2})-?(\d+[A-Z]?)$/);
  if (match) {
    const mz = match[1];
    const lt = match[2].replace(/^(\d+)/, (m) => m.padStart(2, '0'));
    return `${mz}-${lt}`;
  }

  return cleaned;
}

/**
 * Build a lookup map from inventory lots for fast matching.
 */
function buildLotLookup(lots: LotData[]): Map<string, LotData[]> {
  const lookup = new Map<string, LotData[]>();

  for (const lot of lots) {
    // Generate multiple keys for fuzzy matching
    const keys = new Set<string>();

    // From label
    keys.add(normalizeLotLabel(lot.label));

    // From manzana + lote
    const ltStr = String(lot.lote).padStart(2, '0');
    keys.add(`${lot.manzana}-${ltStr}`);

    // Also without padding
    keys.add(`${lot.manzana}-${lot.lote}`);

    // With fila if available
    if (lot.fila) {
      keys.add(`${lot.manzana}-${lot.fila}`);
    }

    for (const key of keys) {
      const existing = lookup.get(key) || [];
      existing.push(lot);
      lookup.set(key, existing);
    }
  }

  return lookup;
}

/**
 * Try to match a detected label against the inventory lookup.
 * Returns the best match or null.
 */
function findBestMatch(
  label: DetectedLabel,
  lookup: Map<string, LotData[]>,
  alreadyMatched: Set<string>
): { lot: LotData; confidence: number; status: DetectionReviewStatus } | null {
  const normalized = label.normalized.toUpperCase();

  // Exact match
  const exactCandidates = lookup.get(normalized);
  if (exactCandidates) {
    const available = exactCandidates.filter((l) => !alreadyMatched.has(l.id));
    if (available.length === 1) {
      return { lot: available[0], confidence: 0.9, status: 'matched' };
    }
    if (available.length > 1) {
      return { lot: available[0], confidence: 0.5, status: 'ambiguous' };
    }
  }

  // Try with manzana-lote combo
  if (label.manzana && label.lote) {
    const key = `${label.manzana}-${label.lote}`;
    const candidates = lookup.get(key);
    if (candidates) {
      const available = candidates.filter((l) => !alreadyMatched.has(l.id));
      if (available.length === 1) {
        return { lot: available[0], confidence: 0.85, status: 'matched' };
      }
      if (available.length > 1) {
        return { lot: available[0], confidence: 0.45, status: 'ambiguous' };
      }
    }
  }

  // Try fuzzy: remove leading zeros, try different padding
  const fuzzyKeys = [
    normalized.replace(/-0+/g, '-'),
    normalized.replace(/-(\d+)/, (_, n) => `-${String(parseInt(n)).padStart(2, '0')}`),
    normalized.replace(/-(\d+)/, (_, n) => `-${String(parseInt(n)).padStart(3, '0')}`),
  ];

  for (const fk of fuzzyKeys) {
    const candidates = lookup.get(fk);
    if (candidates) {
      const available = candidates.filter((l) => !alreadyMatched.has(l.id));
      if (available.length >= 1) {
        return {
          lot: available[0],
          confidence: 0.6,
          status: available.length === 1 ? 'matched' : 'ambiguous',
        };
      }
    }
  }

  return null;
}

/**
 * Main matching function: takes detected contours + labels and matches
 * against the project's lot inventory.
 */
export function matchDetectionsToInventory(
  contours: RawContour[],
  labels: DetectedLabel[],
  lots: LotData[]
): MatchResult {
  const lookup = buildLotLookup(lots);
  const alreadyMatched = new Set<string>();
  const detections: DetectedPlanLot[] = [];

  for (let i = 0; i < contours.length; i++) {
    const contour = contours[i];
    const label = labels[i];
    const likeness = lotLikenessScore(contour);

    // Try matching
    const matchResult = findBestMatch(label, lookup, alreadyMatched);

    const detection: DetectedPlanLot = {
      id: genDetectionId(),
      polygon: contour.points,
      bbox: contour.bbox,
      centroid: contour.centroid,
      detectedLabel: label.raw,
      normalizedLabel: label.normalized,
      detectionConfidence: likeness,
      ocrConfidence: label.confidence,
      matchedLotId: matchResult?.lot.id || null,
      reviewStatus: matchResult?.status || 'unmatched',
    };

    if (matchResult?.lot) {
      alreadyMatched.add(matchResult.lot.id);
    }

    detections.push(detection);
  }

  // Calculate stats
  const stats = {
    total: detections.length,
    matched: detections.filter((d) => d.reviewStatus === 'matched').length,
    ambiguous: detections.filter((d) => d.reviewStatus === 'ambiguous').length,
    unmatched: detections.filter((d) => d.reviewStatus === 'unmatched').length,
  };

  return { detections, stats };
}

/**
 * Re-match a single detection with a specific lot (admin override).
 */
export function reassignDetection(
  detection: DetectedPlanLot,
  newLotId: string
): DetectedPlanLot {
  return {
    ...detection,
    matchedLotId: newLotId,
    reviewStatus: 'approved',
  };
}

/**
 * Approve a detection (mark as verified by admin).
 */
export function approveDetection(detection: DetectedPlanLot): DetectedPlanLot {
  return {
    ...detection,
    reviewStatus: 'approved',
  };
}

/**
 * Reject a detection (false positive).
 */
export function rejectDetection(detection: DetectedPlanLot): DetectedPlanLot {
  return {
    ...detection,
    reviewStatus: 'rejected',
    matchedLotId: null,
  };
}

/**
 * Bulk auto-approve all high-confidence matches.
 */
export function autoApproveHighConfidence(
  detections: DetectedPlanLot[],
  minConfidence: number = 0.7
): DetectedPlanLot[] {
  return detections.map((d) => {
    if (
      d.reviewStatus === 'matched' &&
      d.detectionConfidence >= minConfidence &&
      d.ocrConfidence >= minConfidence
    ) {
      return { ...d, reviewStatus: 'approved' as const };
    }
    return d;
  });
}
