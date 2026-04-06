'use client';

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { ProjectData, PlanData, LotData } from '@/lib/projects-data';
import {
  getAdminProjects,
  updatePlanImage,
  removePlanImage,
  saveDetections,
  updateDetection,
  deleteDetection,
  clearDetections,
  upsertLotShape,
  clearLotShapes,
  getLotShapes,
} from '@/lib/admin-store';
import dynamic from 'next/dynamic';
import { detectPlanPolygons, DEFAULT_CONFIG, type DetectionConfig } from '@/lib/plan-detection-engine';
import { assignLabelsToContours } from '@/lib/plan-ocr-engine';
import { matchDetectionsToInventory } from '@/lib/plan-matching-engine';
import { generateLayoutFromDetections, generateLayoutFromInventoryOnly } from '@/lib/layout-generator';
import { saveGeneratedLayout, getGeneratedLayout } from '@/lib/admin-store';
import type { GeneratedLayout } from '@/lib/projects-data';

const ManualPlanMapper = dynamic(() => import('./ManualPlanMapper'), { ssr: false });
const LayoutReviewEditor = dynamic(() => import('./LayoutReviewEditor'), { ssr: false });

/* ═══════════════════════════════════════════════
   ICONS
   ═══════════════════════════════════════════════ */
const Icons = {
  upload: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
  detect: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  x: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  refresh: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>,
};

/* ═══════════════════════════════════════════════
   STATUS COLORS
   ═══════════════════════════════════════════════ */
const REVIEW_COLORS: Record<string, { fill: string; stroke: string; label: string; badge: string }> = {
  matched: { fill: 'rgba(16,185,129,0.25)', stroke: '#10b981', label: 'Matched', badge: 'bg-emerald-100 text-emerald-700' },
  approved: { fill: 'rgba(59,130,246,0.25)', stroke: '#3b82f6', label: 'Aprobado', badge: 'bg-blue-100 text-blue-700' },
  ambiguous: { fill: 'rgba(245,158,11,0.25)', stroke: '#f59e0b', label: 'Ambiguo', badge: 'bg-amber-100 text-amber-700' },
  unmatched: { fill: 'rgba(239,68,68,0.25)', stroke: '#ef4444', label: 'Sin match', badge: 'bg-red-100 text-red-700' },
  rejected: { fill: 'rgba(148,163,184,0.15)', stroke: '#94a3b8', label: 'Rechazado', badge: 'bg-slate-100 text-slate-500' },
  auto: { fill: 'rgba(168,85,247,0.25)', stroke: '#a855f7', label: 'Auto', badge: 'bg-purple-100 text-purple-700' },
};

/* ═══════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════ */
interface PlanDetectionEditorProps {
  project: ProjectData;
  onUpdate: () => void;
  showToast: (msg: string) => void;
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function PlanDetectionEditor({ project, onUpdate, showToast }: PlanDetectionEditorProps) {
  const [activeTab, setActiveTab] = useState<'auto' | 'manual' | 'layout'>('auto');
  const [planData, setPlanData] = useState<PlanData | undefined>(project.planData);
  const [detecting, setDetecting] = useState(false);
  const [generatingLayout, setGeneratingLayout] = useState(false);
  const [currentLayout, setCurrentLayout] = useState<GeneratedLayout | null>(null);

  useEffect(() => {
    getGeneratedLayout(project.id).then(setCurrentLayout);
  }, [project.id]);
  const [selectedDetId, setSelectedDetId] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);
  const [hoveredDetId, setHoveredDetId] = useState<string | null>(null);
  const [reassignLotId, setReassignLotId] = useState<string>('');
  const [configOpen, setConfigOpen] = useState(false);
  const [config, setConfig] = useState<DetectionConfig>({ ...DEFAULT_CONFIG });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const lots = useMemo(() => project.lots || [], [project.lots]);
  const detections = useMemo(() => planData?.detections || [], [planData?.detections]);
  const manzanas = useMemo(() => {
    const set = new Set(lots.map((l) => l.manzana));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [lots]);

  const selectedDet = detections.find((d) => d.id === selectedDetId);

  // Get lot by id
  const getLot = useCallback((lotId: string | null): LotData | undefined => {
    if (!lotId) return undefined;
    return lots.find((l) => l.id === lotId);
  }, [lots]);

  // Refresh from store
  const refresh = useCallback(() => {
    getAdminProjects().then((projects) => {
      const updated = projects.find((p) => p.id === project.id);
      setPlanData(updated?.planData);
    });
    getGeneratedLayout(project.id).then(setCurrentLayout);
  }, [project.id]);

  // Stats
  const stats = useMemo(() => {
    const s = { total: detections.length, matched: 0, approved: 0, ambiguous: 0, unmatched: 0, rejected: 0 };
    detections.forEach((d) => {
      if (d.reviewStatus in s) s[d.reviewStatus as keyof typeof s]++;
    });
    return s;
  }, [detections]);

  /* ── Image upload ── */
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new window.Image();
      img.onload = () => {
        updatePlanImage(project.id, dataUrl, img.naturalWidth, img.naturalHeight);
        refresh();
        onUpdate();
        showToast('✅ Plano cargado. Ahora ejecuta la detección automática.');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [project.id, refresh, onUpdate, showToast]);

  /* ── Run detection pipeline ── */
  const runDetection = useCallback(async () => {
    if (!planData?.imageUrl) return;
    setDetecting(true);

    try {
      // Phase 1: CV Detection
      const result = await detectPlanPolygons(planData.imageUrl, config);
      setDebugUrl(result.debugBinaryUrl || null);

      // Phase 2: Label assignment
      const labels = assignLabelsToContours(result.contours, manzanas);

      // Phase 3: Match with inventory
      const matchResult = matchDetectionsToInventory(result.contours, labels, lots);

      // Save
      saveDetections(project.id, matchResult.detections);
      refresh();
      onUpdate();

      showToast(
        `🔍 Detección completa: ${matchResult.stats.total} polígonos, ` +
        `${matchResult.stats.matched} matched, ${matchResult.stats.ambiguous} ambiguos, ` +
        `${matchResult.stats.unmatched} sin match (${Math.round(result.timeMs)}ms)`
      );
    } catch (err) {
      console.error('Detection failed:', err);
      showToast('❌ Error en detección: ' + (err instanceof Error ? err.message : 'desconocido'));
    } finally {
      setDetecting(false);
    }
  }, [planData?.imageUrl, config, manzanas, lots, project.id, refresh, onUpdate, showToast]);

  /* ── Review actions ── */
  const handleApprove = useCallback(async (id: string) => {
    await updateDetection(project.id, id, { reviewStatus: 'approved' });
    // Write to LotShape (single source of truth for public view)
    const projects = await getAdminProjects();
    const det = (projects.find((p) => p.id === project.id)?.planData?.detections || []).find((d) => d.id === id);
    if (det?.matchedLotId) {
      await upsertLotShape(project.id, det.matchedLotId, det.manualPolygon || det.polygon, 'auto-approved');
    }
    refresh();
    showToast('✅ Detección aprobada y publicada en el plano');
  }, [project.id, refresh, showToast]);

  const handleReject = useCallback(async (id: string) => {
    await updateDetection(project.id, id, { reviewStatus: 'rejected', matchedLotId: null });
    refresh();
    showToast('🗑️ Detección rechazada');
  }, [project.id, refresh, showToast]);

  const handleReassign = useCallback(async (detId: string, lotId: string) => {
    if (!lotId) return;
    await updateDetection(project.id, detId, { matchedLotId: lotId, reviewStatus: 'approved' });
    refresh();
    onUpdate();
    showToast('🔗 Lote reasignado');
  }, [project.id, refresh, onUpdate, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteDetection(project.id, id);
    if (selectedDetId === id) setSelectedDetId(null);
    refresh();
    showToast('Polígono eliminado');
  }, [project.id, selectedDetId, refresh, showToast]);

  const handleApproveAll = useCallback(async () => {
    const updated = detections.map((d) =>
      d.reviewStatus === 'matched' ? { ...d, reviewStatus: 'approved' as const } : d
    );
    await saveDetections(project.id, updated);
    // Write all matched→approved detections to LotShape table
    for (const d of updated.filter((d) => d.reviewStatus === 'approved' && d.matchedLotId)) {
      await upsertLotShape(project.id, d.matchedLotId!, d.manualPolygon || d.polygon, 'auto-approved');
    }
    refresh();
    showToast(`✅ ${updated.filter((d) => d.reviewStatus === 'approved').length} detecciones aprobadas y publicadas`);
  }, [detections, project.id, refresh, showToast]);

  const handleClearAll = useCallback(async () => {
    if (!window.confirm('¿Eliminar todas las detecciones y polígonos auto-aprobados del plano público?')) return;
    await clearDetections(project.id);
    // Preserve manual shapes, remove auto-approved ones
    const allShapes = await getLotShapes(project.id);
    const manualShapes = allShapes.filter((s) => s.source === 'manual');
    await clearLotShapes(project.id);
    for (const s of manualShapes) {
      await upsertLotShape(project.id, s.lotId, s.polygonPoints, 'manual');
    }
    setSelectedDetId(null);
    refresh();
    onUpdate();
    showToast('🗑️ Detecciones auto eliminadas (polígonos manuales conservados)');
  }, [project.id, refresh, onUpdate, showToast]);

  const handleRemoveImage = useCallback(() => {
    if (!window.confirm('¿Eliminar imagen de plano y todas las detecciones?')) return;
    removePlanImage(project.id);
    setSelectedDetId(null);
    refresh();
    onUpdate();
    showToast('Plano eliminado');
  }, [project.id, refresh, onUpdate, showToast]);

  /* ── Generate abstract layout ── */
  const handleGenerateFromDetections = useCallback(async () => {
    if (detections.length === 0) {
      showToast('⚠️ Primero ejecuta la detección automática');
      return;
    }
    setGeneratingLayout(true);
    try {
      const layout = generateLayoutFromDetections(project.id, detections, lots);
      await saveGeneratedLayout(project.id, layout);
      setCurrentLayout(layout);
      onUpdate();
      showToast(`✅ Layout generado: ${layout.blocks.length} bloques, ${layout.stats.totalLots} lotes, ${Math.round(layout.stats.matchRate * 100)}% coincidencia`);
      setActiveTab('layout');
    } catch (err) {
      showToast('❌ Error generando layout: ' + (err instanceof Error ? err.message : 'desconocido'));
    } finally {
      setGeneratingLayout(false);
    }
  }, [detections, lots, project.id, onUpdate, showToast]);

  const handleGenerateFromInventory = useCallback(async () => {
    if (lots.length === 0) {
      showToast('⚠️ No hay lotes en el inventario');
      return;
    }
    setGeneratingLayout(true);
    try {
      const layout = generateLayoutFromInventoryOnly(project.id, lots);
      await saveGeneratedLayout(project.id, layout);
      setCurrentLayout(layout);
      onUpdate();
      showToast(`✅ Layout generado desde inventario: ${layout.blocks.length} bloques, ${layout.stats.totalLots} lotes`);
      setActiveTab('layout');
    } catch (err) {
      showToast('❌ Error generando layout: ' + (err instanceof Error ? err.message : 'desconocido'));
    } finally {
      setGeneratingLayout(false);
    }
  }, [lots, project.id, onUpdate, showToast]);

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */

  // Tab bar (always visible)
  const tabBar = (
    <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
      <button
        onClick={() => setActiveTab('auto')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          activeTab === 'auto' ? 'bg-white text-[#0098dc] shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        🔍 Auto-detección
      </button>
      <button
        onClick={() => setActiveTab('manual')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          activeTab === 'manual' ? 'bg-white text-[#0098dc] shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        ✏️ Editor manual
      </button>
      <button
        onClick={() => setActiveTab('layout')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
          activeTab === 'layout' ? 'bg-white text-[#0098dc] shadow-sm' : 'text-slate-500 hover:text-slate-700'
        }`}
      >
        🎨 Vista abstracta
        {currentLayout?.status === 'approved' && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
        )}
      </button>
    </div>
  );

  // Layout tab
  if (activeTab === 'layout') {
    return (
      <div className="space-y-4">
        {tabBar}

        {/* Generation buttons */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Generar layout abstracto</h3>
            <p className="text-xs text-slate-400">El layout abstracto es la vista que verán los usuarios finales — sin foto, sin textura, solo bloques y lotes interactivos.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleGenerateFromDetections}
              disabled={generatingLayout || detections.length === 0}
              className="flex flex-col items-start gap-1.5 px-4 py-3.5 bg-[#0098dc] hover:bg-[#0079b2] disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-all shadow-lg shadow-[#0098dc]/20"
            >
              <span className="font-bold text-sm">⚡ Generar desde detecciones</span>
              <span className="text-xs opacity-80">
                {detections.length > 0
                  ? `Usa ${detections.length} polígonos detectados`
                  : 'Requiere detección previa'}
              </span>
            </button>
            <button
              onClick={handleGenerateFromInventory}
              disabled={generatingLayout || lots.length === 0}
              className="flex flex-col items-start gap-1.5 px-4 py-3.5 bg-slate-700 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition-all"
            >
              <span className="font-bold text-sm">📋 Generar desde inventario</span>
              <span className="text-xs opacity-80">
                {lots.length > 0
                  ? `${lots.length} lotes en inventario (sin plano)`
                  : 'No hay lotes'}
              </span>
            </button>
          </div>

          {generatingLayout && (
            <div className="flex items-center gap-3 text-sm text-slate-500 bg-slate-50 rounded-xl p-3">
              <svg className="animate-spin w-4 h-4 text-[#0098dc]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generando layout…
            </div>
          )}
        </div>

        {/* Layout review editor */}
        {currentLayout ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden" style={{ minHeight: 400 }}>
            <LayoutReviewEditor
              projectId={project.id}
              project={project}
              lots={lots}
              layout={currentLayout}
              onLayoutUpdate={(updated) => { setCurrentLayout(updated); onUpdate(); }}
            />
          </div>
        ) : (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">🎨</div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Sin layout generado</p>
            <p className="text-xs text-slate-400">Genera un layout desde las detecciones o desde el inventario para comenzar.</p>
          </div>
        )}
      </div>
    );
  }

  // Manual tab: always available (no plan image required)
  if (activeTab === 'manual') {
    return (
      <div className="space-y-4">
        {tabBar}
        <ManualPlanMapper project={project} onUpdate={onUpdate} showToast={showToast} />
      </div>
    );
  }

  // Auto tab — no plan image yet
  if (!planData?.imageUrl) {
    return (
      <div className="space-y-4">
        {tabBar}
        <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-4">
            {Icons.upload}
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Subir plano maestro</h3>
          <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
            Sube la imagen del plano de lotización. El sistema detectará automáticamente los polígonos de cada lote
            y los cruzará con tu inventario Excel.
          </p>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl shadow-lg shadow-primary-200/50 transition-all"
          >
            Seleccionar imagen de plano
          </button>
          <p className="text-xs text-slate-400 mt-3">Formatos: PNG, JPG, WEBP. Resolución recomendada: 2000px+</p>
        </div>
      </div>
    );
  }

  // Auto tab — plan image available
  return (
    <div className="space-y-4">
      {tabBar}

      {/* ── Toolbar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={runDetection}
            disabled={detecting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-primary-200/50 transition-all"
          >
            {detecting ? (
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : Icons.detect}
            {detecting ? 'Detectando...' : '🔍 Detectar polígonos'}
          </button>

          {detections.length > 0 && (
            <>
              <button onClick={handleApproveAll} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all">
                {Icons.check} Aprobar matched
              </button>
              <button onClick={handleClearAll} className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl border border-red-200 transition-all">
                {Icons.trash} Limpiar todo
              </button>
            </>
          )}

          <div className="flex-1" />

          <button onClick={() => setConfigOpen(!configOpen)} className="px-3 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
            ⚙️ Config
          </button>
          <button onClick={() => setShowDebug(!showDebug)} className="px-3 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all">
            🔬 Debug
          </button>
          <button onClick={handleRemoveImage} className="p-2.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
            {Icons.trash}
          </button>
        </div>

        {/* Config panel */}
        {configOpen && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Threshold (0=auto)</span>
              <input type="number" min={0} max={255} value={config.threshold} onChange={(e) => setConfig({ ...config, threshold: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Min Area %</span>
              <input type="number" min={0} max={100} step={0.01} value={config.minAreaPercent} onChange={(e) => setConfig({ ...config, minAreaPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Max Area %</span>
              <input type="number" min={0} max={100} step={0.1} value={config.maxAreaPercent} onChange={(e) => setConfig({ ...config, maxAreaPercent: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Simplify ε</span>
              <input type="number" min={0} max={1} step={0.001} value={config.simplifyEpsilon} onChange={(e) => setConfig({ ...config, simplifyEpsilon: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg" />
            </label>
            <label className="flex items-center gap-2 col-span-2">
              <input type="checkbox" checked={config.invertBinary} onChange={(e) => setConfig({ ...config, invertBinary: e.target.checked })} />
              <span className="text-xs text-slate-600">Invertir binario (planos con fondo blanco)</span>
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Blur radius</span>
              <input type="number" min={0} max={10} value={config.blurRadius} onChange={(e) => setConfig({ ...config, blurRadius: Number(e.target.value) })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg" />
            </label>
            <label className="space-y-1">
              <span className="text-xs font-semibold text-slate-500">Edge mode</span>
              <select value={config.edgeMode} onChange={(e) => setConfig({ ...config, edgeMode: e.target.value as 'canny' | 'threshold' })}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg">
                <option value="threshold">Threshold</option>
                <option value="canny">Canny (Sobel)</option>
              </select>
            </label>
          </div>
        )}

        {/* Stats */}
        {detections.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-600">{stats.total} polígonos</span>
            <span className="px-3 py-1.5 rounded-lg bg-emerald-100 text-xs font-semibold text-emerald-700">{stats.matched} matched</span>
            <span className="px-3 py-1.5 rounded-lg bg-blue-100 text-xs font-semibold text-blue-700">{stats.approved} aprobados</span>
            <span className="px-3 py-1.5 rounded-lg bg-amber-100 text-xs font-semibold text-amber-700">{stats.ambiguous} ambiguos</span>
            <span className="px-3 py-1.5 rounded-lg bg-red-100 text-xs font-semibold text-red-700">{stats.unmatched} sin match</span>
            <span className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-500">{stats.rejected} rechazados</span>
          </div>
        )}
      </div>

      {/* ── Debug view ── */}
      {showDebug && debugUrl && (
        <div className="bg-slate-900 rounded-2xl p-4 space-y-2">
          <h4 className="text-white font-semibold text-sm">🔬 Vista debug — Imagen binarizada</h4>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={debugUrl} alt="Debug binarizado" className="w-full rounded-xl border border-slate-700" />
        </div>
      )}

      {/* ── Main canvas: plan + polygon overlays ── */}
      <div className="flex gap-4 flex-col lg:flex-row">
        {/* Plan canvas */}
        <div
          ref={canvasRef}
          className="flex-1 relative rounded-2xl border border-slate-200 overflow-hidden bg-slate-100"
          style={{ aspectRatio: `${planData.imageWidth} / ${planData.imageHeight}`, maxHeight: '70vh' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={planData.imageUrl} alt={`Plano de ${project.name}`} className="w-full h-full object-contain pointer-events-none" draggable={false} />

          {/* SVG polygon overlays — debug only, admin-only view */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {detections.filter((d) => d.reviewStatus !== 'rejected').map((det) => {
              const color = REVIEW_COLORS[det.reviewStatus] || REVIEW_COLORS.auto;
              const isSelected = det.id === selectedDetId;
              const isHovered = det.id === hoveredDetId;
              const points = (det.manualPolygon || det.polygon).map(([x, y]) => `${x},${y}`).join(' ');
              return (
                <g key={det.id}>
                  <polygon
                    points={points}
                    fill={isSelected ? 'rgba(0,152,220,0.35)' : isHovered ? color.fill.replace('0.25', '0.4') : color.fill}
                    stroke={isSelected ? '#0098dc' : color.stroke}
                    strokeWidth={isSelected ? 0.3 : 0.15}
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredDetId(det.id)}
                    onMouseLeave={() => setHoveredDetId(null)}
                    onClick={() => setSelectedDetId(det.id === selectedDetId ? null : det.id)}
                  />
                  <text
                    x={det.centroid.x}
                    y={det.centroid.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill={isSelected ? '#0098dc' : color.stroke}
                    fontSize={Math.min(det.bbox.w * 0.3, det.bbox.h * 0.3, 1.2)}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {det.manualLabel || det.normalizedLabel || '?'}
                  </text>
                </g>
              );
            })}
          </svg>

          {detecting && (
            <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-6 shadow-2xl text-center">
                <svg className="animate-spin w-10 h-10 text-primary-600 mx-auto mb-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <p className="text-sm font-semibold text-slate-700">Analizando plano...</p>
                <p className="text-xs text-slate-500 mt-1">Detección de contornos + matching</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Side panel: detection details ── */}
        <div className="w-full lg:w-80 space-y-3">
          {selectedDet ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Detección</p>
                  <h4 className="text-lg font-bold text-slate-900">{selectedDet.manualLabel || selectedDet.normalizedLabel || '???'}</h4>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${REVIEW_COLORS[selectedDet.reviewStatus]?.badge || ''}`}>
                  {REVIEW_COLORS[selectedDet.reviewStatus]?.label || selectedDet.reviewStatus}
                </span>
              </div>

              {selectedDet.matchedLotId && (() => {
                const lot = getLot(selectedDet.matchedLotId);
                if (!lot) return null;
                return (
                  <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">📌 Lote vinculado</p>
                    <p className="font-bold text-emerald-900">{lot.label}</p>
                    <div className="flex gap-3 mt-1 text-xs text-emerald-600">
                      <span>{lot.area.toFixed(1)} m²</span>
                      <span>S/{lot.price.toLocaleString('es-PE')}</span>
                      <span className="capitalize">{lot.status}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold">Contorno</p>
                  <p className="text-sm font-bold text-slate-900">{Math.round(selectedDet.detectionConfidence * 100)}%</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold">OCR</p>
                  <p className="text-sm font-bold text-slate-900">{Math.round(selectedDet.ocrConfidence * 100)}%</p>
                </div>
              </div>

              <div className="text-xs text-slate-500">
                <p>{(selectedDet.manualPolygon || selectedDet.polygon).length} vértices</p>
                <p>BBox: {selectedDet.bbox.w.toFixed(1)}% × {selectedDet.bbox.h.toFixed(1)}%</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">Reasignar lote</label>
                <div className="flex gap-2">
                  <select
                    value={reassignLotId}
                    onChange={(e) => setReassignLotId(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="">Seleccionar lote...</option>
                    {lots.map((lot) => (
                      <option key={lot.id} value={lot.id}>{lot.label} ({lot.status})</option>
                    ))}
                  </select>
                  <button
                    onClick={() => { handleReassign(selectedDet.id, reassignLotId); setReassignLotId(''); }}
                    disabled={!reassignLotId}
                    className="px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-30 text-white text-sm font-semibold rounded-lg transition-all"
                  >
                    🔗
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleApprove(selectedDet.id)} className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-all">
                  ✅ Aprobar
                </button>
                <button onClick={() => handleReject(selectedDet.id)} className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-semibold rounded-xl border border-red-200 transition-all">
                  ❌ Rechazar
                </button>
                <button onClick={() => handleDelete(selectedDet.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                  {Icons.trash}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center">
              <p className="text-sm text-slate-400">Selecciona un polígono en el plano para revisarlo</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden max-h-[40vh] overflow-y-auto">
            <div className="p-3 border-b border-slate-100 bg-slate-50">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Detecciones ({detections.length})
              </h4>
            </div>
            {detections.length === 0 ? (
              <p className="p-4 text-sm text-slate-400 text-center">Sin detecciones. Ejecuta el análisis primero.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {detections.map((det) => {
                  const color = REVIEW_COLORS[det.reviewStatus] || REVIEW_COLORS.auto;
                  const lot = getLot(det.matchedLotId);
                  return (
                    <button
                      key={det.id}
                      onClick={() => setSelectedDetId(det.id === selectedDetId ? null : det.id)}
                      onMouseEnter={() => setHoveredDetId(det.id)}
                      onMouseLeave={() => setHoveredDetId(null)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all hover:bg-slate-50 ${
                        selectedDetId === det.id ? 'bg-primary-50 border-l-2 border-primary-500' : ''
                      }`}
                    >
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color.stroke }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {det.manualLabel || det.normalizedLabel || '???'}
                        </p>
                        {lot && <p className="text-xs text-slate-400 truncate">→ {lot.label}</p>}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${color.badge}`}>
                        {color.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center">
        💡 Sube un plano → Detecta polígonos automáticamente → Revisa y aprueba matches → Los polígonos se mostrarán en la vista pública
      </p>
    </div>
  );
}

