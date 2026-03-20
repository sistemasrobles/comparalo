'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { getLiveProjects, type ProjectData } from '@/lib/projects-data';
import { saveContactSubmission } from '@/lib/contact-store';

/* ── Tipos ── */
interface DeveloperCard {
  slug: string;
  name: string;
  website: string;
  projects: ProjectData[];
  cities: string[];
  totalLots: number;
  minPrice: number;
}

/* ── Helpers ── */
function buildDeveloperCards(): DeveloperCard[] {
  const projects = getLiveProjects();
  const map = new Map<string, DeveloperCard>();

  for (const p of projects) {
    const key = p.developer.slug || p.developer.name;
    if (!map.has(key)) {
      map.set(key, {
        slug: p.developer.slug,
        name: p.developer.name,
        website: p.developer.website || '',
        projects: [],
        cities: [],
        totalLots: 0,
        minPrice: Infinity,
      });
    }
    const card = map.get(key)!;
    card.projects.push(p);
    if (!card.cities.includes(p.city)) card.cities.push(p.city);
    card.totalLots += p.totalLots;
    if (p.minPrice < card.minPrice) card.minPrice = p.minPrice;
  }

  return [...map.values()].sort((a, b) => b.projects.length - a.projects.length);
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/* ── Paleta de colores para los avatares ── */
const AVATAR_COLORS = [
  ['#0098dc', '#005fa3'],
  ['#ff8c42', '#c7520b'],
  ['#10b981', '#065f46'],
  ['#8b5cf6', '#5b21b6'],
  ['#f59e0b', '#92400e'],
  ['#ef4444', '#991b1b'],
  ['#06b6d4', '#0e7490'],
  ['#ec4899', '#9d174d'],
];

function avatarColor(index: number) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

/* ── Ícono búsqueda ── */
const IconSearch = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
  </svg>
);

const IconLink = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
  </svg>
);

const IconBuilding = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
);

const IconMapPin = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);

const IconArrow = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);

/* ══════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════════ */
export default function InmobiliariasPage() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'proyectos' | 'nombre' | 'lotes'>('proyectos');
  const [showPublishModal, setShowPublishModal] = useState(false);

  const allCards = useMemo(() => buildDeveloperCards(), []);

  const filtered = useMemo(() => {
    let list = [...allCards];

    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(s) ||
          d.cities.some((c) => c.toLowerCase().includes(s)),
      );
    }

    list.sort((a, b) => {
      if (sortBy === 'proyectos') return b.projects.length - a.projects.length;
      if (sortBy === 'lotes') return b.totalLots - a.totalLots;
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [allCards, search, sortBy]);

  /* Letras del abecedario para filtro rápido */
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const filteredByLetter = useMemo(() => {
    if (!activeLetter) return filtered;
    return filtered.filter((d) => d.name.toUpperCase().startsWith(activeLetter));
  }, [filtered, activeLetter]);

  const displayList = filteredByLetter;

  return (
    <main className="min-h-screen bg-slate-50">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 text-white pt-14 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <IconBuilding />
              <span className="text-primary-200 text-sm font-medium uppercase tracking-wider">Directorio</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-3 leading-tight">
              Inmobiliarias
            </h1>
            <p className="text-primary-100 text-lg mb-8">
              Conoce todas las empresas desarrolladoras con proyectos activos en nuestra plataforma.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              <div>
                <p className="text-3xl font-bold">{allCards.length}</p>
                <p className="text-primary-200 text-sm">Inmobiliarias</p>
              </div>
              <div className="w-px bg-primary-400" />
              <div>
                <p className="text-3xl font-bold">{allCards.reduce((acc, d) => acc + d.projects.length, 0)}</p>
                <p className="text-primary-200 text-sm">Proyectos activos</p>
              </div>
              <div className="w-px bg-primary-400" />
              <div>
                <p className="text-3xl font-bold">{[...new Set(allCards.flatMap((d) => d.cities))].length}</p>
                <p className="text-primary-200 text-sm">Ciudades</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Filtros ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Buscar */}
          <div className="relative flex-1 max-w-sm">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <IconSearch />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setActiveLetter(null); }}
              placeholder="Buscar inmobiliaria o ciudad..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all bg-slate-50"
            />
          </div>

          {/* Ordenar */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500 hidden sm:block">Ordenar:</span>
            {(['proyectos', 'nombre', 'lotes'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setSortBy(opt)}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                  sortBy === opt
                    ? 'bg-primary-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {opt === 'proyectos' ? 'Proyectos' : opt === 'nombre' ? 'Nombre A–Z' : 'Lotes'}
              </button>
            ))}
          </div>
        </div>

        {/* Abecedario */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
          <div className="flex flex-wrap gap-0.5">
            <button
              onClick={() => setActiveLetter(null)}
              className={`px-2 py-0.5 text-xs font-semibold rounded transition-all ${
                activeLetter === null ? 'bg-primary-600 text-white' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Todas
            </button>
            {alphabet.map((letter) => {
              const hasItems = allCards.some((d) => d.name.toUpperCase().startsWith(letter));
              return (
                <button
                  key={letter}
                  onClick={() => hasItems && setActiveLetter(letter === activeLetter ? null : letter)}
                  className={`px-2 py-0.5 text-xs font-semibold rounded transition-all ${
                    activeLetter === letter
                      ? 'bg-primary-600 text-white'
                      : hasItems
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      : 'text-slate-300 cursor-default'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Grid de tarjetas ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {displayList.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-2xl font-semibold text-slate-400 mb-2">Sin resultados</p>
            <p className="text-slate-400 text-sm">Intenta con otro término de búsqueda.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-6">
              {displayList.length} {displayList.length === 1 ? 'inmobiliaria' : 'inmobiliarias'}
              {activeLetter ? ` con letra "${activeLetter}"` : search ? ` para "${search}"` : ' registradas'}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {displayList.map((dev, i) => {
                const [bg, bgDark] = avatarColor(i);
                const projectCount = dev.projects.length;

                return (
                  <div
                    key={dev.slug}
                    className="bg-white rounded-2xl border border-slate-100 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden group"
                  >
                    {/* Color band */}
                    <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${bg}, ${bgDark})` }} />

                    <div className="p-5 flex flex-col flex-1">
                      {/* Avatar + name */}
                      <div className="flex items-start gap-3 mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${bg}, ${bgDark})` }}
                        >
                          {initials(dev.name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 group-hover:text-primary-600 transition-colors">
                            {dev.name}
                          </h3>
                          {dev.website && (
                            <a
                              href={dev.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-primary-500 transition-colors mt-0.5"
                            >
                              <IconLink />
                              Sitio web
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Ciudades */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {dev.cities.slice(0, 3).map((city) => (
                          <span
                            key={city}
                            className="inline-flex items-center gap-0.5 text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium"
                          >
                            <IconMapPin />
                            {city}
                          </span>
                        ))}
                        {dev.cities.length > 3 && (
                          <span className="text-[11px] text-slate-400 px-1 self-center">
                            +{dev.cities.length - 3} más
                          </span>
                        )}
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 mb-4 mt-auto">
                        <div className="bg-slate-50 rounded-xl px-3 py-2 text-center">
                          <p className="text-lg font-bold text-slate-900">{projectCount}</p>
                          <p className="text-[11px] text-slate-500">{projectCount === 1 ? 'Proyecto' : 'Proyectos'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-xl px-3 py-2 text-center">
                          <p className="text-lg font-bold text-slate-900">{dev.totalLots.toLocaleString('es-PE')}</p>
                          <p className="text-[11px] text-slate-500">Unidades</p>
                        </div>
                      </div>

                      {/* Proyectos preview */}
                      <div className="space-y-1 mb-4">
                        {dev.projects.slice(0, 2).map((p) => (
                          <Link
                            key={p.slug}
                            href={`/proyecto/${p.slug}`}
                            className="flex items-center justify-between gap-2 text-xs text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg px-2 py-1.5 transition-all"
                          >
                            <span className="truncate font-medium">{p.name}</span>
                            <span className="text-slate-400 flex-shrink-0">{p.city}</span>
                          </Link>
                        ))}
                        {dev.projects.length > 2 && (
                          <p className="text-[11px] text-slate-400 px-2">
                            +{dev.projects.length - 2} proyecto{dev.projects.length - 2 !== 1 ? 's' : ''} más
                          </p>
                        )}
                      </div>

                      {/* CTA */}
                      <Link
                        href={`/search?developer=${encodeURIComponent(dev.name)}`}
                        className="mt-auto flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
                        style={{ background: `linear-gradient(90deg, ${bg}, ${bgDark})` }}
                      >
                        <span>Ver proyectos</span>
                        <IconArrow />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── CTA Final ── */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-500 py-16 mt-8">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">¿Tu empresa no aparece aquí?</h2>
          <p className="text-primary-100 mb-6">
            Publica tus proyectos en PerúInversión y llega a miles de compradores interesados cada mes.
          </p>
          <button
            onClick={() => setShowPublishModal(true)}
            className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold px-6 py-3 rounded-xl hover:bg-primary-50 transition-colors shadow-md"
          >
            Publicar mis proyectos
            <IconArrow />
          </button>
        </div>
      </section>

      {/* ── Modal: Publicar proyectos ── */}
      {showPublishModal && (
        <PublishModal onClose={() => setShowPublishModal(false)} />
      )}
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════
   MODAL: PUBLICAR PROYECTOS
══════════════════════════════════════════════════════════════ */
function PublishModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    company: '',
    fullName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    saveContactSubmission({
      projectSlug: '__publicar__',
      projectName: 'Solicitud: Publicar proyectos',
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      message: `Empresa: ${form.company}\n\n${form.message}`,
    });
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(onClose, 2500);
    }, 600);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-[fadeInScale_0.2s_ease]">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-700 to-primary-500 px-6 py-5 flex items-start justify-between">
          <div>
            <h2 className="text-white text-xl font-bold leading-tight">Publicar mis proyectos</h2>
            <p className="text-primary-100 text-sm mt-1">Te contactamos en menos de 24 horas</p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">¡Solicitud enviada!</h3>
              <p className="text-gray-500 text-sm">Un asesor se pondrá en contacto contigo pronto.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Empresa / Inmobiliaria *</label>
                  <input
                    name="company"
                    required
                    value={form.company}
                    onChange={handleChange}
                    placeholder="Nombre de tu empresa"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Nombre completo *</label>
                  <input
                    name="fullName"
                    required
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Teléfono / WhatsApp *</label>
                  <input
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+51 999 000 000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Correo electrónico *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="correo@tuempresa.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">¿Cuéntanos sobre tus proyectos?</label>
                  <textarea
                    name="message"
                    rows={3}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Ej: Tenemos 3 proyectos en Lima y Piura, lotes desde 90 m²..."
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                )}
                {loading ? 'Enviando...' : 'Enviar solicitud'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
