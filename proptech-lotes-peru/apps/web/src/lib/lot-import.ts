/**
 * lot-import.ts
 * Parsea un archivo Excel (.xlsx) con inventario de lotes
 * y lo convierte al formato LotData[] que usa la aplicación.
 *
 * Columnas esperadas en la hoja "LOTES":
 *   slug_proyecto | codigo_lote | area_m2 | precio_soles | precio_m2 | estado | manzana | fila
 */

import * as XLSX from 'xlsx';
import type { LotData, LotStatus } from '@/lib/projects-data';

/* ═══════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════ */
export interface LotImportRow {
  slug_proyecto: string;
  codigo_lote: string;
  area_m2: number;
  precio_soles: number;
  precio_m2: number;
  estado: string;
  manzana: string;
  fila: string;
}

export interface LotImportResult {
  success: boolean;
  lots: LotData[];
  errors: string[];
  warnings: string[];
  rowCount: number;
  slugs: string[];   // slugs de proyecto encontrados
}

/* ═══════════════════════════════════════════
   ESTADO NORMALIZATION
   Acepta variantes comunes del Excel
   ═══════════════════════════════════════════ */
function normalizeEstado(raw: string): LotStatus {
  const s = String(raw).trim().toUpperCase();
  if (['DISPONIBLE', 'LIBRE', 'AVAILABLE'].includes(s)) return 'disponible';
  if (['RESERVADO', 'SEPARADO', 'RESERVED'].includes(s)) return 'reservado';
  if (['VENDIDO', 'SOLD'].includes(s)) return 'vendido';
  if (['BLOQUEADO', 'BLOCKED', 'NO DISPONIBLE'].includes(s)) return 'bloqueado';
  return 'disponible'; // fallback
}

/* ═══════════════════════════════════════════
   PARSE EXCEL FILE → LotData[]
   ═══════════════════════════════════════════ */
export function parseLotExcel(file: ArrayBuffer): LotImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(file, { type: 'array' });
  } catch {
    return { success: false, lots: [], errors: ['No se pudo leer el archivo. Asegúrate de que sea un archivo .xlsx válido.'], warnings: [], rowCount: 0, slugs: [] };
  }

  // Buscar hoja "LOTES" (case-insensitive)
  const sheetName = wb.SheetNames.find((n) => n.toUpperCase() === 'LOTES') || wb.SheetNames[0];
  if (!sheetName) {
    return { success: false, lots: [], errors: ['El archivo no contiene ninguna hoja.'], warnings: [], rowCount: 0, slugs: [] };
  }

  const ws = wb.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  if (rawRows.length === 0) {
    return { success: false, lots: [], errors: [`La hoja "${sheetName}" está vacía.`], warnings: [], rowCount: 0, slugs: [] };
  }

  // Normalizar headers (quitar *, espacios, pasar a lowercase)
  const normalizeHeader = (h: string) => String(h).replace(/\s*\(\*\)\s*/g, '').trim().toLowerCase().replace(/\s+/g, '_');

  const normalizedRows: Record<string, string>[] = rawRows.map((row) => {
    const normalized: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeHeader(key)] = String(value);
    }
    return normalized;
  });

  // Validate required columns
  const firstRow = normalizedRows[0];
  const requiredCols = ['codigo_lote', 'area_m2', 'precio_soles', 'estado'];
  const missingCols = requiredCols.filter((c) => !(c in firstRow));
  if (missingCols.length > 0) {
    return {
      success: false,
      lots: [],
      errors: [`Columnas faltantes: ${missingCols.join(', ')}. Usa la plantilla de descarga como referencia.`],
      warnings: [],
      rowCount: rawRows.length,
      slugs: [],
    };
  }

  const lots: LotData[] = [];
  const slugSet = new Set<string>();

  normalizedRows.forEach((row, idx) => {
    const rowNum = idx + 2; // +2 porque fila 1 es header

    const codigoLote = String(row.codigo_lote || '').trim();
    const areaRaw = parseFloat(row.area_m2);
    const precioRaw = parseFloat(row.precio_soles);
    const precioM2Raw = parseFloat(row.precio_m2 || '0');
    const estadoRaw = String(row.estado || 'DISPONIBLE').trim();
    const manzana = String(row.manzana || '').trim();
    const fila = String(row.fila || '').trim();
    const slug = String(row.slug_proyecto || '').trim();

    // Validations
    if (!codigoLote) {
      errors.push(`Fila ${rowNum}: codigo_lote vacío, omitida.`);
      return;
    }
    if (isNaN(areaRaw) || areaRaw <= 0) {
      errors.push(`Fila ${rowNum} (${codigoLote}): area_m2 inválida (${row.area_m2}).`);
      return;
    }
    if (isNaN(precioRaw) || precioRaw < 0) {
      errors.push(`Fila ${rowNum} (${codigoLote}): precio_soles inválido (${row.precio_soles}).`);
      return;
    }

    if (slug) slugSet.add(slug);

    // Auto-calc precio_m2 if not provided
    const precioM2 = precioM2Raw > 0 ? precioM2Raw : (areaRaw > 0 && precioRaw > 0 ? Math.round((precioRaw / areaRaw) * 100) / 100 : 0);

    // Derive manzana from codigo_lote if missing (e.g., "A-01" → manzana="A")
    let derivedManzana = manzana;
    let derivedFila = fila;
    if (!derivedManzana && codigoLote.includes('-')) {
      const parts = codigoLote.split('-');
      derivedManzana = parts[0];
      if (!derivedFila && parts.length > 1) {
        derivedFila = parts.slice(1).join('-');
      }
    }
    if (!derivedManzana) {
      derivedManzana = 'A'; // fallback
      warnings.push(`Fila ${rowNum} (${codigoLote}): sin manzana, asignada "A".`);
    }

    // Derive numeric lote from fila
    const loteNum = parseInt(derivedFila || '0', 10) || (idx + 1);

    const label = `Mz ${derivedManzana} - Lt ${derivedFila || String(loteNum).padStart(2, '0')}`;

    const lot: LotData = {
      id: `${slug || 'imported'}-${derivedManzana}-${codigoLote}`.replace(/\s+/g, '-').toLowerCase(),
      label,
      manzana: derivedManzana,
      lote: loteNum,
      fila: derivedFila || String(loteNum).padStart(2, '0'),
      area: areaRaw,
      price: precioRaw,
      precioM2,
      status: normalizeEstado(estadoRaw),
    };

    lots.push(lot);
  });

  return {
    success: errors.length === 0,
    lots,
    errors,
    warnings,
    rowCount: rawRows.length,
    slugs: Array.from(slugSet),
  };
}

/* ═══════════════════════════════════════════
   GROUP LOTS BY SLUG (for multi-project import)
   ═══════════════════════════════════════════ */
export function groupLotsBySlug(rows: Record<string, string>[], lots: LotData[]): Map<string, LotData[]> {
  const map = new Map<string, LotData[]>();
  lots.forEach((lot, i) => {
    const slug = rows[i]?.slug_proyecto || 'sin-proyecto';
    const arr = map.get(slug) || [];
    arr.push(lot);
    map.set(slug, arr);
  });
  return map;
}
