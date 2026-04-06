'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  getReservationByCodeAndDni,
  getReservationsByDni,
  buildTimeline,
  type Reservation,
  type ReservationDocument,
  type ReservationTimelineEvent,
} from '@/lib/reservations-store';
import { Suspense } from 'react';

/* ── SVG Icons ── */
const IconHome = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>);
const IconLogout = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>);
const IconDoc = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>);
const IconDownload = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>);
const IconEye = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>);
const IconClock = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const IconShield = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>);
const IconMapPin = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>);
const IconClose = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>);

function MiPanelContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';

  // Auth state
  const [isAuth, setIsAuth] = useState(false);
  const [code, setCode] = useState(initialCode);
  const [dni, setDni] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [timeline, setTimeline] = useState<ReservationTimelineEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'resumen' | 'documentos' | 'historial'>('resumen');
  const [docViewer, setDocViewer] = useState<ReservationDocument | null>(null);

  // Check stored session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem('buyer_session');
    if (stored) {
      try {
        const { code: c, dni: d } = JSON.parse(stored);
        getReservationByCodeAndDni(c, d).then((r) => {
          if (r) {
            setIsAuth(true);
            setReservation(r);
            getReservationsByDni(d).then(setAllReservations);
            setTimeline(buildTimeline(r));
          }
        });
      } catch { /* ignore */ }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedDni = dni.trim();
    if (!trimmedCode || !trimmedDni) {
      setLoginError('Completa ambos campos');
      return;
    }
    const found = await getReservationByCodeAndDni(trimmedCode, trimmedDni);
    if (!found) {
      setLoginError('No encontramos una reserva con ese código y DNI');
      return;
    }
    setIsAuth(true);
    setReservation(found);
    setAllReservations(await getReservationsByDni(trimmedDni));
    setTimeline(buildTimeline(found));
    sessionStorage.setItem('buyer_session', JSON.stringify({ code: trimmedCode, dni: trimmedDni }));
    setLoginError('');
  };

  const handleLogout = () => {
    setIsAuth(false);
    setReservation(null);
    setAllReservations([]);
    sessionStorage.removeItem('buyer_session');
    setCode('');
    setDni('');
  };

  const switchReservation = (r: Reservation) => {
    setReservation(r);
    setTimeline(buildTimeline(r));
    setActiveTab('resumen');
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatDateShort = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statusConfig = {
    pendiente: { label: 'En revisión', color: 'bg-amber-100 text-amber-800', dotColor: 'bg-amber-400', gradient: 'from-amber-500 to-orange-500' },
    aprobada: { label: 'Aprobada', color: 'bg-emerald-100 text-emerald-800', dotColor: 'bg-emerald-500', gradient: 'from-emerald-500 to-teal-500' },
    rechazada: { label: 'Rechazada', color: 'bg-red-100 text-red-700', dotColor: 'bg-red-500', gradient: 'from-red-500 to-rose-500' },
  };

  const timelineIconMap: Record<string, JSX.Element> = {
    created: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
    approved: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
    rejected: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
    document: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
    note: <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
  };

  const timelineColorMap: Record<string, string> = {
    created: 'bg-primary-500 text-white',
    approved: 'bg-emerald-500 text-white',
    rejected: 'bg-red-500 text-white',
    document: 'bg-blue-500 text-white',
    note: 'bg-slate-400 text-white',
  };

  // ── LOGIN SCREEN ──
  if (!isAuth) {
    return (
      <div className="min-h-screen flex">
        {/* Left panel */}
        <div className="hidden lg:flex flex-col justify-between w-[42%] bg-gradient-to-br from-primary-900 via-primary-800 to-primary-950 p-12 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-16">
              <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
              </div>
              <span className="text-white font-bold text-lg">PerúInversión</span>
            </div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Tu portal<br />
              <span className="text-primary-300">de comprador</span>
            </h2>
            <p className="text-primary-200/70 text-base leading-relaxed max-w-xs">
              Consulta el estado de tu reserva, descarga documentos y sigue todo el proceso de tu inversión.
            </p>
          </div>

          <div className="relative z-10 space-y-3">
            {[
              { icon: <IconShield />, label: 'Estado de tu reserva', sub: 'En tiempo real' },
              { icon: <IconDoc />, label: 'Documentos del proyecto', sub: 'Contratos, planos y más' },
              { icon: <IconClock />, label: 'Historial completo', sub: 'Cada paso registrado' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 text-primary-300">
                  {item.icon}
                </div>
                <div>
                  <p className="text-white text-sm font-medium">{item.label}</p>
                  <p className="text-primary-300/50 text-xs">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
          <div className="w-full max-w-sm">
            <div className="lg:hidden flex items-center gap-2 mb-10">
              <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
              </div>
              <span className="font-bold text-slate-800">PerúInversión</span>
            </div>

            <div className="mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-5 shadow-lg shadow-primary-600/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
              </div>
              <h1 className="text-2xl font-black text-slate-900">Mi Panel</h1>
              <p className="text-slate-500 text-sm mt-1">Ingresa tu código de reserva y DNI para acceder</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Código de reserva</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-mono tracking-wider focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 outline-none transition-all bg-white shadow-sm uppercase"
                  placeholder="RES-XXXXX"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">DNI del titular</label>
                <input
                  type="text"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-sm font-mono tracking-wider focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 outline-none transition-all bg-white shadow-sm"
                  placeholder="12345678"
                  maxLength={8}
                  inputMode="numeric"
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-1.5 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/></svg>
                  <p className="text-red-600 text-xs font-medium">{loginError}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-lg shadow-primary-600/25 hover:shadow-primary-600/40 hover:-translate-y-px active:translate-y-0"
              >
                Acceder a mi panel
              </button>
            </form>

            <div className="mt-6 p-3 bg-slate-100 rounded-xl flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-600">Tu código está en tu correo</p>
                <p className="text-xs text-slate-400">Lo recibiste al completar la reserva</p>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 mt-6">
              <Link href="/" className="hover:text-primary-600 transition-colors">← Volver al inicio</Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── BUYER DASHBOARD ──
  if (!reservation) return null;

  const cfg = statusConfig[reservation.status];
  const docs = reservation.documents || [];

  return (
    <div className="min-h-screen bg-[#f5f6fa]">

      {/* ── Top bar ── */}
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-sm">
                <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 leading-none">Mi Panel</p>
                <p className="text-xs text-slate-400 mt-0.5">{reservation.clientName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Link href="/" className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 px-3 py-2 rounded-lg transition-all">
                <IconHome />
                <span className="hidden sm:inline">Inicio</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all"
              >
                <IconLogout />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Status banner ── */}
        <div className={`bg-gradient-to-r ${cfg.gradient} rounded-2xl p-6 mb-8 text-white relative overflow-hidden`}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  {cfg.label}
                </span>
              </div>
              <h1 className="text-2xl font-black">{reservation.projectName}</h1>
              <p className="text-white/80 text-sm mt-1 flex items-center gap-1.5">
                <IconMapPin /> {reservation.lotLabel} &middot; {reservation.lotArea} m²
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Código de reserva</p>
              <p className="text-2xl font-black font-mono tracking-wider">{reservation.code}</p>
            </div>
          </div>
        </div>

        {/* ── Multiple reservations switcher ── */}
        {allReservations.length > 1 && (
          <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-400 font-semibold flex-shrink-0">Mis reservas:</span>
            {allReservations.map((r) => (
              <button
                key={r.id}
                onClick={() => switchReservation(r)}
                className={`flex-shrink-0 text-xs font-mono font-bold px-3 py-1.5 rounded-lg border transition-all ${
                  r.id === reservation.id
                    ? 'bg-primary-50 border-primary-200 text-primary-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-primary-200'
                }`}
              >
                {r.code}
              </button>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-white rounded-xl p-1 mb-6 border border-slate-200/60 shadow-sm w-fit">
          {([
            { key: 'resumen' as const, label: 'Resumen', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
            { key: 'documentos' as const, label: `Documentos (${docs.length})`, icon: <IconDoc /> },
            { key: 'historial' as const, label: 'Historial', icon: <IconClock /> },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── TAB: Resumen ── */}
        {activeTab === 'resumen' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column — main info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Reservation details */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="text-sm font-bold text-slate-900">Detalles de la reserva</h2>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  {[
                    { label: 'Proyecto', value: reservation.projectName },
                    { label: 'Lote', value: reservation.lotLabel },
                    { label: 'Área', value: `${reservation.lotArea} m²` },
                    { label: 'Precio del lote', value: `S/${reservation.lotPrice.toLocaleString('es-PE')}` },
                    { label: 'Monto reservado', value: `S/${reservation.reservationAmount.toLocaleString('es-PE')}`, highlight: true },
                    { label: 'Tipo de compra', value: reservation.purchaseType === 'contado' ? 'Al contado' : 'Financiado', capitalize: true },
                    { label: 'Método de pago', value: reservation.paymentMethod, capitalize: true },
                    { label: 'Fecha de reserva', value: formatDateShort(reservation.createdAt) },
                    { label: 'Estado', value: cfg.label, badge: true },
                  ].map((item) => (
                    <div key={item.label} className="py-2">
                      <p className="text-xs text-slate-400 font-medium mb-1">{item.label}</p>
                      {item.badge ? (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                          {item.value}
                        </span>
                      ) : item.highlight ? (
                        <p className="text-lg font-black text-primary-600">{item.value}</p>
                      ) : (
                        <p className={`text-sm font-semibold text-slate-800 ${item.capitalize ? 'capitalize' : ''}`}>{item.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Rejection reason */}
              {reservation.status === 'rechazada' && reservation.rejectionReason && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd"/></svg>
                    <p className="text-sm font-bold text-red-700">Motivo del rechazo</p>
                  </div>
                  <p className="text-sm text-red-600">{reservation.rejectionReason}</p>
                </div>
              )}

              {/* Recent documents preview */}
              {docs.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="text-sm font-bold text-slate-900">Documentos recientes</h2>
                    <button onClick={() => setActiveTab('documentos')} className="text-xs font-semibold text-primary-600 hover:text-primary-700">
                      Ver todos
                    </button>
                  </div>
                  <div className="p-4">
                    {docs.slice(-3).reverse().map((doc) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all cursor-pointer" onClick={() => { setDocViewer(doc); }}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          doc.fileType === 'pdf' ? 'bg-red-50 text-red-500' : doc.fileType === 'image' ? 'bg-blue-50 text-blue-500' : 'bg-slate-50 text-slate-500'
                        }`}>
                          {doc.fileType === 'pdf' ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                          <p className="text-xs text-slate-400">{formatDateShort(doc.uploadedAt)}</p>
                        </div>
                        <IconEye />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right column — sidebar */}
            <div className="space-y-6">
              {/* Client card */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
                    {reservation.clientName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">{reservation.clientName}</p>
                    <p className="text-xs text-slate-400">Comprador registrado</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">DNI</span>
                    <span className="font-mono font-semibold text-slate-700">{reservation.clientDni}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Email</span>
                    <span className="font-medium text-slate-700 text-xs truncate ml-2">{reservation.clientEmail}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Teléfono</span>
                    <span className="font-medium text-slate-700">{reservation.clientPhone}</span>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Acciones rápidas</h3>
                <div className="space-y-2">
                  <a
                    href="https://wa.me/51987654321"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all text-sm font-semibold"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Contactar asesor
                  </a>
                  <Link
                    href={`/proyecto/${reservation.projectId}`}
                    className="flex items-center gap-3 p-3 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-xl transition-all text-sm font-semibold"
                  >
                    <IconMapPin />
                    Ver proyecto
                  </Link>
                </div>
              </div>

              {/* Next steps */}
              <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm p-6">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Próximos pasos</h3>
                <div className="space-y-3">
                  {reservation.status === 'pendiente' && (
                    <>
                      <div className="flex items-start gap-2.5 text-sm">
                        <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">1</div>
                        <p className="text-slate-600">Tu comprobante está siendo revisado (24h máx.)</p>
                      </div>
                      <div className="flex items-start gap-2.5 text-sm">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">2</div>
                        <p className="text-slate-400">Te contactaremos para confirmar</p>
                      </div>
                      <div className="flex items-start gap-2.5 text-sm">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">3</div>
                        <p className="text-slate-400">Firma de contrato y cronograma</p>
                      </div>
                    </>
                  )}
                  {reservation.status === 'aprobada' && (
                    <>
                      <div className="flex items-start gap-2.5 text-sm">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </div>
                        <p className="text-slate-600">Tu lote ha sido separado exitosamente</p>
                      </div>
                      <div className="flex items-start gap-2.5 text-sm">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">2</div>
                        <p className="text-slate-600">Un asesor te contactará para la visita</p>
                      </div>
                      <div className="flex items-start gap-2.5 text-sm">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold">3</div>
                        <p className="text-slate-400">Firma del contrato de compra-venta</p>
                      </div>
                    </>
                  )}
                  {reservation.status === 'rechazada' && (
                    <div className="flex items-start gap-2.5 text-sm">
                      <div className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </div>
                      <p className="text-slate-600">Contáctanos por WhatsApp para resolver dudas o reintentar.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: Documentos ── */}
        {activeTab === 'documentos' && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Documentos del proyecto</h2>
              <p className="text-xs text-slate-400 mt-0.5">Documentos adjuntados por el vendedor para tu revisión</p>
            </div>

            {docs.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Aún no hay documentos</h3>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">
                  El vendedor irá adjuntando documentos importantes como contratos, planos y comprobantes aquí.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {docs.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-all">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      doc.fileType === 'pdf' ? 'bg-red-50 text-red-500' : doc.fileType === 'image' ? 'bg-blue-50 text-blue-500' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {doc.fileType === 'pdf' ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                      ) : doc.fileType === 'image' ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M1 8a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 018.07 3h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0016.07 6H17a2 2 0 012 2v7a2 2 0 01-2 2H3a2 2 0 01-2-2V8zm13.5 3a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM10 14a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" /></svg>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">{doc.name}</p>
                      {doc.description && <p className="text-xs text-slate-400 mt-0.5">{doc.description}</p>}
                      <p className="text-xs text-slate-300 mt-1">Adjuntado el {formatDate(doc.uploadedAt)} por {doc.uploadedBy}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDocViewer(doc)}
                        className="flex items-center gap-1.5 bg-primary-50 hover:bg-primary-100 text-primary-600 font-semibold text-xs px-3 py-2 rounded-lg transition-all"
                      >
                        <IconEye />
                        <span className="hidden sm:inline">Ver</span>
                      </button>
                      <a
                        href={doc.fileUrl}
                        download={doc.name}
                        className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs px-3 py-2 rounded-lg transition-all"
                      >
                        <IconDownload />
                        <span className="hidden sm:inline">Descargar</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: Historial ── */}
        {activeTab === 'historial' && (
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Historial de actividad</h2>
              <p className="text-xs text-slate-400 mt-0.5">Todo el seguimiento de tu reserva en un solo lugar</p>
            </div>

            {timeline.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <IconClock />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Sin actividad aún</h3>
                <p className="text-sm text-slate-400">Los eventos aparecerán aquí conforme avance tu proceso.</p>
              </div>
            ) : (
              <div className="p-6">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-100" />

                  <div className="space-y-6">
                    {timeline.map((event) => (
                      <div key={event.id} className="relative flex gap-4">
                        {/* Dot */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${timelineColorMap[event.type] || 'bg-slate-400 text-white'}`}>
                          {timelineIconMap[event.type] || timelineIconMap.note}
                        </div>
                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{event.title}</p>
                              {event.description && <p className="text-xs text-slate-500 mt-0.5">{event.description}</p>}
                            </div>
                            <p className="text-xs text-slate-300 flex-shrink-0 font-medium">{formatDateShort(event.date)}</p>
                          </div>
                          {event.by && <p className="text-xs text-slate-300 mt-1">Por: {event.by}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Document viewer modal ── */}
      {docViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDocViewer(null)} />
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3 text-white">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  docViewer.fileType === 'pdf' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'
                }`}>
                  <IconDoc />
                </div>
                <div>
                  <p className="text-sm font-bold">{docViewer.name}</p>
                  {docViewer.description && <p className="text-xs text-white/50">{docViewer.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={docViewer.fileUrl}
                  download={docViewer.name}
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all"
                >
                  <IconDownload />
                  Descargar
                </a>
                <button
                  onClick={() => setDocViewer(null)}
                  className="text-white/60 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all"
                >
                  <IconClose />
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl overflow-hidden shadow-2xl flex-1 min-h-0">
              {docViewer.fileType === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={docViewer.fileUrl} alt={docViewer.name} className="w-full max-h-[75vh] object-contain" />
              ) : docViewer.fileType === 'pdf' ? (
                <iframe src={docViewer.fileUrl} className="w-full h-[75vh]" title={docViewer.name} />
              ) : (
                <div className="p-12 text-center">
                  <IconDoc />
                  <p className="text-sm text-slate-500 mt-3">Vista previa no disponible para este tipo de archivo</p>
                  <a href={docViewer.fileUrl} download={docViewer.name} className="inline-flex items-center gap-2 mt-4 bg-primary-600 text-white font-semibold text-sm px-4 py-2 rounded-xl">
                    <IconDownload /> Descargar archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MiPanelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>}>
      <MiPanelContent />
    </Suspense>
  );
}
