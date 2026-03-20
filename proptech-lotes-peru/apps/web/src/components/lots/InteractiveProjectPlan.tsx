'use client';

/**
 * InteractiveProjectPlan — Vista pública del plano interactivo
 *
 * REGLAS:
 * - Solo muestra imagen del plano + polígonos aprobados (LotShape)
 * - CERO overlays de debug, centroides, rayos, bounding boxes
 * - Layout full-width: mapa 75% + panel lateral 25%
 * - Zoom/pan con rueda y arrastrar
 * - Hover = tooltip. Click = selecciona lote
 * - Panel lateral con info del lote y botón "Reservar"
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LotData, LotStatus, ProjectData, PlanData } from '@/lib/projects-data';
import { formatPrice } from '@/lib/projects-data';
import type { LotShape } from '@/lib/projects-data';

/* ─────────────────────────────────────────────
   PALETA DE ESTADOS
───────────────────────────────────────────── */
// ──────────────────────────────────────────────────────────
// PALETA: el plano debe verse LIMPIO — sin manchas de color.
//
// Reposo (fill):    transparencia mínima, solo borde sutil
// Hover  (fillHover): relleno suave al pasar el mouse
// Seleccionado:     azul suave
// ──────────────────────────────────────────────────────────
const PALETTE: Record<LotStatus, { fill: string; fillHover: string; stroke: string; label: string; bg: string; text: string }> = {
  disponible: {
    fill:      'rgba(16,185,129,0.06)',   // reposo: casi invisible
    fillHover: 'rgba(16,185,129,0.28)',   // hover: verde suave
    stroke:    'rgba(16,185,129,0.65)',
    label: 'Disponible',
    bg: 'bg-emerald-500',
    text: 'text-white',
  },
  reservado: {
    fill:      'rgba(245,158,11,0.06)',
    fillHover: 'rgba(245,158,11,0.28)',
    stroke:    'rgba(245,158,11,0.65)',
    label: 'Reservado',
    bg: 'bg-amber-500',
    text: 'text-white',
  },
  vendido: {
    fill:      'rgba(239,68,68,0.05)',
    fillHover: 'rgba(239,68,68,0.22)',
    stroke:    'rgba(239,68,68,0.55)',
    label: 'Vendido',
    bg: 'bg-red-500',
    text: 'text-white',
  },
  bloqueado: {
    fill:      'rgba(148,163,184,0.04)',
    fillHover: 'rgba(148,163,184,0.20)',
    stroke:    'rgba(148,163,184,0.40)',
    label: 'No disponible',
    bg: 'bg-slate-400',
    text: 'text-white',
  },
};

const SELECTED_FILL   = 'rgba(0,152,220,0.22)';
const SELECTED_STROKE = '#0098dc';

/* ─────────────────────────────────────────────
   PROPS
───────────────────────────────────────────── */
export interface InteractiveProjectPlanProps {
  project: ProjectData;
  lots: LotData[];
  planData: PlanData;
  shapes: LotShape[];           // ← fuente de verdad, tabla project_lot_shapes
  selectedLot: LotData | null;
  onSelectLot: (lot: LotData | null) => void;
  onReserve?: (lot: LotData) => void;
  purchaseType?: 'financiado' | 'contado';
  calcMonthly?: (price: number) => number;
}

/* ─────────────────────────────────────────────
   UTILIDADES
───────────────────────────────────────────── */
function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function InteractiveProjectPlan({
  project,
  lots,
  planData,
  shapes,
  selectedLot,
  onSelectLot,
  onReserve,
  purchaseType = 'financiado',
  calcMonthly,
}: InteractiveProjectPlanProps) {
  // ── Zoom / Pan state ──
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Hover / Tooltip ──
  const [hoveredLotId, setHoveredLotId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // ── Mobile panel visible ──
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  // ── LotId → LotData map ──
  const lotMap = useMemo(() => {
    const m = new Map<string, LotData>();
    lots.forEach((l) => m.set(l.id, l));
    return m;
  }, [lots]);

  // ── Shapes con datos del lote ──
  const shapesWithLot = useMemo(() => {
    return shapes
      .map((s) => ({ shape: s, lot: lotMap.get(s.lotId) }))
      .filter((x): x is { shape: LotShape; lot: LotData } => x.lot !== undefined);
  }, [shapes, lotMap]);

  const hoveredLot = hoveredLotId ? lotMap.get(hoveredLotId) ?? null : null;

  // ── Fit to container on mount ──
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [planData.imageUrl]);

  // ── Wheel zoom ──
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const delta = e.deltaY > 0 ? -0.12 : 0.12;
    setZoom((z) => clamp(z + delta, 0.3, 8));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  // ── Mouse pan ──
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanningRef.current = true;
    panStartRef.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
    if (!isPanningRef.current) return;
    setPan({
      x: panStartRef.current.px + (e.clientX - panStartRef.current.mx),
      y: panStartRef.current.py + (e.clientY - panStartRef.current.my),
    });
  }, []);

  const onMouseUp = useCallback(() => { isPanningRef.current = false; }, []);

  // ── Touch pan ──
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && lastTouchRef.current) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;
      setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, []);

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  // ── Click polygon ──
  const handlePolygonClick = useCallback((e: React.MouseEvent, lot: LotData) => {
    e.stopPropagation();
    if (lot.status !== 'disponible') return;
    const next = selectedLot?.id === lot.id ? null : lot;
    onSelectLot(next);
    if (next) setMobilePanelOpen(true);
  }, [selectedLot, onSelectLot]);

  // ── No shapes ──
  if (shapesWithLot.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
        <div className="text-center">
          <p className="text-slate-400 text-sm">El plano interactivo aún no tiene lotes asignados.</p>
          <p className="text-slate-300 text-xs mt-1">El administrador debe asignar los polígonos desde el panel.</p>
        </div>
      </div>
    );
  }

  const ar = planData.imageWidth && planData.imageHeight
    ? planData.imageWidth / planData.imageHeight
    : 16 / 9;

  return (
    <div className="flex flex-col lg:flex-row gap-0 w-full overflow-hidden rounded-2xl border border-slate-200 shadow-xl bg-slate-100" style={{ minHeight: '500px', maxHeight: '82vh' }}>

      {/* ══════════════════════════════════════
          MAPA — 75% del ancho en desktop
          ════════════════════════════════════ */}
      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden cursor-grab active:cursor-grabbing bg-slate-100"
        style={{ minHeight: '500px' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={() => { onMouseUp(); setHoveredLotId(null); }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={() => { lastTouchRef.current = null; }}
        onClick={() => onSelectLot(null)}
      >
        {/* Plano + overlays — transformados juntos */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: 'center center', willChange: 'transform' }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* ── Imagen del plano ── */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={planData.imageUrl}
              alt={`Plano de ${project.name}`}
              draggable={false}
              style={{ display: 'block', maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', userSelect: 'none', objectFit: 'contain' }}
            />

            {/* ── SVG overlay — SOLO polígonos aprobados ── */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ pointerEvents: 'none' }}
            >
              {shapesWithLot.map(({ shape, lot }) => {
                const isSelected = selectedLot?.id === lot.id;
                const isHovered = hoveredLotId === lot.id;
                const pal = PALETTE[lot.status];
                const pts = shape.polygonPoints.map(([x, y]) => `${x},${y}`).join(' ');
                // centroide del polígono
                const cx = shape.polygonPoints.reduce((s, [x]) => s + x, 0) / shape.polygonPoints.length;
                const cy = shape.polygonPoints.reduce((s, [, y]) => s + y, 0) / shape.polygonPoints.length;

                return (
                  <g key={shape.id}>
                    {/* polígono — siempre invisible, solo captura eventos */}
                    <polygon
                      points={pts}
                      fill="transparent"
                      stroke="transparent"
                      strokeWidth={0}
                      style={{ pointerEvents: 'all', cursor: lot.status === 'disponible' ? 'pointer' : 'default' }}
                      onMouseEnter={(e) => { e.stopPropagation(); setHoveredLotId(lot.id); }}
                      onMouseLeave={() => setHoveredLotId(null)}
                      onClick={(e) => handlePolygonClick(e, lot)}
                    />
                    {/* punto centroide — visible en hover o seleccionado */}
                    {(isHovered || isSelected) && (
                      <circle
                        cx={cx}
                        cy={cy}
                        r={isSelected ? 1.4 : 1.2}
                        fill={isSelected ? '#0098dc' : pal.stroke}
                        opacity={isSelected ? 0.85 : 0.9}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* ── Controles de zoom ── */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setZoom((z) => clamp(z + 0.3, 0.3, 8)); }}
            className="w-9 h-9 bg-white/90 backdrop-blur rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:bg-white font-bold text-xl transition-all"
          >+</button>
          <button
            onClick={(e) => { e.stopPropagation(); setZoom((z) => clamp(z - 0.3, 0.3, 8)); }}
            className="w-9 h-9 bg-white/90 backdrop-blur rounded-lg shadow-lg flex items-center justify-center text-slate-700 hover:bg-white font-bold text-xl transition-all"
          >−</button>
          <button
            onClick={(e) => { e.stopPropagation(); resetView(); }}
            className="w-9 h-9 bg-white/90 backdrop-blur rounded-lg shadow-lg flex items-center justify-center text-slate-500 hover:bg-white transition-all"
            title="Restablecer vista"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
            </svg>
          </button>
        </div>

        {/* ── Leyenda ── */}
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 bg-slate-900/80 backdrop-blur rounded-xl px-3 py-2">
          {(['disponible', 'reservado', 'vendido'] as LotStatus[]).map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PALETTE[s].stroke }} />
              <span className="text-[10px] font-medium text-slate-300 capitalize">{PALETTE[s].label}</span>
            </div>
          ))}
        </div>

        {/* ── Hint mobile ── */}
        {selectedLot && (
          <button
            className="lg:hidden absolute bottom-3 right-3 z-20 bg-primary-600 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-lg"
            onClick={(e) => { e.stopPropagation(); setMobilePanelOpen(true); }}
          >
            Ver lote →
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════
          PANEL LATERAL — 25% desktop / modal mobile
          ════════════════════════════════════ */}
      {/* Desktop panel */}
      <div className="hidden lg:flex flex-col w-80 xl:w-96 bg-white border-l border-slate-200 overflow-y-auto flex-shrink-0">
        <LotInfoPanel
          lot={selectedLot}
          currency={project.currency ?? 'PEN'}
          purchaseType={purchaseType}
          calcMonthly={calcMonthly}
          onReserve={onReserve}
          onDeselect={() => onSelectLot(null)}
          totalShapes={shapesWithLot.length}
          availableCount={shapesWithLot.filter((x) => x.lot.status === 'disponible').length}
        />
      </div>

      {/* Mobile panel (modal from bottom) */}
      <AnimatePresence>
        {mobilePanelOpen && selectedLot && (
          <>
            <motion.div
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobilePanelOpen(false)}
            />
            <motion.div
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[75vh] overflow-y-auto"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-2" />
              <LotInfoPanel
                lot={selectedLot}
                currency={project.currency ?? 'PEN'}
                purchaseType={purchaseType}
                calcMonthly={calcMonthly}
                onReserve={onReserve}
                onDeselect={() => { onSelectLot(null); setMobilePanelOpen(false); }}
                totalShapes={shapesWithLot.length}
                availableCount={shapesWithLot.filter((x) => x.lot.status === 'disponible').length}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Tooltip hover (desktop) ── */}
      <AnimatePresence>
        {hoveredLot && !isPanningRef.current && (
          <motion.div
            className="fixed z-50 pointer-events-none"
            style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 16 }}
            initial={{ opacity: 0, scale: 0.92, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12 }}
          >
            <div className="bg-slate-900/95 backdrop-blur rounded-2xl shadow-2xl px-3.5 py-2.5 min-w-[170px]">
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="font-bold text-white text-sm">{hoveredLot.label}</span>
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PALETTE[hoveredLot.status].stroke }}
                />
              </div>
              <div className="text-xs text-slate-400 space-y-0.5">
                <p>{hoveredLot.area.toFixed(1)} m² · Mz {hoveredLot.manzana}</p>
                {hoveredLot.status === 'disponible' && (
                  <p className="font-semibold text-emerald-400">{formatPrice(hoveredLot.price, project.currency ?? 'PEN')}</p>
                )}
                {hoveredLot.status !== 'disponible' && (
                  <p className="capitalize" style={{ color: PALETTE[hoveredLot.status].stroke }}>{PALETTE[hoveredLot.status].label}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────────────────────
   LOT INFO PANEL
───────────────────────────────────────────── */
function LotInfoPanel({
  lot,
  currency,
  purchaseType,
  calcMonthly,
  onReserve,
  onDeselect,
  totalShapes,
  availableCount,
}: {
  lot: LotData | null;
  currency: 'PEN' | 'USD';
  purchaseType?: 'financiado' | 'contado';
  calcMonthly?: (price: number) => number;
  onReserve?: (lot: LotData) => void;
  onDeselect: () => void;
  totalShapes: number;
  availableCount: number;
}) {
  if (!lot) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center h-full">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
          </svg>
        </div>
        <h3 className="font-bold text-slate-900 mb-1">Plano interactivo</h3>
        <p className="text-slate-400 text-sm mb-4">Haz clic sobre un lote disponible para ver sus detalles</p>
        <div className="w-full bg-slate-50 rounded-xl p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Total en plano</span>
            <span className="font-semibold text-slate-700">{totalShapes} lotes</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Disponibles</span>
            <span className="font-semibold text-emerald-600">{availableCount} lotes</span>
          </div>
        </div>
      </div>
    );
  }

  const pal = PALETTE[lot.status];
  const monthly = calcMonthly ? calcMonthly(lot.price) : null;
  const precioM2 = lot.precioM2 ?? (lot.area > 0 ? lot.price / lot.area : 0);

  return (
    <div className="p-5 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-0.5">Lote seleccionado</p>
          <h3 className="text-xl font-bold text-slate-900">{lot.label}</h3>
        </div>
        <button
          onClick={onDeselect}
          className="p-1.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Status badge */}
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold w-fit ${pal.bg} ${pal.text}`}>
        <span className="w-2 h-2 rounded-full bg-white/50" />
        {pal.label}
      </span>

      {/* Data grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Área</p>
          <p className="text-lg font-bold text-slate-900">{lot.area.toFixed(1)}</p>
          <p className="text-xs text-slate-400">m²</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Precio m²</p>
          <p className="text-lg font-bold text-slate-900">{formatPrice(precioM2, currency)}</p>
          <p className="text-xs text-slate-400">por m²</p>
        </div>
        <div className="bg-primary-50 rounded-xl p-3 col-span-2">
          <p className="text-[10px] text-primary-400 font-semibold uppercase tracking-wider mb-1">Precio total</p>
          <p className="text-2xl font-bold text-primary-700">{formatPrice(lot.price, currency)}</p>
          {monthly && purchaseType === 'financiado' && (
            <p className="text-xs text-primary-400 mt-0.5">Desde {formatPrice(monthly, currency)}/mes</p>
          )}
        </div>
      </div>

      {/* Manzana / Lote */}
      <div className="flex gap-2 text-sm text-slate-500">
        <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-medium">Mz {lot.manzana}</span>
        <span className="px-2.5 py-1 bg-slate-100 rounded-lg font-medium">Lt {lot.fila ?? lot.lote}</span>
      </div>

      {/* CTA */}
      {lot.status === 'disponible' && onReserve && (
        <button
          onClick={() => onReserve(lot)}
          className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-200/50 transition-all text-sm"
        >
          Reservar este lote →
        </button>
      )}

      {lot.status !== 'disponible' && (
        <div className="w-full py-3 text-center text-sm text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
          Este lote no está disponible
        </div>
      )}
    </div>
  );
}
