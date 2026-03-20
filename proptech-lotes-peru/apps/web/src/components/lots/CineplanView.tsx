'use client';

/**
 * CineplanView.tsx
 *
 * Vista pública ABSTRACTA del proyecto tipo Cineplanet.
 * NO muestra la foto del plano — renderiza un SVG limpio generado
 * desde GeneratedLayout con bloques y lotes como shapes interactivos.
 *
 * Features:
 * - Zoom / pan (rueda del ratón + arrastre)
 * - Hover con tooltip flotante
 * - Clic para seleccionar lote
 * - Panel lateral con detalle del lote seleccionado
 * - Mobile: bottom sheet
 * - Leyenda de estados
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  GeneratedLayout,
  GeneratedBlock,
  GeneratedLot,
  LotData,
  LotStatus,
  ProjectData,
} from '@/lib/projects-data';
import { formatPrice } from '@/lib/projects-data';

/* ─────────────────────────────────────────────
   COLORES DE ESTADO
───────────────────────────────────────────── */
const STATUS_STYLE: Record<LotStatus, {
  fill: string;
  fillHover: string;
  fillSelected: string;
  stroke: string;
  strokeSelected: string;
  label: string;
  badge: string;
  dot: string;
}> = {
  disponible: {
    fill: 'rgba(16,185,129,0.08)',
    fillHover: 'rgba(16,185,129,0.22)',
    fillSelected: 'rgba(0,152,220,0.25)',
    stroke: '#10b981',
    strokeSelected: '#0098dc',
    label: 'Disponible',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: '#10b981',
  },
  reservado: {
    fill: 'rgba(245,158,11,0.12)',
    fillHover: 'rgba(245,158,11,0.25)',
    fillSelected: 'rgba(245,158,11,0.30)',
    stroke: '#f59e0b',
    strokeSelected: '#d97706',
    label: 'Reservado',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: '#f59e0b',
  },
  vendido: {
    fill: 'rgba(239,68,68,0.08)',
    fillHover: 'rgba(239,68,68,0.18)',
    fillSelected: 'rgba(239,68,68,0.22)',
    stroke: '#ef4444',
    strokeSelected: '#dc2626',
    label: 'Vendido',
    badge: 'bg-red-100 text-red-700 border-red-200',
    dot: '#ef4444',
  },
  bloqueado: {
    fill: 'rgba(148,163,184,0.08)',
    fillHover: 'rgba(148,163,184,0.18)',
    fillSelected: 'rgba(148,163,184,0.22)',
    stroke: '#94a3b8',
    strokeSelected: '#64748b',
    label: 'No disponible',
    badge: 'bg-slate-100 text-slate-500 border-slate-200',
    dot: '#94a3b8',
  },
};

/* ─────────────────────────────────────────────
   PROPS
───────────────────────────────────────────── */
interface CineplanViewProps {
  project: ProjectData;
  layout: GeneratedLayout;
  lots: LotData[];
  selectedLot: LotData | null;
  onSelectLot: (lot: LotData | null) => void;
  onReserve?: (lot: LotData) => void;
  purchaseType?: 'financiado' | 'contado';
  calcMonthly?: (price: number) => number;
}

/* ─────────────────────────────────────────────
   UTILIDADES
───────────────────────────────────────────── */
interface TooltipState {
  x: number; y: number;
  lot: LotData;
  genLot: GeneratedLot;
}

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function CineplanView({
  project,
  layout,
  lots,
  selectedLot,
  onSelectLot,
  onReserve,
  purchaseType = 'financiado',
  calcMonthly,
}: CineplanViewProps) {
  // ── Zoom / Pan ──
  const [zoom, setZoom] = useState(1);
  const fmt = (price: number) => formatPrice(price, project.currency ?? 'PEN');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Hover tooltip ──
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  // ── Mobile sheet ──
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  // ── Lookup: lotId → LotData ──
  const lotById = useMemo(() => {
    const map = new Map<string, LotData>();
    lots.forEach((l) => map.set(l.id, l));
    return map;
  }, [lots]);

  // ── Stats ──
  const stats = useMemo(() => {
    const s: Record<string, number> = { disponible: 0, reservado: 0, vendido: 0, bloqueado: 0 };
    lots.forEach((l) => { s[l.status] = (s[l.status] || 0) + 1; });
    return s;
  }, [lots]);

  // ── Reset pan on layout change ──
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [layout.id]);

  /* ── Pan handlers ── */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-lot]')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.max(0.4, Math.min(5, z * delta)));
  }, []);

  const resetView = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  /* ── Lot click ── */
  const handleLotClick = useCallback((genLot: GeneratedLot) => {
    if (!genLot.lotId) return;
    const lot = lotById.get(genLot.lotId);
    if (!lot || lot.status !== 'disponible') return;
    onSelectLot(selectedLot?.id === lot.id ? null : lot);
    setTooltip(null);
  }, [lotById, selectedLot, onSelectLot]);

  /* ── SVG viewBox ── */
  const vb = `0 0 ${layout.canvasWidth} ${layout.canvasHeight}`;

  /* ── Renderizar bloque ── */
  const renderBlock = useCallback((block: GeneratedBlock) => {
    const accentColor = block.color || '#0098dc';

    return (
      <g key={block.id}>
        {/* Block background */}
        <rect
          x={block.x}
          y={block.y}
          width={block.width}
          height={block.height}
          rx={0.8}
          fill={`${accentColor}10`}
          stroke={`${accentColor}40`}
          strokeWidth={0.2}
        />
        {/* Block label */}
        <text
          x={block.x + block.width / 2}
          y={block.y + 2.2}
          textAnchor="middle"
          fontSize={1.6}
          fontWeight="600"
          fill={accentColor}
          className="select-none pointer-events-none"
          opacity={0.9}
        >
          {block.name}
        </text>

        {/* Lots inside block */}
        {block.lots.map((genLot) => {
          const lot = genLot.lotId ? lotById.get(genLot.lotId) : null;
          const status: LotStatus = lot?.status || 'bloqueado';
          const style = STATUS_STYLE[status];
          const isSelected = selectedLot?.id === lot?.id;
          const isClickable = status === 'disponible' && !!lot;

          // Absolute coords in the SVG canvas
          const ax = block.x + (genLot.x / 100) * block.width;
          const ay = block.y + (genLot.y / 100) * block.height + 3.5; // offset for label
          const aw = (genLot.width / 100) * block.width;
          const ah = (genLot.height / 100) * (block.height - 4);

          return (
            <g
              key={genLot.id}
              data-lot={genLot.lotId || ''}
              style={{ cursor: isClickable ? 'pointer' : 'default' }}
              onClick={() => handleLotClick(genLot)}
              onMouseEnter={(e) => {
                if (!lot) return;
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                setTooltip({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top - 10,
                  lot,
                  genLot,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <rect
                x={ax}
                y={ay}
                width={Math.max(aw, 0.1)}
                height={Math.max(ah, 0.1)}
                rx={0.3}
                fill={isSelected ? style.fillSelected : style.fill}
                stroke={isSelected ? style.strokeSelected : style.stroke}
                strokeWidth={isSelected ? 0.25 : 0.15}
                className="transition-all duration-150"
              />
              {/* Lot label — only if large enough */}
              {aw > 3 && ah > 2 && (
                <text
                  x={ax + aw / 2}
                  y={ay + ah / 2 + 0.45}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.min(aw * 0.28, ah * 0.4, 1.3)}
                  fontWeight={isSelected ? '700' : '500'}
                  fill={isSelected ? style.strokeSelected : style.stroke}
                  className="select-none pointer-events-none"
                >
                  {genLot.label.replace(/^.*-/, '')}
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
  }, [lotById, selectedLot, handleLotClick]);

  /* ── Selected lot info ── */
  const selectedLotInfo = selectedLot ? (
    <LotInfoPanel
      lot={selectedLot}
      project={project}
      purchaseType={purchaseType}
      calcMonthly={calcMonthly}
      onClose={() => onSelectLot(null)}
      onReserve={onReserve}
    />
  ) : null;

  return (
    <div className="flex h-[82vh] gap-0 rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white">
      {/* ── MAP AREA ── */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* SVG canvas */}
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '50% 50%',
            width: '100%',
            height: '100%',
            transition: isDragging ? 'none' : 'transform 0.05s ease-out',
          }}
        >
          <svg
            viewBox={vb}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Background grid (subtle) */}
            <defs>
              <pattern id="cp-grid" width="5" height="5" patternUnits="userSpaceOnUse">
                <path d="M 5 0 L 0 0 0 5" fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="0.15" />
              </pattern>
            </defs>
            <rect width={layout.canvasWidth} height={layout.canvasHeight} fill="url(#cp-grid)" />

            {/* Blocks + Lots */}
            {layout.blocks.map(renderBlock)}
          </svg>
        </div>

        {/* Floating tooltip */}
        <AnimatePresence>
          {tooltip && (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute z-20 pointer-events-none"
              style={{ left: tooltip.x + 12, top: tooltip.y - 40, maxWidth: 200 }}
            >
              <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-xl px-3.5 py-2.5 text-sm">
                <p className="font-bold text-slate-900">{tooltip.lot.label}</p>
                <p className="text-slate-500 text-xs">{tooltip.lot.area.toFixed(1)} m²</p>
                <p className="text-[#0098dc] font-semibold text-xs mt-0.5">{fmt(tooltip.lot.price)}</p>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border mt-1 inline-block ${STATUS_STYLE[tooltip.lot.status].badge}`}>
                  {STATUS_STYLE[tooltip.lot.status].label}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
          <button onClick={() => setZoom((z) => Math.min(5, z * 1.25))}
            className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold text-lg transition-all">+</button>
          <button onClick={resetView}
            className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-all" title="Restablecer vista">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5M15 15l5.25 5.25" />
            </svg>
          </button>
          <button onClick={() => setZoom((z) => Math.max(0.4, z * 0.8))}
            className="w-8 h-8 bg-white border border-slate-200 rounded-lg shadow-sm flex items-center justify-center text-slate-600 hover:bg-slate-50 font-bold text-lg transition-all">−</button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 flex flex-wrap gap-2 z-10">
          {(Object.entries(STATUS_STYLE) as [LotStatus, typeof STATUS_STYLE[LotStatus]][]).map(([status, s]) => {
            const count = stats[status] || 0;
            if (count === 0) return null;
            return (
              <div key={status} className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-lg px-2.5 py-1.5 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-sm border-2 flex-shrink-0" style={{ borderColor: s.dot, backgroundColor: s.fill }} />
                <span className="text-xs font-medium text-slate-600">{s.label}</span>
                <span className="text-xs font-bold text-slate-400">({count})</span>
              </div>
            );
          })}
        </div>

        {/* No lots fallback */}
        {layout.blocks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6z" />
              </svg>
              <p className="text-sm">No hay layout generado aún</p>
            </div>
          </div>
        )}
      </div>

      {/* ── SIDE PANEL (desktop) ── */}
      <AnimatePresence>
        {selectedLot && !isMobile && (
          <motion.aside
            key="side-panel"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex-shrink-0 border-l border-slate-200 overflow-hidden"
          >
            <div className="w-80 h-full overflow-y-auto">
              {selectedLotInfo}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── BOTTOM SHEET (mobile) ── */}
      <AnimatePresence>
        {selectedLot && isMobile && (
          <motion.div
            key="bottom-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white rounded-t-2xl shadow-2xl max-h-[60vh] overflow-y-auto"
          >
            {selectedLotInfo}
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
  project,
  purchaseType,
  calcMonthly,
  onClose,
  onReserve,
}: {
  lot: LotData;
  project: ProjectData;
  purchaseType?: 'financiado' | 'contado';
  calcMonthly?: (price: number) => number;
  onClose: () => void;
  onReserve?: (lot: LotData) => void;
}) {
  const monthly = calcMonthly ? calcMonthly(lot.price) : null;
  const style = STATUS_STYLE[lot.status];
  const fmt = (price: number) => formatPrice(price, project.currency ?? 'PEN');

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Lote seleccionado</p>
          <h3 className="text-xl font-black text-slate-900">{lot.label}</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Status badge */}
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${style.badge}`}>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: style.dot }} />
        {style.label}
      </span>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Área</p>
          <p className="text-lg font-black text-slate-900">{lot.area.toFixed(1)}</p>
          <p className="text-xs text-slate-400">m²</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Precio/m²</p>
          <p className="text-lg font-black text-slate-900">
            {lot.precioM2 ? `S/${lot.precioM2.toLocaleString('es-PE')}` : (lot.area > 0 ? `S/${Math.round(lot.price / lot.area).toLocaleString('es-PE')}` : '—')}
          </p>
          <p className="text-xs text-slate-400">por m²</p>
        </div>
      </div>

      {/* Price */}
      <div className="bg-gradient-to-r from-[#0098dc]/10 to-[#0098dc]/5 rounded-xl p-4 text-center border border-[#0098dc]/20">
        <p className="text-xs text-slate-500 font-medium mb-1">Precio total</p>
        <p className="text-2xl font-black text-[#0098dc]">{fmt(lot.price)}</p>
        {purchaseType === 'financiado' && monthly && (
          <p className="text-xs text-slate-500 mt-1">
            Desde <span className="font-bold text-slate-700">S/{monthly.toLocaleString('es-PE')}/mes</span>
          </p>
        )}
      </div>

      {/* Down payment */}
      {project.downPaymentMin > 0 && (
        <div className="flex items-center justify-between bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
          <span className="text-sm text-emerald-700 font-medium">Cuota inicial desde</span>
          <span className="text-sm font-bold text-emerald-800">{fmt(project.downPaymentMin)}</span>
        </div>
      )}

      {/* Reserve CTA */}
      {lot.status === 'disponible' && onReserve && (
        <button
          onClick={() => onReserve(lot)}
          className="w-full py-3.5 bg-[#0098dc] hover:bg-[#0079b2] text-white font-bold text-base rounded-xl shadow-lg shadow-[#0098dc]/25 transition-all active:scale-[0.98]"
        >
          Reservar este lote →
        </button>
      )}

      {lot.status !== 'disponible' && (
        <div className="w-full py-3 bg-slate-100 text-slate-400 font-semibold text-sm rounded-xl text-center">
          {lot.status === 'reservado' ? 'Lote reservado' : 'Lote no disponible'}
        </div>
      )}

      {/* Project info */}
      <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 space-y-1">
        <p><span className="font-medium text-slate-500">Proyecto:</span> {project.name}</p>
        <p><span className="font-medium text-slate-500">Ubicación:</span> {project.zone}, {project.city}</p>
      </div>
    </div>
  );
}
