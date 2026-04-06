'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, getLegalStatusLabel, getLegalStatusColor, getAccessLabel, getCategoryLabel } from '@/lib/projects-data';
import { useAdminProjects } from '@/lib/hooks/useAdminProjects';
import { saveContactSubmission } from '@/lib/contact-store';
import { saveFeriaRegistro } from '@/lib/feria-store';

/* ── SVG Icons ── */
const IconMapPin = () => (<svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>);
const IconShield = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>);
const IconTrending = () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>);
const IconCheck = () => (<svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>);
const IconX = () => (<svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconGrid = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>);
const IconList = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>);
const IconPlus = () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>);
const IconCalc = () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" /></svg>);
const IconLink = () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>);
const IconClose = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);

/* ── Social proof badge helper ── */
function getSocialProofCount(projectId: string): number {
  // Deterministic pseudo-random based on project id (3-12 range)
  let hash = 0;
  for (let i = 0; i < projectId.length; i++) {
    hash = ((hash << 5) - hash) + projectId.charCodeAt(i);
    hash |= 0;
  }
  return 3 + Math.abs(hash) % 10; // 3 to 12
}

function SocialProofBadge({ projectId }: { projectId: string }) {
  const count = getSocialProofCount(projectId);
  return (
    <div className="flex items-center gap-1.5 text-2xs font-medium text-orange-700 bg-orange-50 border border-orange-100 px-2.5 py-1.5 rounded-lg">
      <span className="flex h-2 w-2 relative flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
      </span>
      <span>+{count} personas vieron esto hoy</span>
    </div>
  );
}

function formatServiceName(key: string): string {
  const map: Record<string, string> = {
    electricity: 'Electricidad', water: 'Agua', sewage: 'Desagüe', internet: 'Internet',
    pavedRoads: 'Pistas asfaltadas', greenAreas: 'Áreas verdes', security24h: 'Vigilancia 24h',
    clubhouse: 'Casa club', playground: 'Juegos infantiles', sportsCourt: 'Cancha deportiva',
  };
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}

/* ── Ad Banner Component ── */
function AdBanner({ onClose }: { onClose: () => void }) {
  return (
    <div className="card overflow-hidden relative">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
        aria-label="Cerrar"
      >
        <IconClose />
      </button>
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-5 text-white text-center">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <p className="text-xs font-semibold text-primary-200 uppercase tracking-wider mb-1">Oferta especial</p>
        <h3 className="text-lg font-bold mb-2 leading-tight">Lotes desde S/ 19,900</h3>
        <p className="text-xs text-primary-100 leading-relaxed mb-4">
          Cuotas desde S/ 350/mes<br />Sin inicial · Entrega inmediata
        </p>
        <a href="#" className="inline-block bg-white text-primary-700 font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-primary-50 transition-colors shadow-lg">
          ¡Lo quiero!
        </a>
      </div>
      <div className="p-4 bg-amber-50 border-t border-amber-100">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">¿Sabías que?</span> Los terrenos en Cañete se han valorizado un 15% el último año.
          </p>
        </div>
      </div>
      <div className="p-4 text-center">
        <Link href="/simulator" className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1.5">
          <IconCalc /> Simula tu inversión →
        </Link>
      </div>
    </div>
  );
}

/* ── Feria PerúInversión Banner ── */
function FeriaBanner({ onOpenModal }: { onOpenModal: () => void }) {
  const [closed, setClosed] = useState(false);

  if (closed) return null;
  return (
    <>
      <div className="mb-3 rounded-2xl overflow-hidden shadow-md border border-primary-100 relative">
        <button
          onClick={() => setClosed(true)}
          className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center transition-colors"
          aria-label="Cerrar"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header degradado */}
        <div className="bg-gradient-to-br from-[#0066cc] via-[#0098dc] to-[#00c6a7] px-4 pt-5 pb-3 text-white">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 mb-3">
            <svg className="w-3.5 h-3.5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-xs font-bold tracking-wide uppercase">Evento oficial</span>
          </div>
          <h3 className="text-base font-black leading-tight tracking-tight mb-0.5">
            Feria PerúInversión
            <span className="text-yellow-300"> 2026</span>
          </h3>
          <p className="text-[11px] text-blue-100 font-medium">El evento inmobiliario más grande del Perú</p>
        </div>

        {/* Info */}
        <div className="bg-white px-4 py-3 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" />
            </svg>
            <span className="font-semibold text-slate-800">28, 29 y 30 de marzo</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span>Centro de Convenciones de Lima</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <svg className="w-3.5 h-3.5 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 000-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
            <span><span className="font-semibold text-emerald-600">Entrada libre</span> · Sorpresas y premios</span>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-500 px-4 py-3">
          <button
            onClick={onOpenModal}
            className="flex items-center justify-center gap-1.5 bg-white text-primary-700 font-bold text-xs px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors shadow-sm w-full"
          >
            Registrarme al evento
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Modal registro Feria ── */
function FeriaRegistroModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', interest: 'lotes' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    saveFeriaRegistro({
      nombre: form.name,
      email: form.email,
      telefono: form.phone,
      interes: form.interest,
    });
    setTimeout(() => {
      setLoading(false);
      setDone(true);
      setTimeout(onClose, 2500);
    }, 600);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0066cc] to-[#00c6a7] px-6 py-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-white/90 text-xs font-semibold uppercase tracking-wider">Feria PerúInversión 2026</span>
            </div>
            <h2 className="text-white text-xl font-bold">Registro al evento</h2>
            <p className="text-blue-100 text-xs mt-0.5">28, 29 y 30 de marzo · Lima</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6">
          {done ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">¡Registro confirmado!</h3>
              <p className="text-gray-500 text-sm">Te esperamos del 28 al 30 de marzo en el Centro de Convenciones de Lima.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre completo *</label>
                <input
                  name="name" required value={form.name} onChange={handleChange}
                  placeholder="Tu nombre"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                  <input
                    name="email" type="email" required value={form.email} onChange={handleChange}
                    placeholder="correo@gmail.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">WhatsApp *</label>
                  <input
                    name="phone" required value={form.phone} onChange={handleChange}
                    placeholder="+51 999 000 000"
                    maxLength={9}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">¿Qué te interesa ver?</label>
                <select
                  name="interest" value={form.interest} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent bg-white"
                >
                  <option value="lotes">Lotes y terrenos</option>
                  <option value="departamentos">Departamentos</option>
                  <option value="inversion">Inversión / Rentabilidad</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {loading ? 'Registrando...' : 'Confirmar registro'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Second Ad Banner ── */
function AdBannerSecondary() {
  return (
    <div className="card overflow-hidden">
      <div className="p-5 text-center">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
        </div>
        <h4 className="text-sm font-semibold text-slate-900 mb-1">Compra segura</h4>
        <p className="text-xs text-slate-500 leading-relaxed mb-3">
          Todos los proyectos verificados con documentación legal al día
        </p>
        <div className="flex flex-col gap-2 text-xs text-left">
          {['Inscritos en SUNARP', 'Hab. urbana aprobada', 'Servicios garantizados'].map((item) => (
            <div key={item} className="flex items-center gap-2 text-slate-600">
              <IconCheck />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { ProjectCardSkeletonGrid } from '@/components/Skeletons';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get('city') || '';
  const highlightSlug = searchParams.get('highlight') || '';
  const initialDeveloper = searchParams.get('developer') || '';

  const [filters, setFilters] = useState({
    search: initialDeveloper, city: initialCity, minPrice: '', maxPrice: '',
    legalStatus: '', sortBy: '', category: '',
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [modalSlug, setModalSlug] = useState<string | null>(highlightSlug || null);
  const [contactSlug, setContactSlug] = useState<string | null>(null);
  const [showAdBanner, setShowAdBanner] = useState(true);
  const [showFeriaModal, setShowFeriaModal] = useState(false);

  // useAdminProjects: reactivo a cambios del admin (nombre, descripción, precio, moneda, etc.)
  const allProjects = useAdminProjects();
  const cities = useMemo(() => [...new Set(allProjects.map((p) => p.city))].filter(Boolean).sort(), [allProjects]);

  // Categorías disponibles con conteo de proyectos
  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    allProjects.forEach((p) => { counts[p.category] = (counts[p.category] ?? 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allProjects]);

  // currencyMap derivado directamente de allProjects — siempre actualizado
  const currencyMap = useMemo(() => {
    const map: Record<string, 'PEN' | 'USD'> = {};
    allProjects.forEach((p) => { if (p.currency) map[p.slug] = p.currency; });
    return map;
  }, [allProjects]);

  // Helper: format a price using the project's saved currency
  const fmt = (price: number, slug: string) => formatPrice(price, currencyMap[slug] ?? 'PEN');

  const results = useMemo(() => {
    let result = [...allProjects];
    // Si viene de /inmobiliarias con ?developer=X, filtra exacto por nombre de developer
    if (initialDeveloper && filters.search === initialDeveloper) {
      result = result.filter((p) => p.developer.name === initialDeveloper);
    } else if (filters.search) {
      const s = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(s) ||
          p.zone.toLowerCase().includes(s) ||
          p.city.toLowerCase().includes(s) ||
          p.developer.name.toLowerCase().includes(s)
      );
    }
    if (filters.city) result = result.filter((p) => p.city === filters.city);
    if (filters.category) result = result.filter((p) => p.category === filters.category);
    if (filters.minPrice) result = result.filter((p) => p.maxPrice >= Number(filters.minPrice));
    if (filters.maxPrice) result = result.filter((p) => p.minPrice <= Number(filters.maxPrice));
    if (filters.legalStatus) result = result.filter((p) => p.legalStatus === filters.legalStatus);
    if (filters.sortBy === 'price_asc') result.sort((a, b) => a.minPrice - b.minPrice);
    else if (filters.sortBy === 'price_desc') result.sort((a, b) => b.minPrice - a.minPrice);
    else if (filters.sortBy === 'area_desc') result.sort((a, b) => b.lotSizeMax - a.lotSizeMax);
    else if (filters.sortBy === 'safety_desc') result.sort((a, b) => b.safetyScore - a.safetyScore);
    else if (filters.sortBy === 'valorizacion_desc') result.sort((a, b) => b.valorizationEstimate - a.valorizationEstimate);
    return result;
  }, [allProjects, filters, initialDeveloper]);

  const modalProject = modalSlug ? allProjects.find((p) => p.slug === modalSlug) ?? null : null;
  const contactProject = contactSlug ? allProjects.find((p) => p.slug === contactSlug) ?? null : null;

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', city: '', minPrice: '', maxPrice: '', legalStatus: '', sortBy: '', category: '' });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-slate-50/60">

      {/* ── Top search bar (solo búsqueda de texto) ── */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xl">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
              <input
                type="text"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none transition-all"
                placeholder="Buscar proyecto, zona o ciudad..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>
            <p className="text-sm text-slate-500 whitespace-nowrap">
              <span className="font-semibold text-slate-900">{results.length}</span> proyecto{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </p>
            <div className="flex-1" />
            {/* View toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`} title="Vista cuadrícula"><IconGrid /></button>
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-slate-400 hover:text-slate-600'}`} title="Vista lista"><IconList /></button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main layout: filtros laterales + resultados ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6 items-start">

          {/* ═══ PANEL LATERAL DE FILTROS (estilo Nexo) ═══ */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-28">
            {/* ── Banner Feria PerúInversión (arriba de filtros) ── */}
            <FeriaBanner onOpenModal={() => setShowFeriaModal(true)} />

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <span className="text-sm font-bold text-slate-900">Filtros</span>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="text-xs text-primary-600 hover:text-primary-700 font-semibold">
                    Limpiar todo
                  </button>
                )}
              </div>

              <div className="divide-y divide-slate-100">

                {/* Tipo de inmueble */}
                <div className="px-5 py-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tipo de inmueble</p>
                  <div className="space-y-2">
                    {/* "Todos" */}
                    <label className="flex items-center justify-between cursor-pointer group">
                      <div className="flex items-center gap-2.5">
                        <div
                          onClick={() => updateFilter('category', '')}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${!filters.category ? 'bg-primary-600 border-primary-600' : 'border-slate-300 group-hover:border-primary-400'}`}
                        >
                          {!filters.category && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        </div>
                        <span onClick={() => updateFilter('category', '')} className={`text-sm cursor-pointer transition-colors ${!filters.category ? 'text-primary-700 font-semibold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                          Todos
                        </span>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">{allProjects.length}</span>
                    </label>
                    {/* Una opción por cada categoría presente */}
                    {categories.map(([cat, count]) => (
                      <label key={cat} className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-2.5">
                          <div
                            onClick={() => updateFilter('category', filters.category === cat ? '' : cat)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${filters.category === cat ? 'bg-primary-600 border-primary-600' : 'border-slate-300 group-hover:border-primary-400'}`}
                          >
                            {filters.category === cat && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                          </div>
                          <span onClick={() => updateFilter('category', filters.category === cat ? '' : cat)} className={`text-sm cursor-pointer transition-colors ${filters.category === cat ? 'text-primary-700 font-semibold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                            {getCategoryLabel(cat as Parameters<typeof getCategoryLabel>[0])}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">{count}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Estado del proyecto */}
                <div className="px-5 py-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Estado del proyecto</p>
                  <div className="space-y-2">
                    {[
                      { value: '', label: 'Todos' },
                      { value: 'INSCRITO_SUNARP', label: 'Inscrito SUNARP' },
                      { value: 'EN_TRAMITE', label: 'En trámite' },
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                        <div
                          onClick={() => updateFilter('legalStatus', value)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            filters.legalStatus === value
                              ? 'bg-primary-600 border-primary-600'
                              : 'border-slate-300 group-hover:border-primary-400'
                          }`}
                        >
                          {filters.legalStatus === value && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                          )}
                        </div>
                        <span
                          onClick={() => updateFilter('legalStatus', value)}
                          className={`text-sm cursor-pointer transition-colors ${filters.legalStatus === value ? 'text-primary-700 font-semibold' : 'text-slate-600 group-hover:text-slate-900'}`}
                        >
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Ciudad */}
                <div className="px-5 py-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ciudad</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <div
                        onClick={() => updateFilter('city', '')}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${!filters.city ? 'bg-primary-600 border-primary-600' : 'border-slate-300 group-hover:border-primary-400'}`}
                      >
                        {!filters.city && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                      </div>
                      <span onClick={() => updateFilter('city', '')} className={`text-sm cursor-pointer transition-colors ${!filters.city ? 'text-primary-700 font-semibold' : 'text-slate-600 group-hover:text-slate-900'}`}>Todas</span>
                    </label>
                    {cities.map((c) => (
                      <label key={c} className="flex items-center gap-2.5 cursor-pointer group">
                        <div
                          onClick={() => updateFilter('city', filters.city === c ? '' : c)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${filters.city === c ? 'bg-primary-600 border-primary-600' : 'border-slate-300 group-hover:border-primary-400'}`}
                        >
                          {filters.city === c && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                        </div>
                        <span onClick={() => updateFilter('city', filters.city === c ? '' : c)} className={`text-sm cursor-pointer transition-colors ${filters.city === c ? 'text-primary-700 font-semibold' : 'text-slate-600 group-hover:text-slate-900'}`}>{c}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Precio */}
                <div className="px-5 py-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Precio</p>
                  <div className="space-y-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">Desde</span>
                      <input
                        type="number"
                        className="w-full pl-14 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none transition-all"
                        placeholder="S/ 0"
                        value={filters.minPrice}
                        onChange={(e) => updateFilter('minPrice', e.target.value)}
                      />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">Hasta</span>
                      <input
                        type="number"
                        className="w-full pl-14 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none transition-all"
                        placeholder="Sin límite"
                        value={filters.maxPrice}
                        onChange={(e) => updateFilter('maxPrice', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Ordenar */}
                <div className="px-5 py-4">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Ordenar por</p>
                  <div className="space-y-2">
                    {[
                      { value: '', label: 'Relevancia' },
                      { value: 'price_asc', label: 'Precio: menor a mayor' },
                      { value: 'price_desc', label: 'Precio: mayor a menor' },
                      { value: 'area_desc', label: 'Mayor área' },
                      { value: 'safety_desc', label: 'Más seguros' },
                      { value: 'valorizacion_desc', label: 'Mayor valorización' },
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                        <div
                          onClick={() => updateFilter('sortBy', value)}
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${filters.sortBy === value ? 'border-primary-600' : 'border-slate-300 group-hover:border-primary-400'}`}
                        >
                          {filters.sortBy === value && <div className="w-2 h-2 rounded-full bg-primary-600" />}
                        </div>
                        <span
                          onClick={() => updateFilter('sortBy', value)}
                          className={`text-sm cursor-pointer transition-colors ${filters.sortBy === value ? 'text-primary-700 font-semibold' : 'text-slate-600 group-hover:text-slate-900'}`}
                        >
                          {label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </aside>

          {/* ─ Centro: resultados ─ */}
          <div className="flex-1 min-w-0">
            {results.length === 0 ? (
              <div className="card p-12 text-center bg-white">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
                </div>
                <p className="text-slate-700 font-semibold text-lg">No se encontraron proyectos</p>
                <p className="text-slate-400 text-sm mt-1">Intenta ajustar los filtros de búsqueda</p>
                <button onClick={clearFilters} className="btn-primary mt-5 text-sm">Limpiar filtros</button>
              </div>
            ) : viewMode === 'grid' ? (
              /* ═══ GRID VIEW — estilo Nexo ═══ */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.map((project) => (
                  <div key={project.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col group">
                    {/* Imagen */}
                    <div className="relative h-44 overflow-hidden flex-shrink-0">
                      <Image src={project.imageUrl} alt={project.name} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                      {/* Badges top-left */}
                      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                        {project.isExclusive && (
                          <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-2xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">✦ Exclusivo</span>
                        )}
                      </div>
                      {/* Estado legal top-right */}
                      <div className="absolute top-2.5 right-2.5">
                        <span className={`text-2xs font-bold px-2 py-0.5 rounded-md shadow-sm ${getLegalStatusColor(project.legalStatus)}`}>
                          {getLegalStatusLabel(project.legalStatus)}
                        </span>
                      </div>
                      {/* Precio bottom */}
                      <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-end justify-between">
                        <div>
                          <p className="text-white/70 text-2xs">Desde</p>
                          <p className="text-white font-bold text-base leading-none drop-shadow">{fmt(project.minPrice, project.slug)}</p>
                        </div>
                        <p className="text-white/80 text-xs flex items-center gap-1"><IconMapPin />{project.city}</p>
                      </div>
                    </div>

                    {/* Contenido */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Social proof */}
                      <SocialProofBadge projectId={project.id} />

                      {/* Nombre + inmobiliaria */}
                      <Link href={`/proyecto/${project.slug}`} className="mt-2 font-bold text-slate-900 text-[15px] leading-snug hover:text-primary-600 transition-colors line-clamp-1">{project.name}</Link>
                      <p className="text-xs text-slate-400 mt-0.5 mb-3 line-clamp-1">{project.developer.name}</p>

                      {/* Métricas: 3 pills */}
                      <div className="flex items-center gap-2 text-xs mb-4 flex-wrap">
                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                          {project.lotSizeMin}–{project.lotSizeMax} m²
                        </span>
                        <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                          <IconTrending /> +{project.valorizationEstimate}%
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-500 px-2.5 py-1 rounded-full">
                          {project.totalLots} lotes
                        </span>
                      </div>

                      {/* Cuota */}
                      <p className="text-xs text-slate-500 mb-4">Cuota desde <span className="font-semibold text-emerald-600">{fmt(project.monthlyPaymentEst, project.slug)}/mes</span></p>

                      {/* Botones */}
                      <div className="flex items-center gap-2 mt-auto">
                        <Link
                          href={`/proyecto/${project.slug}`}
                          className="flex-1 flex items-center justify-center py-2.5 text-xs font-bold text-primary-600 border-2 border-primary-600 rounded-xl hover:bg-primary-600 hover:text-white transition-all duration-150"
                        >
                          Ver más
                        </Link>
                        <button
                          onClick={() => setContactSlug(project.slug)}
                          className="flex-1 flex items-center justify-center py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors shadow-sm"
                        >
                          Contactar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ═══ LIST VIEW ═══ */
              <div className="space-y-3">
                {results.map((project) => {
                  return (
                    <div key={project.id} className="card overflow-hidden bg-white transition-all duration-200">
                      <div className="flex flex-col sm:flex-row">
                        {/* Image */}
                        <div className="sm:w-52 md:w-60 h-44 sm:h-auto flex-shrink-0 relative overflow-hidden">
                          <Image src={project.imageUrl} alt={project.name} fill className="object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent sm:bg-gradient-to-r" />
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            {project.isExclusive && (
                              <span className="bg-gradient-to-r from-amber-500 to-amber-600 text-white text-2xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm flex items-center gap-1">
                                <svg className="w-2.5 h-2.5 fill-white" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                                Exclusivo
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 md:p-5 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="font-semibold text-slate-900 truncate">{project.name}</h3>
                              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                                <IconMapPin /> {project.zone}, {project.city}
                                <span className="mx-1 text-slate-300">·</span>
                                {project.developer.name}
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                              <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
                                project.safetyScore >= 80 ? 'bg-emerald-50 text-emerald-700' :
                                project.safetyScore >= 60 ? 'bg-amber-50 text-amber-700' :
                                'bg-red-50 text-red-700'
                              }`}>
                                <IconShield /> {project.safetyScore}
                              </div>
                              <span className={`text-2xs px-1.5 py-0.5 rounded font-medium ${getLegalStatusColor(project.legalStatus)}`}>
                                {getLegalStatusLabel(project.legalStatus)}
                              </span>
                            </div>
                          </div>

                          <p className="text-sm text-slate-500 mt-2 line-clamp-2 leading-relaxed">{project.shortDescription}</p>

                          {/* Social proof */}
                          <div className="mt-2">
                            <SocialProofBadge projectId={project.id} />
                          </div>

                          {/* Key metrics */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                            <div className="metric-box">
                              <p className="text-2xs text-slate-400 uppercase tracking-wider mb-0.5">Precio</p>
                              <p className="text-sm font-bold text-primary-600">{fmt(project.minPrice, project.slug)}</p>
                            </div>
                            <div className="metric-box">
                              <p className="text-2xs text-slate-400 uppercase tracking-wider mb-0.5">Área</p>
                              <p className="text-sm font-semibold text-slate-800">{project.lotSizeMin}–{project.lotSizeMax} m²</p>
                            </div>
                            <div className="metric-box">
                              <p className="text-2xs text-slate-400 uppercase tracking-wider mb-0.5">Cuota</p>
                              <p className="text-sm font-semibold text-emerald-600">{fmt(project.monthlyPaymentEst, project.slug)}/mes</p>
                            </div>
                            <div className="metric-box">
                              <p className="text-2xs text-slate-400 uppercase tracking-wider mb-0.5">Valorización</p>
                              <p className="text-sm font-semibold text-slate-800 flex items-center gap-1"><IconTrending /> +{project.valorizationEstimate}%</p>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-3">
                            <Link
                              href={`/proyecto/${project.slug}`}
                              className="btn-secondary text-xs px-4 py-1.5 flex items-center gap-1.5 font-semibold"
                            >
                              Ver más →
                            </Link>
                            <button
                              onClick={() => setContactSlug(project.slug)}
                              className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 px-4 py-1.5 rounded-xl shadow-sm transition-colors"
                            >
                              Contactar
                            </button>
                            <Link href={`/compare?ids=${project.id}`} className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 px-2 py-1.5 rounded-lg hover:bg-primary-50 transition-colors">
                              <IconPlus /> Comparar
                            </Link>
                            <Link href={`/simulator?price=${project.minPrice}&monthly=${project.monthlyPaymentEst}&term=${project.termMonthsEst}`} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 px-2 py-1.5 rounded-lg hover:bg-emerald-50 transition-colors">
                              <IconCalc /> Simular
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─ Derecha: Sidebar de anuncios ─ */}
          <aside className="hidden xl:block w-[240px] flex-shrink-0">
            <div className="sticky top-[120px] space-y-4">
              {showAdBanner && <AdBanner onClose={() => setShowAdBanner(false)} />}
              <AdBannerSecondary />
              {/* Quick stats */}
              <div className="card p-4 bg-white">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Resumen</h4>
                <div className="space-y-3">
                  {[
                    { label: 'Proyectos totales', value: results.length.toString() },
                    { label: 'Ciudades', value: cities.length.toString() },
                    ...(results.length > 0 ? [
                      { label: 'Precio más bajo', value: (() => { const cheapest = results.reduce((a, b) => a.minPrice < b.minPrice ? a : b); return fmt(cheapest.minPrice, cheapest.slug); })() },
                      { label: 'Mejor valorización', value: `+${Math.max(...results.map(p => p.valorizationEstimate))}%` },
                    ] : []),
                  ].map((stat) => (
                    <div key={stat.label} className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">{stat.label}</span>
                      <span className="text-sm font-semibold text-slate-800">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ═══ CONTACT MODAL ═══ */}
      {contactProject && (
        <ContactModal
          project={contactProject}
          onClose={() => setContactSlug(null)}
        />
      )}

      {/* ═══ FERIA REGISTRO MODAL ═══ */}
      {showFeriaModal && (
        <FeriaRegistroModal onClose={() => setShowFeriaModal(false)} />
      )}

      {/* ═══ DETAIL MODAL ═══ */}
      {modalProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setModalSlug(null)}
          />
          {/* Panel */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            {/* Header image */}
            <div className="relative h-48 sm:h-56 overflow-hidden rounded-t-2xl">
              <Image src={modalProject.imageUrl} alt={modalProject.name} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              {/* Close button */}
              <button
                onClick={() => setModalSlug(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
                aria-label="Cerrar"
              >
                <IconClose />
              </button>
              {/* Badges */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                {modalProject.isFeatured && (
                  <span className="badge-blue text-2xs uppercase tracking-wider">Destacado</span>
                )}
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm ${
                  modalProject.safetyScore >= 80 ? 'bg-emerald-500 text-white' :
                  modalProject.safetyScore >= 60 ? 'bg-amber-500 text-white' :
                  'bg-red-500 text-white'
                }`}>
                  <IconShield /> {modalProject.safetyScore}
                </span>
              </div>
              {/* Title overlay */}
              <div className="absolute bottom-4 left-5 right-5">
                <h2 className="text-xl sm:text-2xl font-bold text-white drop-shadow-md">{modalProject.name}</h2>
                <p className="text-sm text-white/80 flex items-center gap-1.5 mt-1 drop-shadow-sm">
                  <IconMapPin /> {modalProject.zone}, {modalProject.city}
                  <span className="mx-1 text-white/40">·</span>
                  {modalProject.developer.name}
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-7">
              {/* Price and key metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-primary-50 rounded-xl p-3.5 text-center">
                  <p className="text-2xs text-primary-400 uppercase tracking-wider font-semibold mb-0.5">Precio desde</p>
                  <p className="text-lg font-bold text-primary-600">{fmt(modalProject.minPrice, modalProject.slug)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3.5 text-center">
                  <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mb-0.5">Área</p>
                  <p className="text-base font-bold text-slate-800">{modalProject.lotSizeMin}–{modalProject.lotSizeMax} m²</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3.5 text-center">
                  <p className="text-2xs text-emerald-500 uppercase tracking-wider font-semibold mb-0.5">Cuota</p>
                  <p className="text-base font-bold text-emerald-600">{fmt(modalProject.monthlyPaymentEst, modalProject.slug)}/mes</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3.5 text-center">
                  <p className="text-2xs text-amber-500 uppercase tracking-wider font-semibold mb-0.5">Valorización</p>
                  <p className="text-base font-bold text-amber-600 flex items-center justify-center gap-1"><IconTrending /> +{modalProject.valorizationEstimate}%</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-slate-600 leading-relaxed mb-6">{modalProject.description || modalProject.shortDescription}</p>

              {/* Details grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                {/* General info */}
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-primary-500 rounded-full" />
                    Información general
                  </h4>
                  <dl className="space-y-2.5">
                    {[
                      ['Precio/m²', `${fmt(modalProject.priceM2Min, modalProject.slug)} – ${fmt(modalProject.priceM2Max, modalProject.slug)}`],
                      ['Total lotes', modalProject.totalLots.toString()],
                      ['Inicial mínima', fmt(modalProject.downPaymentMin, modalProject.slug)],
                      ['Plazo estimado', `${modalProject.termMonthsEst} meses`],
                      ['Acceso', getAccessLabel(modalProject.accessType)],
                      ['Dist. al centro', `${modalProject.distanceToCityCenterKm} km`],
                      ['Estado legal', getLegalStatusLabel(modalProject.legalStatus)],
                    ].map(([label, value]) => (
                      <div key={label as string} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="font-medium text-slate-800">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Services */}
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
                    <span className="w-1 h-4 bg-emerald-500 rounded-full" />
                    Servicios incluidos
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {Object.entries(modalProject.services).map(([key, val]) => (
                      <div key={key} className={`flex items-center gap-2.5 text-sm p-2 rounded-lg ${val ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                        {val ? <IconCheck /> : <IconX />}
                        <span className={val ? 'text-emerald-800 font-medium' : 'text-slate-400'}>{formatServiceName(key)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-5 border-t border-slate-100">
                <Link
                  href={`/compare?ids=${modalProject.id}`}
                  className="btn-primary flex items-center justify-center gap-2 text-sm px-5 py-2.5"
                >
                  <IconPlus /> Comparar proyecto
                </Link>
                <Link
                  href={`/simulator?price=${modalProject.minPrice}&monthly=${modalProject.monthlyPaymentEst}&term=${modalProject.termMonthsEst}`}
                  className="btn-secondary flex items-center justify-center gap-2 text-sm px-5 py-2.5"
                >
                  <IconCalc /> Simular inversión
                </Link>
                <a
                  href={modalProject.developer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium px-3 py-2.5 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <IconLink /> Web de {modalProject.developer.name}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CONTACT MODAL COMPONENT
═══════════════════════════════════════════════ */
import type { ProjectData } from '@/lib/projects-data';

function ContactModal({ project, onClose }: { project: ProjectData; onClose: () => void }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState(
    `Hola, encontré el proyecto ${project.name} en PerúInversión y me gustaría recibir más información.`
  );
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveContactSubmission({
      name: fullName,
      email,
      phone,
      message,
      projectName: project.name,
    });
    setSent(true);
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-4 p-5 border-b border-slate-100">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0">
            <Image src={project.imageUrl} alt={project.name} fill className="object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-slate-900 text-base leading-tight truncate">{project.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{project.developer.name}</p>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
              <IconMapPin /> {project.zone}, {project.city}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors flex-shrink-0"
            aria-label="Cerrar"
          >
            <IconClose />
          </button>
        </div>

        {sent ? (
          /* ── Éxito ── */
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            </div>
            <p className="font-bold text-slate-900 text-lg">¡Consulta enviada!</p>
            <p className="text-sm text-slate-500 mt-1">Un asesor se pondrá en contacto contigo pronto.</p>
          </div>
        ) : (
          /* ── Formulario ── */
          <form className="p-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nombre completo <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. María García"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Correo electrónico <span className="text-red-500">*</span></label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Celular <span className="text-red-500">*</span></label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+51 999 999 999"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mensaje</label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              Enviar consulta
            </button>

            <a
              href={`https://wa.me/51999999999?text=${encodeURIComponent(`Hola, encontré el proyecto ${project.name} en PerúInversión y me gustaría recibir más información. 📍 ${project.zone}, ${project.city}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Consultar por WhatsApp
            </a>

            <p className="text-center text-2xs text-slate-400">
              Al contactar aceptas nuestros{' '}
              <a href="/terminos" className="underline hover:text-slate-600">Términos y Condiciones</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50/60 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProjectCardSkeletonGrid count={6} />
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
