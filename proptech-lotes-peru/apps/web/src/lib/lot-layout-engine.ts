// ============================================
// LOT LAYOUT ENGINE
// Automatically generates lot positions within
// a manzana block shape drawn on the plan image.
// ============================================

import type { LotData, BlockShape } from './projects-data';

export interface LayoutLot {
  lot: LotData;
  /** Position relative to block's own coordinate space (0-100%) */
  x: number;       // % offset within block
  y: number;       // % offset within block
  w: number;       // % width within block
  h: number;       // % height within block
}

/**
 * Natural-sort comparator for alphanumeric strings like "01", "09A", "10"
 */
function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function getSortKey(lot: LotData): string {
  return lot.fila || String(lot.lote).padStart(4, '0');
}

/**
 * Given a block shape and a list of lots belonging to that manzana,
 * auto-generate layout positions for each lot within the block.
 *
 * Strategy:
 * - Sort lots naturally by fila/lote
 * - Calculate optimal grid: try to keep aspect ratio close to block shape
 * - Distribute lots into rows/columns with small gaps
 */
export function layoutLotsInBlock(block: BlockShape, lots: LotData[]): LayoutLot[] {
  if (lots.length === 0) return [];

  const sorted = [...lots].sort((a, b) => naturalSort(getSortKey(a), getSortKey(b)));

  const count = sorted.length;

  // Calculate grid dimensions based on block aspect ratio
  // block.width and block.height are in % of plan image, but ratio matters
  const aspectRatio = block.width / (block.height || 1);

  // Try to find cols/rows that best match the aspect ratio
  let bestCols = 1;
  let bestDiff = Infinity;

  for (let c = 1; c <= count; c++) {
    const r = Math.ceil(count / c);
    const gridAspect = c / (r || 1);
    const diff = Math.abs(gridAspect - aspectRatio);
    if (diff < bestDiff) {
      bestDiff = diff;
      bestCols = c;
    }
  }

  const cols = bestCols;
  const rows = Math.ceil(count / cols);

  // Gap as percentage of block space
  const gap = 2; // 2% gap
  const totalGapX = gap * (cols + 1);
  const totalGapY = gap * (rows + 1);
  const cellW = (100 - totalGapX) / cols;
  const cellH = (100 - totalGapY) / rows;

  return sorted.map((lot, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);

    return {
      lot,
      x: gap + col * (cellW + gap),
      y: gap + row * (cellH + gap),
      w: cellW,
      h: cellH,
    };
  });
}

/**
 * Generate layout for ALL blocks in a plan, matching lots by manzana name.
 */
export function layoutAllBlocks(
  blocks: BlockShape[],
  lots: LotData[]
): Map<string, LayoutLot[]> {
  const result = new Map<string, LayoutLot[]>();

  for (const block of blocks) {
    const manzanaLots = lots.filter(
      (l) => l.manzana.toLowerCase() === block.blockName.toLowerCase()
    );
    result.set(block.id, layoutLotsInBlock(block, manzanaLots));
  }

  return result;
}
