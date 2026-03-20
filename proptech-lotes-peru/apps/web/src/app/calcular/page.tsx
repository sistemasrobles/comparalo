'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/projects-data';
import { useAdminProjects } from '@/lib/hooks/useAdminProjects';

export default function CalcularCuotaPage() {
  const [precio, setPrecio] = useState('');
  const [inicial, setInicial] = useState('');
  const [plazo, setPlazo] = useState('36');
  const [tasa, setTasa] = useState('12');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<'PEN' | 'USD'>('PEN');

  const allProjects = useAdminProjects();

  const fmt = (amount: number) => formatPrice(amount, selectedCurrency);

  // When a project is selected, prefill
  const handleProjectSelect = (slug: string) => {
    setSelectedProject(slug);
    if (slug) {
      const p = allProjects.find((pr) => pr.slug === slug);
      if (p) {
        setPrecio(p.minPrice.toString());
        setInicial(p.downPaymentMin.toString());
        setPlazo(p.termMonthsEst.toString());
        setSelectedCurrency(p.currency ?? 'PEN');
      }
    } else {
      setSelectedCurrency('PEN');
    }
  };

  const result = useMemo(() => {
    const p = Number(precio);
    const i = Number(inicial);
    const m = Number(plazo);
    const t = Number(tasa);
    if (!p || p <= 0 || m <= 0) return null;

    const financiado = Math.max(p - (i || 0), 0);
    if (financiado <= 0) return null;

    const tasaMensual = t / 100 / 12;
    let cuota: number;
    if (tasaMensual === 0) {
      cuota = financiado / m;
    } else {
      cuota = (financiado * tasaMensual * Math.pow(1 + tasaMensual, m)) / (Math.pow(1 + tasaMensual, m) - 1);
    }

    const totalPagar = cuota * m;
    const intereses = totalPagar - financiado;

    return { financiado, cuota, totalPagar, intereses, tasaMensual };
  }, [precio, inicial, plazo, tasa]);

  return (
    <div className="min-h-screen bg-slate-50/60">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-400">
            <Link href="/" className="hover:text-primary-600 transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-slate-700 font-medium">Calcular cuota</span>
          </nav>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Calculadora de cuota mensual</h1>
          <p className="text-slate-500 mt-2">Ingresa los datos de tu terreno y calcula cuánto pagarías por mes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3 card p-6 bg-white">
            {/* Quick project selector */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cargar datos de un proyecto</label>
              <select
                value={selectedProject}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none transition-all"
              >
                <option value="">Ingresar manualmente</option>
                {allProjects.map((p) => (
                  <option key={p.slug} value={p.slug}>{p.name} — {formatPrice(p.minPrice, p.currency ?? 'PEN')}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Precio del terreno (S/)</label>
                <input
                  type="number"
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="Ej: 25000"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cuota inicial (S/)</label>
                <input
                  type="number"
                  value={inicial}
                  onChange={(e) => setInicial(e.target.value)}
                  placeholder="Ej: 3000"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Plazo (meses)</label>
                <select
                  value={plazo}
                  onChange={(e) => setPlazo(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none transition-all"
                >
                  {[6, 12, 18, 24, 36, 48, 60, 72, 84, 96, 120].map((m) => (
                    <option key={m} value={m}>{m} meses ({(m / 12).toFixed(1)} años)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Tasa anual (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={tasa}
                  onChange={(e) => setTasa(e.target.value)}
                  placeholder="Ej: 12"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 focus:bg-white focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none transition-all"
                />
                <p className="text-2xs text-slate-400 mt-1">0 para financiamiento directo sin intereses</p>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="lg:col-span-2">
            {result ? (
              <div className="card overflow-hidden bg-white">
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 p-6 text-center text-white">
                  <p className="text-xs font-semibold text-primary-200 uppercase tracking-wider mb-1">Tu cuota mensual</p>
                  <p className="text-4xl font-bold">{fmt(Math.round(result.cuota))}</p>
                  <p className="text-sm text-primary-200 mt-1">por mes</p>
                </div>
                <div className="p-5 space-y-3">
                  {[
                    { label: 'Precio total', value: fmt(Number(precio)) },
                    { label: 'Cuota inicial', value: fmt(Number(inicial) || 0) },
                    { label: 'Monto a financiar', value: fmt(result.financiado) },
                    { label: 'Plazo', value: `${plazo} meses` },
                    { label: 'Tasa anual', value: `${tasa}%` },
                    { label: 'Total intereses', value: fmt(Math.round(result.intereses)), color: result.intereses > 0 ? 'text-amber-600' : 'text-emerald-600' },
                    { label: 'Total a pagar', value: fmt(Math.round(result.totalPagar)), bold: true },
                  ].map((row) => (
                    <div key={row.label} className={`flex justify-between items-center text-sm ${row.bold ? 'pt-3 border-t border-slate-100 font-semibold' : ''}`}>
                      <span className="text-slate-500">{row.label}</span>
                      <span className={`font-medium ${row.color || (row.bold ? 'text-slate-900 text-base' : 'text-slate-800')}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="p-5 pt-0">
                  <Link href="/search" className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
                    Buscar terrenos en este rango
                  </Link>
                </div>
              </div>
            ) : (
              <div className="card p-8 text-center bg-white">
                <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" /></svg>
                </div>
                <p className="text-sm text-slate-500">Ingresa el precio y plazo para calcular tu cuota mensual</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
