'use client';

import { useState, useRef, useCallback, useMemo } from 'react';
import type { ProjectData, BlockShape, PlanData } from '@/lib/projects-data';
import {
  getAdminProjects,
  updatePlanImage,
  removePlanImage,
  addBlockShape,
  updateBlockShape,
  deleteBlockShape,
} from '@/lib/admin-store';

/* ═══════════════════════════════════════════════
   ICONS (inline SVGs to avoid extra dependencies)
   ═══════════════════════════════════════════════ */
const Icons = {
  upload: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  move: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>,
};

/* ═══════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════ */
interface PlanEditorProps {
  project: ProjectData;
  onUpdate: () => void;
  showToast: (msg: string) => void;
}

type EditorTool = 'select' | 'draw';

interface DragState {
  type: 'draw' | 'move' | 'resize';
  blockId?: string;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  originBlock?: BlockShape;
  corner?: string;
}

/* ═══════════════════════════════════════════════
   MANZANA COLORS — cycle through palette
   ═══════════════════════════════════════════════ */
const BLOCK_COLORS = [
  'rgba(16, 185, 129, 0.35)',  // emerald
  'rgba(59, 130, 246, 0.35)',  // blue
  'rgba(245, 158, 11, 0.35)', // amber
  'rgba(168, 85, 247, 0.35)', // purple
  'rgba(239, 68, 68, 0.35)',  // red
  'rgba(20, 184, 166, 0.35)', // teal
  'rgba(236, 72, 153, 0.35)', // pink
  'rgba(234, 179, 8, 0.35)',  // yellow
];

const BLOCK_BORDERS = [
  'rgba(16, 185, 129, 0.9)',
  'rgba(59, 130, 246, 0.9)',
  'rgba(245, 158, 11, 0.9)',
  'rgba(168, 85, 247, 0.9)',
  'rgba(239, 68, 68, 0.9)',
  'rgba(20, 184, 166, 0.9)',
  'rgba(236, 72, 153, 0.9)',
  'rgba(234, 179, 8, 0.9)',
];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function PlanEditor({ project, onUpdate, showToast }: PlanEditorProps) {
  const [planData, setPlanData] = useState<PlanData | undefined>(project.planData);
  const [tool, setTool] = useState<EditorTool>('select');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [blockNameInput, setBlockNameInput] = useState('');

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Available manzanas from lots
  const manzanas = useMemo(() => {
    const set = new Set((project.lots || []).map((l) => l.manzana));
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [project.lots]);

  // Manzanas already assigned to blocks
  const assignedManzanas = useMemo(() => {
    if (!planData) return new Set<string>();
    return new Set(planData.blocks.map((b) => b.blockName));
  }, [planData]);

  // Refresh from store
  const refresh = useCallback(() => {
    const updated = getAdminProjects().find((p) => p.id === project.id);
    setPlanData(updated?.planData);
    onUpdate();
  }, [project.id, onUpdate]);

  /* ── Image upload ── */
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64 for localStorage
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      // Get image dimensions
      const img = new window.Image();
      img.onload = () => {
        updatePlanImage(project.id, dataUrl, img.naturalWidth, img.naturalHeight);
        refresh();
        showToast('Imagen del plano cargada');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveImage = () => {
    if (!confirm('¿Eliminar la imagen del plano y todos los bloques?')) return;
    removePlanImage(project.id);
    refresh();
    setSelectedBlockId(null);
    showToast('Plano eliminado');
  };

  /* ── Mouse → percentage coordinates ── */
  const getPercentCoords = useCallback((clientX: number, clientY: number): { px: number; py: number } => {
    if (!canvasRef.current) return { px: 0, py: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const px = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const py = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { px, py };
  }, []);

  /* ── Drawing / Moving / Resizing ── */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!planData) return;
    const { px, py } = getPercentCoords(e.clientX, e.clientY);

    if (tool === 'draw') {
      setDragState({ type: 'draw', startX: px, startY: py, currentX: px, currentY: py });
      setSelectedBlockId(null);
    }
  }, [planData, tool, getPercentCoords]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState) return;
    const { px, py } = getPercentCoords(e.clientX, e.clientY);

    if (dragState.type === 'draw') {
      setDragState((prev) => prev ? { ...prev, currentX: px, currentY: py } : null);
    } else if (dragState.type === 'move' && dragState.blockId && dragState.originBlock) {
      const dx = px - dragState.startX;
      const dy = py - dragState.startY;
      const newX = Math.max(0, Math.min(100 - dragState.originBlock.width, dragState.originBlock.x + dx));
      const newY = Math.max(0, Math.min(100 - dragState.originBlock.height, dragState.originBlock.y + dy));
      setDragState((prev) => prev ? { ...prev, currentX: newX, currentY: newY } : null);
    } else if (dragState.type === 'resize' && dragState.blockId && dragState.originBlock) {
      const dx = px - dragState.startX;
      const dy = py - dragState.startY;
      const newW = Math.max(3, dragState.originBlock.width + dx);
      const newH = Math.max(3, dragState.originBlock.height + dy);
      setDragState((prev) => prev ? { ...prev, currentX: newW, currentY: newH } : null);
    }
  }, [dragState, getPercentCoords]);

  const handleMouseUp = useCallback(() => {
    if (!dragState || !planData) return;

    if (dragState.type === 'draw') {
      const x = Math.min(dragState.startX, dragState.currentX);
      const y = Math.min(dragState.startY, dragState.currentY);
      const w = Math.abs(dragState.currentX - dragState.startX);
      const h = Math.abs(dragState.currentY - dragState.startY);

      if (w > 2 && h > 2) {
        // Find next unassigned manzana
        const nextMz = manzanas.find((mz) => !assignedManzanas.has(mz)) || `MZ${planData.blocks.length + 1}`;
        const created = addBlockShape(project.id, {
          blockName: nextMz,
          x, y, width: w, height: h,
        });
        if (created) {
          refresh();
          setSelectedBlockId(created.id);
          showToast(`Bloque "${nextMz}" creado`);
        }
      }
    } else if (dragState.type === 'move' && dragState.blockId) {
      updateBlockShape(project.id, dragState.blockId, {
        x: dragState.currentX,
        y: dragState.currentY,
      });
      refresh();
    } else if (dragState.type === 'resize' && dragState.blockId) {
      updateBlockShape(project.id, dragState.blockId, {
        width: dragState.currentX,
        height: dragState.currentY,
      });
      refresh();
    }

    setDragState(null);
  }, [dragState, planData, project.id, manzanas, assignedManzanas, refresh, showToast]);

  /* ── Block interactions ── */
  const handleBlockMouseDown = useCallback((e: React.MouseEvent, block: BlockShape, action: 'move' | 'resize') => {
    e.stopPropagation();
    const { px, py } = getPercentCoords(e.clientX, e.clientY);
    setSelectedBlockId(block.id);
    setDragState({
      type: action,
      blockId: block.id,
      startX: px,
      startY: py,
      currentX: action === 'move' ? block.x : block.width,
      currentY: action === 'move' ? block.y : block.height,
      originBlock: { ...block },
    });
  }, [getPercentCoords]);

  const handleDeleteBlock = (blockId: string) => {
    if (!confirm('¿Eliminar este bloque de manzana?')) return;
    deleteBlockShape(project.id, blockId);
    if (selectedBlockId === blockId) setSelectedBlockId(null);
    refresh();
    showToast('Bloque eliminado');
  };

  const handleRenameBlock = (blockId: string) => {
    if (!blockNameInput.trim()) return;
    updateBlockShape(project.id, blockId, { blockName: blockNameInput.trim() });
    setEditingBlock(null);
    setBlockNameInput('');
    refresh();
    showToast('Bloque renombrado');
  };

  /* ── Get visual block position (accounts for drag) ── */
  const getBlockVisual = (block: BlockShape) => {
    if (dragState?.blockId === block.id) {
      if (dragState.type === 'move') {
        return { x: dragState.currentX, y: dragState.currentY, width: block.width, height: block.height };
      }
      if (dragState.type === 'resize') {
        return { x: block.x, y: block.y, width: dragState.currentX, height: dragState.currentY };
      }
    }
    return { x: block.x, y: block.y, width: block.width, height: block.height };
  };

  // Count lots per manzana
  const lotCountByMz = useMemo(() => {
    const map: Record<string, number> = {};
    (project.lots || []).forEach((l) => {
      map[l.manzana] = (map[l.manzana] || 0) + 1;
    });
    return map;
  }, [project.lots]);

  /* ── Render ── */
  if (!planData) {
    return (
      <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
          {Icons.upload}
        </div>
        <h3 className="text-lg font-bold text-slate-700 mb-2">Plano interactivo</h3>
        <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
          Sube la imagen del plano del proyecto. Luego podrás dibujar las manzanas sobre el plano y los lotes se generarán automáticamente dentro de cada zona.
        </p>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#0098dc] hover:bg-[#0079b2] text-white font-semibold rounded-xl shadow-sm transition-all"
        >
          {Icons.upload} Subir imagen del plano
        </button>
        <p className="text-xs text-slate-400 mt-3">PNG, JPG o WebP. Se recomienda alta resolución.</p>
      </div>
    );
  }

  const drawPreview = dragState?.type === 'draw' ? {
    x: Math.min(dragState.startX, dragState.currentX),
    y: Math.min(dragState.startY, dragState.currentY),
    w: Math.abs(dragState.currentX - dragState.startX),
    h: Math.abs(dragState.currentY - dragState.startY),
  } : null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setTool('select')}
            className={`px-3 py-2 text-sm font-medium transition-all flex items-center gap-1.5 ${
              tool === 'select' ? 'bg-[#0098dc] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {Icons.move} <span className="hidden sm:inline">Seleccionar</span>
          </button>
          <button
            onClick={() => setTool('draw')}
            className={`px-3 py-2 text-sm font-medium transition-all flex items-center gap-1.5 ${
              tool === 'draw' ? 'bg-[#0098dc] text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {Icons.plus} <span className="hidden sm:inline">Dibujar manzana</span>
          </button>
        </div>
        <span className="text-xs text-slate-400">
          {planData.blocks.length} bloques · {manzanas.length} manzanas en datos
        </span>
        <div className="flex-1" />
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} className="text-xs text-slate-500 hover:text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-all">
          Cambiar imagen
        </button>
        <button onClick={handleRemoveImage} className="text-xs text-red-500 hover:text-red-700 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-all">
          Eliminar plano
        </button>
      </div>

      {/* Canvas area */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Plan image with SVG overlay */}
        <div className="flex-1 min-w-0">
          <div
            ref={canvasRef}
            className={`relative rounded-xl border-2 overflow-hidden select-none ${
              tool === 'draw' ? 'border-blue-300 cursor-crosshair' : 'border-slate-200 cursor-default'
            }`}
            style={{ aspectRatio: `${planData.imageWidth} / ${planData.imageHeight}` }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Plan image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={planData.imageUrl}
              alt="Plan del proyecto"
              className="w-full h-full object-contain pointer-events-none"
              draggable={false}
            />

            {/* SVG overlay */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {/* Existing blocks */}
              {planData.blocks.map((block, idx) => {
                const vis = getBlockVisual(block);
                const colorIdx = idx % BLOCK_COLORS.length;
                const isSelected = selectedBlockId === block.id;
                const lotCount = lotCountByMz[block.blockName] || 0;

                return (
                  <g key={block.id}>
                    <rect
                      x={vis.x}
                      y={vis.y}
                      width={vis.width}
                      height={vis.height}
                      fill={BLOCK_COLORS[colorIdx]}
                      stroke={isSelected ? '#0098dc' : BLOCK_BORDERS[colorIdx]}
                      strokeWidth={isSelected ? 0.5 : 0.3}
                      strokeDasharray={isSelected ? 'none' : '0.8 0.4'}
                      rx={0.3}
                      className="transition-opacity"
                      style={{ cursor: tool === 'select' ? 'grab' : 'crosshair' }}
                      onMouseDown={(e) => {
                        if (tool === 'select') handleBlockMouseDown(e as unknown as React.MouseEvent, block, 'move');
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBlockId(block.id);
                      }}
                    />
                    {/* Block label */}
                    <text
                      x={vis.x + vis.width / 2}
                      y={vis.y + vis.height / 2 - 0.8}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontWeight="bold"
                      fontSize={Math.min(vis.width / 4, vis.height / 3, 3)}
                      className="pointer-events-none select-none"
                      stroke="rgba(0,0,0,0.6)"
                      strokeWidth={0.15}
                    >
                      Mz {block.blockName}
                    </text>
                    <text
                      x={vis.x + vis.width / 2}
                      y={vis.y + vis.height / 2 + 2}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="rgba(255,255,255,0.85)"
                      fontSize={Math.min(vis.width / 5, vis.height / 4, 2)}
                      className="pointer-events-none select-none"
                    >
                      {lotCount} lotes
                    </text>

                    {/* Resize handle (bottom-right corner) */}
                    {isSelected && tool === 'select' && (
                      <rect
                        x={vis.x + vis.width - 1.5}
                        y={vis.y + vis.height - 1.5}
                        width={3}
                        height={3}
                        fill="#0098dc"
                        stroke="white"
                        strokeWidth={0.2}
                        rx={0.3}
                        style={{ cursor: 'nwse-resize' }}
                        onMouseDown={(e) => handleBlockMouseDown(e as unknown as React.MouseEvent, block, 'resize')}
                      />
                    )}
                  </g>
                );
              })}

              {/* Draw preview */}
              {drawPreview && drawPreview.w > 0.5 && drawPreview.h > 0.5 && (
                <rect
                  x={drawPreview.x}
                  y={drawPreview.y}
                  width={drawPreview.w}
                  height={drawPreview.h}
                  fill="rgba(0, 152, 220, 0.2)"
                  stroke="#0098dc"
                  strokeWidth={0.3}
                  strokeDasharray="1 0.5"
                  rx={0.3}
                />
              )}
            </svg>
          </div>

          {/* Help text */}
          <p className="text-xs text-slate-400 mt-2 text-center">
            {tool === 'draw'
              ? '🖱️ Arrastra para dibujar una zona de manzana. Se asignará automáticamente la siguiente manzana disponible.'
              : '🖱️ Clic en un bloque para seleccionarlo. Arrastra para mover, esquina inferior-derecha para redimensionar.'
            }
          </p>
        </div>

        {/* Right panel: Block list */}
        <div className="w-full lg:w-72 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-700">Bloques de manzana</h3>
              <p className="text-xs text-slate-400">{planData.blocks.length} bloques dibujados</p>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {planData.blocks.length === 0 && (
                <p className="px-4 py-8 text-center text-slate-400 text-xs">
                  Sin bloques. Usa la herramienta &quot;Dibujar manzana&quot; para crear zonas sobre el plano.
                </p>
              )}
              {planData.blocks.map((block, idx) => {
                const colorIdx = idx % BLOCK_COLORS.length;
                const isSelected = selectedBlockId === block.id;
                const lotCount = lotCountByMz[block.blockName] || 0;
                const isEditing = editingBlock === block.id;

                return (
                  <div
                    key={block.id}
                    className={`px-4 py-3 cursor-pointer transition-all ${isSelected ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
                    onClick={() => setSelectedBlockId(block.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded flex-shrink-0"
                        style={{ backgroundColor: BLOCK_BORDERS[colorIdx] }}
                      />
                      {isEditing ? (
                        <div className="flex items-center gap-1 flex-1">
                          <select
                            value={blockNameInput}
                            onChange={(e) => setBlockNameInput(e.target.value)}
                            className="flex-1 text-xs border border-slate-200 rounded px-2 py-1 focus:border-blue-400 outline-none"
                            autoFocus
                          >
                            <option value="">Seleccionar manzana...</option>
                            {manzanas.map((mz) => (
                              <option key={mz} value={mz} disabled={assignedManzanas.has(mz) && mz !== block.blockName}>
                                Mz {mz} ({lotCountByMz[mz] || 0} lotes) {assignedManzanas.has(mz) && mz !== block.blockName ? '✓' : ''}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRenameBlock(block.id); }}
                            className="p-1 bg-emerald-500 text-white rounded text-xs"
                          >
                            ✓
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingBlock(null); }}
                            className="p-1 bg-slate-300 text-white rounded text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800">Mz {block.blockName}</p>
                          <p className="text-xs text-slate-400">{lotCount} lotes · {block.width.toFixed(0)}×{block.height.toFixed(0)}%</p>
                        </div>
                      )}
                      {!isEditing && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingBlock(block.id);
                              setBlockNameInput(block.blockName);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
                            title="Reasignar manzana"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                            className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                          >
                            {Icons.trash}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Unassigned manzanas */}
            {manzanas.filter((mz) => !assignedManzanas.has(mz)).length > 0 && (
              <div className="px-4 py-3 bg-amber-50/50 border-t border-amber-100">
                <p className="text-xs font-semibold text-amber-700 mb-1">Manzanas sin asignar:</p>
                <div className="flex flex-wrap gap-1">
                  {manzanas.filter((mz) => !assignedManzanas.has(mz)).map((mz) => (
                    <span key={mz} className="inline-flex items-center text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md font-medium">
                      {mz} ({lotCountByMz[mz] || 0})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
