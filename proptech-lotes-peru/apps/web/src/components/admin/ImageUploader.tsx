'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

/* ─── Types ─────────────────────────────────────────────────────────── */
export interface ImageMeta {
  url: string;       // public URL or data URL while uploading
  name: string;
  size: number;      // bytes
  type: string;
  width?: number;
  height?: number;
}

interface Props {
  label: string;
  value: string;           // current public URL
  onChange: (url: string) => void;
  hint?: string;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getOrientation(w: number, h: number): string {
  if (w > h) return 'Horizontal';
  if (h > w) return 'Vertical';
  return 'Cuadrada';
}

function getAspectRatio(w: number, h: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(w, h);
  return `${w / d}:${h / d}`;
}

/* ─── Component ──────────────────────────────────────────────────────── */
export default function ImageUploader({ label, value, onChange, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const [meta, setMeta] = useState<ImageMeta | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Infer metadata from the current URL when the component mounts or value changes
  useEffect(() => {
    if (!value || meta?.url === value) return;
    // If it's a local upload URL we won't have the original meta — show minimal info
    const name = value.split('/').pop() || 'imagen';
    setMeta({ url: value, name, size: 0, type: '' });
    // Try to read dimensions via Image element
    const img = new window.Image();
    img.onload = () => {
      setMeta((prev) =>
        prev ? { ...prev, width: img.naturalWidth, height: img.naturalHeight } : null
      );
    };
    img.src = value;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const processFile = useCallback(async (file: File) => {
    setError('');
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      setError(`Formato no permitido: ${file.type.split('/')[1].toUpperCase()}. Usa JPG, PNG, WEBP o GIF.`);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError(`El archivo pesa ${fmtBytes(file.size)}. Máximo: 10 MB.`);
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setMeta({
        url: localUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.src = localUrl;

    // Upload to server
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error al subir el archivo.');
        setMeta(null);
        return;
      }
      // Update meta with server URL
      setMeta((prev) => prev ? { ...prev, url: data.url } : null);
      onChange(data.url);
    } catch {
      setError('No se pudo conectar con el servidor.');
      setMeta(null);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleFiles = useCallback((files: FileList | null) => {
    if (files && files[0]) processFile(files[0]);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDelete = () => {
    onChange('');
    setMeta(null);
    setConfirmDelete(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const currentSrc = meta?.url || value;

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">{label}</label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Drop zone / preview */}
      {currentSrc ? (
        /* ── Preview state ── */
        <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
          {/* Image */}
          <div className="relative group bg-slate-100 flex items-center justify-center" style={{ minHeight: 180 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSrc}
              alt={meta?.name || 'preview'}
              className="max-h-56 max-w-full object-contain"
              style={{ display: 'block', margin: '0 auto' }}
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-white">
                  <svg className="animate-spin w-8 h-8" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  <span className="text-sm font-medium">Subiendo…</span>
                </div>
              </div>
            )}
          </div>

          {/* Metadata bar */}
          <div className="px-4 py-3 border-t border-slate-100 bg-white">
            <div className="flex items-start gap-3">
              {/* File icon */}
              <div className="w-8 h-8 rounded-lg bg-[#0098dc]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-[#0098dc]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M4.5 3v18M19.5 3v18" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{meta?.name || 'imagen'}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {meta?.width && meta.height && (
                    <>
                      <span className="text-xs text-slate-500">{meta.width} × {meta.height} px</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{getAspectRatio(meta.width, meta.height)}</span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{getOrientation(meta.width, meta.height)}</span>
                    </>
                  )}
                  {meta?.size ? (
                    <>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">{fmtBytes(meta.size)}</span>
                    </>
                  ) : null}
                  {meta?.type && (
                    <>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs font-medium text-[#0098dc] uppercase">{meta.type.split('/')[1]}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                Reemplazar
              </button>

              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  disabled={uploading}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  Eliminar
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-red-600 font-medium">¿Confirmar?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                  >
                    Sí, eliminar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Empty / drop zone state ── */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer select-none ${
            dragging
              ? 'border-[#0098dc] bg-[#0098dc]/5 scale-[1.01]'
              : 'border-slate-200 hover:border-[#0098dc]/50 hover:bg-slate-50/80'
          }`}
          style={{ minHeight: 160 }}
          onClick={() => inputRef.current?.click()}
        >
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
            {uploading ? (
              <svg className="animate-spin w-10 h-10 text-[#0098dc]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${dragging ? 'bg-[#0098dc]/20' : 'bg-slate-100'}`}>
                <svg className={`w-7 h-7 ${dragging ? 'text-[#0098dc]' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
              </div>
            )}
            <div className="text-center">
              <p className={`text-sm font-semibold ${dragging ? 'text-[#0098dc]' : 'text-slate-600'}`}>
                {uploading ? 'Subiendo imagen…' : dragging ? 'Suelta aquí' : 'Arrastra una imagen o haz clic'}
              </p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP, GIF · Máx. 10 MB</p>
            </div>
            {!uploading && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#0098dc] text-white hover:bg-[#0085c0] transition-colors shadow-sm"
              >
                Seleccionar archivo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          {error}
          <button type="button" onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}
    </div>
  );
}
