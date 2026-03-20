'use client';

/**
 * LayoutReviewEditor.tsx
 *
 * Panel admin para revisar y aprobar un GeneratedLayout.
 * Permite:
 * - Vista previa del layout generado (mismo CineplanView)
 * - Lista de bloques y lotes con estado matched/unmatched
 * - Reasignar lotId (FK) de un lote generado
 * - Renombrar bloque
 * - Aprobar / rechazar el layout completo
 */

import { useState, useCallback, useMemo } from 'react';
import {
  getGeneratedLayout,
  updateGeneratedLayoutStatus,
  updateGeneratedBlock,
  reassignGeneratedLot,
  deleteGeneratedLayout,
} from '@/lib/admin-store';
import type {
  GeneratedLayout,
  GeneratedBlock,
  GeneratedLot,
  LotData,
  ProjectData,
} from '@/lib/projects-data';

/* ─────────────────────────────────────────────
   PROPS
───────────────────────────────────────────── */
interface LayoutReviewEditorProps {
  projectId: string;
  project: ProjectData;
  lots: LotData[];
  layout: GeneratedLayout;
  onLayoutUpdate: (layout: GeneratedLayout) => void;
  onClose?: () => void;
}

/* ─────────────────────────────────────────────
   ESTADO LOCAL POR LOTE
───────────────────────────────────────────── */
type EditingLot = {
  blockId: string;
  genLotId: string;
  newLotId: string;
  newLabel: string;
};

/* ─────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────── */
export default function LayoutReviewEditor({
  projectId,
  project,
  lots,
  layout,
  onLayoutUpdate,
  onClose,
}: LayoutReviewEditorProps) {
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const [editingLot, setEditingLot] = useState<EditingLot | null>(null);
  const [editingBlockName, setEditingBlockName] = useState<{ id: string; name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Lookup inverso lotId → LotData
  const lotById = useMemo(() => {
    const m = new Map<string, LotData>();
    lots.forEach((l) => m.set(l.id, l));
    return m;
  }, [lots]);

  // Lotes sin asignar (no FK en ningún genLot)
  const assignedLotIds = useMemo(() => {
    const s = new Set<string>();
    layout.blocks.forEach((b) => b.lots.forEach((gl) => { if (gl.lotId) s.add(gl.lotId); }));
    return s;
  }, [layout]);

  const unassignedLots = useMemo(
    () => lots.filter((l) => !assignedLotIds.has(l.id)),
    [lots, assignedLotIds]
  );

  /* ── helpers de refresh ── */
  const refreshLayout = useCallback(() => {
    const updated = getGeneratedLayout(projectId);
    if (updated) onLayoutUpdate(updated);
  }, [projectId, onLayoutUpdate]);

  /* ── Aprobar layout ── */
  const handleApprove = useCallback(async () => {
    setSaving(true);
    try {
      updateGeneratedLayoutStatus(projectId, 'approved');
      refreshLayout();
    } finally {
      setSaving(false);
    }
  }, [projectId, refreshLayout]);

  /* ── Volver a draft ── */
  const handleSetDraft = useCallback(() => {
    updateGeneratedLayoutStatus(projectId, 'draft');
    refreshLayout();
  }, [projectId, refreshLayout]);

  /* ── Guardar nombre de bloque ── */
  const handleSaveBlockName = useCallback(() => {
    if (!editingBlockName) return;
    updateGeneratedBlock(projectId, editingBlockName.id, { name: editingBlockName.name });
    setEditingBlockName(null);
    refreshLayout();
  }, [editingBlockName, projectId, refreshLayout]);

  /* ── Guardar reasignación de lote ── */
  const handleSaveLotAssign = useCallback(() => {
    if (!editingLot) return;
    reassignGeneratedLot(
      projectId,
      editingLot.blockId,
      editingLot.genLotId,
      editingLot.newLotId || null,
      editingLot.newLabel
    );
    setEditingLot(null);
    refreshLayout();
  }, [editingLot, projectId, refreshLayout]);

  /* ── Eliminar layout ── */
  const handleDelete = useCallback(() => {
    deleteGeneratedLayout(projectId);
    onClose?.();
  }, [projectId, onClose]);

  /* ── Estadísticas ── */
  const matchRate = layout.stats?.matchRate ?? 0;
  const totalLots = layout.stats?.totalLots ?? 0;
  const matchedLots = layout.stats?.matchedLots ?? 0;
  const unmatchedLots = layout.stats?.unmatchedLots ?? 0;

  const statusColor = layout.status === 'approved'
    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
    : layout.status === 'reviewed'
    ? 'bg-blue-100 text-blue-700 border-blue-200'
    : 'bg-amber-100 text-amber-700 border-amber-200';

  const statusLabel = { draft: 'Borrador', reviewed: 'Revisado', approved: '✅ Aprobado' }[layout.status];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
        <div>
          <h3 className="font-bold text-slate-900 text-base">Revisar layout generado</h3>
          <p className="text-xs text-slate-400 mt-0.5">{project.name}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${statusColor}`}>
            {statusLabel}
          </span>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
        <StatCell label="Bloques" value={layout.blocks.length.toString()} />
        <StatCell label="Lotes" value={totalLots.toString()} />
        <StatCell label="Coincidencias" value={`${matchedLots}/${totalLots}`} sub={`${Math.round(matchRate * 100)}%`} accent={matchRate > 0.8 ? 'emerald' : matchRate > 0.5 ? 'amber' : 'red'} />
        <StatCell label="Sin asignar" value={unmatchedLots.toString()} accent={unmatchedLots > 0 ? 'amber' : 'emerald'} />
      </div>

      {/* ── BLOCK LIST ── */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {layout.blocks.map((block) => (
          <BlockRow
            key={block.id}
            block={block}
            lots={lots}
            lotById={lotById}
            isExpanded={expandedBlock === block.id}
            onToggle={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
            onEditName={() => setEditingBlockName({ id: block.id, name: block.name })}
            onEditLot={(gl) => setEditingLot({
              blockId: block.id,
              genLotId: gl.id,
              newLotId: gl.lotId ?? '',
              newLabel: gl.label,
            })}
          />
        ))}

        {/* Unassigned lots warning */}
        {unassignedLots.length > 0 && (
          <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
            <p className="text-xs font-semibold text-amber-700 mb-1.5">
              ⚠️ {unassignedLots.length} lote{unassignedLots.length > 1 ? 's' : ''} del inventario sin asignar
            </p>
            <div className="flex flex-wrap gap-1.5">
              {unassignedLots.slice(0, 12).map((l) => (
                <span key={l.id} className="text-[10px] bg-white border border-amber-200 rounded px-1.5 py-0.5 text-amber-700 font-mono">
                  {l.label}
                </span>
              ))}
              {unassignedLots.length > 12 && (
                <span className="text-[10px] text-amber-500">+{unassignedLots.length - 12} más</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ACTIONS ── */}
      <div className="border-t border-slate-200 px-5 py-4 space-y-3">
        {layout.status !== 'approved' ? (
          <button
            onClick={handleApprove}
            disabled={saving}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
          >
            {saving ? 'Guardando…' : '✅ Aprobar layout — publicar vista abstracta'}
          </button>
        ) : (
          <button
            onClick={handleSetDraft}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all text-sm"
          >
            Volver a borrador
          </button>
        )}

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="w-full py-2 text-xs text-red-400 hover:text-red-600 transition-all"
          >
            Eliminar layout generado
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={handleDelete} className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg text-xs transition-all">
              Confirmar eliminación
            </button>
            <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs transition-all">
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* ── MODAL: Editar nombre bloque ── */}
      {editingBlockName && (
        <ModalOverlay onClose={() => setEditingBlockName(null)}>
          <h4 className="font-bold text-slate-900 mb-4">Renombrar bloque</h4>
          <input
            value={editingBlockName.name}
            onChange={(e) => setEditingBlockName({ ...editingBlockName, name: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#0098dc]/30"
            placeholder="Nombre del bloque (ej: Manzana A)"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleSaveBlockName} className="flex-1 py-2 bg-[#0098dc] text-white font-semibold rounded-lg text-sm">Guardar</button>
            <button onClick={() => setEditingBlockName(null)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm">Cancelar</button>
          </div>
        </ModalOverlay>
      )}

      {/* ── MODAL: Reasignar lote ── */}
      {editingLot && (
        <ModalOverlay onClose={() => setEditingLot(null)}>
          <h4 className="font-bold text-slate-900 mb-1">Asignar lote del inventario</h4>
          <p className="text-xs text-slate-400 mb-4">Label generado: <span className="font-mono font-bold">{editingLot.newLabel}</span></p>
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Etiqueta visual</label>
          <input
            value={editingLot.newLabel}
            onChange={(e) => setEditingLot({ ...editingLot, newLabel: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-[#0098dc]/30"
            placeholder="Ej: A-01"
          />
          <label className="text-xs font-semibold text-slate-600 mb-1 block">Lote del inventario</label>
          <select
            value={editingLot.newLotId}
            onChange={(e) => setEditingLot({ ...editingLot, newLotId: e.target.value })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#0098dc]/30"
          >
            <option value="">— Sin asignar —</option>
            {lots.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label} — {l.area.toFixed(1)}m² — {l.status}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleSaveLotAssign} className="flex-1 py-2 bg-[#0098dc] text-white font-semibold rounded-lg text-sm">Guardar</button>
            <button onClick={() => setEditingLot(null)} className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm">Cancelar</button>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   BLOCK ROW
───────────────────────────────────────────── */
function BlockRow({
  block,
  lots,
  lotById,
  isExpanded,
  onToggle,
  onEditName,
  onEditLot,
}: {
  block: GeneratedBlock;
  lots: LotData[];
  lotById: Map<string, LotData>;
  isExpanded: boolean;
  onToggle: () => void;
  onEditName: () => void;
  onEditLot: (gl: GeneratedLot) => void;
}) {
  const matched = block.lots.filter((gl) => gl.lotId).length;
  const total = block.lots.length;

  return (
    <div>
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-all"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-sm flex-shrink-0"
            style={{ backgroundColor: block.color || '#0098dc' }}
          />
          <span className="font-semibold text-slate-800 text-sm">{block.name}</span>
          {block.manualOverride && (
            <span className="text-[10px] bg-purple-100 text-purple-600 border border-purple-200 rounded px-1.5 py-0.5 font-semibold">manual</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${matched === total ? 'text-emerald-600' : 'text-amber-600'}`}>
            {matched}/{total}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); onEditName(); }}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            title="Renombrar bloque"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
          <svg
            className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-50 bg-slate-50/50">
          {block.lots.map((gl) => {
            const lot = gl.lotId ? lotById.get(gl.lotId) : null;
            return (
              <div key={gl.id} className="flex items-center justify-between px-5 py-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-700">{gl.label}</span>
                  {lot ? (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                      lot.status === 'disponible' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                      lot.status === 'reservado' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                      'bg-red-50 text-red-500 border-red-200'
                    }`}>
                      {lot.status}
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-100 text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 font-semibold">sin asignar</span>
                  )}
                </div>
                <button
                  onClick={() => onEditLot(gl)}
                  className="text-[10px] text-[#0098dc] hover:text-[#0079b2] font-semibold transition-all px-2 py-1 rounded hover:bg-[#0098dc]/5"
                >
                  {lot ? 'Cambiar' : 'Asignar'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   STAT CELL
───────────────────────────────────────────── */
function StatCell({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'emerald' | 'amber' | 'red' }) {
  const colors = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  };
  return (
    <div className="flex flex-col items-center justify-center py-3 px-2">
      <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
      <p className={`text-base font-black ${accent ? colors[accent] : 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODAL OVERLAY
───────────────────────────────────────────── */
function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5 relative">
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
