import Link from 'next/link';

/* ── SVG Icons (lightweight, no animation) ── */
const icons = {
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  ),
  phone: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calculator: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-6h.006v.008h-.006v-.008zm0 2.25h.006v.008h-.006v-.008zm0 2.25h.006v.008h-.006v-.008zm0 2.25h.006v.008h-.006v-.008zm2.493-6h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zM15 9.75a.75.75 0 00-.75-.75h-4.5a.75.75 0 00-.75.75v.75c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75V9.75zM4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
    </svg>
  ),
  chat: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
    </svg>
  ),
};

const ITEMS = [
  { icon: icons.search, title: 'Explora proyectos', subtitle: 'Compara terrenos verificados', bg: 'bg-primary-600', href: '/search' },
  { icon: icons.phone, title: 'Consulta gratis', subtitle: 'Llama al 01-456-7890', bg: 'bg-accent-500', href: 'tel:014567890' },
  { icon: icons.shield, title: 'Proyectos seguros', subtitle: '100% verificados en SUNARP', bg: 'bg-emerald-500', href: '/search' },
  { icon: icons.clock, title: 'Soporte 24/7', subtitle: 'Te asesoramos cuando quieras', bg: 'bg-violet-500', href: 'https://wa.me/51999999999' },
  { icon: icons.calculator, title: 'Simula tu cuota', subtitle: 'Calcula tu inversión al instante', bg: 'bg-primary-600', href: '/search' },
  { icon: icons.chat, title: 'Asesoría personalizada', subtitle: 'Un experto te acompaña', bg: 'bg-accent-500', href: 'https://wa.me/51999999999' },
];

export function PromoBanner() {
  return (
    <div className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 py-2.5">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {ITEMS.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="flex items-center gap-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 transition-colors group"
            >
              <div className={`w-9 h-9 rounded-lg ${item.bg} flex items-center justify-center flex-shrink-0 text-white`}>
                {item.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-slate-800 leading-tight truncate">{item.title}</p>
                <p className="text-[10px] text-slate-400 leading-tight truncate mt-0.5">{item.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
