'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/images/logo-peru-inversion.png"
                alt="PerúInversión"
                width={140}
                height={36}
                className="h-8 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              La primera plataforma en Perú para comparar terrenos con datos reales de precio, seguridad y valorización.
            </p>
          </div>

          {/* Explorar */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-4">Explorar</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/search" className="hover:text-white transition-colors">Buscar terrenos</Link></li>
              <li><Link href="/compare" className="hover:text-white transition-colors">Comparar proyectos</Link></li>
              <li><Link href="/simulator" className="hover:text-white transition-colors">Simulador de inversión</Link></li>
              <li><Link href="/calcular" className="hover:text-white transition-colors">Calcular cuota</Link></li>
            </ul>
          </div>

          {/* Ciudades */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-4">Ciudades</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/search?city=Lima" className="hover:text-white transition-colors">Lima</Link></li>
              <li><Link href="/search?city=La+Libertad" className="hover:text-white transition-colors">La Libertad</Link></li>
              <li><Link href="/search?city=Pasco" className="hover:text-white transition-colors">Oxapampa</Link></li>
              <li><Link href="/search?city=Loreto" className="hover:text-white transition-colors">Iquitos</Link></li>
              <li><Link href="/search?city=Áncash" className="hover:text-white transition-colors">Chimbote</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-4">Legal</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Términos de uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacidad</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Libro de reclamaciones</a></li>
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="mt-10 pt-8 border-t border-slate-800">
          <div className="max-w-md mx-auto text-center">
            <h4 className="text-sm font-semibold text-slate-200 mb-2">📬 Recibe alertas de nuevos proyectos</h4>
            <p className="text-xs text-slate-500 mb-4">Sé el primero en conocer los nuevos terrenos y ofertas exclusivas.</p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="tu@email.com"
                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-300 placeholder-slate-500 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-all"
              />
              <button type="submit" className="bg-primary-600 hover:bg-primary-500 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors whitespace-nowrap">
                Suscribirme
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} PerúInversión. Todos los derechos reservados.
          </p>
          <p className="text-xs text-slate-600">
            Plataforma de comparación. No somos agentes inmobiliarios.
          </p>
        </div>
      </div>
    </footer>
  );
}
