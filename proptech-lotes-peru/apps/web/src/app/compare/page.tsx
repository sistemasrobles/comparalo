'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, getLegalStatusLabel, getLegalStatusColor, getAccessLabel, type ProjectData } from '@/lib/projects-data';
import { useAdminProjects } from '@/lib/hooks/useAdminProjects';

/* ── SVG Icons ── */
const IconCheck = () => (<svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>);
const IconX = () => (<svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);
const IconCalc = () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" /></svg>);
const IconTrash = () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>);
const IconChart = () => (<svg className="w-16 h-16 text-slate-200" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>);
const IconSearch = () => (<svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>);

function BooleanCell({ value }: { value: boolean }) {
  return value ? <IconCheck /> : <IconX />;
}

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Reactivo: se actualiza automáticamente cuando el admin guarda cambios
  const allProjects = useAdminProjects();

  const selectedProjects = allProjects.filter((p) => selectedIds.includes(p.id));

  const toggleProject = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const filteredProjects = allProjects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.zone.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const rows: { label: string; getValue: (p: ProjectData) => React.ReactNode; group?: string }[] = [
    // Pricing
    { label: 'Precio desde', getValue: (p) => <span className="font-bold text-primary-600">{formatPrice(p.minPrice, p.currency ?? 'PEN')}</span>, group: 'Precios' },
    { label: 'Precio hasta', getValue: (p) => formatPrice(p.maxPrice, p.currency ?? 'PEN') },
    { label: 'Precio m² desde', getValue: (p) => formatPrice(p.priceM2Min, p.currency ?? 'PEN') },
    { label: 'Precio m² hasta', getValue: (p) => formatPrice(p.priceM2Max, p.currency ?? 'PEN') },
    // Area
    { label: 'Área mínima', getValue: (p) => `${p.lotSizeMin} m²`, group: 'Terreno' },
    { label: 'Área máxima', getValue: (p) => `${p.lotSizeMax} m²` },
    { label: 'Total lotes', getValue: (p) => p.totalLots.toString() },
    // Financing
    { label: 'Inicial mínima', getValue: (p) => formatPrice(p.downPaymentMin, p.currency ?? 'PEN'), group: 'Financiamiento' },
    { label: 'Cuota mensual', getValue: (p) => <span className="font-semibold text-emerald-600">{formatPrice(p.monthlyPaymentEst, p.currency ?? 'PEN')}/mes</span> },
    { label: 'Plazo', getValue: (p) => `${p.termMonthsEst} meses` },
    // Safety
    {
      label: 'Puntaje seguridad',
      getValue: (p) => (
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
            p.safetyScore >= 80 ? 'bg-emerald-100 text-emerald-700' :
            p.safetyScore >= 60 ? 'bg-amber-100 text-amber-700' :
            'bg-red-100 text-red-700'
          }`}>{p.safetyScore}</div>
          <span className="text-2xs text-slate-400">/ 100</span>
        </div>
      ),
      group: 'Seguridad',
    },
    {
      label: 'Estado legal',
      getValue: (p) => (
        <span className={`px-2 py-0.5 rounded text-2xs font-medium ${getLegalStatusColor(p.legalStatus)}`}>
          {getLegalStatusLabel(p.legalStatus)}
        </span>
      ),
    },
    // Location
    { label: 'Acceso', getValue: (p) => getAccessLabel(p.accessType), group: 'Ubicación' },
    { label: 'Dist. centro', getValue: (p) => `${p.distanceToCityCenterKm} km` },
    { label: 'Valorización est.', getValue: (p) => <span className="font-semibold text-primary-700">+{p.valorizationEstimate}%/año</span> },
    // Services
    { label: 'Agua', getValue: (p) => <BooleanCell value={p.services.agua} />, group: 'Servicios' },
    { label: 'Electricidad', getValue: (p) => <BooleanCell value={p.services.luz} /> },
    { label: 'Desagüe', getValue: (p) => <BooleanCell value={p.services.desague} /> },
    { label: 'Internet', getValue: (p) => <BooleanCell value={p.services.internet} /> },
    // Developer
    { label: 'Inmobiliaria', getValue: (p) => <span className="font-medium">{p.developer.name}</span>, group: 'Empresa' },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Comparar proyectos</h1>
        <p className="text-slate-500 mt-1">Selecciona entre 2 y 4 proyectos para una comparación detallada</p>
      </div>

      {/* Project selector */}
      <div className="card p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-slate-900 text-sm">Seleccionar proyectos</h2>
            <span className="text-2xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{selectedIds.length} / 4</span>
          </div>
          {selectedIds.length > 0 && (
            <button onClick={() => setSelectedIds([])} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors">
              <IconTrash /> Limpiar
            </button>
          )}
        </div>

        <div className="relative mb-4">
          <IconSearch />
          <input
            type="text"
            className="input-field pl-10"
            placeholder="Buscar por nombre, zona o ciudad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto scrollbar-thin pr-1">
          {filteredProjects.map((project) => {
            const isSelected = selectedIds.includes(project.id);
            const isDisabled = selectedIds.length >= 4 && !isSelected;
            return (
              <button
                key={project.id}
                onClick={() => toggleProject(project.id)}
                disabled={isDisabled}
                className={`text-left p-3 rounded-xl border transition-all duration-150 ${
                  isSelected
                    ? 'border-primary-400 bg-primary-50/60 ring-1 ring-primary-200'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                } ${isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-2.5">
                  <Image src={project.imageUrl} alt="" width={36} height={36} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-slate-900 truncate">{project.name}</p>
                    <p className="text-2xs text-slate-500">{project.zone}, {project.city}</p>
                  </div>
                  {isSelected && (
                    <div className="ml-auto flex-shrink-0 w-5 h-5 rounded-full bg-primary-600 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Comparison Table */}
      {selectedProjects.length >= 2 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-4 px-5 text-left font-medium text-slate-500 text-xs uppercase tracking-wider w-44 min-w-[170px] bg-slate-50/70 sticky left-0 z-10">
                    Característica
                  </th>
                  {selectedProjects.map((p) => (
                    <th key={p.id} className="py-4 px-5 text-left min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <Image src={p.imageUrl} alt={p.name} width={44} height={44} className="w-11 h-11 rounded-lg object-cover flex-shrink-0 ring-1 ring-slate-200" />
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm truncate">{p.name}</p>
                          <p className="text-2xs text-slate-500 font-normal">{p.zone}, {p.city}</p>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <>
                    {row.group && (
                      <tr key={`group-${row.group}`}>
                        <td colSpan={selectedProjects.length + 1} className="bg-slate-50/80 py-2 px-5">
                          <span className="text-2xs font-semibold text-slate-500 uppercase tracking-wider">{row.group}</span>
                        </td>
                      </tr>
                    )}
                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-5 text-slate-500 font-medium text-xs bg-white sticky left-0 z-10">{row.label}</td>
                      {selectedProjects.map((p) => (
                        <td key={p.id} className="py-2.5 px-5 text-slate-700">{row.getValue(p)}</td>
                      ))}
                    </tr>
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card p-16 text-center">
          <div className="flex justify-center mb-4"><IconChart /></div>
          <p className="text-slate-600 font-medium">
            {selectedProjects.length === 1
              ? 'Selecciona al menos 1 proyecto más para comparar'
              : 'Selecciona proyectos para comenzar la comparación'}
          </p>
          <p className="text-slate-400 text-sm mt-1">Elige entre 2 y 4 proyectos de la lista</p>
        </div>
      )}

      {/* Quick simulator links */}
      {selectedProjects.length >= 2 && (
        <div className="mt-5 flex flex-wrap gap-2 justify-center">
          {selectedProjects.map((p) => (
            <Link
              key={p.id}
              href={`/simulator?price=${p.minPrice}&monthly=${p.monthlyPaymentEst}&term=${p.termMonthsEst}&name=${encodeURIComponent(p.name)}`}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-2 rounded-lg transition-colors"
            >
              <IconCalc /> Simular: {p.name}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
