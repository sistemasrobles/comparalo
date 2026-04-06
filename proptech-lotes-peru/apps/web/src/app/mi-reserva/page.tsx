'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getReservationByCode, type Reservation } from '@/lib/reservations-store';
import { Suspense } from 'react';

function MiReservaContent() {
  const searchParams = useSearchParams();
  const initialCode = searchParams.get('code') || '';
  const [code, setCode] = useState(initialCode);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [searched, setSearched] = useState(!!initialCode);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (initialCode) {
      getReservationByCode(initialCode).then((found) => {
        setReservation(found);
        setNotFound(!found);
      });
    }
  }, [initialCode]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    const found = await getReservationByCode(trimmed);
    setReservation(found || null);
    setNotFound(!found);
    setSearched(true);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const statusConfig = {
    pendiente: {
      label: 'En revisión',
      color: 'bg-amber-50 border-amber-200',
      iconBg: 'bg-amber-100',
      textColor: 'text-amber-800',
      descColor: 'text-amber-600',
      icon: <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      desc: 'Tu comprobante está siendo revisado por un asesor. Te contactaremos en las próximas 24 horas.',
    },
    aprobada: {
      label: '¡Reserva aprobada!',
      color: 'bg-emerald-50 border-emerald-200',
      iconBg: 'bg-emerald-100',
      textColor: 'text-emerald-800',
      descColor: 'text-emerald-600',
      icon: <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      desc: 'Tu reserva fue aprobada. Un asesor te contactará para formalizar la compra.',
    },
    rechazada: {
      label: 'Reserva rechazada',
      color: 'bg-red-50 border-red-200',
      iconBg: 'bg-red-100',
      textColor: 'text-red-800',
      descColor: 'text-red-600',
      icon: <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>,
      desc: 'Tu reserva fue rechazada. Revisa los detalles abajo o contáctanos.',
    },
  };

  return (
    <div className="min-h-screen bg-slate-50/60">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
            <Link href="/" className="hover:text-primary-600 transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Mi reserva</span>
          </nav>
          <h1 className="text-2xl font-bold text-slate-900">Consultar mi reserva</h1>
          <p className="text-sm text-slate-500 mt-1">Ingresa tu código de seguimiento para ver el estado</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search form */}
        <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Código de reserva</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono tracking-wider focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none uppercase bg-slate-50 transition-all"
              placeholder="RES-XXXXX"
            />
            <button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-all text-sm whitespace-nowrap shadow-sm shadow-primary-200/50 hover:shadow-md hover:shadow-primary-200/50"
            >
              Buscar
            </button>
          </div>
        </form>

        {/* Not found */}
        {searched && notFound && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Reserva no encontrada</h2>
            <p className="text-sm text-slate-500 mb-4">No encontramos ninguna reserva con el código <strong className="font-mono">{code}</strong></p>
            <p className="text-xs text-slate-400">Verifica que el código sea correcto. Si el problema persiste, contáctanos por WhatsApp.</p>
          </div>
        )}

        {/* Reservation found */}
        {reservation && (
          <div className="space-y-5">
            {/* Status banner */}
            <div className={`border rounded-2xl p-5 ${statusConfig[reservation.status].color}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${statusConfig[reservation.status].iconBg}`}>
                  {statusConfig[reservation.status].icon}
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${statusConfig[reservation.status].textColor}`}>{statusConfig[reservation.status].label}</h2>
                  <p className={`text-sm mt-0.5 ${statusConfig[reservation.status].descColor}`}>{statusConfig[reservation.status].desc}</p>
                </div>
              </div>
            </div>

            {/* Code + date */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6 text-center">
              <p className="text-2xs text-slate-400 uppercase tracking-widest font-semibold mb-1.5">Código de reserva</p>
              <p className="text-3xl font-black text-primary-700 font-mono tracking-wider">{reservation.code}</p>
              <p className="text-xs text-slate-400 mt-2.5">Registrada el {formatDate(reservation.createdAt)}</p>
            </div>

            {/* Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Detalles de la reserva</h3>
              </div>
              <div className="p-6 space-y-3">
                {[
                  { label: 'Proyecto', value: reservation.projectName, bold: true },
                  { label: 'Lote', value: reservation.lotLabel, bold: true },
                  { label: 'Área', value: `${reservation.lotArea} m²` },
                  { label: 'Precio del lote', value: `S/${reservation.lotPrice.toLocaleString('es-PE')}`, bold: true },
                  { label: 'Método de pago', value: reservation.paymentMethod, capitalize: true },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm border-b border-slate-50 pb-2.5 last:border-0 last:pb-0">
                    <span className="text-slate-500">{row.label}</span>
                    <span className={`text-slate-800 ${row.bold ? 'font-bold' : 'font-medium'} ${row.capitalize ? 'capitalize' : ''}`}>{row.value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Monto reservado</span>
                  <span className="text-lg font-black text-primary-600">S/{reservation.reservationAmount.toLocaleString('es-PE')}</span>
                </div>
              </div>
            </div>

            {/* Plan de pago */}
            {reservation.purchaseType && (
              <div className={`rounded-2xl border overflow-hidden ${
                reservation.purchaseType === 'contado'
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-primary-50/50 border-primary-200'
              }`}>
                <div className={`px-6 py-3 border-b ${
                  reservation.purchaseType === 'contado' ? 'bg-emerald-50 border-emerald-100' : 'bg-primary-50 border-primary-100'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      reservation.purchaseType === 'contado' ? 'bg-emerald-100' : 'bg-primary-100'
                    }`}>
                      {reservation.purchaseType === 'contado'
                        ? <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        : <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                      }
                    </div>
                    <h3 className={`text-xs font-bold uppercase tracking-widest ${
                      reservation.purchaseType === 'contado' ? 'text-emerald-700' : 'text-primary-600'
                    }`}>
                      {reservation.purchaseType === 'contado' ? 'Pago al contado' : 'Plan de financiamiento'}
                    </h3>
                  </div>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className={reservation.purchaseType === 'contado' ? 'text-emerald-600' : 'text-primary-500'}>
                      {reservation.purchaseType === 'contado' ? 'Pago total' : 'Cuota inicial'}
                    </span>
                    <span className={`font-bold ${reservation.purchaseType === 'contado' ? 'text-emerald-800' : 'text-primary-800'}`}>
                      {reservation.initialPayment ? `S/${reservation.initialPayment.toLocaleString('es-PE')}` : '—'}
                    </span>
                  </div>
                  {reservation.purchaseType === 'financiado' && reservation.termMonths && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-500">Plazo</span>
                      <span className="font-semibold text-primary-800">{reservation.termMonths} meses</span>
                    </div>
                  )}
                  {reservation.purchaseType === 'financiado' && reservation.monthlyPayment && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-500">Cuota mensual est.</span>
                      <span className="font-black text-primary-700">S/{reservation.monthlyPayment.toLocaleString('es-PE')}/mes</span>
                    </div>
                  )}
                  {reservation.purchaseType === 'contado' && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Gastos registrales</span>
                      <span className="font-bold text-emerald-700">GRATIS</span>
                    </div>
                  )}
                  {reservation.purchaseType === 'contado' && reservation.selectedPrizeLabel && (
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-emerald-600">Premio elegido</span>
                      <span className="font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 text-xs">{reservation.selectedPrizeLabel}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Rejection reason */}
            {reservation.status === 'rechazada' && reservation.rejectionReason && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-red-700 mb-1">Motivo del rechazo</h3>
                    <p className="text-sm text-red-600">{reservation.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Next steps */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Próximos pasos</h3>
              </div>
              <div className="p-6 space-y-4">
                {reservation.status === 'pendiente' && (
                  <>
                    {[
                      { step: 1, text: 'Un asesor revisará tu comprobante de pago (máximo 24 horas hábiles)' },
                      { step: 2, text: 'Te contactaremos por WhatsApp o email para confirmar' },
                      { step: 3, text: 'Coordinaremos la firma del contrato y el cronograma de pagos' },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-3">
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 text-xs font-bold">{item.step}</div>
                        <p className="text-sm text-slate-600 pt-0.5">{item.text}</p>
                      </div>
                    ))}
                  </>
                )}
                {reservation.status === 'aprobada' && (
                  <>
                    {[
                      { icon: <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>, bg: 'bg-emerald-100', text: 'Tu lote ha sido separado exitosamente' },
                      { icon: <svg className="w-3.5 h-3.5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>, bg: 'bg-primary-100', text: 'Un asesor te contactará para coordinar la visita al proyecto' },
                      { icon: <svg className="w-3.5 h-3.5 text-slate-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>, bg: 'bg-slate-100', text: 'Se programará la firma del contrato de compra-venta' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full ${item.bg} flex items-center justify-center flex-shrink-0`}>{item.icon}</div>
                        <p className="text-sm text-slate-600 pt-0.5">{item.text}</p>
                      </div>
                    ))}
                  </>
                )}
                {reservation.status === 'rechazada' && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                    </div>
                    <p className="text-sm text-slate-600 pt-0.5">Contáctanos por WhatsApp al <strong className="text-slate-800">987 654 321</strong> para resolver cualquier duda o reintentar tu reserva.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://wa.me/51987654321"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3.5 rounded-xl transition-all text-sm shadow-sm shadow-emerald-200/50"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Contactar por WhatsApp
              </a>
              <Link href="/search" className="flex-1 inline-flex items-center justify-center gap-2 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold py-3.5 rounded-xl transition-all text-sm">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>
                Ver más proyectos
              </Link>
            </div>
          </div>
        )}

        {/* No search yet */}
        {!searched && (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            </div>
            <p className="text-slate-400 text-sm">Ingresa tu código de reserva para consultar el estado</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MiReservaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>}>
      <MiReservaContent />
    </Suspense>
  );
}
