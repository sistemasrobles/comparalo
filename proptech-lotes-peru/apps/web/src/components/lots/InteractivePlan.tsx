'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LotData, LotStatus, ProjectData, PlanData } from '@/lib/projects-data';
import { formatPrice } from '@/lib/projects-data';
import { layoutLotsInBlock, type LayoutLot } from '@/lib/lot-layout-engine';

/* ═══════════════════════════════════════════════
   STATUS PALETTE
   ═══════════════════════════════════════════════ */
const STATUS_FILL: Record<LotStatus, string> = {
  disponible: '#10b981',
  reservado: '#f59e0b',
  vendido: '#ef4444',
  bloqueado: '#94a3b8',
};

const STATUS_FILL_HOVER: Record<LotStatus, string> = {
  disponible: '#059669',
  reservado: '#d97706',
  vendido: '#dc2626',
  bloqueado: '#64748b',
};

const STATUS_LABEL: Record<LotStatus, string> = {
  disponible: 'Disponible',
  reservado: 'Reservado',
  vendido: 'Vendido',
  bloqueado: 'No disponible',
};

/* ═══════════════════════════════════════════════
   BLOCK BG PALETTE
   ═══════════════════════════════════════════════ */
const BLOCK_BG = [
  'rgba(30,41,59,0.08)',
  'rgba(30,41,59,0.06)',
  'rgba(30,41,59,0.10)',
  'rgba(30,41,59,0.07)',
  'rgba(30,41,59,0.09)',
];

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */
interface InteractivePlanProps {
  project: ProjectData;
  lots: LotData[];
  planData: PlanData;
  selectedLot: LotData | null;
  onSelectLot: (lot: LotData | null) => void;
  purchaseType?: 'financiado' | 'contado';
  calcMonthly?: (price: number) => number;
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function InteractivePlan({
  project,
  lots,
  planData,
  selectedLot,
  onSelectLot,
  purchaseType = 'financiado',
  calcMonthly,
}: InteractivePlanProps) {
  const fmt = (price: number) => formatPrice(price, project.currency ?? 'PEN');

  const [hoveredLot, setHoveredLot] = useState<string | null>(null);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  /* ── Layout computation ── */
  const blockLayouts = useMemo(() => {
    const map = new Map<string, LayoutLot[]>();
    for (const block of planData.blocks) {
      const manzanaLots = lots.filter(
        (l) => l.manzana.toLowerCase() === block.blockName.toLowerCase()
      );
      map.set(block.id, layoutLotsInBlock(block, manzanaLots));
    }
    return map;
  }, [planData.blocks, lots]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const s: Record<string, number> = { disponible: 0, reservado: 0, vendido: 0, bloqueado: 0, total: lots.length };
    lots.forEach((l) => { s[l.status] = (s[l.status] || 0) + 1; });
    return s;
  }, [lots]);

  /* ── Handlers ── */
  const handleLotClick = useCallback((lot: LotData) => {
    if (lot.status !== 'disponible') return;
    onSelectLot(selectedLot?.id === lot.id ? null : lot);
  }, [selectedLot, onSelectLot]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((z) => Math.min(3, Math.max(0.5, z + delta)));
  }, []);

  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  }, [pan]);

  const handlePanMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
    // Update tooltip position for any hover
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart]);

  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const precioM2 = (lot: LotData) => {
    if (lot.precioM2) return lot.precioM2;
    if (lot.area > 0 && lot.price > 0) return Math.round(lot.price / lot.area);
    return 0;
  };

  return (
    <div className="relative">
      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3">
          {(['disponible', 'reservado', 'vendido'] as LotStatus[]).map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-xs text-slate-600">
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_FILL[s] }} />
              {STATUS_LABEL[s]} ({stats[s] || 0})
            </span>
          ))}
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))} className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center text-sm font-bold transition-all">−</button>
          <span className="text-xs text-slate-500 w-12 text-center font-medium">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))} className="w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 flex items-center justify-center text-sm font-bold transition-all">+</button>
          {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
            <button onClick={resetView} className="px-2.5 h-8 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 text-xs font-medium transition-all">
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Plan canvas */}
      <div
        ref={containerRef}
        className="relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 select-none"
        style={{ aspectRatio: `${planData.imageWidth} / ${planData.imageHeight}`, maxHeight: '70vh' }}
        onWheel={handleWheel}
        onMouseDown={handlePanStart}
        onMouseMove={handlePanMove}
        onMouseUp={handlePanEnd}
        onMouseLeave={handlePanEnd}
      >
        <div
          className="w-full h-full transition-transform duration-100"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Plan image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={planData.imageUrl}
            alt={`Plano de ${project.name}`}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />

          {/* SVG overlay */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {planData.blocks.map((block, blockIdx) => {
              const layout = blockLayouts.get(block.id) || [];
              const isBlockHovered = hoveredBlock === block.id;

              return (
                <g key={block.id}>
                  {/* Block background */}
                  <rect
                    x={block.x}
                    y={block.y}
                    width={block.width}
                    height={block.height}
                    fill={isBlockHovered ? 'rgba(0,152,220,0.06)' : BLOCK_BG[blockIdx % BLOCK_BG.length]}
                    stroke={isBlockHovered ? 'rgba(0,152,220,0.4)' : 'rgba(100,116,139,0.2)'}
                    strokeWidth={0.15}
                    rx={0.2}
                    onMouseEnter={() => setHoveredBlock(block.id)}
                    onMouseLeave={() => setHoveredBlock(null)}
                  />

                  {/* Block label — top of block */}
                  <text
                    x={block.x + 0.5}
                    y={block.y + Math.min(block.height * 0.12, 1.8)}
                    fill="rgba(30,41,59,0.7)"
                    fontSize={Math.min(block.width / 6, block.height / 6, 1.5)}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    Mz {block.blockName}
                  </text>

                  {/* Auto-generated lot tiles */}
                  {layout.map(({ lot, x: lx, y: ly, w: lw, h: lh }) => {
                    const isSelected = selectedLot?.id === lot.id;
                    const isHovered = hoveredLot === lot.id;
                    const isClickable = lot.status === 'disponible';

                    // Convert local % to plan %
                    const absX = block.x + (lx / 100) * block.width;
                    const absY = block.y + (ly / 100) * block.height;
                    const absW = (lw / 100) * block.width;
                    const absH = (lh / 100) * block.height;

                    const fill = isSelected
                      ? '#0098dc'
                      : isHovered && isClickable
                        ? STATUS_FILL_HOVER[lot.status]
                        : STATUS_FILL[lot.status];

                    const opacity = isClickable ? (isSelected || isHovered ? 1 : 0.85) : 0.45;

                    return (
                      <g key={lot.id}>
                        <rect
                          x={absX}
                          y={absY}
                          width={absW}
                          height={absH}
                          fill={fill}
                          opacity={opacity}
                          rx={0.15}
                          stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.4)'}
                          strokeWidth={isSelected ? 0.2 : 0.08}
                          className={isClickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                          onMouseEnter={() => { setHoveredLot(lot.id); setHoveredBlock(block.id); }}
                          onMouseLeave={() => { setHoveredLot(null); setHoveredBlock(null); }}
                          onClick={(e) => { e.stopPropagation(); handleLotClick(lot); }}
                        />
                        {/* Lot code — only show if tile is big enough */}
                        {absW > 1.5 && absH > 1.5 && (
                          <text
                            x={absX + absW / 2}
                            y={absY + absH / 2}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize={Math.min(absW * 0.45, absH * 0.35, 0.9)}
                            fontWeight="bold"
                            className="pointer-events-none select-none"
                          >
                            {lot.fila || lot.lote}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Floating tooltip */}
      <AnimatePresence>
        {hoveredLot && (() => {
          const lot = lots.find((l) => l.id === hoveredLot);
          if (!lot || !containerRef.current) return null;
          const containerRect = containerRef.current.getBoundingClientRect();
          const tx = tooltipPos.x - containerRect.left;
          const ty = tooltipPos.y - containerRect.top;

          return (
            <motion.div
              key="tooltip"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.12 }}
              className="absolute z-50 pointer-events-none"
              style={{ left: tx + 15, top: ty - 10 }}
            >
              <div className="bg-slate-900 text-white rounded-xl px-3.5 py-2.5 shadow-2xl min-w-[170px]">
                <p className="font-bold text-sm">{lot.label}</p>
                <div className="mt-1.5 space-y-1 text-slate-300 text-xs">
                  <div className="flex justify-between gap-4">
                    <span>Área</span>
                    <span className="text-white font-medium">{lot.area.toFixed(2)} m²</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Precio</span>
                    <span className="text-emerald-400 font-bold">{fmt(lot.price)}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>S/ / m²</span>
                    <span className="text-white font-medium">{precioM2(lot).toLocaleString('es-PE')}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Estado</span>
                    <span className="font-medium" style={{ color: STATUS_FILL[lot.status] }}>
                      {STATUS_LABEL[lot.status]}
                    </span>
                  </div>
                </div>
                {lot.status === 'disponible' && (
                  <p className="text-primary-300 text-[10px] font-semibold mt-2 text-center">Clic para seleccionar</p>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Mobile selected lot panel */}
      <AnimatePresence>
        {selectedLot && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-lg p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-sm shadow-lg">
                  {selectedLot.manzana}
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">Lote seleccionado</p>
                  <h3 className="text-base font-bold text-slate-900">{selectedLot.label}</h3>
                </div>
              </div>
              <button onClick={() => onSelectLot(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Área</p>
                <p className="text-sm font-bold text-slate-900">{selectedLot.area.toFixed(1)} m²</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Precio</p>
                <p className="text-sm font-bold text-emerald-600">{fmt(selectedLot.price)}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">S//m²</p>
                <p className="text-sm font-bold text-slate-900">{precioM2(selectedLot).toLocaleString('es-PE')}</p>
              </div>
            </div>

            {purchaseType === 'financiado' && calcMonthly && (
              <div className="mt-2 bg-primary-50 rounded-xl p-3 border border-primary-100 text-center">
                <p className="text-xs text-primary-600">Cuota mensual estimada</p>
                <p className="text-lg font-bold text-primary-700">{fmt(calcMonthly(selectedLot.price))}/mes</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instructions */}
      <p className="text-xs text-slate-400 mt-3 text-center">
        💡 Usa la rueda del ratón para hacer zoom · Alt + arrastrar para mover el plano · Clic en lotes verdes para seleccionar
      </p>
    </div>
  );
}
