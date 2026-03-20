'use client';

/**
 * ManualPlanMapper — Editor manual con DRAG & DROP como flujo principal
 *
 * ═══ FLUJO PRINCIPAL ═══
 * 1. Panel derecho: lista de lotes pendientes (cards arrastrables)
 * 2. Arrastrar card hacia el plano
 * 3. Soltar sobre la región del lote real
 * 4. Confirmar → lote pasa a mapeado automáticamente
 *
 * ═══ FLUJO SECUNDARIO (respaldo) ═══
 * - Botón lápiz en la card → modo polígono manual
 *
 * ═══ COLORES (plano limpio) ═══
 * Normal:   sin fill / borde sutil punteado
 * Hover:    fill muy suave
 * Activo:   azul suave
 * Drop:     animación azul pulsante
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { ProjectData, LotData, LotShape } from '@/lib/projects-data';
import {
  getLotShapes,
  upsertLotShape,
  deleteLotShape,
  clearLotShapes,
  updatePlanImage,
  getAdminProjects,
} from '@/lib/admin-store';
import { formatPrice } from '@/lib/projects-data';

/* ─── tipos ─────────────────────────────────── */
type Pt = [number, number];
interface VB { x: number; y: number; w: number; h: number }
type Mode = 'idle' | 'drawing';

interface PendingDrop {
  lotId: string;
  pct: Pt;
}

interface ManualPlanMapperProps {
  project: ProjectData;
  onUpdate: () => void;
  showToast: (msg: string) => void;
}

/* ─── paleta admin (sin manchas) ──────────────── */
const C = {
  mapped:    { fill: 'rgba(16,185,129,0.07)',  stroke: 'rgba(16,185,129,0.55)' },
  hover:     { fill: 'rgba(16,185,129,0.20)',  stroke: '#10b981' },
  selected:  { fill: 'rgba(0,152,220,0.15)',   stroke: '#0098dc' },
  drop:      { fill: 'rgba(0,152,220,0.22)',   stroke: '#0098dc' },
  draft:     { fill: 'rgba(0,152,220,0.10)',   stroke: '#0098dc' },
};

/* ═══════════════════════════════════════════════ */
export default function ManualPlanMapper({ project, onUpdate, showToast }: ManualPlanMapperProps) {
  const [planData,  setPlanData]  = useState(project.planData);
  const [shapes,    setShapes]    = useState<LotShape[]>([]);
  const [mode,      setMode]      = useState<Mode>('idle');
  const [dragging,  setDragging]  = useState<string | null>(null);
  const [overCanvas, setOverCanvas] = useState(false);
  const [dropCursor, setDropCursor] = useState<Pt | null>(null);
  const [pending,   setPending]   = useState<PendingDrop | null>(null);
  const [hoverSh,   setHoverSh]   = useState<string | null>(null);
  const [selSh,     setSelSh]     = useState<string | null>(null);
  const [undo,      setUndo]      = useState<{ lotId: string; prev: LotShape | null } | null>(null);
  const [search,    setSearch]    = useState('');
  const [drawLot,   setDrawLot]   = useState<string | null>(null);
  const [draft,     setDraft]     = useState<Pt[]>([]);
  const [cursor,    setCursor]    = useState<Pt | null>(null);
  const [vb,        setVb]        = useState<VB>({ x: 0, y: 0, w: 1000, h: 700 });

  const svgRef    = useRef<SVGSVGElement>(null);
  const panning   = useRef(false);
  const panOrigin = useRef<{ mx: number; my: number; vbx: number; vby: number } | null>(null);
  const fileRef   = useRef<HTMLInputElement>(null);

  const imgW = planData?.imageWidth  || 1000;
  const imgH = planData?.imageHeight || 700;

  /* ── reload ── */
  const reload = useCallback(() => {
    const fresh = getAdminProjects().find(p => p.id === project.id);
    setPlanData(fresh?.planData);
    setShapes(getLotShapes(project.id));
  }, [project.id]);
  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { setVb({ x: 0, y: 0, w: imgW, h: imgH }); }, [imgW, imgH]);

  /* ── lookups ── */
  const lots       = useMemo(() => project.lots || [], [project.lots]);
  const lotById    = useMemo(() => { const m = new Map<string, LotData>(); lots.forEach(l => m.set(l.id, l)); return m; }, [lots]);
  const shapeByLot = useMemo(() => { const m = new Map<string, LotShape>(); shapes.forEach(s => m.set(s.lotId, s)); return m; }, [shapes]);

  const pending_ = useMemo(() => lots.filter(l => !shapeByLot.has(l.id) && (!search || l.label.toLowerCase().includes(search.toLowerCase()) || (l.manzana||'').toLowerCase().includes(search.toLowerCase()))), [lots, shapeByLot, search]);
  const mapped_  = useMemo(() => lots.filter(l =>  shapeByLot.has(l.id) && (!search || l.label.toLowerCase().includes(search.toLowerCase()))), [lots, shapeByLot, search]);

  /* ── coord utils ── */
  const toSvg = useCallback((cx: number, cy: number): Pt | null => {
    const el = svgRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return [vb.x + (cx - r.left) * (vb.w / r.width), vb.y + (cy - r.top) * (vb.h / r.height)];
  }, [vb]);

  const toPct = useCallback((p: Pt): Pt => [+((p[0]/imgW)*100).toFixed(3), +((p[1]/imgH)*100).toFixed(3)], [imgW, imgH]);
  const toImg = useCallback((p: Pt): Pt => [(p[0]/100)*imgW, (p[1]/100)*imgH], [imgW, imgH]);

  /* ── upload ── */
  const onUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const img = new window.Image();
      img.onload = () => { updatePlanImage(project.id, url, img.naturalWidth, img.naturalHeight); reload(); onUpdate(); showToast('✅ Plano cargado'); };
      img.src = url;
    };
    reader.readAsDataURL(f);
    e.target.value = '';
  }, [project.id, reload, onUpdate, showToast]);

  /* ── drag from sidebar ── */
  const onDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('text/lot-id', id);
    setDragging(id);
    setMode('idle'); setDraft([]); setCursor(null);
  }, []);
  const onDragEnd = useCallback(() => { setDragging(null); setOverCanvas(false); setDropCursor(null); }, []);

  /* ── drag over canvas ── */
  const onCanvasDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setOverCanvas(true);
    const pt = toSvg(e.clientX, e.clientY);
    if (pt) setDropCursor(toPct(pt));
  }, [toSvg, toPct]);
  const onCanvasDragLeave = useCallback(() => { setOverCanvas(false); setDropCursor(null); }, []);

  const onCanvasDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOverCanvas(false); setDropCursor(null);
    const id = e.dataTransfer.getData('text/lot-id') || dragging;
    if (!id) return;
    const pt = toSvg(e.clientX, e.clientY);
    if (!pt) return;
    setPending({ lotId: id, pct: toPct(pt) });
    setDragging(null);
  }, [dragging, toSvg, toPct]);

  /* ── confirm ── */
  const confirm = useCallback(() => {
    if (!pending) return;
    const { lotId, pct: [cx, cy] } = pending;
    const MH = 3;
    const pts: Pt[] = [[cx-MH,cy-MH],[cx+MH,cy-MH],[cx+MH,cy+MH],[cx-MH,cy+MH]];
    setUndo({ lotId, prev: shapeByLot.get(lotId) ?? null });
    upsertLotShape(project.id, lotId, pts, 'manual');
    reload(); onUpdate();
    showToast(`✅ ${lotById.get(lotId)?.label ?? lotId} marcado`);
    setPending(null);
  }, [pending, shapeByLot, project.id, reload, onUpdate, showToast, lotById]);

  const cancelPending = useCallback(() => { setPending(null); setDragging(null); }, []);

  /* ── undo ── */
  const doUndo = useCallback(() => {
    if (!undo) return;
    const { lotId, prev } = undo;
    if (prev) upsertLotShape(project.id, lotId, prev.polygonPoints, prev.source);
    else deleteLotShape(project.id, lotId);
    reload(); onUpdate();
    showToast(`↩ ${lotById.get(lotId)?.label ?? lotId} desmapeado`);
    setUndo(null);
  }, [undo, project.id, reload, onUpdate, showToast, lotById]);

  /* ── delete ── */
  const doDelete = useCallback((lotId: string) => {
    setUndo({ lotId, prev: shapeByLot.get(lotId) ?? null });
    deleteLotShape(project.id, lotId);
    reload(); onUpdate();
    showToast('🗑️ Asignación eliminada');
  }, [shapeByLot, project.id, reload, onUpdate, showToast]);

  /* ── drawing mode ── */
  const startDraw = useCallback((lotId: string) => {
    setDrawLot(lotId); setMode('drawing'); setDraft([]); setCursor(null); setPending(null);
  }, []);
  const cancelDraw = useCallback(() => { setMode('idle'); setDrawLot(null); setDraft([]); setCursor(null); }, []);
  const saveDraw = useCallback(() => {
    if (!drawLot || draft.length < 3) { showToast('⚠️ Necesitas al menos 3 puntos'); return; }
    const pts = draft.map(toPct);
    setUndo({ lotId: drawLot, prev: shapeByLot.get(drawLot) ?? null });
    upsertLotShape(project.id, drawLot, pts, 'manual');
    reload(); onUpdate();
    showToast(`✅ ${lotById.get(drawLot)?.label ?? drawLot} mapeado con polígono`);
    setMode('idle'); setDrawLot(null); setDraft([]); setCursor(null);
  }, [drawLot, draft, toPct, shapeByLot, project.id, reload, onUpdate, showToast, lotById]);

  /* ── SVG events ── */
  const onSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (panning.current || mode !== 'drawing') return;
    const pt = toSvg(e.clientX, e.clientY);
    if (!pt) return;
    if (draft.length >= 3) {
      const [fx, fy] = draft[0];
      if (Math.hypot(pt[0]-fx, pt[1]-fy) < vb.w * 0.015) { saveDraw(); return; }
    }
    setDraft(p => [...p, pt]);
  }, [mode, toSvg, draft, vb.w, saveDraw]);

  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const origin = panOrigin.current;
    if (panning.current && origin) {
      const el = svgRef.current;
      const r = el?.getBoundingClientRect();
      if (!r) return;
      // Usamos setVb con función para leer el vb más reciente — evita closure stale
      setVb(v => {
        const dx = (e.clientX - origin.mx) * (v.w / r.width);
        const dy = (e.clientY - origin.my) * (v.h / r.height);
        return { ...v, x: origin.vbx - dx, y: origin.vby - dy };
      });
      return;
    }
    if (mode === 'drawing') { const pt = toSvg(e.clientX, e.clientY); if (pt) setCursor(pt); }
  }, [mode, toSvg]);

  const onMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button === 1 || e.button === 2 || mode === 'idle') {
      e.preventDefault();
      panning.current = true;
      panOrigin.current = { mx: e.clientX, my: e.clientY, vbx: vb.x, vby: vb.y };
    }
  }, [mode, vb.x, vb.y]);

  const onMouseUp = useCallback(() => { panning.current = false; panOrigin.current = null; }, []);

  const onWheel = useCallback((e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const f = e.deltaY < 0 ? 0.83 : 1.20;
    const pt = toSvg(e.clientX, e.clientY);
    if (!pt) return;
    const nw = Math.max(imgW*0.08, Math.min(imgW*5, vb.w*f));
    const nh = nw * (imgH/imgW);
    setVb(v => ({ x: pt[0]-(pt[0]-v.x)*(nw/v.w), y: pt[1]-(pt[1]-v.y)*(nh/v.h), w: nw, h: nh }));
  }, [toSvg, imgW, imgH, vb.w]);

  const resetView = useCallback(() => setVb({ x:0, y:0, w:imgW, h:imgH }), [imgW, imgH]);

  /* ── keyboard ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'Enter')     { e.preventDefault(); if (mode === 'drawing') saveDraw(); else if (pending) confirm(); }
      if (e.key === 'Escape')    { cancelDraw(); cancelPending(); }
      if (e.key === 'Backspace') { if (mode === 'drawing') setDraft(p => p.slice(0,-1)); }
      if (e.key === 'z' && (e.ctrlKey||e.metaKey)) { e.preventDefault(); doUndo(); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [mode, saveDraw, pending, confirm, cancelDraw, cancelPending, doUndo]);

  /* ── computed SVG strings ── */
  const draftStr = draft.map(([x,y]) => `${x},${y}`).join(' ');
  const liveLine = cursor && draft.length > 0
    ? `${draft[draft.length-1][0]},${draft[draft.length-1][1]} ${cursor[0]},${cursor[1]}`
    : '';

  const shapesPx = useMemo(() => shapes.map(s => ({
    ...s,
    px: s.polygonPoints.map(([x,y]): Pt => [(x/100)*imgW,(y/100)*imgH]),
  })), [shapes, imgW, imgH]);

  const pendPx = pending ? toImg(pending.pct) : null;
  const pendLot = pending ? lotById.get(pending.lotId) : null;

  /* ─── Sin plano ─── */
  if (!planData?.imageUrl) {
    return (
      <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <h3 className="font-bold text-slate-900 mb-2">Sube el plano del proyecto</h3>
        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">
          Luego arrastra los lotes desde la lista hacia su posición en el plano.
        </p>
        <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
        <button onClick={() => fileRef.current?.click()}
          className="px-6 py-3 bg-[#0098dc] hover:bg-[#0079b2] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[#0098dc]/20">
          Seleccionar imagen del plano
        </button>
      </div>
    );
  }

  /* ══════════════════════════════════════════════ */
  return (
    <div className="flex rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-900"
      style={{ height: '82vh' }}>

      {/* ════ CANVAS 75% ════ */}
      <div className="flex-1 relative overflow-hidden"
        onDragOver={onCanvasDragOver}
        onDragLeave={onCanvasDragLeave}
        onDrop={onCanvasDrop}
      >
        {/* Borde drop */}
        {overCanvas && (
          <div className="absolute inset-0 z-20 pointer-events-none border-4 border-[#0098dc]/70 rounded-l-2xl"
            style={{ boxShadow: 'inset 0 0 50px rgba(0,152,220,0.12)' }} />
        )}

        {/* Banners */}
        {mode === 'drawing' && drawLot && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#0098dc] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg pointer-events-none">
            ✏️ {lotById.get(drawLot)?.label} — clic para añadir puntos · Enter = guardar · Esc = cancelar
          </div>
        )}
        {overCanvas && dragging && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#0098dc] text-white text-sm font-bold px-5 py-2.5 rounded-full shadow-xl pointer-events-none">
            📍 Suelta aquí para marcar &quot;{lotById.get(dragging)?.label}&quot;
          </div>
        )}
        {!overCanvas && !dragging && !pending && mode === 'idle' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-black/45 text-white text-xs px-4 py-1.5 rounded-full pointer-events-none">
            Arrastra un lote desde la derecha · rueda = zoom · arrastrar = mover
          </div>
        )}

        {/* SVG */}
        <svg ref={svgRef}
          className="w-full h-full select-none"
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ cursor: mode === 'drawing' ? 'crosshair' : panning.current ? 'grabbing' : 'grab' }}
          onClick={onSvgClick}
          onMouseMove={onMouseMove}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseUp}
          onMouseLeave={() => {
            setCursor(null);
            // Solo detener pan si el botón ya no está presionado
            panning.current = false;
            panOrigin.current = null;
          }}
          onWheel={onWheel}
          onContextMenu={e => e.preventDefault()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <image href={planData.imageUrl} x={0} y={0} width={imgW} height={imgH}
            preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: 'none' }} />

          {/* Shapes guardados */}
          {shapesPx.map(sh => {
            const isSel   = selSh === sh.id;
            const isHov   = hoverSh === sh.id;
            const col     = isSel ? C.selected : isHov ? C.hover : C.mapped;
            const ptsStr  = sh.px.map(([x,y]) => `${x},${y}`).join(' ');
            const cx      = sh.px.reduce((a,p)=>a+p[0],0)/sh.px.length;
            const cy      = sh.px.reduce((a,p)=>a+p[1],0)/sh.px.length;
            const lot     = lotById.get(sh.lotId);
            const fs      = vb.w * 0.017;
            return (
              <g key={sh.id}
                onMouseEnter={() => setHoverSh(sh.id)}
                onMouseLeave={() => setHoverSh(null)}
                onClick={e => { if (mode==='idle') { e.stopPropagation(); setSelSh(sh.id === selSh ? null : sh.id); } }}
                style={{ cursor: mode==='drawing'?'crosshair':'pointer' }}
              >
                <polygon points={ptsStr}
                  fill={col.fill} stroke={col.stroke}
                  strokeWidth={vb.w*0.0013}
                  strokeDasharray={isSel?undefined:`${vb.w*0.004} ${vb.w*0.002}`}
                />
                {(isHov || isSel) && lot && (
                  <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
                    fontSize={fs} fontWeight="700" fill={col.stroke}
                    style={{ pointerEvents:'none', userSelect:'none' }}>
                    {lot.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Drop cursor pulsante */}
          {overCanvas && dropCursor && (() => {
            const [dcx, dcy] = toImg(dropCursor);
            const r = vb.w * 0.025;
            return (
              <circle cx={dcx} cy={dcy} r={r}
                fill={C.drop.fill} stroke={C.drop.stroke}
                strokeWidth={vb.w*0.003}
                style={{ pointerEvents:'none' }}>
                <animate attributeName="r"
                  values={`${r*0.7};${r*1.3};${r*0.7}`} dur="1s" repeatCount="indefinite" />
              </circle>
            );
          })()}

          {/* Pending drop marker */}
          {pendPx && pendLot && (
            <g style={{ pointerEvents:'none' }}>
              <line x1={pendPx[0]-vb.w*0.022} y1={pendPx[1]} x2={pendPx[0]+vb.w*0.022} y2={pendPx[1]}
                stroke={C.drop.stroke} strokeWidth={vb.w*0.002} />
              <line x1={pendPx[0]} y1={pendPx[1]-vb.w*0.022} x2={pendPx[0]} y2={pendPx[1]+vb.w*0.022}
                stroke={C.drop.stroke} strokeWidth={vb.w*0.002} />
              <circle cx={pendPx[0]} cy={pendPx[1]} r={vb.w*0.02}
                fill={C.drop.fill} stroke={C.drop.stroke}
                strokeWidth={vb.w*0.003}
                strokeDasharray={`${vb.w*0.005} ${vb.w*0.003}`} />
              <text x={pendPx[0]} y={pendPx[1]-vb.w*0.03}
                textAnchor="middle" fontSize={vb.w*0.018} fontWeight="700"
                fill={C.drop.stroke} style={{ userSelect:'none' }}>
                {pendLot.label}
              </text>
            </g>
          )}

          {/* Draft polígono */}
          {mode === 'drawing' && (
            <>
              {draft.length > 1 && (
                <polyline points={draftStr} fill="none"
                  stroke={C.draft.stroke} strokeWidth={vb.w*0.0015}
                  strokeDasharray={`${vb.w*0.004} ${vb.w*0.002}`} />
              )}
              {liveLine && (
                <polyline points={liveLine} fill="none"
                  stroke={C.draft.stroke} strokeWidth={vb.w*0.001}
                  strokeDasharray={`${vb.w*0.003} ${vb.w*0.002}`} opacity={0.5} />
              )}
              {draft.length >= 3 && (
                <polygon points={draftStr} fill={C.draft.fill} stroke="none" />
              )}
              {draft.map(([px,py], i) => {
                const first = i===0 && draft.length>=3;
                return (
                  <circle key={i} cx={px} cy={py}
                    r={vb.w*(first?0.012:0.007)}
                    fill={first?'#10b981':C.draft.stroke}
                    stroke="white" strokeWidth={vb.w*0.001}
                    onClick={e=>{if(first){e.stopPropagation();saveDraw();}}}
                    style={{ cursor:first?'pointer':'default' }}
                  />
                );
              })}
            </>
          )}
        </svg>

        {/* ── Confirmación drop ── */}
        {pending && pendLot && (
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 bg-white rounded-2xl shadow-2xl border border-slate-200 px-5 py-4 flex items-center gap-4"
            style={{ minWidth: 320 }}>
            <div className="w-10 h-10 rounded-xl bg-[#0098dc]/10 flex items-center justify-center flex-shrink-0 text-xl">📍</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-900 text-sm">¿Confirmar asignación?</p>
              <p className="text-xs text-slate-500">
                Lote <strong>{pendLot.label}</strong> · {pendLot.area.toFixed(1)} m²
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Puedes refinar el polígono exacto después</p>
            </div>
            <div className="flex flex-col gap-1.5 flex-shrink-0">
              <button onClick={confirm}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all">
                ✅ Confirmar
              </button>
              <button onClick={cancelPending}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-lg transition-all">
                ✕ Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Toolbar inferior */}
        <div className="absolute bottom-4 left-3 flex flex-wrap gap-2 z-30">
          {mode === 'drawing' && (
            <>
              {draft.length >= 3 && (
                <button onClick={saveDraw}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow">
                  ✅ Guardar (Enter)
                </button>
              )}
              <button onClick={() => setDraft(p => p.slice(0,-1))}
                className="px-3 py-1.5 bg-white/90 text-slate-600 text-xs font-semibold rounded-lg shadow hover:bg-white">
                ↩ Punto
              </button>
              <button onClick={cancelDraw}
                className="px-3 py-1.5 bg-white/90 text-red-500 text-xs font-semibold rounded-lg shadow hover:bg-white">
                ✕ Cancelar
              </button>
            </>
          )}
          {undo && (
            <button onClick={doUndo}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow">
              ↩ Deshacer (Ctrl+Z)
            </button>
          )}
          <button onClick={() => fileRef.current?.click()}
            className="px-3 py-1.5 bg-white/80 text-slate-500 text-xs rounded-lg shadow hover:bg-white">
            📷 Cambiar plano
          </button>
        </div>

        {/* Zoom */}
        <div className="absolute bottom-4 right-3 flex flex-col gap-1.5 z-30">
          {[
            { label:'+', action:()=>setVb(v=>({...v,w:v.w*0.7,h:v.h*0.7})) },
            { label:'⊡', action:resetView },
            { label:'−', action:()=>setVb(v=>({...v,w:Math.min(imgW*4,v.w*1.4),h:Math.min(imgH*4,v.h*1.4)})) },
          ].map(({label,action})=>(
            <button key={label} onClick={action}
              className="w-8 h-8 bg-white/90 rounded-lg shadow flex items-center justify-center text-slate-700 font-bold hover:bg-white transition-all">
              {label}
            </button>
          ))}
        </div>

        <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
      </div>

      {/* ════ SIDEBAR 25% ════ */}
      <aside className="w-72 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col overflow-hidden">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm">Mapear lotes</h3>
          <p className="text-xs text-slate-400 truncate">{project.name}</p>
        </div>

        {/* Instrucción */}
        <div className="px-4 py-3 border-b border-slate-100 bg-[#0098dc]/5">
          <div className="flex gap-2 items-start">
            <span className="text-base mt-0.5">↔️</span>
            <div>
              <p className="text-xs font-bold text-[#0098dc]">Arrastra y suelta sobre el plano</p>
              <p className="text-[10px] text-slate-500 leading-relaxed mt-0.5">
                Toma un lote y suéltalo sobre su posición real. Confirma y pasa al siguiente.
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
            <span>Progreso</span>
            <span className="font-bold text-emerald-600">{shapes.length} / {lots.length}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width:`${lots.length>0?(shapes.length/lots.length)*100:0}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>{lots.length - shapes.length} pendientes</span>
            <span>{Math.round(lots.length>0?(shapes.length/lots.length)*100:0)}%</span>
          </div>
        </div>

        {/* Buscador */}
        <div className="px-3 py-2 border-b border-slate-100">
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Buscar lote..."
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0098dc]/30 bg-slate-50"
          />
        </div>

        {/* Listas */}
        <div className="flex-1 overflow-y-auto">
          {pending_.length > 0 && (
            <section>
              <div className="px-3 py-2 bg-amber-50 border-b border-amber-100 sticky top-0 z-10">
                <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  Pendientes ({pending_.length})
                </p>
              </div>
              <div className="p-2 space-y-1.5">
                {pending_.map(lot => (
                  <DragCard key={lot.id} lot={lot} status="pending"
                    isDragging={dragging === lot.id}
                    onDragStart={onDragStart} onDragEnd={onDragEnd}
                    onDraw={startDraw} currency={project.currency ?? 'PEN'} />
                ))}
              </div>
            </section>
          )}

          {mapped_.length > 0 && (
            <section>
              <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-100 sticky top-0 z-10">
                <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Mapeados ({mapped_.length})
                </p>
              </div>
              <div className="p-2 space-y-1.5">
                {mapped_.map(lot => {
                  const sh = shapeByLot.get(lot.id);
                  return (
                    <MappedCard key={lot.id} lot={lot} shape={sh}
                      isDragging={dragging === lot.id}
                      onDragStart={onDragStart} onDragEnd={onDragEnd}
                      onDelete={() => doDelete(lot.id)}
                      onRedraw={() => startDraw(lot.id)} />
                  );
                })}
              </div>
            </section>
          )}

          {pending_.length === 0 && mapped_.length === 0 && (
            <p className="p-6 text-center text-slate-400 text-sm">Sin resultados</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 space-y-1.5">
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-slate-400">
            <span>Enter = confirmar</span><span>Esc = cancelar</span>
            <span>Ctrl+Z = deshacer</span><span>Rueda = zoom</span>
          </div>
          {shapes.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm(`¿Eliminar los ${shapes.length} mapeos?`)) {
                  clearLotShapes(project.id); reload(); onUpdate();
                  showToast('🗑️ Todos los mapeos eliminados');
                }
              }}
              className="w-full py-1.5 text-xs text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
              Eliminar todos ({shapes.length})
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

/* ── DragCard (pendiente) ─────────────────────── */
interface DragCardProps {
  lot: LotData;
  status: 'pending';
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDraw: (id: string) => void;
  currency: 'PEN' | 'USD';
}
function DragCard({ lot, isDragging, onDragStart, onDragEnd, onDraw, currency }: DragCardProps) {
  const fmt = (price: number) => formatPrice(price, currency);
  return (
    <div draggable
      onDragStart={e => onDragStart(e, lot.id)}
      onDragEnd={onDragEnd}
      className={`group relative rounded-xl border transition-all duration-150 select-none
        cursor-grab active:cursor-grabbing
        ${isDragging
          ? 'border-[#0098dc] bg-[#0098dc]/5 opacity-70 scale-[0.97]'
          : 'border-amber-200 bg-amber-50 hover:border-amber-300 hover:shadow-sm'
        }`}
    >
      <div className="px-3 py-2.5 flex items-center gap-2.5">
        <DragHandle color="text-amber-400 group-hover:text-amber-500" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="font-black text-slate-900 text-sm">{lot.label}</span>
            {lot.manzana && (
              <span className="text-[9px] bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded font-semibold flex-shrink-0">
                Mz {lot.manzana}
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {lot.area.toFixed(1)} m²{lot.price>0 && <> · {fmt(lot.price)}</>}
          </p>
        </div>
        <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
      </div>
      {/* Botón polígono (solo hover) */}
      {!isDragging && (
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDraw(lot.id); }}
          title="Dibujar polígono"
          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100
            w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center
            text-slate-400 hover:text-[#0098dc] hover:border-[#0098dc]/30 transition-all shadow-sm"
        >
          <PencilIcon />
        </button>
      )}
    </div>
  );
}

/* ── MappedCard ───────────────────────────────── */
interface MappedCardProps {
  lot: LotData;
  shape?: LotShape;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDelete: () => void;
  onRedraw: () => void;
}
function MappedCard({ lot, shape, isDragging, onDragStart, onDragEnd, onDelete, onRedraw }: MappedCardProps) {
  const isPoint = shape && shape.polygonPoints.length === 4;
  return (
    <div draggable
      onDragStart={e => onDragStart(e, lot.id)}
      onDragEnd={onDragEnd}
      className={`group relative rounded-xl border transition-all duration-150 select-none
        cursor-grab active:cursor-grabbing
        ${isDragging
          ? 'border-[#0098dc] bg-[#0098dc]/5 opacity-70'
          : 'border-emerald-200 bg-emerald-50/60 hover:border-emerald-300 hover:shadow-sm'
        }`}
    >
      <div className="px-3 py-2.5 flex items-center gap-2.5">
        <DragHandle color="text-emerald-400" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="font-semibold text-slate-700 text-sm">{lot.label}</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold flex-shrink-0
              ${isPoint ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {isPoint ? 'punto' : 'polígono'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-0.5">{lot.area.toFixed(1)} m²</p>
        </div>
        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
      </div>
      {!isDragging && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 flex gap-1">
          <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onRedraw();}}
            title="Refinar polígono"
            className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#0098dc] shadow-sm transition-all">
            <PencilIcon size="w-3 h-3" />
          </button>
          <button onMouseDown={e=>e.stopPropagation()} onClick={e=>{e.stopPropagation();onDelete();}}
            title="Eliminar asignación"
            className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 shadow-sm transition-all">
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Íconos inline ───────────────────────────── */
function DragHandle({ color = 'text-slate-400' }: { color?: string }) {
  return (
    <svg className={`w-4 h-4 flex-shrink-0 ${color}`} fill="currentColor" viewBox="0 0 20 20">
      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"/>
    </svg>
  );
}
function PencilIcon({ size = 'w-3.5 h-3.5' }: { size?: string }) {
  return (
    <svg className={size} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}
