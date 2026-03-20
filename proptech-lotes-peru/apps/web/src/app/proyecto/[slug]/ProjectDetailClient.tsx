'use client';

import { formatPrice, getLegalStatusLabel, getLegalStatusColor, getAccessLabel } from '@/lib/projects-data';
import { useAdminProject, useAdminProjects } from '@/lib/hooks/useAdminProjects';
import type { ProjectData } from '@/lib/projects-data';
import Link from 'next/link';
import Image from 'next/image';
import ReservarButton from '@/components/ReservarButton';
import { useEffect } from 'react';
import { saveRecentlyViewed } from '@/lib/recently-viewed-store';

/* ── SVG Icons ── */
const IconCheck = () => (<svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>);
const IconX = () => (<svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconMapPin = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>);
const IconShield = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>);
const IconTrending = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>);
const IconLink = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>);
const IconWhatsApp = () => (<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>);

function formatServiceName(key: string): string {
  const map: Record<string, string> = {
    electricity: 'Electricidad', water: 'Agua', sewage: 'Desagüe', internet: 'Internet',
    pavedRoads: 'Pistas asfaltadas', greenAreas: 'Áreas verdes', security24h: 'Vigilancia 24h',
    clubhouse: 'Casa club', playground: 'Juegos infantiles', sportsCourt: 'Cancha deportiva',
    agua: 'Agua', luz: 'Electricidad', desague: 'Desagüe', seguridad: 'Seguridad 24h',
    areasVerdes: 'Áreas verdes', pistaAsfaltada: 'Pista asfaltada', canalDeRiego: 'Canal de riego',
    cabanas: 'Cabañas', lagunaArtificial: 'Laguna artificial', zonaCamping: 'Zona camping',
    centroComercial: 'Centro comercial', parqueIndustrial: 'Parque industrial',
  };
  return map[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
}

export default function ProjectDetailClient({ slug, serverProject }: { slug: string; serverProject: ProjectData }) {
  // Start with serverProject (SSR-safe, no hydration mismatch).
  // useAdminProject reacts to storage + focus events so any admin change propagates.
  const liveProject = useAdminProject(slug);
  const project = liveProject ?? serverProject;

  const currency = project.currency ?? 'PEN';
  const fmt = (price: number) => formatPrice(price, currency);

  const allProjects = useAdminProjects();
  const relatedProjects = allProjects.filter((p) => p.city === project.city && p.slug !== project.slug).slice(0, 3);

  // views30d viene siempre del dato estático (serverProject) porque el override del admin no lo incluye
  const views30d = serverProject.views30d ?? project.views30d ?? 0;

  const scoreColor = project.safetyScore >= 80 ? 'text-emerald-600 bg-emerald-50' : project.safetyScore >= 60 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';

  // ── Trackear visita para "No lo dejes ir" ──
  useEffect(() => {
    saveRecentlyViewed({
      slug: project.slug,
      name: project.name,
      city: project.city,
      zone: project.zone,
      imageUrl: project.imageUrl,
      minPrice: project.minPrice,
      currency: project.currency ?? 'PEN',
      category: project.category,
    });
  // Solo al montar (cuando cambia el slug)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.slug]);

  return (
    <div className="min-h-screen bg-slate-50/60">
      {/* Hero image */}
      <div className="relative h-64 sm:h-80 md:h-96 overflow-hidden">
        <Image src={project.imageUrl} alt={project.name} fill className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        {/* Breadcrumb on image */}
        <div className="absolute top-4 left-0 right-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 text-xs text-white/70">
              <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
              <span>/</span>
              <Link href="/search" className="hover:text-white transition-colors">Proyectos</Link>
              <span>/</span>
              <span className="text-white font-medium">{project.name}</span>
            </nav>
          </div>
        </div>
        {/* Title overlay */}
        <div className="absolute bottom-6 left-0 right-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  {project.isExclusive && (
                    <span className="bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900 text-2xs font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                      Exclusivo
                    </span>
                  )}
                  {project.isFeatured && (
                    <span className="bg-amber-400 text-amber-900 text-2xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">Destacado</span>
                  )}
                  <span className={`text-2xs px-2 py-0.5 rounded-md font-bold ${getLegalStatusColor(project.legalStatus)}`}>
                    {getLegalStatusLabel(project.legalStatus)}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-md">{project.name}</h1>
                <p className="text-sm text-white/80 flex items-center gap-1.5 mt-2">
                  <IconMapPin /> {project.zone}, {project.city}, {project.region}
                  <span className="mx-1 text-white/40">·</span>
                  {project.developer.name}
                </p>
              </div>
              <div className={`hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl ${scoreColor} font-bold text-lg`}>
                <IconShield /> {project.safetyScore}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="card p-4 text-center bg-white">
                <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold">Precio desde</p>
                <p className="text-xl font-bold text-primary-600 mt-1">{fmt(project.minPrice)}</p>
              </div>
              <div className="card p-4 text-center bg-white">
                <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold">Área</p>
                <p className="text-lg font-bold text-slate-800 mt-1">{project.lotSizeMin}–{project.lotSizeMax} m²</p>
              </div>
              <div className="card p-4 text-center bg-white">
                <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold">Cuota desde</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">{fmt(project.monthlyPaymentEst)}/mes</p>
              </div>
              <div className="card p-4 text-center bg-white">
                <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold">Valorización</p>
                <p className="text-lg font-bold text-amber-600 mt-1 flex items-center justify-center gap-1"><IconTrending /> +{project.valorizationEstimate}%</p>
              </div>
            </div>

            {/* Social proof — visitas hoy */}
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 px-4 py-3 rounded-xl">
              <span className="flex h-2.5 w-2.5 relative flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
              <span className="text-sm font-medium text-orange-700">+{3 + Math.abs(project.name.length * 7 + project.totalLots) % 10} personas visitaron este proyecto hoy</span>
            </div>

            {/* Description */}
            <div className="card p-6 bg-white">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">Sobre el proyecto</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
            </div>

            {/* General info table */}
            <div className="card p-6 bg-white">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Información general</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                {[
                  ['Precio/m²', `${fmt(project.priceM2Min)} – ${fmt(project.priceM2Max)}`],
                  ['Total lotes', project.totalLots.toString()],
                  ['Inicial mínima', fmt(project.downPaymentMin)],
                  ['Plazo estimado', `${project.termMonthsEst} meses`],
                  ['Tipo de acceso', getAccessLabel(project.accessType)],
                  ['Dist. al centro', `${project.distanceToCityCenterKm} km`],
                  ['Estado legal', getLegalStatusLabel(project.legalStatus)],
                  ['Puntaje seguridad', `${project.safetyScore}/100`],
                ].map(([label, value]) => (
                  <div key={label as string} className="flex justify-between items-center text-sm py-2 border-b border-slate-100">
                    <span className="text-slate-500">{label}</span>
                    <span className="font-medium text-slate-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Services */}
            <div className="card p-6 bg-white">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Servicios y amenidades</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(project.services).map(([key, val]) => (
                  <div key={key} className={`flex items-center gap-2.5 text-sm p-2.5 rounded-lg ${val ? 'bg-emerald-50' : 'bg-slate-50'}`}>
                    {val ? <IconCheck /> : <IconX />}
                    <span className={val ? 'text-emerald-800 font-medium' : 'text-slate-400'}>{formatServiceName(key)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map placeholder */}
            <div className="card overflow-hidden bg-white">
              <h2 className="text-lg font-semibold text-slate-900 p-6 pb-3">Ubicación</h2>
              <div className="relative h-64 bg-slate-100 flex items-center justify-center">
                <div className="text-center">
                  <IconMapPin />
                  <p className="text-sm text-slate-500 mt-2">{project.addressText}</p>
                  <p className="text-xs text-slate-400 mt-1">{project.lat.toFixed(4)}, {project.lng.toFixed(4)}</p>
                  <a
                    href={`https://www.google.com/maps?q=${project.lat},${project.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium"
                  >
                    <IconLink /> Ver en Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-6 bg-white sticky top-20">
              <div className="text-center mb-5">
                <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Precio desde</p>
                <p className="text-3xl font-bold text-primary-600">{fmt(project.minPrice)}</p>
                <p className="text-sm text-slate-500 mt-1">Cuota desde {fmt(project.monthlyPaymentEst)}/mes</p>
              </div>

              <div className="space-y-2.5">
                <ReservarButton projectSlug={project.slug} />
                <p className="text-center text-2xs text-slate-400">Reserva 100% online · Confirmación en 24h</p>
                <Link
                  href={`/calcular?precio=${project.minPrice}&inicial=${project.downPaymentMin}&plazo=${project.termMonthsEst}`}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" /></svg>
                  Calcular mi cuota
                </Link>
                <Link
                  href={`/compare?ids=${project.id}`}
                  className="btn-secondary w-full flex items-center justify-center gap-2 py-3 text-sm"
                >
                  Comparar con otros
                </Link>
                <Link
                  href={`/simulator?price=${project.minPrice}&monthly=${project.monthlyPaymentEst}&term=${project.termMonthsEst}`}
                  className="btn-secondary w-full flex items-center justify-center gap-2 py-3 text-sm"
                >
                  Simular inversión
                </Link>
                <a
                  href={`https://wa.me/51999999999?text=Hola, me interesa el proyecto ${project.name} en ${project.city}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors"
                >
                  <IconWhatsApp /> Consultar por WhatsApp
                </a>
              </div>

              {/* Developer info */}
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-2">Desarrollador</p>
                <p className="text-sm font-semibold text-slate-900">{project.developer.name}</p>
                <a
                  href={project.developer.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  <IconLink /> Visitar sitio web
                </a>
                {views30d > 0 && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                    <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs text-slate-500">
                      Proyecto con <span className="font-semibold text-slate-700">{views30d.toLocaleString()}</span> visualizaciones en los últimos 30 días
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Related projects */}
        {relatedProjects.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Otros proyectos en {project.city}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedProjects.map((p) => {
                // relatedProjects already comes from allProjects (admin-store), so p is fully up-to-date
                const fmtP = (price: number) => formatPrice(price, p.currency ?? 'PEN');
                return (
                  <Link key={p.slug} href={`/proyecto/${p.slug}`} className="card-interactive group overflow-hidden bg-white">
                    <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-sm text-slate-900 group-hover:text-primary-600 transition-colors">{p.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{p.developer.name}</p>
                      <div className="flex items-baseline justify-between mt-2">
                        <span className="text-sm font-bold text-primary-600">{fmtP(p.minPrice)}</span>
                        <span className="text-xs text-slate-400">{p.lotSizeMin}–{p.lotSizeMax} m²</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
