// ============================================
// PLAN DETECTION ENGINE — Browser-based CV
// Detects lot polygons from a master plan image
// using Canvas API: grayscale → threshold →
// edge detection → contour tracing → polygon simplification
// ============================================

export interface RawContour {
  points: number[][];       // [x, y] in pixel coords
  area: number;             // pixel area
  perimeter: number;
  bbox: { x: number; y: number; w: number; h: number };
  centroid: { x: number; y: number };
}

export interface DetectionConfig {
  /** Threshold for binarization (0-255). Auto if 0. */
  threshold: number;
  /** Minimum contour area as % of image area (filter noise) */
  minAreaPercent: number;
  /** Maximum contour area as % of image area (filter huge regions) */
  maxAreaPercent: number;
  /** Epsilon for polygon simplification (Douglas-Peucker) as fraction of perimeter */
  simplifyEpsilon: number;
  /** Whether to invert binary (dark lines on white = true) */
  invertBinary: boolean;
  /** Blur radius for noise reduction */
  blurRadius: number;
  /** Edge detection mode */
  edgeMode: 'canny' | 'threshold';
}

export const DEFAULT_CONFIG: DetectionConfig = {
  threshold: 0,          // auto (Otsu)
  minAreaPercent: 0.05,  // 0.05% of image
  maxAreaPercent: 25,    // 25% of image
  simplifyEpsilon: 0.015,
  invertBinary: true,
  blurRadius: 1,
  edgeMode: 'threshold',
};

// ── Helpers ──

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getImageData(img: HTMLImageElement): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

function toGrayscale(data: ImageData): Uint8Array {
  const gray = new Uint8Array(data.width * data.height);
  const d = data.data;
  for (let i = 0; i < gray.length; i++) {
    const j = i * 4;
    gray[i] = Math.round(0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]);
  }
  return gray;
}

/** Simple box blur */
function boxBlur(gray: Uint8Array, w: number, h: number, radius: number): Uint8Array {
  if (radius < 1) return gray;
  const out = new Uint8Array(gray.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < h && nx >= 0 && nx < w) {
            sum += gray[ny * w + nx];
            count++;
          }
        }
      }
      out[y * w + x] = Math.round(sum / count);
    }
  }
  return out;
}

/** Otsu's automatic thresholding */
function otsuThreshold(gray: Uint8Array): number {
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < gray.length; i++) histogram[gray[i]]++;

  const total = gray.length;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumB = 0, wB = 0, maxVariance = 0, threshold = 0;
  for (let i = 0; i < 256; i++) {
    wB += histogram[i];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += i * histogram[i];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) * (mB - mF);
    if (variance > maxVariance) {
      maxVariance = variance;
      threshold = i;
    }
  }
  return threshold;
}

/** Binarize → 0 or 255 */
function binarize(gray: Uint8Array, thresh: number, invert: boolean): Uint8Array {
  const bin = new Uint8Array(gray.length);
  for (let i = 0; i < gray.length; i++) {
    const val = gray[i] < thresh ? 0 : 255;
    bin[i] = invert ? (255 - val) : val;
  }
  return bin;
}

/** Sobel edge detection → binary edge map */
function sobelEdges(gray: Uint8Array, w: number, h: number): Uint8Array {
  const edges = new Uint8Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = (i: number, j: number) => gray[(y + i) * w + (x + j)];
      const gx =
        -idx(-1, -1) + idx(-1, 1) +
        -2 * idx(0, -1) + 2 * idx(0, 1) +
        -idx(1, -1) + idx(1, 1);
      const gy =
        -idx(-1, -1) - 2 * idx(-1, 0) - idx(-1, 1) +
        idx(1, -1) + 2 * idx(1, 0) + idx(1, 1);
      const mag = Math.sqrt(gx * gx + gy * gy);
      edges[y * w + x] = mag > 50 ? 255 : 0;
    }
  }
  return edges;
}

// ── Contour tracing (Moore neighborhood) ──

const DIRS_8 = [
  [0, -1], [1, -1], [1, 0], [1, 1],
  [0, 1], [-1, 1], [-1, 0], [-1, -1],
];

function traceContour(
  binary: Uint8Array,
  w: number,
  h: number,
  startX: number,
  startY: number,
  visited: Uint8Array
): number[][] | null {
  const points: number[][] = [];
  let x = startX, y = startY;
  let dir = 0; // start direction

  const maxSteps = w * h;
  let steps = 0;

  do {
    points.push([x, y]);
    visited[y * w + x] = 1;

    let found = false;
    // Search clockwise from opposite of entry direction
    const startDir = (dir + 5) % 8;
    for (let i = 0; i < 8; i++) {
      const d = (startDir + i) % 8;
      const nx = x + DIRS_8[d][0];
      const ny = y + DIRS_8[d][1];
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && binary[ny * w + nx] === 255) {
        dir = d;
        x = nx;
        y = ny;
        found = true;
        break;
      }
    }

    if (!found) break;
    steps++;
  } while ((x !== startX || y !== startY) && steps < maxSteps);

  if (points.length < 8) return null; // too small
  return points;
}

function findAllContours(binary: Uint8Array, w: number, h: number): number[][][] {
  const visited = new Uint8Array(w * h);
  const contours: number[][][] = [];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (binary[y * w + x] === 255 && visited[y * w + x] === 0) {
        // Check if it's a boundary pixel (has a 0-neighbor)
        let isBoundary = false;
        for (const [dx, dy] of DIRS_8) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && binary[ny * w + nx] === 0) {
            isBoundary = true;
            break;
          }
        }
        if (isBoundary) {
          const contour = traceContour(binary, w, h, x, y, visited);
          if (contour) contours.push(contour);
        } else {
          visited[y * w + x] = 1;
        }
      }
    }
  }
  return contours;
}

// ── Connected components (flood-fill approach for closed regions) ──

function floodFillRegions(binary: Uint8Array, w: number, h: number): Map<number, number[][]> {
  const labels = new Int32Array(w * h);
  let nextLabel = 1;
  const regions = new Map<number, number[][]>();

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (binary[y * w + x] === 255 && labels[y * w + x] === 0) {
        const label = nextLabel++;
        const region: number[][] = [];
        const stack: number[][] = [[x, y]];

        while (stack.length > 0) {
          const [cx, cy] = stack.pop()!;
          if (cx < 0 || cx >= w || cy < 0 || cy >= h) continue;
          const idx = cy * w + cx;
          if (binary[idx] !== 255 || labels[idx] !== 0) continue;

          labels[idx] = label;
          region.push([cx, cy]);

          stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
        }

        if (region.length > 0) {
          regions.set(label, region);
        }
      }
    }
  }

  return regions;
}

// ── Polygon simplification (Douglas-Peucker) ──

function perpendicularDistance(point: number[], lineStart: number[], lineEnd: number[]): number {
  const dx = lineEnd[0] - lineStart[0];
  const dy = lineEnd[1] - lineStart[1];
  const mag = Math.sqrt(dx * dx + dy * dy);
  if (mag === 0) return Math.sqrt((point[0] - lineStart[0]) ** 2 + (point[1] - lineStart[1]) ** 2);
  const u = ((point[0] - lineStart[0]) * dx + (point[1] - lineStart[1]) * dy) / (mag * mag);
  const closestX = lineStart[0] + u * dx;
  const closestY = lineStart[1] + u * dy;
  return Math.sqrt((point[0] - closestX) ** 2 + (point[1] - closestY) ** 2);
}

function douglasPeucker(points: number[][], epsilon: number): number[][] {
  if (points.length <= 2) return points;

  let maxDist = 0, maxIdx = 0;
  const last = points.length - 1;

  for (let i = 1; i < last; i++) {
    const d = perpendicularDistance(points[i], points[0], points[last]);
    if (d > maxDist) {
      maxDist = d;
      maxIdx = i;
    }
  }

  if (maxDist > epsilon) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), epsilon);
    const right = douglasPeucker(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[last]];
}

// ── Contour to polygon with metrics ──

function contourToRaw(points: number[][], imgW: number, imgH: number, epsilon: number): RawContour {
  // Simplify polygon
  const simplified = douglasPeucker(points, epsilon);

  // Calculate area (Shoelace formula)
  let area = 0;
  for (let i = 0; i < simplified.length; i++) {
    const j = (i + 1) % simplified.length;
    area += simplified[i][0] * simplified[j][1];
    area -= simplified[j][0] * simplified[i][1];
  }
  area = Math.abs(area) / 2;

  // Perimeter
  let perimeter = 0;
  for (let i = 0; i < simplified.length; i++) {
    const j = (i + 1) % simplified.length;
    const dx = simplified[j][0] - simplified[i][0];
    const dy = simplified[j][1] - simplified[i][1];
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }

  // Bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of simplified) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  // Centroid
  let cx = 0, cy = 0;
  for (const [x, y] of simplified) {
    cx += x;
    cy += y;
  }
  cx /= simplified.length;
  cy /= simplified.length;

  // Convert to % of image dimensions
  const polygonPct = simplified.map(([x, y]) => [
    (x / imgW) * 100,
    (y / imgH) * 100,
  ]);

  return {
    points: polygonPct,
    area,
    perimeter,
    bbox: {
      x: (minX / imgW) * 100,
      y: (minY / imgH) * 100,
      w: ((maxX - minX) / imgW) * 100,
      h: ((maxY - minY) / imgH) * 100,
    },
    centroid: {
      x: (cx / imgW) * 100,
      y: (cy / imgH) * 100,
    },
  };
}

// ── Alternative: region boundary extraction ──

function extractRegionBoundary(region: number[][]): number[][] {
  // Create a mini binary mask from region pixels
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const pixelSet = new Set<string>();

  for (const [x, y] of region) {
    pixelSet.add(`${x},${y}`);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  // Find boundary pixels (those with at least one non-region 4-neighbor)
  const boundary: number[][] = [];
  for (const [x, y] of region) {
    const is4Boundary =
      !pixelSet.has(`${x + 1},${y}`) ||
      !pixelSet.has(`${x - 1},${y}`) ||
      !pixelSet.has(`${x},${y + 1}`) ||
      !pixelSet.has(`${x},${y - 1}`);
    if (is4Boundary) {
      boundary.push([x, y]);
    }
  }

  if (boundary.length === 0) return region;

  // Sort boundary by angle from centroid to create ordered polygon
  let cx = 0, cy = 0;
  for (const [x, y] of boundary) { cx += x; cy += y; }
  cx /= boundary.length;
  cy /= boundary.length;

  boundary.sort((a, b) =>
    Math.atan2(a[1] - cy, a[0] - cx) - Math.atan2(b[1] - cy, b[0] - cx)
  );

  return boundary;
}

// ═══════════════════════════════════════════════
// MAIN DETECTION PIPELINE
// ═══════════════════════════════════════════════

export interface DetectionResult {
  contours: RawContour[];
  /** Processing time in ms */
  timeMs: number;
  /** Config used */
  config: DetectionConfig;
  /** Debug: binary image as data URL */
  debugBinaryUrl?: string;
  /** Debug: edges image as data URL */
  debugEdgesUrl?: string;
}

export async function detectPlanPolygons(
  imageUrl: string,
  config: Partial<DetectionConfig> = {}
): Promise<DetectionResult> {
  const cfg: DetectionConfig = { ...DEFAULT_CONFIG, ...config };
  const startTime = performance.now();

  // 1. Load image
  const img = await loadImage(imageUrl);
  const imageData = getImageData(img);
  const w = imageData.width;
  const h = imageData.height;
  const totalPixels = w * h;

  // 2. Grayscale
  let gray = toGrayscale(imageData);

  // 3. Blur for noise reduction
  if (cfg.blurRadius > 0) {
    gray = boxBlur(gray, w, h, cfg.blurRadius);
  }

  // 4. Threshold
  const thresh = cfg.threshold > 0 ? cfg.threshold : otsuThreshold(gray);

  let edgeMap: Uint8Array;

  if (cfg.edgeMode === 'canny') {
    // Sobel-based edge detection
    edgeMap = sobelEdges(gray, w, h);
  } else {
    // Simple threshold-based binarization
    edgeMap = binarize(gray, thresh, cfg.invertBinary);
  }

  // 5. Find contours OR flood-fill regions
  let rawContours: RawContour[];

  if (cfg.edgeMode === 'canny') {
    // Trace contours from edge map
    const contours = findAllContours(edgeMap, w, h);
    rawContours = contours.map((pts) =>
      contourToRaw(pts, w, h, cfg.simplifyEpsilon * Math.sqrt(w * h))
    );
  } else {
    // Flood-fill to find closed regions, then extract boundaries
    // Invert binary to get filled regions (white = lot interior)
    const invertedForFill = new Uint8Array(edgeMap.length);
    for (let i = 0; i < edgeMap.length; i++) {
      invertedForFill[i] = edgeMap[i] === 0 ? 255 : 0;
    }

    const regions = floodFillRegions(invertedForFill, w, h);
    rawContours = [];

    for (const [, region] of regions) {
      const boundary = extractRegionBoundary(region);
      const raw = contourToRaw(boundary, w, h, cfg.simplifyEpsilon * Math.sqrt(w * h));
      rawContours.push(raw);
    }
  }

  // 6. Filter by area
  const minArea = (cfg.minAreaPercent / 100) * totalPixels;
  const maxArea = (cfg.maxAreaPercent / 100) * totalPixels;

  rawContours = rawContours.filter((c) => {
    const pixelArea = c.area;
    return pixelArea >= minArea && pixelArea <= maxArea && c.points.length >= 3;
  });

  // 7. Sort by area descending
  rawContours.sort((a, b) => b.area - a.area);

  // 8. Generate debug images

  // Binary debug
  const debugCanvas = document.createElement('canvas');
  debugCanvas.width = w;
  debugCanvas.height = h;
  const debugCtx = debugCanvas.getContext('2d')!;
  const debugImg = debugCtx.createImageData(w, h);
  for (let i = 0; i < edgeMap.length; i++) {
    const v = edgeMap[i];
    debugImg.data[i * 4] = v;
    debugImg.data[i * 4 + 1] = v;
    debugImg.data[i * 4 + 2] = v;
    debugImg.data[i * 4 + 3] = 255;
  }
  debugCtx.putImageData(debugImg, 0, 0);
  const debugBinaryUrl = debugCanvas.toDataURL('image/png');
  const debugEdgesUrl = debugBinaryUrl;

  const elapsed = performance.now() - startTime;

  return {
    contours: rawContours,
    timeMs: elapsed,
    config: cfg,
    debugBinaryUrl,
    debugEdgesUrl,
  };
}

/**
 * Calculate a "lot-likeness" score for a contour.
 * Lots tend to be convex quadrilaterals with reasonable aspect ratios.
 */
export function lotLikenessScore(contour: RawContour): number {
  let score = 0.5; // base

  // Prefer 4-8 vertices (rectangular lots)
  const nVertices = contour.points.length;
  if (nVertices >= 4 && nVertices <= 6) score += 0.2;
  else if (nVertices >= 3 && nVertices <= 10) score += 0.1;
  else score -= 0.1;

  // Prefer reasonable aspect ratios (not too thin or too square)
  const aspect = contour.bbox.w / (contour.bbox.h || 0.01);
  if (aspect >= 0.3 && aspect <= 3) score += 0.15;
  else score -= 0.1;

  // Compactness: ratio of area to bounding box area
  const bboxArea = contour.bbox.w * contour.bbox.h;
  if (bboxArea > 0) {
    // Convert pixel area to % area for comparison
    const compactness = (contour.area / (bboxArea * 10000)) * 100 * 100;
    if (compactness > 0.5) score += 0.15;
  }

  return Math.max(0, Math.min(1, score));
}
