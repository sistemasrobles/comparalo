'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { getRecentlyViewed, type RecentlyViewedProject } from '@/lib/recently-viewed-store';
import { formatPrice } from '@/lib/projects-data';

const navLinks = [
  { href: '/search', label: 'Buscar' },
  { href: '/inmobiliarias', label: 'Inmobiliarias' },
  { href: '/compare', label: 'Comparar' },
  { href: '/simulator', label: 'Simulador' },
  { href: '/mi-panel', label: 'Mi Panel' },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [lastVisited, setLastVisited] = useState<RecentlyViewedProject | null>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const items = getRecentlyViewed();
    if (items.length > 0) setLastVisited(items[0]);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setShowPopup(false);
      }
    }
    if (showPopup) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPopup]);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Image
              src="/images/logo-peru-inversion.png"
              alt="PerúInversión"
              width={200}
              height={50}
              className="h-11 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-2.5">
            <Link href="/admin" className="text-xs text-slate-400 hover:text-slate-600 transition-colors px-2 py-1" title="Panel Admin">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </Link>
            <Link href="/calcular" className="btn-ghost text-sm">
              Calcular cuota
            </Link>

            {/* ── Botón No lo dejes ir ── */}
            {lastVisited && (
              <div className="relative" ref={popupRef}>
                <button
                  onClick={() => setShowPopup((v) => !v)}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  � No lo dejes ir
                </button>

                {showPopup && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-fade-in">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-800">Último proyecto que visitó</p>
                      <button onClick={() => setShowPopup(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4 flex gap-3">
                      <img
                        src={lastVisited.imageUrl}
                        alt={lastVisited.name}
                        className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500 mb-0.5">Desde</p>
                        <p className="text-base font-black text-slate-900">
                          {formatPrice(lastVisited.minPrice, lastVisited.currency as 'PEN' | 'USD')}
                        </p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5 line-clamp-1">{lastVisited.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <svg className="w-3 h-3 text-rose-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                          <p className="text-xs text-slate-500 truncate">{lastVisited.zone} · {lastVisited.city}</p>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 pb-4">
                      <Link
                        href={`/proyecto/${lastVisited.slug}`}
                        onClick={() => setShowPopup(false)}
                        className="block w-full text-center bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold text-sm py-2.5 rounded-xl transition-all shadow-sm"
                      >
                        Ver proyecto →
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Link href="/search" className="btn-primary text-sm">
              Ver proyectos
            </Link>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2 -mr-2 text-slate-500 hover:text-slate-700" onClick={() => setOpen(!open)}>
            {open ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4 pt-2 border-t border-slate-100 animate-fade-in">
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-50" onClick={() => setOpen(false)}>
                  {link.label}
                </Link>
              ))}
              {lastVisited && (
                <Link
                  href={`/proyecto/${lastVisited.slug}`}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-rose-600 rounded-lg hover:bg-rose-50"
                  onClick={() => setOpen(false)}
                >
                  � No lo dejes ir — <span className="font-medium truncate">{lastVisited.name}</span>
                </Link>
              )}
              <div className="flex gap-2 pt-3 mt-2 border-t border-slate-100">
                <Link href="/simulator" className="btn-secondary text-sm flex-1" onClick={() => setOpen(false)}>Calcular cuota</Link>
                <Link href="/search" className="btn-primary text-sm flex-1" onClick={() => setOpen(false)}>Ver proyectos</Link>
              </div>
              <Link href="/admin" className="px-3 py-2 text-xs text-slate-400 hover:text-slate-600 mt-2 flex items-center gap-1.5" onClick={() => setOpen(false)}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Panel Admin
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
