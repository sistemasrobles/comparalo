'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, getLegalStatusLabel, getLegalStatusColor, type ProjectCategory, type ProjectData } from '@/lib/projects-data';
import { getAdminProjects, getHeroSlides, type HeroSlide } from '@/lib/admin-store';

function featuredFrom(projects: ProjectData[]) { return projects.filter(p => p.isFeatured && p.isActive); }
function citiesFrom(projects: ProjectData[]) { return [...new Set(projects.filter(p => p.isActive).map(p => p.city))]; }
function exclusiveFrom(projects: ProjectData[]) { return projects.filter(p => p.isExclusive && p.isActive); }
function byCategoryFrom(projects: ProjectData[], cat: ProjectCategory) { return projects.filter(p => p.category === cat && p.isActive); }
import { PromoBanner } from '@/components/PromoBanner';

/* ── SVG Icons ── */
const IconSearch = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>);
const IconMapPin = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>);
const IconTrending = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>);
const IconArrowRight = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>);
const IconChevronLeft = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>);
const IconChevronRight = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>);
const IconStar = () => (<svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>);
const IconQuote = () => (<svg className="w-8 h-8 text-primary-200" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609L9.978 5.151c-2.432.917-3.995 3.638-3.995 5.849H10V21H0z"/></svg>);

/* ── Hero slides fallback ── */
const DEFAULT_HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&h=900&fit=crop&q=80',
    title: 'Encuentra el terreno ideal para tu inversión',
    subtitle: 'Compara precios, seguridad jurídica y proyección de valorización en las principales ciudades de Perú.',
  },
  {
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=900&fit=crop&q=80',
    title: 'Compara hasta 4 proyectos lado a lado',
    subtitle: 'Analiza precio por m², servicios, acceso y financiamiento de forma clara y transparente.',
  },
  {
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=900&fit=crop&q=80',
    title: 'Simula tu inversión y toma la mejor decisión',
    subtitle: 'Calcula cuotas, proyecta valorización y descubre proyectos que se ajustan a tu presupuesto.',
  },
];

/* ── Blog articles ── */
const BLOG_POSTS = [
  {
    title: '¿Cómo verificar la seguridad legal de un terreno en Perú?',
    excerpt: 'Aprende a consultar SUNARP, verificar títulos de propiedad y evitar estafas al comprar lotes.',
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop&q=80',
    category: 'Guía legal',
    readTime: '5 min',
  },
  {
    title: 'Top 5 zonas con mayor valorización en 2026',
    excerpt: 'Descubre las regiones donde los terrenos están experimentando la mayor plusvalía este año.',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop&q=80',
    category: 'Inversión',
    readTime: '4 min',
  },
  {
    title: 'Financiamiento directo vs. crédito hipotecario: ¿qué conviene más?',
    excerpt: 'Comparamos las opciones de financiamiento para comprar tu terreno sin complicaciones.',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop&q=80',
    category: 'Finanzas',
    readTime: '6 min',
  },
];

/* ── Testimonials ── */
const TESTIMONIALS = [
  { name: 'Fernando F.', city: 'Lima', text: 'Amador y Ríos son muy formales con la documentación, lo cual nos da seguridad y confianza. Ya estamos construyendo nuestra casa de campo.', project: 'Condominio Ginebra' },
  { name: 'Angelica R.', city: 'La Libertad', text: 'En Golf de Poseidón encontré la seguridad legal que buscaba. El proceso fue transparente y hoy mi familia disfruta de su terreno frente al mar.', project: 'Golf de Poseidón' },
  { name: 'Lucas R.', city: 'Chanchamayo', text: 'Invertir fue la mejor decisión del año. Los avances en Valle Orquídea son reales y constantes, superan cualquier promesa de venta.', project: 'Valle Orquídea' },
];

// Deterministic number formatter to avoid hydration mismatch
function fmtNum(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/* ── Animated counter hook ── */
function useCountUp(end: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * end));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [start, end, duration]);

  return count;
}

/* ── FAQ Accordion item ── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between py-4 text-left group">
        <span className="text-sm font-semibold text-slate-900 group-hover:text-primary-600 transition-colors pr-4">{q}</span>
        <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
      </button>
      {open && <p className="text-sm text-slate-500 leading-relaxed pb-4 animate-fade-in">{a}</p>}
    </div>
  );
}

export default function HomePage() {
  const [allProjects, setAllProjects] = useState<ProjectData[]>([]);
  const [featured, setFeatured] = useState<ProjectData[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [totalLots, setTotalLots] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Load hero slides from admin store
  const [heroSlides, setHeroSlides] = useState(DEFAULT_HERO_SLIDES);
  useEffect(() => {
    getAdminProjects().then((projects) => {
      setAllProjects(projects);
      setFeatured(featuredFrom(projects));
      setCities(citiesFrom(projects));
      setTotalLots(projects.filter(p => p.isActive).reduce((sum, p) => sum + p.totalLots, 0));
    });
    try {
      getHeroSlides().then((stored) => {
        if (stored.length > 0) {
          setHeroSlides(stored.sort((a: HeroSlide, b: HeroSlide) => a.order - b.order).map((s: HeroSlide) => ({ image: s.image, title: s.title, subtitle: s.subtitle })));
        }
      });
    } catch { /* use defaults */ }
  }, []);

  // Auto-advance slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);

  /* Animated counters */
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = statsRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const countProjects = useCountUp(featured.length, 1500, statsVisible);
  const countLots = useCountUp(totalLots, 2000, statsVisible);
  const countCities = useCountUp(cities.length, 1500, statsVisible);
  const countDevs = useCountUp(4, 1200, statsVisible);

  return (
    <div>
      {/* ═══════════════════════════════════════════
          1. HERO SLIDER (fotos cálidas y luminosas)
      ═══════════════════════════════════════════ */}
      <section className="relative h-[520px] md:h-[580px] overflow-hidden">
        {/* Slides */}
        {heroSlides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-1000 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`}
          >
            <Image src={slide.image} alt="" fill className="object-cover" />
            {/* Dark overlay — transparent black for contrast */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        ))}

        {/* Content */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/30 text-xs font-medium text-white mb-5 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {allProjects.filter(p => p.isActive).length} proyectos verificados en {cities.length} ciudades
            </div>

            <h1 className="text-3xl md:text-5xl font-bold leading-[1.1] tracking-tight text-white mb-4">
              {heroSlides[currentSlide].title}
            </h1>
            <p className="text-base md:text-lg text-white/80 leading-relaxed mb-8 max-w-md">
              {heroSlides[currentSlide].subtitle}
            </p>

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <Link href="/search" className="flex-1 flex items-center gap-3 bg-white/90 hover:bg-white border border-slate-200 rounded-xl px-4 py-3.5 shadow-card transition-all group backdrop-blur-sm">
                <span className="text-slate-400"><IconSearch /></span>
                <span className="text-sm text-slate-400 group-hover:text-slate-500">Buscar por ciudad, zona o proyecto…</span>
              </Link>
              <Link href="/search" className="btn-primary px-7 py-3.5 rounded-xl whitespace-nowrap shadow-lg shadow-primary-600/20">
                Buscar terrenos
              </Link>
            </div>

            {/* Stats pills — animated counters */}
            <div ref={statsRef} className="flex flex-wrap gap-3 mt-8">
              {[
                { value: countProjects, label: 'Proyectos', suffix: '' },
                { value: countLots, label: 'Lotes', suffix: '+' },
                { value: countCities, label: 'Ciudades', suffix: '' },
                { value: countDevs, label: 'Inmobiliarias', suffix: '' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg px-3 py-2">
                  <span className="text-lg font-bold text-amber-300 tabular-nums">{fmtNum(s.value)}{s.suffix}</span>
                  <span className="text-xs text-white/70">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slider controls */}
        <div className="absolute bottom-6 right-6 flex items-center gap-2">
          <button onClick={prevSlide} className="w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-slate-700 transition-colors backdrop-blur-sm">
            <IconChevronLeft />
          </button>
          <div className="flex gap-1.5 mx-2">
            {heroSlides.map((_, i) => (
              <button key={i} onClick={() => setCurrentSlide(i)} className={`w-2 h-2 rounded-full transition-all ${i === currentSlide ? 'bg-primary-600 w-6' : 'bg-slate-400/40'}`} />
            ))}
          </div>
          <button onClick={nextSlide} className="w-10 h-10 rounded-full bg-white/80 hover:bg-white shadow-md flex items-center justify-center text-slate-700 transition-colors backdrop-blur-sm">
            <IconChevronRight />
          </button>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PROMO BANNER — Marquee animado
      ═══════════════════════════════════════════ */}
      <PromoBanner />

      {/* ═══════════════════════════════════════════
          3b. ¿POR QUÉ PERÚINVERSIÓN?
      ═══════════════════════════════════════════ */}
      <section className="py-14 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-heading">¿Por qué PerúInversión?</h2>
            <p className="section-subheading mx-auto">La forma más inteligente de invertir en terrenos</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" /></svg>),
                title: 'Datos reales',
                desc: 'Información verificada directamente de las inmobiliarias con precios actualizados.',
                color: 'bg-primary-50 text-primary-600',
              },
              {
                icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>),
                title: 'Proyectos verificados',
                desc: 'Cada proyecto incluye puntaje de seguridad jurídica y estado legal en SUNARP.',
                color: 'bg-emerald-50 text-emerald-600',
              },
              {
                icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>),
                title: 'Comparación fácil',
                desc: 'Compara hasta 4 proyectos lado a lado con métricas claras y objetivas.',
                color: 'bg-amber-50 text-amber-600',
              },
              {
                icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>),
                title: 'Sin comisiones',
                desc: 'Servicio 100% gratuito para el comprador. Sin intermediarios ni costos ocultos.',
                color: 'bg-violet-50 text-violet-600',
              },
            ].map((item) => (
              <div key={item.title} className="card p-5 text-center bg-white hover:shadow-card-hover transition-shadow duration-300">
                <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-3`}>
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-1.5">{item.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. PASO A PASO — Cómo funciona
      ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-slate-50/80 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-heading">¿Cómo funciona?</h2>
            <p className="section-subheading mx-auto">3 pasos simples para encontrar tu terreno ideal</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-16 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200" />

            {[
              {
                step: '1',
                title: 'Compara',
                desc: 'Usa nuestros filtros avanzados para encontrar y comparar terrenos por precio, ubicación, servicios y seguridad jurídica.',
                color: 'bg-primary-600',
                icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>),
              },
              {
                step: '2',
                title: 'Elige',
                desc: 'Analiza las opciones con datos reales: puntaje de seguridad, valorización estimada y cuotas mensuales.',
                color: 'bg-accent-500',
                icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>),
              },
              {
                step: '3',
                title: 'Contacta',
                desc: 'Comunícate directamente con la inmobiliaria y agenda tu visita al proyecto que más te convenza.',
                color: 'bg-emerald-500',
                icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>),
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-lg relative z-10`}>
                  {item.icon}
                </div>
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 z-20">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4.5 PROYECTOS EXCLUSIVOS — Reserva online
      ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-y border-amber-100/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-800 text-xs font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
              <svg className="w-4 h-4 fill-amber-500" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
              Nuevo
            </div>
            <h2 className="section-heading">Proyectos Exclusivos</h2>
            <p className="section-subheading mx-auto">Reserva tu lote o local comercial 100% online con comprobante de pago</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {exclusiveFrom(allProjects).map((p) => (
              <Link key={p.slug} href={`/proyecto/${p.slug}`} className="group relative card-interactive overflow-hidden bg-white ring-1 ring-amber-200/60 hover:ring-amber-300">
                <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                  <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-900 text-2xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1 shadow-sm">
                    <svg className="w-3 h-3 fill-amber-800" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                    Exclusivo
                  </span>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white font-bold text-sm drop-shadow">{p.name}</p>
                    <p className="text-white/80 text-xs mt-0.5">{p.city}, {p.region}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-baseline justify-between mb-3">
                    <span className="text-lg font-bold text-primary-600">{formatPrice(p.minPrice)}</span>
                    <span className="text-xs text-slate-400">{p.lotSizeMin}–{p.lotSizeMax} m²</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-bold rounded-lg group-hover:from-amber-600 group-hover:to-amber-700 transition-all shadow-sm group-hover:shadow-md">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Ver proyecto
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/search?exclusive=true" className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-800 transition-colors">
              Ver todos los proyectos exclusivos <IconArrowRight />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5. CIUDADES DISPONIBLES (compact grid)
      ═══════════════════════════════════════════ */}
      <section className="py-14 bg-slate-50/80 border-y border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="section-heading">Ciudades disponibles</h2>
            <p className="section-subheading">Terrenos en las principales regiones del Perú</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {cities.map((city) => {
              const cp = allProjects.filter((p: ProjectData) => p.city === city && p.isActive);
              const minP = Math.min(...cp.map((p) => p.minPrice));
              return (
                <Link
                  key={city}
                  href={`/search?city=${encodeURIComponent(city)}`}
                  className="group flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3.5 hover:border-primary-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 transition-colors">
                    <IconMapPin />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 leading-tight truncate">{city}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{cp.length} proy. · <span className="text-primary-600 font-semibold">{formatPrice(minP)}</span></p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          6. PROYECTOS DESTACADOS
      ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-heading">Proyectos destacados</h2>
              <p className="section-subheading">Seleccionados por ubicación, potencial y seguridad</p>
            </div>
            <Link href="/search" className="btn-ghost hidden sm:inline-flex gap-1.5">
              Ver todos <IconArrowRight />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featured.slice(0, 6).map((p) => (
              <Link key={p.id} href={`/proyecto/${p.slug}`} className="card-interactive group overflow-hidden">
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 flex gap-1.5">
                    <span className="badge-blue text-2xs uppercase tracking-wider">Destacado</span>
                  </div>
                  <div className="absolute top-3 right-3">
                    <span className={`score-pill ${p.safetyScore >= 80 ? 'bg-emerald-500/90 text-white' : p.safetyScore >= 60 ? 'bg-amber-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                      {p.safetyScore}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-white text-xs font-medium flex items-center gap-1 opacity-90">
                      <IconMapPin /> {p.zone}, {p.city}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-[15px] leading-snug group-hover:text-primary-600 transition-colors">{p.name}</h3>
                  <p className="text-xs text-slate-500 mb-3">{p.developer.name}</p>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-base font-bold text-slate-900">{formatPrice(p.minPrice)}</span>
                      <span className="text-xs text-slate-400 ml-1">desde</span>
                    </div>
                    <span className="text-xs text-slate-500">{p.lotSizeMin}–{p.lotSizeMax} m²</span>
                  </div>
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><IconTrending /> +{p.valorizationEstimate}%/año</span>
                    <span>{p.totalLots} lotes</span>
                    <span className={`ml-auto px-1.5 py-0.5 rounded text-2xs font-medium ${getLegalStatusColor(p.legalStatus)}`}>
                      {getLegalStatusLabel(p.legalStatus)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="/search" className="btn-secondary">Ver todos los proyectos</Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          6b. SECCIONES POR CATEGORÍA
      ═══════════════════════════════════════════ */}
      {([
        {
          category: 'lotes' as ProjectCategory,
          title: 'Lotes y Terrenos',
          subtitle: 'Invierte en tierra: lotes campestres, frente al mar y con alta valorización',
          icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3H21m-3.75 3H21" /></svg>),
          badgeColor: 'bg-emerald-100 text-emerald-700',
          badgeLabel: 'Lote',
        },
        {
          category: 'departamentos' as ProjectCategory,
          title: 'Departamentos',
          subtitle: 'Urbanizaciones con obras completas, crédito directo y alta revalorización',
          icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" /></svg>),
          badgeColor: 'bg-blue-100 text-blue-700',
          badgeLabel: 'Depto.',
        },
        {
          category: 'locales-comerciales' as ProjectCategory,
          title: 'Locales Comerciales',
          subtitle: 'Puestos y locales en zonas de alto tránsito, ideal para emprendedores',
          icon: (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.15c0 .415.336.75.75.75z" /></svg>),
          badgeColor: 'bg-amber-100 text-amber-700',
          badgeLabel: 'Comercial',
        },
      ]).map((cat) => {
        const items = byCategoryFrom(allProjects, cat.category);
        if (items.length === 0) return null;
        return (
          <section key={cat.category} className="py-14 md:py-18 border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between mb-10">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                    {cat.icon}
                  </div>
                  <div>
                    <h2 className="section-heading">{cat.title}</h2>
                    <p className="section-subheading">{cat.subtitle}</p>
                  </div>
                </div>
                <Link href="/search" className="btn-ghost hidden sm:inline-flex gap-1.5">
                  Ver todos <IconArrowRight />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.slice(0, 3).map((p) => (
                  <Link key={p.id} href={`/proyecto/${p.slug}`} className="card-interactive group overflow-hidden">
                    <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className={`text-2xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md ${cat.badgeColor}`}>{cat.badgeLabel}</span>
                      </div>
                      <div className="absolute top-3 right-3">
                        <span className={`score-pill ${p.safetyScore >= 80 ? 'bg-emerald-500/90 text-white' : p.safetyScore >= 60 ? 'bg-amber-500/90 text-white' : 'bg-red-500/90 text-white'}`}>
                          {p.safetyScore}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <p className="text-white text-xs font-medium flex items-center gap-1 opacity-90">
                          <IconMapPin /> {p.zone}, {p.city}
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-slate-900 text-[15px] leading-snug group-hover:text-primary-600 transition-colors">{p.name}</h3>
                      <p className="text-xs text-slate-500 mb-3">{p.developer.name}</p>
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-bold text-slate-900">{formatPrice(p.minPrice)}</span>
                          <span className="text-xs text-slate-400 ml-1">desde</span>
                        </div>
                        <span className="text-xs text-slate-500">{p.lotSizeMin}–{p.lotSizeMax} m²</span>
                      </div>
                      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><IconTrending /> +{p.valorizationEstimate}%/año</span>
                        <span>{p.totalLots} lotes</span>
                        <span className={`ml-auto px-1.5 py-0.5 rounded text-2xs font-medium ${getLegalStatusColor(p.legalStatus)}`}>
                          {getLegalStatusLabel(p.legalStatus)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* ═══════════════════════════════════════════
          7. BLOG DE CONSEJOS
      ═══════════════════════════════════════════ */}
      <section className="py-16 bg-slate-50/80 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="section-heading">Blog de consejos</h2>
              <p className="section-subheading">Información útil para invertir con seguridad</p>
            </div>
            <span className="btn-ghost hidden sm:inline-flex gap-1.5 cursor-default opacity-60">
              Próximamente <IconArrowRight />
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {BLOG_POSTS.map((post) => (
              <article key={post.title} className="card-interactive group overflow-hidden">
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  <Image src={post.image} alt={post.title} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-medium text-primary-700 px-2.5 py-1 rounded-lg">
                    {post.category}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-primary-600 transition-colors line-clamp-2 mb-2">
                    {post.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 mb-3">{post.excerpt}</p>
                  <span className="text-2xs text-slate-400">{post.readTime} de lectura</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          8. COMUNIDAD / TESTIMONIOS
      ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Counter */}
          <div className="text-center mb-14">
            <p className="text-xs font-semibold text-primary-600 uppercase tracking-widest mb-2">Nuestra comunidad</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-2">
              Únete a los <span className="text-primary-600">{fmtNum(totalLots * 3)}+</span> que ya compararon
            </h2>
            <p className="text-slate-500 max-w-md mx-auto">
              Miles de personas confían en PerúInversión para tomar la mejor decisión de inversión inmobiliaria
            </p>
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="card p-6 relative">
                <div className="absolute top-4 right-4"><IconQuote /></div>
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map((s) => <IconStar key={s} />)}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-4 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                  <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-2xs text-slate-500">{t.project} · {t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <Link href="/search" className="btn-primary px-8 py-3.5 rounded-xl text-base shadow-lg shadow-primary-600/20">
              Compara tú también
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          8b. PREGUNTAS FRECUENTES
      ═══════════════════════════════════════════ */}
      <section className="py-16 bg-slate-50/80 border-y border-slate-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-heading">Preguntas frecuentes</h2>
            <p className="section-subheading mx-auto">Todo lo que necesitas saber antes de invertir</p>
          </div>
          <div className="card p-6 bg-white divide-y divide-slate-100">
            <FaqItem q="¿Es seguro comprar terrenos en proyectos de habilitación urbana?" a="Sí, siempre que verifiques el estado legal del proyecto. En PerúInversión incluimos el puntaje de seguridad jurídica de cada proyecto, que evalúa si está inscrito en SUNARP, si tiene habilitación urbana aprobada y si cuenta con todos los permisos municipales." />
            <FaqItem q="¿Qué es SUNARP y por qué es importante?" a="SUNARP (Superintendencia Nacional de Registros Públicos) es la entidad que registra la propiedad en Perú. Un terreno inscrito en SUNARP te garantiza que la propiedad está legalmente reconocida y que puedes verificar quién es el dueño real antes de comprar." />
            <FaqItem q="¿Cómo funciona el financiamiento directo?" a="El financiamiento directo es ofrecido por la inmobiliaria sin pasar por un banco. Generalmente pagas una cuota inicial (desde S/3,000) y el resto en cuotas mensuales a 24-96 meses, muchas veces sin intereses o con tasas bajas." />
            <FaqItem q="¿Qué significa la valorización estimada?" a="Es el porcentaje de incremento de valor que se estima tendrá el terreno anualmente, basado en el historial de la zona, los planes de desarrollo urbano y la infraestructura proyectada. Una valorización del 12% significa que un terreno de S/20,000 podría valer S/22,400 en un año." />
            <FaqItem q="¿PerúInversión cobra alguna comisión?" a="No. Nuestro servicio es 100% gratuito para el comprador. No somos intermediarios ni agentes inmobiliarios. Solo facilitamos la comparación de proyectos con información transparente." />
            <FaqItem q="¿Puedo visitar los proyectos antes de comprar?" a="¡Por supuesto! Cada proyecto tiene los datos de contacto de la inmobiliaria desarrolladora. Te recomendamos siempre visitar el terreno, verificar los servicios y revisar la documentación legal antes de tomar una decisión." />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          9. CTA FINAL
      ═══════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\'%3E%3Cpath d=\'M20 20.5V18H0v-2h20v-2l2 3.25L20 20.5z\'/%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">¿Listo para invertir en tu terreno?</h2>
          <p className="text-lg text-primary-200 mb-10">
            Compara, simula y decide con datos reales.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/search" className="bg-white text-primary-700 hover:bg-primary-50 font-semibold px-8 py-3.5 rounded-xl text-base transition-colors inline-flex items-center justify-center shadow-lg">
              Buscar terrenos
            </Link>
            <Link href="/compare" className="bg-white/15 hover:bg-white/25 border border-white/20 text-white font-medium px-8 py-3.5 rounded-xl text-base transition-colors inline-flex items-center justify-center gap-2">
              Comparar proyectos
            </Link>
            <Link href="/simulator" className="bg-white/15 hover:bg-white/25 border border-white/20 text-white font-medium px-8 py-3.5 rounded-xl text-base transition-colors inline-flex items-center justify-center gap-2">
              Simular inversión
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
