/**
 * layout-generator.ts
 *
 * FASE 4 del pipeline:
 * Toma las detecciones del plano (DetectedPlanLot[]) + inventario (LotData[])
 * y genera un GeneratedLayout abstracto sin imágenes, listo para CineplanView.
 *
 * ALGORITMO:
 * 1. Agrupar detecciones aprobadas/matcheadas por manzana
 * 2. Para cada manzana, calcular bounding-box colectivo en el espacio del plano
 * 3. Normalizar posiciones al canvas virtual (0-100)
 * 4. Generar celdas internas de cada lote dentro de su bloque
 * 5. Para lotes del inventario sin detección, añadirlos al final del bloque
 * 6. Calcular stats de matching
 */

import type {
  LotData,
  DetectedPlanLot,
  GeneratedLayout,
  GeneratedBlock,
  GeneratedLot,
} from './projects-data';

function genId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ── Paleta de colores por bloque (orden cíclico) ──
const BLOCK_COLORS = [
  '#0098dc', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316',
  '#6366f1', '#14b8a6', '#eab308', '#ef4444',
];

/* ─────────────────────────────────────────────
   NORMALIZACIÓN DE ETIQUETAS
───────────────────────────────────────────── */
export function normalizeLotCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/^(LT|LOT|LOTE|MZ)[.\s-]*/i, '')
    // A-1 → A-01 (pad single digit after dash)
    .replace(/-(\d)(?!\d)/g, '-0$1')
    // A01 → A-01 (insert dash between letter and digits)
    .replace(/^([A-Z]+)(\d+)$/, '$1-$2');
}

/** Extrae la manzana de un label normalizado.
 *  "A-01" → "A", "Mz B" → "B", "III-09" → "III"
 */
export function extractManzana(label: string): string {
  // Prefijo de manzana explícito
  const mzMatch = label.match(/^(?:MZ\s*)?([A-Z]{1,4})-\d+/i);
  if (mzMatch) return mzMatch[1].toUpperCase();
  // Bloque romano
  const romMatch = label.match(/^(I{1,3}|IV|VI{0,3}|IX|X{1,3})-/i);
  if (romMatch) return romMatch[1].toUpperCase();
  // Fallback: primeras letras
  const fallback = label.replace(/[^A-Za-z]/g, '');
  return fallback.slice(0, 2).toUpperCase() || 'X';
}

/* ─────────────────────────────────────────────
   ESTRUCTURA DE TRABAJO
───────────────────────────────────────────── */
interface ManzanaGroup {
  name: string;
  detections: DetectedPlanLot[];
  lots: LotData[];             // inventory lots for this manzana
  /** Bounding box colectivo en % del plano (0-100) */
  bbox: { x: number; y: number; w: number; h: number } | null;
}

/* ─────────────────────────────────────────────
   GENERADOR PRINCIPAL
───────────────────────────────────────────── */
export interface GenerateLayoutOptions {
  /** Canvas virtual dimensions */
  canvasWidth?: number;
  canvasHeight?: number;
  /** Padding entre bloques (0-100 space units) */
  blockPadding?: number;
  /** Si true, incluye lotes del inventario aunque no se hayan detectado */
  includeUndetectedLots?: boolean;
}

export function generateLayoutFromDetections(
  projectId: string,
  detections: DetectedPlanLot[],
  inventoryLots: LotData[],
  opts: GenerateLayoutOptions = {}
): GeneratedLayout {
  const {
    canvasWidth = 120,
    canvasHeight = 100,
    blockPadding = 2,
    includeUndetectedLots = true,
  } = opts;

  // ── Filtrar solo detecciones útiles ──
  const usable = detections.filter(
    (d) => d.reviewStatus !== 'rejected' && d.matchedLotId
  );

  // ── Paso 1: Agrupar por manzana ──
  const manzanaMap = new Map<string, ManzanaGroup>();

  // Primero, crear grupos desde inventario
  inventoryLots.forEach((lot) => {
    const mz = (lot.manzana || 'SIN_MZ').toUpperCase();
    if (!manzanaMap.has(mz)) {
      manzanaMap.set(mz, { name: mz, detections: [], lots: [], bbox: null });
    }
    manzanaMap.get(mz)!.lots.push(lot);
  });

  // Luego, asociar detecciones a manzanas
  usable.forEach((det) => {
    const label = det.manualLabel || det.normalizedLabel || '';
    const mz = extractManzana(label) || 'SIN_MZ';
    // Intentar encontrar la manzana por el inventario matcheado
    let targetMz = mz;
    if (det.matchedLotId) {
      const invLot = inventoryLots.find((l) => l.id === det.matchedLotId);
      if (invLot?.manzana) targetMz = invLot.manzana.toUpperCase();
    }
    if (!manzanaMap.has(targetMz)) {
      manzanaMap.set(targetMz, { name: targetMz, detections: [], lots: [], bbox: null });
    }
    manzanaMap.get(targetMz)!.detections.push(det);
  });

  // ── Paso 2: Calcular bounding-boxes colectivos por manzana ──
  manzanaMap.forEach((group) => {
    if (group.detections.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    group.detections.forEach((det) => {
      const pts = det.manualPolygon || det.polygon;
      pts.forEach(([px, py]) => {
        minX = Math.min(minX, px);
        minY = Math.min(minY, py);
        maxX = Math.max(maxX, px);
        maxY = Math.max(maxY, py);
      });
    });
    if (minX < Infinity) {
      group.bbox = { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
  });

  // ── Paso 3: Ordenar manzanas por posición en el plano (arriba→abajo, izq→der) ──
  const sortedGroups = Array.from(manzanaMap.values()).sort((a, b) => {
    if (!a.bbox && !b.bbox) return a.name.localeCompare(b.name, undefined, { numeric: true });
    if (!a.bbox) return 1;
    if (!b.bbox) return -1;
    // Cuadrantes: dividir el plano en filas de 20%
    const rowA = Math.floor(a.bbox.y / 20);
    const rowB = Math.floor(b.bbox.y / 20);
    if (rowA !== rowB) return rowA - rowB;
    return a.bbox.x - b.bbox.x;
  });

  // ── Paso 4: Calcular posiciones del canvas virtual ──
  // Layout en grid: distribuir bloques en filas según su posición relativa
  const totalGroups = sortedGroups.length;
  const cols = Math.ceil(Math.sqrt(totalGroups * (canvasWidth / canvasHeight)));
  const rows = Math.ceil(totalGroups / cols);

  // Tamaño disponible por celda (con padding)
  const cellW = (canvasWidth - blockPadding * (cols + 1)) / cols;
  const cellH = (canvasHeight - blockPadding * (rows + 1)) / rows;

  const generatedBlocks: GeneratedBlock[] = [];
  let matchedLots = 0;
  let unmatchedLots = 0;

  sortedGroups.forEach((group, groupIdx) => {
    const col = groupIdx % cols;
    const row = Math.floor(groupIdx / cols);

    const blockX = blockPadding + col * (cellW + blockPadding);
    const blockY = blockPadding + row * (cellH + blockPadding);

    // ── Paso 5: Generar lotes dentro del bloque ──
    // Primero los detectados (preservando posición relativa dentro del bbox)
    const detectedLotIds = new Set(group.detections.map((d) => d.matchedLotId).filter(Boolean));

    const generatedLots: GeneratedLot[] = [];

    // Lotes detectados — posición proporcional al bbox del bloque
    group.detections.forEach((det) => {
      const invLot = det.matchedLotId ? inventoryLots.find((l) => l.id === det.matchedLotId) : null;
      const label = det.manualLabel || det.normalizedLabel || invLot?.label || '?';

      let lotX = 10, lotY = 10, lotW = 80, lotH = 80;

      if (group.bbox) {
        // Posición relativa dentro del bbox del bloque (0-100)
        const bboxW = group.bbox.w || 1;
        const bboxH = group.bbox.h || 1;
        const detCenterX = det.centroid.x - group.bbox.x;
        const detCenterY = det.centroid.y - group.bbox.y;
        const relX = Math.max(0, Math.min(100, (detCenterX / bboxW) * 100));
        const relY = Math.max(0, Math.min(100, (detCenterY / bboxH) * 100));
        // Tamaño proporcional al bbox del lote vs bbox total del bloque
        const relW = Math.max(5, Math.min(50, (det.bbox.w / bboxW) * 90));
        const relH = Math.max(5, Math.min(50, (det.bbox.h / bboxH) * 90));
        lotX = Math.max(0, relX - relW / 2);
        lotY = Math.max(0, relY - relH / 2);
        lotW = relW;
        lotH = relH;
      }

      generatedLots.push({
        id: genId(),
        lotId: det.matchedLotId,
        label,
        x: lotX,
        y: lotY,
        width: lotW,
        height: lotH,
        confidence: det.detectionConfidence * det.ocrConfidence,
        manualOverride: false,
      });

      if (det.matchedLotId) matchedLots++;
      else unmatchedLots++;
    });

    // Lotes del inventario sin detección — añadir en grid al final si se desea
    if (includeUndetectedLots) {
      const undetected = group.lots.filter((l) => !detectedLotIds.has(l.id));
      if (undetected.length > 0) {
        // Colocarlos en una sub-grilla al fondo del bloque
        const gridCols = Math.ceil(Math.sqrt(undetected.length));
        const tileW = 90 / gridCols;
        const tileH = Math.min(15, tileW * 1.2);
        // Posición Y de inicio: después de los detectados
        const startY = generatedLots.length > 0
          ? Math.min(80, Math.max(...generatedLots.map((l) => l.y + l.height)) + 5)
          : 5;

        undetected.forEach((lot, i) => {
          const gc = i % gridCols;
          const gr = Math.floor(i / gridCols);
          generatedLots.push({
            id: genId(),
            lotId: lot.id,
            label: lot.label,
            x: 5 + gc * (tileW + 1),
            y: Math.min(startY + gr * (tileH + 1), 95 - tileH),
            width: tileW,
            height: tileH,
            confidence: 0,
            manualOverride: false,
          });
          unmatchedLots++;
        });
      }
    }

    // Si el grupo no tiene ningún lote generado, saltarlo
    if (generatedLots.length === 0 && group.lots.length === 0) return;

    // Para grupos sin detecciones pero con inventario, layout en grid
    if (generatedLots.length === 0 && group.lots.length > 0) {
      const gridCols = Math.ceil(Math.sqrt(group.lots.length));
      const tileW = 90 / gridCols;
      const tileH = Math.min(20, tileW * 1.4);
      group.lots.forEach((lot, i) => {
        const gc = i % gridCols;
        const gr = Math.floor(i / gridCols);
        generatedLots.push({
          id: genId(),
          lotId: lot.id,
          label: lot.label,
          x: 5 + gc * (tileW + 1),
          y: 5 + gr * (tileH + 1),
          width: tileW,
          height: tileH,
          confidence: 0,
          manualOverride: false,
        });
        unmatchedLots++;
      });
    }

    generatedBlocks.push({
      id: genId(),
      name: `Manzana ${group.name}`,
      x: blockX,
      y: blockY,
      width: cellW,
      height: cellH,
      lots: generatedLots,
      color: BLOCK_COLORS[groupIdx % BLOCK_COLORS.length],
      manualOverride: false,
    });
  });

  const totalLots = matchedLots + unmatchedLots;

  return {
    id: genId(),
    projectId,
    blocks: generatedBlocks,
    canvasWidth,
    canvasHeight,
    stats: {
      totalBlocks: generatedBlocks.length,
      totalLots,
      matchedLots,
      unmatchedLots,
      matchRate: totalLots > 0 ? matchedLots / totalLots : 0,
    },
    status: 'draft',
    generatedAt: new Date().toISOString(),
  };
}

/* ─────────────────────────────────────────────
   GENERADOR DESDE SOLO INVENTARIO (sin plano)
   Para proyectos que no tienen detecciones.
───────────────────────────────────────────── */
export function generateLayoutFromInventoryOnly(
  projectId: string,
  inventoryLots: LotData[],
  opts: GenerateLayoutOptions = {}
): GeneratedLayout {
  const {
    canvasWidth = 120,
    canvasHeight = 100,
    blockPadding = 2,
  } = opts;

  // Agrupar por manzana
  const manzanaMap = new Map<string, LotData[]>();
  inventoryLots.forEach((lot) => {
    const mz = (lot.manzana || 'SIN_MZ').toUpperCase();
    if (!manzanaMap.has(mz)) manzanaMap.set(mz, []);
    manzanaMap.get(mz)!.push(lot);
  });

  const sortedManzanas = Array.from(manzanaMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const totalGroups = sortedManzanas.length;
  const cols = Math.max(1, Math.ceil(Math.sqrt(totalGroups * (canvasWidth / canvasHeight))));
  const rows = Math.ceil(totalGroups / cols);
  const cellW = (canvasWidth - blockPadding * (cols + 1)) / cols;
  const cellH = (canvasHeight - blockPadding * (rows + 1)) / rows;

  let totalLots = 0;
  const generatedBlocks: GeneratedBlock[] = sortedManzanas.map(([mzName, lots], groupIdx) => {
    const col = groupIdx % cols;
    const row = Math.floor(groupIdx / cols);
    const blockX = blockPadding + col * (cellW + blockPadding);
    const blockY = blockPadding + row * (cellH + blockPadding);

    // Ordenar lotes dentro del bloque
    const sortedLots = [...lots].sort((a, b) =>
      (a.fila || String(a.lote).padStart(4, '0')).localeCompare(
        (b.fila || String(b.lote).padStart(4, '0')),
        undefined, { numeric: true }
      )
    );

    const gridCols = Math.ceil(Math.sqrt(sortedLots.length));
    const tileW = Math.max(5, 90 / gridCols - 1);
    const tileH = Math.min(25, Math.max(8, tileW * 1.3));

    const genLots: GeneratedLot[] = sortedLots.map((lot, i) => {
      const gc = i % gridCols;
      const gr = Math.floor(i / gridCols);
      return {
        id: genId(),
        lotId: lot.id,
        label: lot.label,
        x: 5 + gc * (tileW + 1.5),
        y: 8 + gr * (tileH + 1.5),
        width: tileW,
        height: tileH,
        confidence: 0,
        manualOverride: false,
      };
    });

    totalLots += genLots.length;

    return {
      id: genId(),
      name: `Manzana ${mzName}`,
      x: blockX,
      y: blockY,
      width: cellW,
      height: cellH,
      lots: genLots,
      color: BLOCK_COLORS[groupIdx % BLOCK_COLORS.length],
      manualOverride: false,
    };
  });

  return {
    id: genId(),
    projectId,
    blocks: generatedBlocks,
    canvasWidth,
    canvasHeight,
    stats: {
      totalBlocks: generatedBlocks.length,
      totalLots,
      matchedLots: 0,
      unmatchedLots: totalLots,
      matchRate: 0,
    },
    status: 'draft',
    generatedAt: new Date().toISOString(),
  };
}
