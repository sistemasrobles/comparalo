'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ReservarButtonProps {
  projectSlug: string;
}

export default function ReservarButton({ projectSlug }: ReservarButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleSelect = (tipo: 'financiado' | 'contado') => {
    setShowModal(false);
    router.push(`/proyecto/${projectSlug}/reservar?tipo=${tipo}`);
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        Reservar lote online
      </button>

      {/* ── Modal: tipo de compra ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />

          {/* Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="relative px-6 pt-6 pb-4">
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">¿Cómo deseas comprar?</h2>
                  <p className="text-xs text-slate-400">Selecciona tu modalidad de pago</p>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="px-6 pb-6 space-y-3">
              {/* Financiado */}
              <button
                onClick={() => handleSelect('financiado')}
                className="group w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-primary-400 hover:bg-primary-50/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 group-hover:bg-primary-100 flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition-colors">Financiado</h3>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Paga tu lote en cómodas cuotas mensuales. Ideal para planificar tu inversión a largo plazo.
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-2xs text-slate-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                        Cuotas fijas
                      </span>
                      <span className="inline-flex items-center gap-1 text-2xs text-slate-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                        Sin intereses
                      </span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-primary-500 transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </div>
              </button>

              {/* Al contado */}
              <button
                onClick={() => handleSelect('contado')}
                className="group w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 flex items-center justify-center flex-shrink-0 transition-colors">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">Al contado</h3>
                      <span className="bg-emerald-100 text-emerald-700 text-2xs font-bold px-2 py-0.5 rounded-full">Popular</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Paga el precio total y obtén gastos registrales gratis + premio a elegir.
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="inline-flex items-center gap-1 text-2xs text-slate-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                        Gastos gratis
                      </span>
                      <span className="inline-flex items-center gap-1 text-2xs text-slate-400">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" /></svg>
                        Premio adicional
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-100 w-fit">
                      <svg className="w-3 h-3 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" /></svg>
                      <span className="text-2xs text-amber-700 font-medium">5 personas compraron al contado hace un instante</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                </div>
              </button>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
              <p className="text-2xs text-slate-400 text-center">
                Podrás ver todos los detalles antes de confirmar tu reserva
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
