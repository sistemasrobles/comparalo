'use client';

import { useRef, useState, useCallback } from 'react';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface GalleryItem {
  url: string;
  name: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
  uploading?: boolean;
  error?: string;
  localPreview?: string;  // object URL while uploading
}

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function fmtBytes(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function urlToItem(url: string): GalleryItem {
  const name = url.split('/').pop() || 'imagen';
  return { url, name, size: 0, type: '' };
}

/* ─── Component ──────────────────────────────────────────────────────── */
export default function GalleryUploader({ value, onChange, maxImages = 20 }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const replaceIndexRef = useRef<number>(-1);
  const [dragging, setDragging] = useState(false);
  const [globalError, setGlobalError] = useState('');

  // Internal items state — synced from props on first render; local changes propagate via onChange
  const [items, setItems] = useState<GalleryItem[]>(() => value.map(urlToItem));

  // Sync incoming value changes (e.g. when parent resets form)
  const prevValueRef = useRef<string[]>(value);
  if (value !== prevValueRef.current) {
    prevValueRef.current = value;
    // Only sync if URLs differ from current items (avoids overwriting upload progress)
    const currentUrls = items.filter((i) => !i.uploading).map((i) => i.url);
    const valueStr = value.join(',');
    const currentStr = currentUrls.join(',');
    if (valueStr !== currentStr) {
      setItems(value.map(urlToItem));
    }
  }

  const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
  const MAX_SIZE = 10 * 1024 * 1024;

  const uploadFile = useCallback(async (
    file: File,
    index: number,
    allItems: GalleryItem[],
    setAll: React.Dispatch<React.SetStateAction<GalleryItem[]>>,
    propagate: (items: GalleryItem[]) => void
  ) => {
    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      setAll((prev) => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index] = { ...updated[index], url: data.url, uploading: false, error: undefined };
        }
        propagate(updated);
        return updated;
      });
    } catch (err: unknown) {
      setAll((prev) => {
        const updated = [...prev];
        if (updated[index]) {
          updated[index] = { ...updated[index], uploading: false, error: (err as Error).message };
        }
        return updated;
      });
    }
  }, []);

  const processFiles = useCallback(async (files: FileList) => {
    setGlobalError('');
    const fileArr = Array.from(files);

    // Validate
    const badMime = fileArr.find((f) => !ALLOWED.includes(f.type));
    if (badMime) { setGlobalError(`"${badMime.name}": formato no permitido. Usa JPG, PNG, WEBP o GIF.`); return; }
    const tooBig = fileArr.find((f) => f.size > MAX_SIZE);
    if (tooBig) { setGlobalError(`"${tooBig.name}" pesa demasiado (máx. 10 MB).`); return; }

    const existing = items.filter((i) => !i.uploading && !i.error);
    if (existing.length + fileArr.length > maxImages) {
      setGlobalError(`Máximo ${maxImages} imágenes. Tienes ${existing.length}, intentas subir ${fileArr.length}.`);
      return;
    }

    // Create placeholder items immediately with local previews
    const placeholders: GalleryItem[] = fileArr.map((file) => ({
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
      type: file.type,
      uploading: true,
      localPreview: URL.createObjectURL(file),
    }));

    // Read dimensions
    await Promise.all(
      placeholders.map((ph, i) =>
        new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            placeholders[i].width = img.naturalWidth;
            placeholders[i].height = img.naturalHeight;
            resolve();
          };
          img.onerror = () => resolve();
          img.src = ph.url;
        })
      )
    );

    const startIndex = items.length;
    const newItems = [...items, ...placeholders];
    setItems(newItems);

    // Upload each file
    fileArr.forEach((file, i) => {
      uploadFile(file, startIndex + i, newItems, setItems, (updated) => {
        const doneUrls = updated.filter((it) => !it.uploading && !it.error).map((it) => it.url);
        onChange(doneUrls);
      });
    });

    if (inputRef.current) inputRef.current.value = '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, maxImages, onChange, uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleReplace = useCallback(async (index: number, file: File) => {
    if (!ALLOWED.includes(file.type)) { setGlobalError(`Formato no permitido: ${file.type.split('/')[1]}`); return; }
    if (file.size > MAX_SIZE) { setGlobalError(`El archivo pesa demasiado (máx. 10 MB).`); return; }

    const localUrl = URL.createObjectURL(file);
    const img = new window.Image();
    const dims = await new Promise<{ w: number; h: number }>((resolve) => {
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve({ w: 0, h: 0 });
      img.src = localUrl;
    });

    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], url: localUrl, name: file.name, size: file.size, type: file.type, width: dims.w, height: dims.h, uploading: true, error: undefined };
      return updated;
    });

    const form = new FormData();
    form.append('file', file);
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir');
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], url: data.url, uploading: false, error: undefined };
        const doneUrls = updated.filter((it) => !it.uploading && !it.error).map((it) => it.url);
        onChange(doneUrls);
        return updated;
      });
    } catch (err: unknown) {
      setItems((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], uploading: false, error: (err as Error).message };
        return updated;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange]);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      const doneUrls = updated.filter((it) => !it.uploading && !it.error).map((it) => it.url);
      onChange(doneUrls);
      return updated;
    });
  }, [onChange]);

  const canAddMore = items.filter((i) => !i.error).length < maxImages;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">
          Galería de imágenes
          <span className="ml-2 text-xs font-normal text-slate-400">
            {items.filter((i) => !i.uploading && !i.error).length} / {maxImages}
          </span>
        </label>
        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#0098dc] text-white hover:bg-[#0085c0] transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Subir imágenes
          </button>
        )}
      </div>

      {/* Hidden inputs */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        multiple
        className="hidden"
        onChange={(e) => { if (e.target.files?.length) processFiles(e.target.files); }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0] && replaceIndexRef.current >= 0) {
            handleReplace(replaceIndexRef.current, e.target.files[0]);
          }
          if (replaceInputRef.current) replaceInputRef.current.value = '';
        }}
      />

      {/* Grid */}
      {items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {items.map((item, i) => (
            <GalleryTile
              key={`${item.url}-${i}`}
              item={item}
              index={i}
              onReplace={(idx) => {
                replaceIndexRef.current = idx;
                replaceInputRef.current?.click();
              }}
              onRemove={removeItem}
            />
          ))}

          {/* Add more tile */}
          {canAddMore && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all select-none ${
                dragging
                  ? 'border-[#0098dc] bg-[#0098dc]/5'
                  : 'border-slate-200 hover:border-[#0098dc]/50 hover:bg-slate-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dragging ? 'bg-[#0098dc]/20' : 'bg-slate-100'}`}>
                <svg className={`w-5 h-5 ${dragging ? 'text-[#0098dc]' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
              <span className={`text-xs font-medium ${dragging ? 'text-[#0098dc]' : 'text-slate-400'}`}>Agregar</span>
            </div>
          )}
        </div>
      ) : (
        /* Empty drop zone */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl transition-all cursor-pointer select-none ${
            dragging
              ? 'border-[#0098dc] bg-[#0098dc]/5 scale-[1.005]'
              : 'border-slate-200 hover:border-[#0098dc]/50 hover:bg-slate-50/80'
          }`}
          style={{ minHeight: 140 }}
        >
          <div className="flex flex-col items-center justify-center gap-3 p-8">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dragging ? 'bg-[#0098dc]/20' : 'bg-slate-100'}`}>
              <svg className={`w-7 h-7 ${dragging ? 'text-[#0098dc]' : 'text-slate-400'}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M4.5 3v18M19.5 3v18" />
              </svg>
            </div>
            <div className="text-center">
              <p className={`text-sm font-semibold ${dragging ? 'text-[#0098dc]' : 'text-slate-600'}`}>
                {dragging ? 'Suelta las imágenes aquí' : 'Arrastra imágenes o haz clic para seleccionar'}
              </p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP, GIF · Máx. 10 MB cada una</p>
            </div>
            {!dragging && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-[#0098dc] text-white hover:bg-[#0085c0] transition-colors shadow-sm"
              >
                Seleccionar archivos
              </button>
            )}
          </div>
        </div>
      )}

      {/* Global error */}
      {globalError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          {globalError}
          <button type="button" onClick={() => setGlobalError('')} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}
    </div>
  );
}

/* ─── GalleryTile ────────────────────────────────────────────────────── */
interface TileProps {
  item: GalleryItem;
  index: number;
  onReplace: (i: number) => void;
  onRemove: (i: number) => void;
}

function GalleryTile({ item, index, onReplace, onRemove }: TileProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [hovered, setHovered] = useState(false);

  const displaySrc = item.localPreview || item.url;

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group"
      style={{ aspectRatio: '1' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={displaySrc}
        alt={item.name}
        className="w-full h-full object-cover"
        loading="lazy"
      />

      {/* Upload overlay */}
      {item.uploading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <svg className="animate-spin w-7 h-7 text-white" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      )}

      {/* Error overlay */}
      {item.error && (
        <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center gap-1 p-2">
          <svg className="w-6 h-6 text-red-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          <p className="text-xs text-red-200 text-center leading-tight">{item.error}</p>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="mt-1 text-xs font-semibold px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
          >
            Quitar
          </button>
        </div>
      )}

      {/* Hover controls (only when no error and not uploading) */}
      {hovered && !item.uploading && !item.error && (
        <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/70 via-black/20 to-transparent">
          {/* Top: index badge */}
          <div className="flex justify-end p-1.5">
            <span className="text-[10px] font-bold bg-black/50 text-white rounded px-1.5 py-0.5 leading-none">#{index + 1}</span>
          </div>

          {/* Bottom: metadata + actions */}
          <div className="p-2 space-y-1.5">
            {/* Metadata */}
            <p className="text-[10px] text-white/80 truncate leading-none">{item.name}</p>
            <div className="flex gap-1 flex-wrap">
              {item.width && item.height && (
                <span className="text-[10px] bg-black/40 text-white/90 rounded px-1.5 py-0.5">{item.width}×{item.height}</span>
              )}
              {item.size > 0 && (
                <span className="text-[10px] bg-black/40 text-white/90 rounded px-1.5 py-0.5">{fmtBytes(item.size)}</span>
              )}
              {item.type && (
                <span className="text-[10px] bg-[#0098dc]/80 text-white rounded px-1.5 py-0.5 uppercase">{item.type.split('/')[1]}</span>
              )}
            </div>

            {/* Action buttons */}
            {!confirmDelete ? (
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => onReplace(index)}
                  className="flex-1 text-[10px] font-semibold py-1 rounded bg-white/20 hover:bg-white/30 text-white transition-colors text-center"
                >
                  Reemplazar
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-[10px] font-semibold py-1 px-2 rounded bg-red-500/80 hover:bg-red-600 text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="flex gap-1 items-center">
                <span className="text-[10px] text-white font-medium flex-1">¿Eliminar?</span>
                <button
                  type="button"
                  onClick={() => onRemove(index)}
                  className="text-[10px] font-bold px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                >
                  Sí
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-[10px] font-bold px-2 py-1 rounded bg-white/20 text-white hover:bg-white/30"
                >
                  No
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
