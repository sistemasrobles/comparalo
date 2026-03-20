'use client';

import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PROJECTS, formatPrice, type ProjectData } from '@/lib/projects-data';

/* ── SVG Icons ── */
const IconReceipt = () => (<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>);
const IconWallet = () => (<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110 6h3.75A2.25 2.25 0 0021 13.5V12zm0 0V9.75a2.25 2.25 0 00-2.25-2.25h-13.5A2.25 2.25 0 003 9.75v10.5A2.25 2.25 0 005.25 22.5h13.5A2.25 2.25 0 0021 20.25V12z" /></svg>);
const IconTrending = () => (<svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>);
const IconArrow = () => (<svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>);
const IconMapPin = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>);

/* ── CTA Button to view project ── */
function ProjectCTA({ project, label }: { project: ProjectData | undefined; label?: string }) {
  if (!project) return null;
  return (
    <Link
      href={`/search?highlight=${project.slug}`}
      className="flex items-center justify-center gap-2.5 w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-red-600/25 hover:shadow-red-600/35 transition-all duration-200 text-sm group mt-4"
    >
      <IconMapPin />
      {label || `Ver proyecto: ${project.name}`}
      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
    </Link>
  );
}

function SimulatorContent() {
  const searchParams = useSearchParams();
  const initialPrice = searchParams.get('price') || '';
  const initialTerm = searchParams.get('term') || '';
  const projectName = searchParams.get('name') || '';

  const [activeTab, setActiveTab] = useState<'cuotas' | 'capacidad' | 'valorizacion'>('cuotas');

  // Tab 1: Simulador de cuotas
  const [cuotas, setCuotas] = useState({
    projectId: '', price: initialPrice, downPayment: '', termMonths: initialTerm || '48',
  });

  // Tab 2: Capacidad de pago
  const [capacidad, setCapacidad] = useState({
    monthlyIncome: '', monthlyExpenses: '', downPayment: '',
  });

  // Tab 3: Valorización
  const [valorizacion, setValorizacion] = useState({
    currentPrice: initialPrice, annualRate: '12', years: '5',
  });
  const [selectedValProject, setSelectedValProject] = useState<string>('');

  /* ── CÁLCULOS ── */
  const cuotasResult = useMemo(() => {
    const price = parseFloat(cuotas.price);
    const dp = parseFloat(cuotas.downPayment) || 0;
    const term = parseInt(cuotas.termMonths) || 48;
    if (!price || price <= 0) return null;
    const remaining = price - dp;
    if (remaining <= 0) return { monthly: 0, total: dp, remaining: 0, term };
    return { monthly: Math.ceil(remaining / term), total: price, remaining, term };
  }, [cuotas]);

  const capacidadResult = useMemo(() => {
    const income = parseFloat(capacidad.monthlyIncome);
    const expenses = parseFloat(capacidad.monthlyExpenses);
    const dp = parseFloat(capacidad.downPayment) || 0;
    if (!income || !expenses) return null;
    const available = income - expenses;
    const maxMonthly = available * 0.35;
    const maxPrice36 = dp + maxMonthly * 36;
    const maxPrice48 = dp + maxMonthly * 48;
    const maxPrice84 = dp + maxMonthly * 84;
    const score = maxMonthly >= 1500 ? 90 : maxMonthly >= 800 ? 70 : maxMonthly >= 400 ? 50 : 30;
    const affordable = PROJECTS.filter((p) => p.minPrice <= maxPrice48);
    return { available, maxMonthly, maxPrice36, maxPrice48, maxPrice84, score, affordable };
  }, [capacidad]);

  const valorizacionResult = useMemo(() => {
    const price = parseFloat(valorizacion.currentPrice);
    const rate = parseFloat(valorizacion.annualRate) / 100;
    const years = parseInt(valorizacion.years);
    if (!price || !rate || !years) return null;
    const projections = [];
    for (let i = 1; i <= years; i++) {
      const value = price * Math.pow(1 + rate, i);
      projections.push({ year: i, value: Math.round(value), gain: Math.round(value - price) });
    }
    return projections;
  }, [valorizacion]);

  // Get the active project for each tab
  const cuotasProject = PROJECTS.find((p) => p.id === cuotas.projectId);
  const valProject = PROJECTS.find((p) => p.id === selectedValProject);

  const handleSelectProject = (id: string) => {
    const project = PROJECTS.find((p) => p.id === id);
    if (project) {
      setCuotas({
        projectId: id,
        price: project.minPrice.toString(),
        downPayment: project.downPaymentMin.toString(),
        termMonths: project.termMonthsEst.toString(),
      });
    }
  };

  const handleSelectValProject = (p: typeof PROJECTS[0]) => {
    setSelectedValProject(p.id);
    setValorizacion({
      ...valorizacion,
      currentPrice: p.minPrice.toString(),
      annualRate: p.valorizationEstimate.toString(),
    });
  };

  const tabs = [
    { key: 'cuotas' as const, icon: <IconReceipt />, label: 'Cuotas' },
    { key: 'capacidad' as const, icon: <IconWallet />, label: 'Capacidad' },
    { key: 'valorizacion' as const, icon: <IconTrending />, label: 'Valorización' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Simulador de inversión</h1>
        <p className="text-slate-500 mt-1 max-w-xl mx-auto">
          Calcula cuotas, verifica tu capacidad de pago y proyecta la valorización
        </p>
        {projectName && (
          <p className="text-sm text-primary-600 font-medium mt-2 bg-primary-50 inline-block px-3 py-1 rounded-full">
            Simulando: {projectName}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 rounded-xl p-1 mb-8 max-w-md mx-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ═══ TAB: CUOTAS ═══ */}
      {activeTab === 'cuotas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-slate-900 text-sm">Datos del terreno</h2>

            <div>
              <label className="form-label">Seleccionar proyecto</label>
              <select className="select-field" value={cuotas.projectId} onChange={(e) => handleSelectProject(e.target.value)}>
                <option value="">Elegir proyecto...</option>
                {PROJECTS.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — {p.city} ({formatPrice(p.minPrice)})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Precio del terreno (S/)</label>
              <input type="number" className="input-field" placeholder="50000" value={cuotas.price} onChange={(e) => setCuotas({ ...cuotas, price: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Cuota inicial (S/)</label>
              <input type="number" className="input-field" placeholder="5000" value={cuotas.downPayment} onChange={(e) => setCuotas({ ...cuotas, downPayment: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Plazo (meses)</label>
              <select className="select-field" value={cuotas.termMonths} onChange={(e) => setCuotas({ ...cuotas, termMonths: e.target.value })}>
                {[12, 24, 36, 48, 60, 84].map((m) => (
                  <option key={m} value={m}>{m} meses</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            {cuotasResult ? (
              <div className="card p-5 space-y-5 animate-fade-in">
                <h2 className="font-semibold text-slate-900 text-sm">Resultado</h2>
                <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Tu cuota mensual</p>
                  <p className="text-4xl font-bold text-primary-600">{formatPrice(cuotasResult.monthly)}</p>
                  <p className="text-sm text-slate-500 mt-1">por {cuotasResult.term} meses</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="metric-box text-center">
                    <p className="text-2xs text-slate-400 uppercase tracking-wider">Precio total</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{formatPrice(cuotasResult.total)}</p>
                  </div>
                  <div className="metric-box text-center">
                    <p className="text-2xs text-slate-400 uppercase tracking-wider">A financiar</p>
                    <p className="text-lg font-bold text-slate-900 mt-0.5">{formatPrice(cuotasResult.remaining)}</p>
                  </div>
                </div>
                <p className="text-2xs text-slate-400 text-center leading-relaxed">
                  * Cálculo referencial. El financiamiento directo no cobra intereses en la mayoría de proyectos.
                </p>

                {/* CTA: go to project */}
                <ProjectCTA project={cuotasProject} />

                {!cuotasProject && (
                  <Link
                    href="/search"
                    className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-red-600/25 hover:shadow-red-600/35 transition-all duration-200 text-sm group"
                  >
                    <IconMapPin />
                    Buscar proyectos en este rango
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </Link>
                )}
              </div>
            ) : (
              <div className="card p-14 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <IconReceipt />
                </div>
                <p className="text-slate-500 text-sm">Ingresa el precio del terreno para calcular tus cuotas</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: CAPACIDAD ═══ */}
      {activeTab === 'capacidad' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-slate-900 text-sm">Datos financieros</h2>
            <div>
              <label className="form-label">Ingreso mensual (S/)</label>
              <input type="number" className="input-field" placeholder="5000" value={capacidad.monthlyIncome} onChange={(e) => setCapacidad({ ...capacidad, monthlyIncome: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Gastos mensuales (S/)</label>
              <input type="number" className="input-field" placeholder="2500" value={capacidad.monthlyExpenses} onChange={(e) => setCapacidad({ ...capacidad, monthlyExpenses: e.target.value })} />
            </div>
            <div>
              <label className="form-label">Ahorro para inicial (S/)</label>
              <input type="number" className="input-field" placeholder="10000" value={capacidad.downPayment} onChange={(e) => setCapacidad({ ...capacidad, downPayment: e.target.value })} />
            </div>
          </div>

          <div>
            {capacidadResult ? (
              <div className="card p-5 space-y-5 animate-fade-in">
                <h2 className="font-semibold text-slate-900 text-sm">Tu capacidad de pago</h2>

                <div className="text-center p-6 bg-gradient-to-br from-primary-50 to-primary-100/50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Cuota máxima</p>
                  <p className="text-3xl font-bold text-primary-600">{formatPrice(Math.round(capacidadResult.maxMonthly))}</p>
                  <p className="text-xs text-slate-400 mt-1">35% de tu ingreso disponible</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: '36 meses', value: capacidadResult.maxPrice36, highlight: false },
                    { label: '48 meses', value: capacidadResult.maxPrice48, highlight: true },
                    { label: '84 meses', value: capacidadResult.maxPrice84, highlight: false },
                  ].map((item) => (
                    <div key={item.label} className={`p-3 rounded-xl text-center ${item.highlight ? 'bg-primary-50 ring-1 ring-primary-200' : 'bg-slate-50'}`}>
                      <p className="text-2xs text-slate-500">{item.label}</p>
                      <p className={`text-base font-bold mt-0.5 ${item.highlight ? 'text-primary-700' : 'text-slate-900'}`}>{formatPrice(Math.round(item.value))}</p>
                    </div>
                  ))}
                </div>

                {/* Score */}
                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-base ${
                    capacidadResult.score >= 70 ? 'bg-emerald-500' : capacidadResult.score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}>
                    {capacidadResult.score}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {capacidadResult.score >= 70 ? 'Buen perfil financiero' : capacidadResult.score >= 50 ? 'Perfil moderado' : 'Perfil ajustado'}
                    </p>
                    <p className="text-2xs text-slate-500">
                      {capacidadResult.score >= 70 ? 'Puedes acceder a la mayoría de proyectos' : 'Considera opciones con menor precio inicial'}
                    </p>
                  </div>
                </div>

                {/* Affordable projects */}
                {capacidadResult.affordable.length > 0 && (
                  <div>
                    <h3 className="font-medium text-slate-900 text-sm mb-2">Proyectos a tu alcance ({capacidadResult.affordable.length})</h3>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-thin">
                      {capacidadResult.affordable.map((p) => (
                        <Link key={p.id} href={`/search?highlight=${p.slug}`} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 border border-slate-150 transition-colors group">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900 group-hover:text-primary-600 truncate">{p.name}</p>
                            <p className="text-2xs text-slate-500">{p.city} · {p.developer.name}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            <span className="text-sm font-semibold text-primary-600">{formatPrice(p.minPrice)}</span>
                            <IconArrow />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA */}
                <Link
                  href="/search"
                  className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-red-600/25 hover:shadow-red-600/35 transition-all duration-200 text-sm group"
                >
                  <IconMapPin />
                  Ver todos los proyectos disponibles
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </Link>
              </div>
            ) : (
              <div className="card p-14 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <IconWallet />
                </div>
                <p className="text-slate-500 text-sm">Ingresa tus datos financieros para conocer tu capacidad de compra</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ═══ TAB: VALORIZACIÓN ═══ */}
      {activeTab === 'valorizacion' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-slate-900 text-sm">Proyección de valorización</h2>
            <div>
              <label className="form-label">Precio actual (S/)</label>
              <input type="number" className="input-field" placeholder="50000" value={valorizacion.currentPrice} onChange={(e) => { setValorizacion({ ...valorizacion, currentPrice: e.target.value }); setSelectedValProject(''); }} />
            </div>
            <div>
              <label className="form-label">Valorización anual (%)</label>
              <select className="select-field" value={valorizacion.annualRate} onChange={(e) => setValorizacion({ ...valorizacion, annualRate: e.target.value })}>
                <option value="5">5% — Conservador</option>
                <option value="8">8% — Moderado</option>
                <option value="10">10% — Optimista</option>
                <option value="12">12% — Costa/selva emergente</option>
                <option value="15">15% — Alto potencial</option>
                <option value="18">18% — Zona premium</option>
              </select>
            </div>
            <div>
              <label className="form-label">Horizonte de inversión</label>
              <select className="select-field" value={valorizacion.years} onChange={(e) => setValorizacion({ ...valorizacion, years: e.target.value })}>
                {[1, 3, 5, 10].map((y) => (
                  <option key={y} value={y}>{y} año{y > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            {/* Quick project buttons — with active state */}
            <div>
              <p className="form-label">Proyectar con proyecto real</p>
              <div className="flex flex-wrap gap-1.5">
                {PROJECTS.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleSelectValProject(p)}
                    className={`text-2xs px-2.5 py-1.5 rounded-lg border font-medium transition-all duration-150 ${
                      selectedValProject === p.id
                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                        : 'border-slate-200 text-slate-600 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            {valorizacionResult ? (
              <div className="card p-5 space-y-5 animate-fade-in">
                <h2 className="font-semibold text-slate-900 text-sm">
                  Proyección
                  {valProject && <span className="text-primary-600"> — {valProject.name}</span>}
                </h2>

                <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-xl">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                    Valor en {valorizacion.years} año{parseInt(valorizacion.years) > 1 ? 's' : ''}
                  </p>
                  <p className="text-4xl font-bold text-emerald-600">
                    {formatPrice(valorizacionResult[valorizacionResult.length - 1].value)}
                  </p>
                  <p className="text-sm text-emerald-700 font-medium mt-1">
                    +{formatPrice(valorizacionResult[valorizacionResult.length - 1].gain)} de ganancia
                  </p>
                </div>

                {/* Year by year */}
                <div className="space-y-2">
                  {valorizacionResult.map((row) => {
                    const pct = valorizacion.currentPrice ? ((row.gain / parseFloat(valorizacion.currentPrice)) * 100).toFixed(0) : 0;
                    return (
                      <div key={row.year} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                        <span className="text-2xs font-bold text-slate-400 w-10">Año {row.year}</span>
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (row.value / valorizacionResult[valorizacionResult.length - 1].value) * 100)}%` }}
                          />
                        </div>
                        <div className="text-right min-w-[100px]">
                          <p className="text-sm font-semibold text-slate-900">{formatPrice(row.value)}</p>
                          <p className="text-2xs text-emerald-600 font-medium">+{pct}%</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-2xs text-slate-400 text-center leading-relaxed">
                  * Proyección basada en tendencias históricas del mercado. No garantiza rentabilidad futura.
                </p>

                {/* CTA: go to specific project or search */}
                <ProjectCTA project={valProject} />

                {!valProject && (
                  <Link
                    href="/search"
                    className="flex items-center justify-center gap-2 w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-red-600/25 hover:shadow-red-600/35 transition-all duration-200 text-sm group"
                  >
                    <IconMapPin />
                    Buscar proyectos disponibles
                    <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                  </Link>
                )}
              </div>
            ) : (
              <div className="card p-14 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <IconTrending />
                </div>
                <p className="text-slate-500 text-sm">Ingresa el precio actual para ver la proyección</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SimulatorPage() {
  return (
    <Suspense fallback={<div className="max-w-5xl mx-auto px-4 py-16 text-center text-slate-400">Cargando...</div>}>
      <SimulatorContent />
    </Suspense>
  );
}
