'use client';

/**
 * PlanManualEditor — Editor manual de polígonos sobre el plano
 *
 * MODOS:
 *   draw   → click para añadir vértices, doble-click cierra polígono
 *   select → click en polígono lo selecciona, arrastra vértices para editarlos
 *
 * Cada polígono se asocia a un LotData y se guarda como LotShape.
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { ProjectData, LotData, LotShape } from '@/lib/projects-data';
import {
  getLotShapes,
  upsertLotShape,
  deleteLotShape,
  clearLotShapes,
  updatePlanImage,
  removePlanImage,
} from '@/lib/admin-store';
import { formatPrice } from '@/lib/projects-data';

/* ─────────────────────────────────────────────
   TIPOS INTERNOS
───────────────────────────────────────────── */
type EditorMode = 'idle' | 'draw' | 'select';

interface DraftPolygon {
  points: [number, number][];  // % coordinates 0-100
}

interface SelectedShape {
  shapeId: string;
  lotId: string;
  dragVertexIdx: number | null;
}

/* ─────────────────────────────────────────────
   COLORES
───────────────────────────────────────────── */
const COLORS = {
  draft: { fill: 'rgba(0,152,220,0.20)', stroke: '#0098dc', vertex: '#0098dc' },
  saved: { fill: 'rgba(16,185,129,0.22)', stroke: '#10b981' },
  selected: { fill: 'rgba(245,158,11,0.30)', stroke: '#f59e0b', vertex: '#f59e0b' },
  hover: { fill: 'rgba(16,185,129,0.38)', stroke: '#059669' },
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const VERTEX_RADIUS = 5; // px — SVG vertex circle radius

/* ─────────────────────────────────────────────
   PROPS
───────────────────────────────────────────── */
interface PlanManualEditorProps {
  project: ProjectData;
  onUpdate: () => void;
  showToast: (msg: string) => void;
}

/* ─────────────────────────────────────────────
   COMPONENTE
───────────────────────────────────────────── */
export default function PlanManualEditor({ project, onUpdate, showToast }: PlanManualEditorProps) {
  const planData = project.planData;
  const lots = useMemo(() => project.lots || [], [project.lots]);
  const fmt = (price: number) => formatPrice(price, project.currency ?? 'PEN');

  // ── State ──
  const [shapes, setShapes] = useState<LotShape[]>([]);
  const [mode, setMode] = useState<EditorMode>('idle');
  const [draft, setDraft] = useState<DraftPolygon | null>(null);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);
  const [selected, setSelected] = useState<SelectedShape | null>(null);
  const [hoveredShapeId, setHoveredShapeId] = useState<string | null>(null);
  const [assignLotId, setAssignLotId] = useState<string>('');
  const [searchLot, setSearchLot] = useState('');

  // ── Refs ──
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Reload shapes from store ──
  const reload = useCallback(() => {
    setShapes(getLotShapes(project.id));
  }, [project.id]);

  useEffect(() => { reload(); }, [reload]);

  // ── Lot map ──
  const lotMap = useMemo(() => {
    const m = new Map<string, LotData>();
    lots.forEach((l) => m.set(l.id, l));
    return m;
  }, [lots]);

  // ── Unmapped lots (no tienen shape aún) ──
  const assignedLotIds = useMemo(() => new Set(shapes.map((s) => s.lotId)), [shapes]);
  const filteredLots = useMemo(() => {
    return lots.filter((l) => {
      const notAssigned = !assignedLotIds.has(l.id);
      const matchSearch = !searchLot || l.label.toLowerCase().includes(searchLot.toLowerCase());
      return notAssigned && matchSearch;
    });
  }, [lots, assignedLotIds, searchLot]);

  // ── SVG coordinate conversion ──
  const clientToSvgPct = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return [
      Math.max(0, Math.min(100, x)),
      Math.max(0, Math.min(100, y)),
    ];
  }, []);

  // ── Image upload ──
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        updatePlanImage(project.id, dataUrl, img.naturalWidth, img.naturalHeight);
        onUpdate();
        showToast('✅ Plano cargado');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [project.id, onUpdate, showToast]);

  // ── SVG click handler ──
  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'draw') return;
    const pt = clientToSvgPct(e.clientX, e.clientY);
    if (!pt) return;

    setDraft((prev) => {
      if (!prev) return { points: [pt] };
      return { points: [...prev.points, pt] };
    });
  }, [mode, clientToSvgPct]);

  // ── Double-click closes polygon ──
  const handleSvgDblClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    if (!draft || draft.points.length < 3) {
      showToast('⚠️ Dibuja al menos 3 puntos para cerrar el polígono');
      return;
    }
    // Close polygon — show lot assignment
    setMode('idle');
  }, [mode, draft, showToast]);

  // ── Mouse move (live cursor preview) ──
  const handleSvgMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const pt = clientToSvgPct(e.clientX, e.clientY);
    setMousePos(pt);

    // Drag vertex
    if (selected?.dragVertexIdx !== null && selected?.dragVertexIdx !== undefined && pt) {
      setShapes((prev) => {
        const updated = prev.map((s) => {
          if (s.id !== selected.shapeId) return s;
          const newPts = [...s.polygonPoints];
          newPts[selected.dragVertexIdx!] = pt;
          return { ...s, polygonPoints: newPts };
        });
        return updated;
      });
    }
  }, [clientToSvgPct, selected]);

  const handleSvgMouseUp = useCallback(() => {
    if (selected?.dragVertexIdx !== null && selected?.dragVertexIdx !== undefined) {
      // Persist vertex drag
      const shape = shapes.find((s) => s.id === selected.shapeId);
      if (shape) {
        upsertLotShape(project.id, shape.lotId, shape.polygonPoints, shape.source);
        showToast('Vértice movido y guardado');
        onUpdate();
      }
      setSelected((s) => s ? { ...s, dragVertexIdx: null } : null);
    }
  }, [selected, shapes, project.id, onUpdate, showToast]);

  // ── Save draft polygon ──
  const saveDraft = useCallback(() => {
    if (!draft || draft.points.length < 3) {
      showToast('⚠️ Polígono necesita al menos 3 vértices');
      return;
    }
    if (!assignLotId) {
      showToast('⚠️ Selecciona un lote para asignar');
      return;
    }
    upsertLotShape(project.id, assignLotId, draft.points, 'manual');
    reload();
    onUpdate();
    setDraft(null);
    setAssignLotId('');
    showToast(`✅ Polígono guardado para ${lotMap.get(assignLotId)?.label ?? assignLotId}`);
  }, [draft, assignLotId, project.id, reload, onUpdate, lotMap, showToast]);

  const cancelDraft = useCallback(() => {
    setDraft(null);
    setMode('idle');
  }, []);

  // ── Delete selected shape ──
  const deleteSelected = useCallback(() => {
    if (!selected) return;
    const shape = shapes.find((s) => s.id === selected.shapeId);
    if (!shape) return;
    deleteLotShape(project.id, shape.lotId);
    setSelected(null);
    reload();
    onUpdate();
    showToast('🗑️ Polígono eliminado');
  }, [selected, shapes, project.id, reload, onUpdate, showToast]);

  // ── Reassign selected shape ──
  const reassignSelected = useCallback((newLotId: string) => {
    if (!selected || !newLotId) return;
    const shape = shapes.find((s) => s.id === selected.shapeId);
    if (!shape) return;
    deleteLotShape(project.id, shape.lotId);
    upsertLotShape(project.id, newLotId, shape.polygonPoints, 'manual');
    reload();
    onUpdate();
    setSelected(null);
    showToast(`🔗 Reasignado a ${lotMap.get(newLotId)?.label ?? newLotId}`);
  }, [selected, shapes, project.id, reload, onUpdate, lotMap, showToast]);

  // ── Clear all shapes ──
  const clearAll = useCallback(() => {
    if (!window.confirm(`¿Eliminar los ${shapes.length} polígonos de este proyecto?`)) return;
    clearLotShapes(project.id);
    setSelected(null);
    reload();
    onUpdate();
    showToast('🗑️ Todos los polígonos eliminados');
  }, [shapes.length, project.id, reload, onUpdate, showToast]);

  const selectedShape = selected ? shapes.find((s) => s.id === selected.shapeId) : null;
  const selectedLot = selectedShape ? lotMap.get(selectedShape.lotId) : null;

  // ── No plan image ──
  if (!planData?.imageUrl) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <h3 className="font-bold text-slate-900 mb-2">Sube el plano del proyecto</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-sm mx-auto">
          Necesitas la imagen del master plan para dibujar los polígonos de cada lote.
        </p>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-200/50"
        >
          Seleccionar imagen del plano
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => { setMode(mode === 'draw' ? 'idle' : 'draw'); setDraft(null); setSelected(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            mode === 'draw'
              ? 'bg-primary-600 text-white shadow-lg shadow-primary-200/50'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
          </svg>
          {mode === 'draw' ? 'Cancelar dibujo' : '✏️ Dibujar polígono'}
        </button>

        <button
          onClick={() => { setMode(mode === 'select' ? 'idle' : 'select'); setDraft(null); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
            mode === 'select'
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-200/50'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zm-7.518-.267A8.25 8.25 0 1120.25 10.5M8.288 14.212A5.25 5.25 0 1117.25 10.5" />
          </svg>
          {mode === 'select' ? 'Salir edición' : '🖱️ Seleccionar / editar'}
        </button>

        <div className="flex-1" />

        <span className="text-xs text-slate-400 font-medium">{shapes.length} polígono{shapes.length !== 1 ? 's' : ''} guardado{shapes.length !== 1 ? 's' : ''}</span>

        {shapes.length > 0 && (
          <button onClick={clearAll} className="px-3 py-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl text-sm transition-all border border-red-100">
            🗑️ Limpiar todo
          </button>
        )}

        <button
          onClick={() => { fileInputRef.current?.click(); }}
          className="px-3 py-2.5 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm transition-all"
        >
          📷 Cambiar plano
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

        <button
          onClick={() => { if (window.confirm('¿Eliminar el plano y todos los polígonos?')) { removePlanImage(project.id); clearLotShapes(project.id); reload(); onUpdate(); showToast('Plano eliminado'); } }}
          className="p-2.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Eliminar plano"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </button>
      </div>

      {/* ── Instructions ── */}
      {mode === 'draw' && (
        <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-2.5 text-sm text-primary-700 font-medium">
          ✏️ <strong>Modo dibujo:</strong> Haz clic para añadir vértices. <strong>Doble clic</strong> para cerrar el polígono.
        </div>
      )}
      {mode === 'select' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700 font-medium">
          🖱️ <strong>Modo selección:</strong> Haz clic en un polígono para seleccionarlo. Arrastra sus vértices para editarlo.
        </div>
      )}

      {/* ── Canvas + Panel lateral ── */}
      <div className="flex gap-4">
        {/* Canvas */}
        <div
          ref={containerRef}
          className="relative flex-1 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100"
          style={{
            aspectRatio: planData.imageWidth && planData.imageHeight
              ? `${planData.imageWidth} / ${planData.imageHeight}`
              : '16/9',
            maxHeight: '70vh',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={planData.imageUrl}
            alt="Plano"
            className="w-full h-full object-contain pointer-events-none select-none"
            draggable={false}
          />

          {/* SVG para overlays */}
          <svg
            ref={svgRef}
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{ cursor: mode === 'draw' ? 'crosshair' : 'default' }}
            onClick={handleSvgClick}
            onDoubleClick={handleSvgDblClick}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onMouseLeave={() => setMousePos(null)}
          >
            {/* Polígonos guardados */}
            {shapes.map((shape) => {
              const isSelected = selected?.shapeId === shape.id;
              const isHovered = hoveredShapeId === shape.id && !isSelected;
              const pts = shape.polygonPoints.map(([x, y]) => `${x},${y}`).join(' ');
              const col = isSelected ? COLORS.selected : isHovered ? COLORS.hover : COLORS.saved;

              return (
                <g key={shape.id}>
                  <polygon
                    points={pts}
                    fill={col.fill}
                    stroke={col.stroke}
                    strokeWidth={0.25}
                    style={{ cursor: mode === 'select' ? 'pointer' : 'default' }}
                    onMouseEnter={() => mode === 'select' && setHoveredShapeId(shape.id)}
                    onMouseLeave={() => setHoveredShapeId(null)}
                    onClick={(e) => {
                      if (mode !== 'select') return;
                      e.stopPropagation();
                      setSelected({ shapeId: shape.id, lotId: shape.lotId, dragVertexIdx: null });
                    }}
                  />
                  {/* Vértices editables en modo select */}
                  {isSelected && shape.polygonPoints.map(([x, y], vi) => (
                    <circle
                      key={vi}
                      cx={x} cy={y} r={0.8}
                      fill={COLORS.selected.vertex}
                      stroke="white" strokeWidth={0.2}
                      style={{ cursor: 'grab' }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setSelected((s) => s ? { ...s, dragVertexIdx: vi } : null);
                      }}
                    />
                  ))}
                  {/* Label */}
                  {(() => {
                    const lot = lotMap.get(shape.lotId);
                    if (!lot) return null;
                    const xs = shape.polygonPoints.map(([x]) => x);
                    const ys = shape.polygonPoints.map(([, y]) => y);
                    const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
                    const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
                    const w = Math.max(...xs) - Math.min(...xs);
                    const h = Math.max(...ys) - Math.min(...ys);
                    return (
                      <text
                        x={cx} y={cy}
                        textAnchor="middle" dominantBaseline="middle"
                        fill={isSelected ? COLORS.selected.stroke : COLORS.saved.stroke}
                        fontSize={Math.min(w * 0.28, h * 0.28, 1.1)}
                        fontWeight="bold"
                        style={{ pointerEvents: 'none', userSelect: 'none' }}
                      >
                        {lot.label.replace('Mz ', '').replace('Lt ', '')}
                      </text>
                    );
                  })()}
                </g>
              );
            })}

            {/* Draft en progreso */}
            {draft && draft.points.length > 0 && (
              <g>
                {draft.points.length > 1 && (
                  <polyline
                    points={draft.points.map(([x, y]) => `${x},${y}`).join(' ')}
                    fill="none" stroke={COLORS.draft.stroke} strokeWidth={0.25} strokeDasharray="1,0.5"
                  />
                )}
                {/* Línea hasta cursor */}
                {mousePos && (
                  <line
                    x1={draft.points[draft.points.length - 1][0]}
                    y1={draft.points[draft.points.length - 1][1]}
                    x2={mousePos[0]} y2={mousePos[1]}
                    stroke={COLORS.draft.stroke} strokeWidth={0.2} strokeDasharray="0.8,0.4"
                  />
                )}
                {/* Relleno preview */}
                {draft.points.length >= 3 && (
                  <polygon
                    points={draft.points.map(([x, y]) => `${x},${y}`).join(' ')}
                    fill={COLORS.draft.fill} stroke={COLORS.draft.stroke} strokeWidth={0.25} strokeDasharray="1,0.5"
                  />
                )}
                {/* Vértices */}
                {draft.points.map(([x, y], i) => (
                  <circle
                    key={i} cx={x} cy={y} r={0.7}
                    fill={COLORS.draft.vertex} stroke="white" strokeWidth={0.2}
                  />
                ))}
              </g>
            )}
          </svg>
        </div>

        {/* Panel lateral */}
        <div className="w-72 space-y-3 flex-shrink-0">
          {/* Draft: asignación de lote */}
          {draft && draft.points.length >= 3 && mode === 'idle' && (
            <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-bold text-primary-900 text-sm">Asignar polígono a lote</h4>
              <p className="text-xs text-primary-600">{draft.points.length} vértices</p>
              <input
                type="text"
                placeholder="Buscar lote..."
                value={searchLot}
                onChange={(e) => setSearchLot(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-primary-200 rounded-lg"
              />
              <select
                value={assignLotId}
                onChange={(e) => setAssignLotId(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-primary-200 rounded-lg"
                size={Math.min(filteredLots.length + 1, 8)}
              >
                <option value="">— Selecciona lote —</option>
                {filteredLots.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label} · {l.area.toFixed(0)}m² · {l.status}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button
                  onClick={saveDraft}
                  disabled={!assignLotId}
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-30 text-white text-sm font-bold rounded-xl transition-all"
                >
                  💾 Guardar
                </button>
                <button
                  onClick={cancelDraft}
                  className="px-3 py-2.5 bg-white border border-slate-200 text-slate-500 text-sm rounded-xl hover:bg-slate-50 transition-all"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Draft en progreso (aún dibujando) */}
          {draft && mode === 'draw' && (
            <div className="bg-slate-800 rounded-2xl p-4 space-y-2">
              <h4 className="font-bold text-white text-sm">Dibujando polígono</h4>
              <p className="text-xs text-slate-300">{draft.points.length} vértice{draft.points.length !== 1 ? 's' : ''}</p>
              {draft.points.length >= 3 && (
                <p className="text-xs text-primary-400">Doble clic para cerrar</p>
              )}
              <button onClick={cancelDraft} className="w-full py-2 text-sm text-slate-400 hover:text-white transition-all">
                Cancelar
              </button>
            </div>
          )}

          {/* Shape seleccionado */}
          {selectedShape && selectedLot && (
            <div className="bg-white rounded-2xl border border-amber-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">Polígono seleccionado</h4>
                <button
                  onClick={() => setSelected(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-sm">
                <p className="font-bold text-slate-900">{selectedLot.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{selectedLot.area.toFixed(1)} m² · {fmt(selectedLot.price)} · {selectedLot.status}</p>
                <p className="text-slate-400 text-xs mt-0.5">{selectedShape.polygonPoints.length} vértices</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-500">Reasignar a otro lote</label>
                <select
                  defaultValue=""
                  onChange={(e) => { if (e.target.value) reassignSelected(e.target.value); }}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="">Seleccionar lote...</option>
                  {lots.filter((l) => l.id !== selectedShape.lotId).map((l) => (
                    <option key={l.id} value={l.id}>{l.label} ({l.status})</option>
                  ))}
                </select>
              </div>
              <button
                onClick={deleteSelected}
                className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl border border-red-200 transition-all"
              >
                🗑️ Eliminar polígono
              </button>
            </div>
          )}

          {/* Lista de lotes sin polígono */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Sin polígono ({filteredLots.length})
              </h4>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-50">
              {filteredLots.length === 0 ? (
                <p className="p-3 text-xs text-slate-400 text-center">Todos los lotes tienen polígono ✅</p>
              ) : (
                filteredLots.slice(0, 50).map((l) => (
                  <div key={l.id} className="flex items-center gap-2 px-3 py-2 text-xs">
                    <span className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
                    <span className="flex-1 text-slate-600 truncate">{l.label}</span>
                    <span className="text-slate-300">{l.area.toFixed(0)}m²</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
