'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { LotData, LotStatus, ProjectData, LotShape, GeneratedLayout } from '@/lib/projects-data';
import { formatPrice } from '@/lib/projects-data';
import { getLotShapes, getGeneratedLayout } from '@/lib/admin-store';
import InteractiveProjectPlan from './InteractiveProjectPlan';
import dynamic from 'next/dynamic';

const CineplanView = dynamic(() => import('./CineplanView'), { ssr: false });

/* ═══════════════════════════════════════════════════════════════
   CONFIGURACIÓN DE ESTADOS — colores, íconos, labels
   ═══════════════════════════════════════════════════════════════ */
const STATUS: Record<LotStatus, {
  bg: string; bgSolid: string; border: string; text: string; label: string;
  ring: string; dot: string;
}> = {
  disponible: {
    bg: 'bg-emerald-50', bgSolid: 'bg-emerald-500', border: 'border-emerald-200',
    text: 'text-emerald-700', label: 'Disponible', ring: 'ring-emerald-400',
    dot: 'bg-emerald-400',
  },
  reservado: {
    bg: 'bg-amber-50', bgSolid: 'bg-amber-500', border: 'border-amber-200',
    text: 'text-amber-700', label: 'Reservado', ring: 'ring-amber-400',
    dot: 'bg-amber-400',
  },
  vendido: {
    bg: 'bg-rose-50', bgSolid: 'bg-rose-500', border: 'border-rose-200',
    text: 'text-rose-600', label: 'Vendido', ring: 'ring-rose-400',
    dot: 'bg-rose-400',
  },
  bloqueado: {
    bg: 'bg-slate-100', bgSolid: 'bg-slate-400', border: 'border-slate-200',
    text: 'text-slate-500', label: 'No disponible', ring: 'ring-slate-300',
    dot: 'bg-slate-300',
  },
};

const SELECTED_STYLE = {
  ring: 'ring-2 ring-primary-500 ring-offset-2',
  bg: 'bg-primary-50',
  border: 'border-primary-300',
  text: 'text-primary-700',
};

/* ═══════════════════════════════════════════════════════════════
   UTILIDADES
   ═══════════════════════════════════════════════════════════════ */
function naturalSort(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function getLotSortKey(lot: LotData): string {
  return lot.fila || String(lot.lote).padStart(4, '0');
}

function getPrecioM2(lot: LotData): number {
  if (lot.precioM2) return lot.precioM2;
  if (lot.area > 0 && lot.price > 0) return Math.round(lot.price / lot.area);
  return 0;
}

function compactPrice(price: number): string {
  if (price >= 1000) return `S/${(price / 1000).toFixed(price % 1000 === 0 ? 0 : 1)}K`;
  return `S/${price.toLocaleString('es-PE')}`;
}

/* ═══════════════════════════════════════════════════════════════
   PROPS — misma interfaz para no romper imports
   ═══════════════════════════════════════════════════════════════ */
interface InteractiveLotMapProps {
  project: ProjectData;
  lots: LotData[];
  selectedLot: LotData | null;
  onSelectLot: (lot: LotData | null) => void;
  purchaseType?: 'financiado' | 'contado';
  calcMonthly?: (price: number) => number;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function InteractiveLotMap({
  project,
  lots,
  selectedLot,
  onSelectLot,
  purchaseType = 'financiado',
  calcMonthly,
}: InteractiveLotMapProps) {
  /* ── Currency helper — uses project currency so admin changes propagate here ── */
  const fmt = (price: number) => formatPrice(price, project.currency ?? 'PEN');

  /* ── State ── */
  const [manzanaFilter, setManzanaFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<LotStatus | 'todas'>('todas');
  const [searchQuery, setSearchQuery] = useState('');
  const [lotShapes, setLotShapes] = useState<LotShape[]>([]);
  const [generatedLayout, setGeneratedLayout] = useState<GeneratedLayout | null>(null);
  const hasPlan = !!generatedLayout || lotShapes.length > 0 || Boolean(project.planData?.imageUrl);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'plan'>('grid');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 0]);
  const [showFilters, setShowFilters] = useState(false);
  const [hoveredLot, setHoveredLot] = useState<string | null>(null);

  /* ── Derived data ── */
  const manzanas = useMemo(() => {
    const set = new Set(lots.map((l) => l.manzana));
    return Array.from(set).sort(naturalSort);
  }, [lots]);

  const priceMinMax = useMemo((): [number, number] => {
    if (lots.length === 0) return [0, 0];
    const prices = lots.map((l) => l.price).filter(Boolean);
    return [Math.min(...prices), Math.max(...prices)];
  }, [lots]);

  const areaMinMax = useMemo((): [number, number] => {
    if (lots.length === 0) return [0, 0];
    const areas = lots.map((l) => l.area).filter(Boolean);
    return [Math.min(...areas), Math.max(...areas)];
  }, [lots]);

  // Initialize ranges
  useEffect(() => {
    setPriceRange(priceMinMax);
    setAreaRange(areaMinMax);
  }, [priceMinMax, areaMinMax]);

  // Load approved lot shapes + generated layout (public sources of truth)
  useEffect(() => {
    // Priority 1: approved GeneratedLayout → CineplanView
    const layout = getGeneratedLayout(project.id);
    if (layout?.status === 'approved') {
      setGeneratedLayout(layout);
      setViewMode('plan');
      return;
    }
    // Priority 2: LotShapes (polygon overlay on plan photo)
    const shapes = getLotShapes(project.id);
    setLotShapes(shapes);
    if (shapes.length > 0) setViewMode('plan');
  }, [project.id]);

  const stats = useMemo(() => {
    const s: Record<string, number> = { disponible: 0, reservado: 0, vendido: 0, bloqueado: 0, total: lots.length };
    lots.forEach((l) => { s[l.status] = (s[l.status] || 0) + 1; });
    return s;
  }, [lots]);

  const filteredLots = useMemo(() => {
    let result = lots;
    if (manzanaFilter !== 'todas') result = result.filter((l) => l.manzana === manzanaFilter);
    if (statusFilter !== 'todas') result = result.filter((l) => l.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((l) =>
        l.label.toLowerCase().includes(q) || l.manzana.toLowerCase().includes(q) || (l.fila && l.fila.toLowerCase().includes(q))
      );
    }
    if (priceRange[0] > priceMinMax[0] || priceRange[1] < priceMinMax[1]) {
      result = result.filter((l) => l.price >= priceRange[0] && l.price <= priceRange[1]);
    }
    if (areaRange[0] > areaMinMax[0] || areaRange[1] < areaMinMax[1]) {
      result = result.filter((l) => l.area >= areaRange[0] && l.area <= areaRange[1]);
    }
    return result;
  }, [lots, manzanaFilter, statusFilter, searchQuery, priceRange, areaRange, priceMinMax, areaMinMax]);

  const groupedByManzana = useMemo(() => {
    const map = new Map<string, LotData[]>();
    filteredLots.forEach((lot) => {
      const arr = map.get(lot.manzana) || [];
      arr.push(lot);
      map.set(lot.manzana, arr);
    });
    map.forEach((arr) => arr.sort((a, b) => naturalSort(getLotSortKey(a), getLotSortKey(b))));
    return new Map([...map.entries()].sort(([a], [b]) => naturalSort(a, b)));
  }, [filteredLots]);

  /* ── Handlers ── */
  const handleLotClick = useCallback((lot: LotData) => {
    if (lot.status !== 'disponible') return;
    onSelectLot(selectedLot?.id === lot.id ? null : lot);
  }, [selectedLot, onSelectLot]);

  const clearFilters = () => {
    setManzanaFilter('todas');
    setStatusFilter('todas');
    setSearchQuery('');
    setPriceRange(priceMinMax);
    setAreaRange(areaMinMax);
  };

  const hasActiveFilters = manzanaFilter !== 'todas' || statusFilter !== 'todas' || searchQuery.trim() !== '' ||
    priceRange[0] > priceMinMax[0] || priceRange[1] < priceMinMax[1] ||
    areaRange[0] > areaMinMax[0] || areaRange[1] < areaMinMax[1];

  const unitLabel = project.category === 'departamentos' ? 'unidad' : 'lote';
  const unitLabelPlural = project.category === 'departamentos' ? 'unidades' : 'lotes';

  return (
    <div className="relative">
      {/* ═══════════════════════════════════════════
          HEADER
          ═══════════════════════════════════════════ */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-200/50">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Selecciona tu {unitLabel}</h2>
                <p className="text-sm text-slate-500">Explora las unidades disponibles en {project.name}</p>
              </div>
            </div>
          </div>

          {/* Stat pills — clickable as filter */}
          <div className="flex flex-wrap gap-2">
            {(['disponible', 'reservado', 'vendido'] as LotStatus[]).map((s) => {
              const cfg = STATUS[s];
              const count = stats[s] || 0;
              if (count === 0) return null;
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(statusFilter === s ? 'todas' : s)}
                  className={`
                    inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold
                    border transition-all duration-200 cursor-pointer select-none
                    ${statusFilter === s
                      ? `${cfg.bg} ${cfg.border} ${cfg.text} shadow-sm`
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:shadow-sm'
                    }
                  `}
                >
                  <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot} ${s === 'disponible' ? 'animate-pulse' : ''}`} />
                  <span>{count}</span>
                  <span className="hidden sm:inline">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══════════ TOOLBAR ═══════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder={`Buscar ${unitLabel} por código, manzana...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
              />
            </div>

            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
              {/* Manzana */}
              <select
                value={manzanaFilter}
                onChange={(e) => setManzanaFilter(e.target.value)}
                className="px-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all cursor-pointer min-w-[140px]"
              >
                <option value="todas">Todas Mz.</option>
                {manzanas.map((mz) => <option key={mz} value={mz}>Manzana {mz}</option>)}
              </select>

              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                  flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-xl border transition-all
                  ${showFilters || hasActiveFilters
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
                  }
                `}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                </svg>
                <span className="hidden sm:inline">Filtros</span>
                {hasActiveFilters && (
                  <span className="w-5 h-5 rounded-full bg-primary-600 text-white text-[10px] font-bold flex items-center justify-center">!</span>
                )}
              </button>

              {/* View toggle */}
              <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                {hasPlan ? (
                  <button
                    onClick={() => setViewMode('plan')}
                    className={`px-3 py-2.5 transition-all ${viewMode === 'plan' ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                    title="Vista plano"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
                    </svg>
                  </button>
                ) : null}
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2.5 transition-all ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  title="Vista interactiva"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2.5 transition-all ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  title="Vista lista"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Advanced filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-3 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Rango de precio</label>
                      <div className="flex items-center gap-2">
                        <input type="number" value={priceRange[0]} onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-400 outline-none" placeholder="Min" />
                        <span className="text-slate-400 text-xs">—</span>
                        <input type="number" value={priceRange[1]} onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-400 outline-none" placeholder="Max" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 block">Rango de área (m²)</label>
                      <div className="flex items-center gap-2">
                        <input type="number" value={areaRange[0]} onChange={(e) => setAreaRange([Number(e.target.value), areaRange[1]])} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-400 outline-none" placeholder="Min" />
                        <span className="text-slate-400 text-xs">—</span>
                        <input type="number" value={areaRange[1]} onChange={(e) => setAreaRange([areaRange[0], Number(e.target.value)])} className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:border-primary-400 outline-none" placeholder="Max" />
                      </div>
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <button onClick={clearFilters} className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      Limpiar todos los filtros
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══════════ LEGEND ═══════════ */}
      <div className="flex flex-wrap items-center gap-3 mb-5 px-1">
        {(['disponible', 'reservado', 'vendido', 'bloqueado'] as LotStatus[]).map((s) => {
          const cfg = STATUS[s];
          if ((stats[s] || 0) === 0 && s === 'bloqueado') return null;
          return (
            <span key={s} className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <span className={`w-3 h-3 rounded-sm ${cfg.bgSolid}`} />
              {cfg.label}
            </span>
          );
        })}
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <span className="w-3 h-3 rounded-sm bg-primary-500 ring-1 ring-primary-300 ring-offset-1" />
          Seleccionado
        </span>
        <span className="text-xs text-slate-400 ml-auto">
          {filteredLots.length} de {lots.length} {unitLabelPlural}
        </span>
      </div>

      {/* ═══════════════════════════════════════════
          MAIN CONTENT AREA
          ═══════════════════════════════════════════ */}
      {viewMode === 'plan' && generatedLayout ? (
        <CineplanView
          project={project}
          layout={generatedLayout}
          lots={lots}
          selectedLot={selectedLot}
          onSelectLot={onSelectLot}
          purchaseType={purchaseType}
          calcMonthly={calcMonthly}
        />
      ) : viewMode === 'plan' && project.planData ? (
        <InteractiveProjectPlan
          project={project}
          lots={lots}
          planData={project.planData}
          shapes={lotShapes}
          selectedLot={selectedLot}
          onSelectLot={onSelectLot}
          purchaseType={purchaseType}
          calcMonthly={calcMonthly}
        />
      ) : (
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left: Grid / List */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            {viewMode === 'grid' || viewMode === 'plan' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                {Array.from(groupedByManzana.entries()).map(([manzana, manzanaLots], idx) => (
                  <ManzanaBlock
                    key={manzana}
                    manzana={manzana}
                    lots={manzanaLots}
                    unitLabel={unitLabel}
                    selectedLot={selectedLot}
                    hoveredLot={hoveredLot}
                    onHover={setHoveredLot}
                    onClick={handleLotClick}
                    index={idx}
                    currency={project.currency ?? 'PEN'}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <ListView lots={filteredLots} selectedLot={selectedLot} onClick={handleLotClick} unitLabel={unitLabel} currency={project.currency ?? 'PEN'} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state */}
          {groupedByManzana.size === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
              <p className="text-slate-600 font-semibold mb-1">No se encontraron {unitLabelPlural}</p>
              <p className="text-sm text-slate-400 mb-4">Intenta ajustar los filtros de búsqueda</p>
              <button onClick={clearFilters} className="btn-primary text-sm">Limpiar filtros</button>
            </motion.div>
          )}
        </div>

        {/* Right: Desktop detail panel */}
        <AnimatePresence>
          {selectedLot && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="hidden lg:block w-[340px] flex-shrink-0"
            >
              <div className="sticky top-6">
                <LotDetailPanel
                  lot={selectedLot}
                  project={project}
                  purchaseType={purchaseType}
                  calcMonthly={calcMonthly}
                  onDeselect={() => onSelectLot(null)}
                  unitLabel={unitLabel}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}

      {/* Mobile Bottom Sheet */}
      <AnimatePresence>
        {selectedLot && (
          <MobileBottomSheet
            lot={selectedLot}
            project={project}
            purchaseType={purchaseType}
            calcMonthly={calcMonthly}
            onDeselect={() => onSelectLot(null)}
            unitLabel={unitLabel}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MANZANA BLOCK
   ═══════════════════════════════════════════════════════════════ */
function ManzanaBlock({ manzana, lots, unitLabel, selectedLot, hoveredLot, onHover, onClick, index, currency }: {
  manzana: string; lots: LotData[]; unitLabel: string;
  selectedLot: LotData | null; hoveredLot: string | null;
  onHover: (id: string | null) => void; onClick: (lot: LotData) => void;
  index: number; currency: 'PEN' | 'USD';
}) {
  const disponibles = lots.filter((l) => l.status === 'disponible').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white flex items-center justify-center text-sm font-bold shadow-md">
            {manzana}
          </span>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Manzana {manzana}</h3>
            <p className="text-xs text-slate-400">{lots.length} {unitLabel}s</p>
          </div>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-slate-200 to-transparent" />
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
          disponibles > 0
            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            : 'bg-slate-100 text-slate-400 border border-slate-200'
        }`}>
          {disponibles > 0 ? `${disponibles} disponible${disponibles > 1 ? 's' : ''}` : 'Agotada'}
        </span>
      </div>

      {/* Grid */}
      <div className="bg-gradient-to-b from-slate-50/80 to-white rounded-2xl border border-slate-200/60 p-3 sm:p-4">
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2 sm:gap-2.5">
          {lots.map((lot) => (
            <LotTile
              key={lot.id}
              lot={lot}
              isSelected={selectedLot?.id === lot.id}
              isHovered={hoveredLot === lot.id}
              onHover={onHover}
              onClick={onClick}
              currency={currency}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOT TILE — Cinema seat style
   ═══════════════════════════════════════════════════════════════ */
function LotTile({ lot, isSelected, isHovered, onHover, onClick, currency }: {
  lot: LotData; isSelected: boolean; isHovered: boolean;
  onHover: (id: string | null) => void; onClick: (lot: LotData) => void;
  currency: 'PEN' | 'USD';
}) {
  const cfg = STATUS[lot.status];
  const isClickable = lot.status === 'disponible';
  const lotCode = lot.fila || String(lot.lote).padStart(2, '0');
  const fmt = (price: number) => formatPrice(price, currency);

  return (
    <div className="relative group/tile">
      <motion.button
        onClick={() => onClick(lot)}
        onMouseEnter={() => onHover(lot.id)}
        onMouseLeave={() => onHover(null)}
        disabled={!isClickable}
        whileHover={isClickable ? { scale: 1.1, y: -3 } : {}}
        whileTap={isClickable ? { scale: 0.92 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        className={`
          relative w-full aspect-square rounded-xl flex flex-col items-center justify-center
          border-2 transition-colors duration-200 outline-none
          ${isSelected
            ? `${SELECTED_STYLE.bg} ${SELECTED_STYLE.border} ${SELECTED_STYLE.ring} shadow-lg shadow-primary-200/40`
            : isHovered && isClickable
              ? `bg-white border-emerald-300 shadow-lg shadow-emerald-100/50`
              : `${cfg.bg} ${cfg.border}`
          }
          ${isClickable
            ? 'cursor-pointer'
            : 'cursor-not-allowed opacity-55'
          }
        `}
      >
        {/* Code */}
        <span className={`text-[11px] sm:text-xs font-bold leading-tight ${isSelected ? SELECTED_STYLE.text : cfg.text}`}>
          {lotCode}
        </span>
        {/* Price — only for available lots */}
        {isClickable && (
          <span className={`text-[9px] sm:text-[10px] font-semibold mt-0.5 ${isSelected ? 'text-primary-500' : 'text-slate-500'}`}>
            {compactPrice(lot.price)}
          </span>
        )}
        {/* Non-available status icon */}
        {!isClickable && (
          <span className={`text-[9px] mt-0.5 ${cfg.text}`}>
            {lot.status === 'vendido' ? '✕' : lot.status === 'reservado' ? '◷' : '—'}
          </span>
        )}

        {/* Selection badge */}
        <AnimatePresence>
          {isSelected && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-lg z-10"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && isClickable && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="hidden sm:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-50 pointer-events-none"
          >
            <div className="bg-slate-900 text-white rounded-xl px-3.5 py-2.5 shadow-2xl min-w-[175px]">
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
                  <span className="text-white font-medium">{getPrecioM2(lot).toLocaleString('es-PE')}</span>
                </div>
              </div>
              <p className="text-primary-300 text-[10px] font-semibold mt-2 text-center">Clic para seleccionar</p>
              <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                <div className="w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-slate-900" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LIST VIEW
   ═══════════════════════════════════════════════════════════════ */
function ListView({ lots, selectedLot, onClick, unitLabel, currency }: {
  lots: LotData[]; selectedLot: LotData | null; onClick: (lot: LotData) => void; unitLabel: string; currency: 'PEN' | 'USD';
}) {
  const sorted = useMemo(() =>
    [...lots].sort((a, b) => naturalSort(a.manzana, b.manzana) || naturalSort(getLotSortKey(a), getLotSortKey(b))),
    [lots]
  );
  const fmt = (price: number) => formatPrice(price, currency);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-card overflow-hidden">
      <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <div className="col-span-3">Código</div>
        <div className="col-span-2">Manzana</div>
        <div className="col-span-2">Área</div>
        <div className="col-span-2">Precio</div>
        <div className="col-span-2">Estado</div>
        <div className="col-span-1" />
      </div>
      <div className="divide-y divide-slate-100">
        {sorted.map((lot) => {
          const cfg = STATUS[lot.status];
          const isSelected = selectedLot?.id === lot.id;
          const isClickable = lot.status === 'disponible';

          return (
            <motion.button
              key={lot.id}
              onClick={() => onClick(lot)}
              disabled={!isClickable}
              whileHover={isClickable ? { backgroundColor: 'rgba(0, 152, 220, 0.04)' } : {}}
              className={`
                w-full grid grid-cols-2 sm:grid-cols-12 gap-2 px-4 py-3 text-left items-center transition-all
                ${isSelected ? 'bg-primary-50/70 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}
                ${isClickable ? 'cursor-pointer hover:bg-slate-50/70' : 'cursor-not-allowed opacity-60'}
              `}
            >
              <div className="sm:col-span-3">
                <p className={`text-sm font-bold ${isSelected ? 'text-primary-700' : 'text-slate-900'}`}>{lot.label}</p>
              </div>
              <div className="sm:col-span-2 text-right sm:text-left">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">Mz {lot.manzana}</span>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-slate-600">{lot.area.toFixed(2)} m²</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-bold text-slate-900">{fmt(lot.price)}</p>
              </div>
              <div className="sm:col-span-2">
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                  {cfg.label}
                </span>
              </div>
              <div className="hidden sm:flex sm:col-span-1 justify-end">
                {isClickable && (
                  <svg className={`w-4 h-4 ${isSelected ? 'text-primary-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
      {sorted.length === 0 && (
        <div className="px-4 py-12 text-center text-slate-400 text-sm">No hay {unitLabel}s para mostrar</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DESKTOP DETAIL PANEL
   ═══════════════════════════════════════════════════════════════ */
function LotDetailPanel({ lot, project, purchaseType, calcMonthly, onDeselect, unitLabel }: {
  lot: LotData; project: ProjectData; purchaseType: string;
  calcMonthly?: (price: number) => number; onDeselect: () => void; unitLabel: string;
}) {
  const fmt = (price: number) => formatPrice(price, project.currency ?? 'PEN');
  const precioM2 = getPrecioM2(lot);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-elevated overflow-hidden">
      {/* Gradient header */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 px-5 py-5 text-white">
        <button
          onClick={onDeselect}
          className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-lg font-bold">{lot.manzana}</span>
          </div>
          <div>
            <p className="text-primary-100 text-xs font-medium uppercase tracking-wider">{unitLabel} seleccionado</p>
            <h3 className="text-lg font-bold">{lot.label}</h3>
          </div>
        </div>
        <div className="text-3xl font-extrabold tracking-tight">{fmt(lot.price)}</div>
        {purchaseType === 'financiado' && calcMonthly && (
          <p className="text-primary-200 text-sm mt-1">
            Desde <span className="text-white font-bold">{fmt(calcMonthly(lot.price))}</span>/mes
          </p>
        )}
      </div>

      {/* Details */}
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <DetailMetric label="Área total" value={`${lot.area.toFixed(2)} m²`} />
          <DetailMetric label="Precio/m²" value={`S/${precioM2.toLocaleString('es-PE')}`} />
          <DetailMetric label="Manzana" value={lot.manzana} />
          <DetailMetric label="Estado" value={STATUS[lot.status].label} dotColor={STATUS[lot.status].dot} />
        </div>

        <div className="h-px bg-slate-100" />

        {/* Reservation info */}
        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 rounded-xl p-3.5 border border-emerald-200/60">
          <div className="flex items-center gap-2 text-emerald-700">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <div>
              <p className="text-sm font-bold">{unitLabel === 'lote' ? 'Lote' : 'Unidad'} disponible para reserva</p>
              <p className="text-xs text-emerald-600">Continúa al siguiente paso para reservar</p>
            </div>
          </div>
        </div>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/51999999999?text=Hola, me interesa el ${lot.label} del proyecto ${project.name} (${lot.area}m², ${fmt(lot.price)})`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
        >
          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          Solicitar asesor
        </a>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DETAIL METRIC
   ═══════════════════════════════════════════════════════════════ */
function DetailMetric({ label, value, dotColor }: { label: string; value: string; dotColor?: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5 flex items-center gap-1">
        {dotColor && <span className={`w-2 h-2 rounded-full ${dotColor}`} />}
        {label}
      </p>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE BOTTOM SHEET
   ═══════════════════════════════════════════════════════════════ */
function MobileBottomSheet({ lot, project, purchaseType, calcMonthly, onDeselect, unitLabel }: {
  lot: LotData; project: ProjectData; purchaseType: string;
  calcMonthly?: (price: number) => number; onDeselect: () => void; unitLabel: string;
}) {
  const fmt = (price: number) => formatPrice(price, project.currency ?? 'PEN');
  const precioM2 = getPrecioM2(lot);
  const sheetRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 350 }}
      ref={sheetRef}
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 max-h-[65vh] overflow-y-auto"
    >
      {/* Drag indicator */}
      <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white rounded-t-3xl z-10">
        <div className="w-10 h-1 rounded-full bg-slate-300" />
      </div>

      <div className="px-5 pb-6 pb-safe">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-sm shadow-lg">
              {lot.manzana}
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{unitLabel} seleccionado</p>
              <h3 className="text-base font-bold text-slate-900">{lot.label}</h3>
            </div>
          </div>
          <button onClick={onDeselect} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Price */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-4 text-white mb-4">
          <p className="text-primary-200 text-xs font-medium">Precio total</p>
          <p className="text-2xl font-extrabold tracking-tight">{fmt(lot.price)}</p>
          {purchaseType === 'financiado' && calcMonthly && (
            <p className="text-primary-200 text-xs mt-1">Desde <span className="text-white font-bold">{fmt(calcMonthly(lot.price))}</span>/mes</p>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Área</p>
            <p className="text-sm font-bold text-slate-900">{lot.area.toFixed(1)} m²</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">S/ / m²</p>
            <p className="text-sm font-bold text-slate-900">{precioM2.toLocaleString('es-PE')}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Manzana</p>
            <p className="text-sm font-bold text-slate-900">{lot.manzana}</p>
          </div>
        </div>

        {/* WhatsApp CTA */}
        <a
          href={`https://wa.me/51999999999?text=Hola, me interesa el ${lot.label} del proyecto ${project.name} (${lot.area}m², ${fmt(lot.price)})`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all"
        >
          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
          Solicitar asesor por WhatsApp
        </a>
      </div>
    </motion.div>
  );
}
