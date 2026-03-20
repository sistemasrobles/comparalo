'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LotData, LotStatus, ProjectData, PlanData, DetectedPlanLot } from '@/lib/projects-data';
import { formatPrice } from '@/lib/projects-data';

/* ═══════════════════════════════════════════════
   STATUS PALETTE
   ═══════════════════════════════════════════════ */
const STATUS_FILL: Record<LotStatus, { normal: string; hover: string; label: string }> = {
  disponible: { normal: 'rgba(16,185,129,0.35)', hover: 'rgba(5,150,105,0.55)', label: 'Disponible' },
  reservado: { normal: 'rgba(245,158,11,0.35)', hover: 'rgba(217,119,6,0.55)', label: 'Reservado' },
  vendido: { normal: 'rgba(239,68,68,0.30)', hover: 'rgba(220,38,38,0.45)', label: 'Vendido' },
  bloqueado: { normal: 'rgba(148,163,184,0.25)', hover: 'rgba(100,116,139,0.40)', label: 'No disponible' },
};

const STATUS_STROKE: Record<LotStatus, string> = {
  disponible: '#10b981',
  reservado: '#f59e0b',
  vendido: '#ef4444',
  bloqueado: '#94a3b8',
};

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */
interface RealPlanViewProps {
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
export default function RealPlanView({
  project,
  lots,
  planData,
  selectedLot,
  onSelectLot,
  purchaseType = 'financiado',
  calcMonthly,
}: RealPlanViewProps) {
  const [hoveredDetId, setHoveredDetId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const fmt = (price: number) => formatPrice(price, project.currency ?? 'PEN');
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  /* ── Build lookup: detectionId → lot ── */
  const detToLot = useMemo(() => {
    const map = new Map<string, LotData>();
    const lotMap = new Map<string, LotData>();
    lots.forEach((l) => lotMap.set(l.id, l));

    (planData.detections || []).forEach((det) => {
      if (det.matchedLotId) {
        const lot = lotMap.get(det.matchedLotId);
        if (lot) map.set(det.id, lot);
      }
    });
    return map;
  }, [lots, planData.detections]);

  /* ── Visible detections: only approved/matched with lot ── */
  const visibleDetections = useMemo(() => {
    return (planData.detections || []).filter((d) => {
      const validStatus = d.reviewStatus === 'approved' || d.reviewStatus === 'matched';
      return validStatus && d.matchedLotId && detToLot.has(d.id);
    });
  }, [planData.detections, detToLot]);

  /* ── Lot from detId ── */
  const getLot = useCallback((detId: string) => detToLot.get(detId), [detToLot]);

  /* ── Get detection for selected lot ── */
  const selectedDetId = useMemo(() => {
    if (!selectedLot) return null;
    const det = visibleDetections.find((d) => d.matchedLotId === selectedLot.id);
    return det?.id || null;
  }, [selectedLot, visibleDetections]);

  /* ── Hovered lot ── */
  const hoveredLot = useMemo(() => {
    if (!hoveredDetId) return null;
    return getLot(hoveredDetId) || null;
  }, [hoveredDetId, getLot]);

  /* ── Pan & Zoom handlers ── */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    setZoom((z) => Math.min(Math.max(z + delta, 0.5), 5));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  /* ── Click polygon → select lot ── */
  const handlePolygonClick = useCallback((det: DetectedPlanLot) => {
    const lot = getLot(det.id);
    if (!lot) return;
    if (lot.status !== 'disponible') return;
    onSelectLot(selectedLot?.id === lot.id ? null : lot);
  }, [getLot, onSelectLot, selectedLot]);

  /* ── Render ── */
  if (visibleDetections.length === 0) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
        <p className="text-slate-500 text-sm">No hay detecciones aprobadas para mostrar el plano interactivo.</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 select-none">
      {/* ── Zoom controls ── */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        <button onClick={() => setZoom((z) => Math.min(z + 0.3, 5))} className="w-9 h-9 bg-white/90 backdrop-blur rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:bg-white transition-all font-bold text-lg">+</button>
        <button onClick={() => setZoom((z) => Math.max(z - 0.3, 0.5))} className="w-9 h-9 bg-white/90 backdrop-blur rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:bg-white transition-all font-bold text-lg">−</button>
        <button onClick={resetView} className="w-9 h-9 bg-white/90 backdrop-blur rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:bg-white transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
        </button>
      </div>

      {/* ── Legend ── */}
      <div className="absolute bottom-3 left-3 z-20 bg-white/90 backdrop-blur rounded-xl px-3 py-2 shadow-lg flex items-center gap-3">
        {(['disponible', 'reservado', 'vendido', 'bloqueado'] as LotStatus[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: STATUS_STROKE[s] }} />
            <span className="text-[10px] font-semibold text-slate-600">{STATUS_FILL[s].label}</span>
          </div>
        ))}
      </div>

      {/* ── Canvas ── */}
      <div
        ref={containerRef}
        className="overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ maxHeight: '65vh', aspectRatio: planData.imageWidth && planData.imageHeight ? `${planData.imageWidth} / ${planData.imageHeight}` : undefined }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setIsPanning(false); setHoveredDetId(null); }}
      >
        <div
          className="relative w-full h-full origin-center transition-transform duration-100"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          {/* Plan image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={planData.imageUrl}
            alt={`Plano de ${project.name}`}
            className="w-full h-full object-contain pointer-events-none"
            draggable={false}
          />

          {/* SVG polygon overlays */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {visibleDetections.map((det) => {
              const lot = getLot(det.id);
              if (!lot) return null;

              const status = lot.status;
              const colors = STATUS_FILL[status];
              const isSelected = selectedDetId === det.id;
              const isHovered = hoveredDetId === det.id;
              const points = (det.manualPolygon || det.polygon).map(([x, y]) => `${x},${y}`).join(' ');

              return (
                <g key={det.id}>
                  <polygon
                    points={points}
                    fill={isSelected ? 'rgba(0,152,220,0.45)' : isHovered ? colors.hover : colors.normal}
                    stroke={isSelected ? '#0098dc' : STATUS_STROKE[status]}
                    strokeWidth={isSelected ? 0.35 : isHovered ? 0.25 : 0.15}
                    className={`transition-all ${status === 'disponible' ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                    onMouseEnter={(e) => {
                      e.stopPropagation();
                      setHoveredDetId(det.id);
                    }}
                    onMouseLeave={() => setHoveredDetId(null)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePolygonClick(det);
                    }}
                  />
                  {/* Label */}
                  <text
                    x={det.centroid.x}
                    y={det.centroid.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? '#0098dc' : STATUS_STROKE[status]}
                    fontSize={Math.min(det.bbox.w * 0.25, det.bbox.h * 0.25, 1)}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                    style={{ textShadow: '0 0 2px rgba(255,255,255,0.8)' }}
                  >
                    {lot.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* ── Tooltip ── */}
      <AnimatePresence>
        {hoveredLot && !isPanning && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="fixed z-50 pointer-events-none"
            style={{ left: tooltipPos.x + 14, top: tooltipPos.y - 10 }}
          >
            <div className="bg-white rounded-xl shadow-xl border border-slate-200 px-4 py-3 min-w-[200px]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-bold text-slate-900">{hoveredLot.label}</span>
                <span
                  className="px-2 py-0.5 text-[10px] font-semibold rounded-md text-white"
                  style={{ backgroundColor: STATUS_STROKE[hoveredLot.status] }}
                >
                  {STATUS_FILL[hoveredLot.status].label}
                </span>
              </div>
              <div className="flex gap-4 text-xs text-slate-500 mb-1">
                <span>{hoveredLot.area.toFixed(1)} m²</span>
                <span>Mz {hoveredLot.manzana}</span>
              </div>
              {hoveredLot.status === 'disponible' && (
                <>
                  <div className="border-t border-slate-100 pt-1.5 mt-1.5">
                    {purchaseType === 'contado' ? (
                      <p className="text-sm font-bold text-emerald-600">
                        {fmt(hoveredLot.price)} contado
                      </p>
                    ) : (
                      <>
                        <p className="text-sm font-bold text-primary-600">
                          {fmt(hoveredLot.price)}
                        </p>
                        {calcMonthly && (
                          <p className="text-xs text-slate-400">
                            Desde {fmt(calcMonthly(hoveredLot.price))}/mes
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-primary-500 mt-1 font-semibold">Click para seleccionar</p>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Selected lot panel ── */}
      <AnimatePresence>
        {selectedLot && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-200 p-4 w-72"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Seleccionado</p>
                <h4 className="text-lg font-bold text-slate-900">{selectedLot.label}</h4>
              </div>
              <button
                onClick={() => onSelectLot(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Área</span>
                <span className="font-semibold text-slate-900">{selectedLot.area.toFixed(1)} m²</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Manzana</span>
                <span className="font-semibold text-slate-900">{selectedLot.manzana}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Precio</span>
                <span className="font-bold text-primary-600">
                  {purchaseType === 'contado'
                    ? fmt(selectedLot.price)
                    : fmt(selectedLot.price)}
                </span>
              </div>
              {purchaseType === 'financiado' && calcMonthly && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Cuota mensual</span>
                  <span className="font-semibold text-emerald-600">
                    {fmt(calcMonthly(selectedLot.price))}/mes
                  </span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-emerald-600 font-semibold">✅ Lote disponible para reserva</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
