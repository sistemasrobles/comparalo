'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { PROJECTS, getProjectBySlug, formatPrice, getLegalStatusLabel, getLegalStatusColor, type LotData } from '@/lib/projects-data';
import { getAdminProjects } from '@/lib/admin-store';
import { createReservation } from '@/lib/reservations-store';
import InteractiveLotMap from '@/components/lots/InteractiveLotMap';

/* ── Icons ── */
const IconCheck = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>);
const IconMapPin = () => (<svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>);
const IconCamera = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></svg>);
const IconUpload = () => (<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>);
const IconCube = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" /></svg>);
const IconMap = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" /></svg>);
const IconCalculator = () => (<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.498-6h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm0 2.25h.007v.008h-.007v-.008zm2.504-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008v-.008zM8.25 6h7.5v2.25h-7.5V6zM12 2.25c-1.892 0-3.758.11-5.593.322C5.307 2.7 4.5 3.65 4.5 4.757V19.5a2.25 2.25 0 002.25 2.25h10.5a2.25 2.25 0 002.25-2.25V4.757c0-1.108-.806-2.057-1.907-2.185A48.507 48.507 0 0012 2.25z" /></svg>);

type GalleryTab = 'fotos' | 'renders' | 'plano';
type Step = 'explorar' | 'presupuesto' | 'seleccionar' | 'datos' | 'confirmacion';

export default function ReservarPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p className="text-slate-400">Cargando...</p></div>}>
      <ReservarPage />
    </Suspense>
  );
}

function ReservarPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  // Start with static data (SSR-safe), then update from localStorage after mount
  // to avoid React hydration mismatch (server: "S/X" vs client: "$X").
  // IMPORTANT: use PROJECTS.find() directly here — NOT getProjectBySlug() — because
  // getProjectBySlug() calls getLiveProjects() which reads localStorage on the client's
  // first render, producing different data than the server and causing a hydration error.
  const [project, setProject] = useState(() => PROJECTS.find((p) => p.slug === slug) ?? null);
  // Track whether we've completed the first client-side mount (localStorage check).
  // Before mount completes we show a loading skeleton so SSR and first client render always match.
  const [mounted, setMounted] = useState(false);
  // currency must be a separate state initialized to 'PEN' so SSR and first client render match.
  // It is only set to the real value inside useEffect (client-only), after hydration.
  const [currency, setCurrency] = useState<'PEN' | 'USD'>('PEN');
  useEffect(() => {
    getAdminProjects().then((projects) => {
      const adminProject = projects.find((p) => p.slug === slug);
      if (adminProject) {
        setProject(adminProject);
        setCurrency(adminProject.currency ?? 'PEN');
      } else {
        // Even if no admin override, sync currency from static project
        const staticProject = getProjectBySlug(slug);
        if (staticProject?.currency) setCurrency(staticProject.currency);
      }
      setMounted(true);
    });
  }, [slug]);
  // helper local que ya lleva la moneda del proyecto
  const fmt = (price: number) => formatPrice(price, currency);
  const initialTipo = searchParams.get('tipo');
  const [purchaseType, setPurchaseType] = useState<'financiado' | 'contado'>(
    initialTipo === 'contado' ? 'contado' : 'financiado'
  );
  const [showTipoModal, setShowTipoModal] = useState(!initialTipo);

  const [galleryTab, setGalleryTab] = useState<GalleryTab>('fotos');
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [step, setStep] = useState<Step>('explorar');
  const [selectedLot, setSelectedLot] = useState<LotData | null>(null);
  const [formData, setFormData] = useState({
    clientName: '', clientDni: '', clientEmail: '', clientPhone: '',
    paymentMethod: 'yape' as 'yape' | 'plin' | 'transferencia' | 'otro',
  });
  const [voucherImage, setVoucherImage] = useState<string>('');
  const [voucherName, setVoucherName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reservationCode, setReservationCode] = useState('');

  /* ── Financing state (presupuesto step) ── */
  const [selectedTermMonths, setSelectedTermMonths] = useState(project?.termMonthsEst || 36);
  const [initialPayment, setInitialPayment] = useState(
    initialTipo === 'contado' ? (project?.minPrice || 5000) : (project?.downPaymentMin || 5000)
  );
  const termOptions = [12, 24, 36, 48, 60, 72];

  const calcMonthly = (lotPrice: number) => {
    const remaining = Math.max(lotPrice - initialPayment, 0);
    return remaining > 0 ? Math.ceil(remaining / selectedTermMonths) : 0;
  };

  /* ── Derived lot price (uses selected lot when available) ── */
  const lotPrice = selectedLot ? selectedLot.price : (project?.minPrice || 0);

  const [selectedPrize, setSelectedPrize] = useState<string | null>(null);

  /* ── Auto-switch financiado ↔ contado ── */
  // autoSwitchedToContado: user was in financiado and dragged the slider all the way to 100%
  const [autoSwitchedToContado, setAutoSwitchedToContado] = useState(false);

  // In pure contado mode (explicitly chosen, not auto-switched), payment IS the full lot price.
  const isPureContado = purchaseType === 'contado' && !autoSwitchedToContado;
  const effectiveInitialPayment = isPureContado ? lotPrice : initialPayment;

  /* ── Gamification: pago al contado = gastos registrales gratis + premio a elegir ── */
  const rewardGoal = lotPrice;
  const rewardUnlocked = effectiveInitialPayment >= rewardGoal;
  const amountToReward = Math.max(rewardGoal - effectiveInitialPayment, 0);
  const rewardProgressPercent = rewardGoal > 0 ? Math.min((effectiveInitialPayment / rewardGoal) * 100, 100) : 0;

  const bonusPrizes: { id: string; label: string; description: string; icon: (cls: string) => React.ReactNode }[] = [
    { id: 'viaje', label: 'Viaje todo pagado', description: 'Conoce tu proyecto — viaje para 2 personas',
      icon: (cls) => <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg> },
    { id: 'refrigeradora', label: 'Refrigeradora Samsung', description: 'Refrigeradora Samsung de última generación',
      icon: (cls) => <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5V18a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V7.5m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v1.5m18 0H3m6 4.5v6m6-6v6" /></svg> },
    { id: 'tv', label: 'Televisor LG 60"', description: 'Smart TV LG 60 pulgadas 4K',
      icon: (cls) => <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" /></svg> },
    { id: 'cocina', label: 'Cocina', description: 'Cocina de 5 hornillas con horno',
      icon: (cls) => <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></svg> },
    { id: 'giftcard', label: 'Gift Card S/200', description: 'Gift card de S/200 para usar en tiendas',
      icon: (cls) => <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg> },
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);

  // While waiting for localStorage check (admin projects), show a neutral loading state
  // that is identical on both SSR and first client render — avoids hydration mismatch.
  if (!project && !mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-400">Cargando...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Proyecto no encontrado</h1>
          <p className="text-slate-500 mb-4">No pudimos encontrar este proyecto.</p>
          <Link href="/search" className="btn-primary">Ver proyectos</Link>
        </div>
      </div>
    );
  }

  /* Generar lotes automáticos si el proyecto no tiene lotes definidos */
  const LOT_COUNT = 16;
  const generatedLots: LotData[] = project.lots && project.lots.length > 0
    ? project.lots
    : Array.from({ length: LOT_COUNT }, (_, i) => {
        const manzana = String.fromCharCode(65 + Math.floor(i / 4));
        const lote = (i % 4) + 1;
        const fila = String(lote).padStart(2, '0');
        return {
          id: `${project.id}-lote-${i + 1}`,
          label: `Mz ${manzana} - Lt ${fila}`,
          lote,
          fila,
          area: project.lotSizeMin + Math.floor((project.lotSizeMax - project.lotSizeMin) * ((i % 3) / 2)),
          price: project.minPrice + Math.floor((project.minPrice * 0.3) * ((i % 4) / 3)),
          /* Distribución sobre el total generado: 30% vendido, 15% reservado, 55% disponible */
          status: i < Math.floor(LOT_COUNT * 0.30) ? ('vendido' as const)
                : i < Math.floor(LOT_COUNT * 0.45) ? ('reservado' as const)
                : ('disponible' as const),
          manzana,
        };
      });

  const lots = generatedLots;
  const availableLots = lots.filter((l) => l.status === 'disponible');

  const currentGalleryImages = galleryTab === 'fotos'
    ? (project.galleryImages || [project.imageUrl])
    : galleryTab === 'renders'
    ? (project.renderImages || [])
    : project.lotPlanImage ? [project.lotPlanImage] : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('El archivo no puede pesar más de 5MB');
      return;
    }
    setVoucherName(file.name);
    const reader = new FileReader();
    reader.onload = () => setVoucherImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!selectedLot || !formData.clientName || !formData.clientDni || !formData.clientEmail || !formData.clientPhone || !voucherImage) {
      alert('Completa todos los campos y sube tu comprobante de pago');
      return;
    }
    setSubmitting(true);
    createReservation({
      projectId: project.id,
      projectName: project.name,
      lotId: selectedLot.id,
      lotLabel: selectedLot.label,
      lotArea: selectedLot.area,
      lotPrice: selectedLot.price,
      reservationAmount: project.reservationAmount || 1000,
      currency,
      clientName: formData.clientName,
      clientDni: formData.clientDni,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      paymentMethod: formData.paymentMethod,
      purchaseType,
      voucherImage,
      status: 'pendiente',
      initialPayment,
      ...(purchaseType === 'financiado'
        ? {
            termMonths: selectedTermMonths,
            monthlyPayment: calcMonthly(selectedLot.price),
          }
        : {}),
      ...(purchaseType === 'contado' && selectedPrize
        ? {
            selectedPrize,
            selectedPrizeLabel: bonusPrizes.find(p => p.id === selectedPrize)?.label,
          }
        : {}),
    }).then((reservation) => {
      setReservationCode(reservation.code);
      setStep('confirmacion');
      setSubmitting(false);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/60">
      {/* ── Breadcrumb + header bar ── */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            <Link href="/" className="hover:text-primary-600 transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/search" className="hover:text-primary-600 transition-colors">Proyectos</Link>
            <span>/</span>
            <Link href={`/proyecto/${project.slug}`} className="hover:text-primary-600 transition-colors">{project.name}</Link>
            <span>/</span>
            <span className="text-slate-800 font-medium">Reservar</span>
          </nav>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{project.name}</h1>
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-2xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Exclusivo</span>
                <span
                  onClick={() => setShowTipoModal(true)}
                  className={`text-2xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider cursor-pointer hover:opacity-80 transition-opacity ${
                  purchaseType === 'contado'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-primary-100 text-primary-700'
                }`}>
                  {purchaseType === 'contado' ? 'Al contado' : 'Financiado'}
                </span>
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                <IconMapPin /> {project.zone}, {project.city} · {project.developer.name}
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-right">
                <p className="text-2xs text-slate-400 uppercase tracking-wider">Desde</p>
                <p className="text-xl font-bold text-primary-600">{fmt(project.minPrice)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stepper ── */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2">
            {(purchaseType === 'financiado'
              ? [
                  { key: 'explorar', label: '1. Explorar', icon: IconCamera },
                  { key: 'seleccionar', label: '2. Elegir lote', icon: IconMap },
                  { key: 'presupuesto', label: '3. Presupuesto', icon: IconCalculator },
                  { key: 'datos', label: '4. Reservar', icon: IconUpload },
                  { key: 'confirmacion', label: '5. Confirmación', icon: IconCheck },
                ]
              : [
                  { key: 'explorar', label: '1. Explorar', icon: IconCamera },
                  { key: 'seleccionar', label: '2. Elegir lote', icon: IconMap },
                  { key: 'presupuesto', label: '3. Beneficios', icon: IconCalculator },
                  { key: 'datos', label: '4. Reservar', icon: IconUpload },
                  { key: 'confirmacion', label: '5. Confirmación', icon: IconCheck },
                ]
            ).map((s, i) => {
              const steps: Step[] = ['explorar', 'seleccionar', 'presupuesto', 'datos', 'confirmacion'];
              const currentIdx = steps.indexOf(step);
              const stepIdx = steps.indexOf(s.key as Step);
              const isActive = stepIdx === currentIdx;
              const isDone = stepIdx < currentIdx;
              const lastEditableIdx = steps.length - 2; // can't click confirmacion
              return (
                <div key={s.key} className="flex items-center gap-2">
                  {i > 0 && <div className={`w-8 sm:w-16 h-0.5 ${isDone ? 'bg-primary-500' : 'bg-slate-200'}`} />}
                  <button
                    onClick={() => stepIdx <= currentIdx && stepIdx <= lastEditableIdx && setStep(s.key as Step)}
                    className={`flex items-center gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                      isActive ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' :
                      isDone ? 'text-primary-600' :
                      'text-slate-400'
                    }`}
                  >
                    {isDone ? <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center"><IconCheck /></span> : <s.icon />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ══════════ STEP 1: EXPLORAR ══════════ */}
      {step === 'explorar' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Gallery */}
            <div className="lg:col-span-2 space-y-4">
              {/* Gallery tabs */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
                {[
                  { key: 'fotos' as GalleryTab, label: 'Fotos', icon: IconCamera },
                  { key: 'renders' as GalleryTab, label: 'Renders 3D', icon: IconCube },
                  { key: 'plano' as GalleryTab, label: 'Plano', icon: IconMap },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => { setGalleryTab(t.key); setGalleryIndex(0); }}
                    className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-md transition-all ${
                      galleryTab === t.key ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <t.icon /> {t.label}
                  </button>
                ))}
              </div>

              {/* Main image */}
              {currentGalleryImages.length > 0 ? (
                <div
                  className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-200 cursor-pointer group"
                  onClick={() => setLightboxOpen(true)}
                >
                  <Image
                    src={currentGalleryImages[galleryIndex]}
                    alt={`${project.name} - ${galleryTab}`}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-lg">
                    {galleryIndex + 1} / {currentGalleryImages.length} · Clic para ampliar
                  </div>
                  {galleryTab === 'renders' && (
                    <div className="absolute top-3 left-3 bg-purple-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                      <IconCube /> Vista 3D del proyecto
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[16/10] rounded-2xl bg-slate-100 flex items-center justify-center">
                  <p className="text-slate-400 text-sm">No hay imágenes disponibles</p>
                </div>
              )}

              {/* Thumbnails */}
              {currentGalleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {currentGalleryImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setGalleryIndex(i)}
                      className={`flex-shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                        galleryIndex === i ? 'border-primary-500 ring-2 ring-primary-200' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="relative w-full h-full">
                        <Image src={img} alt="" fill className="object-cover" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="card p-6 bg-white">
                <h2 className="text-lg font-semibold text-slate-900 mb-3">Sobre el proyecto</h2>
                <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
              </div>

              {/* Amenities */}
              {project.amenities && project.amenities.length > 0 && (
                <div className="card p-6 bg-white">
                  <h2 className="text-lg font-semibold text-slate-900 mb-4">Amenities y servicios</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {project.amenities.map((a) => (
                      <div key={a} className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2.5">
                        <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0" />
                        {a}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {/* Price card */}
              <div className="card p-6 bg-white">
                <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold">Precio desde</p>
                <p className="text-3xl font-bold text-primary-600 mt-1">{fmt(project.minPrice)}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-500">
                  <span>Cuota desde {fmt(project.monthlyPaymentEst)}/mes</span>
                </div>
                <div className="border-t border-slate-100 mt-4 pt-4 space-y-2.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Área</span>
                    <span className="font-medium text-slate-800">{project.lotSizeMin}–{project.lotSizeMax} m²</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Lotes totales</span>
                    <span className="font-medium text-slate-800">{project.totalLots}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Disponibles</span>
                    <span className="font-bold text-emerald-600">{availableLots.length} lotes</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Reserva online</span>
                    <span className="font-bold text-amber-600">{fmt(project.reservationAmount || 1000)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep('seleccionar')}
                  className="w-full mt-5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-primary-200/50 hover:shadow-primary-300/50 text-sm"
                >
                  Elegir mi lote →
                </button>
              </div>

              {/* Trust badges */}
              <div className="card p-5 bg-white">
                <div className="space-y-3">
                  {[
                    { icon: <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>, text: 'Pago seguro verificado' },
                    { icon: <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>, text: getLegalStatusLabel(project.legalStatus) },
                    { icon: <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, text: 'Asesor confirma en 24h' },
                    { icon: <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>, text: 'Soporte por WhatsApp' },
                  ].map((b) => (
                    <div key={b.text} className="flex items-center gap-2.5 text-sm text-slate-600">
                      {b.icon}
                      {b.text}
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety score */}
              <div className={`card p-5 ${project.safetyScore >= 80 ? 'bg-emerald-50 border-emerald-100' : project.safetyScore >= 60 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold ${
                    project.safetyScore >= 80 ? 'bg-emerald-500 text-white' : project.safetyScore >= 60 ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {project.safetyScore}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Puntaje de seguridad</p>
                    <p className="text-xs text-slate-500">
                      {project.safetyScore >= 80 ? 'Excelente — Muy confiable' : project.safetyScore >= 60 ? 'Bueno — Confiable' : 'Regular — Verificar'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Conoce tu proyecto — Datos legales y de confianza */}
              <div className="card p-5 bg-white">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Conoce tu proyecto</h3>
                    <p className="text-2xs text-slate-400">Datos legales verificados</p>
                  </div>
                </div>

                {/* Inmobiliaria / Empresa */}
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Inmobiliaria</p>
                    <p className="text-sm font-bold text-slate-800">{project.developer.name}</p>
                    {project.developer.razonSocial && (
                      <p className="text-xs text-slate-500 mt-0.5">{project.developer.razonSocial}</p>
                    )}
                  </div>

                  {project.developer.ruc && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mb-1">RUC</p>
                        <p className="text-sm font-mono font-bold text-slate-800">{project.developer.ruc}</p>
                      </div>
                      <a
                        href={`https://e-consultaruc.sunat.gob.pe/cl-ti-itmrconsruc/FrameCriterioBusquedaWeb.jsp`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-2xs font-semibold text-primary-600 hover:text-primary-700 transition-colors px-2 py-1 rounded-md hover:bg-primary-50"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                        Verificar en SUNAT
                      </a>
                    </div>
                  </div>
                  )}

                  {project.partidaRegistral && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Partida Registral</p>
                        <p className="text-sm font-mono font-bold text-slate-800">N° {project.partidaRegistral}</p>
                      </div>
                      <a
                        href="https://www.sunarp.gob.pe/seccion/servicios-en-linea.asp"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-2xs font-semibold text-primary-600 hover:text-primary-700 transition-colors px-2 py-1 rounded-md hover:bg-primary-50"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
                        Verificar en SUNARP
                      </a>
                    </div>
                  </div>
                  )}

                  {project.developer.representanteLegal && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Representante legal</p>
                    <p className="text-sm font-semibold text-slate-800">{project.developer.representanteLegal}</p>
                  </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    {project.developer.anoConstitucion && (
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                      <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Constituida</p>
                      <p className="text-sm font-bold text-slate-800">{project.developer.anoConstitucion}</p>
                    </div>
                    )}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-center">
                      <p className="text-2xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Estado legal</p>
                      <p className={`text-xs font-bold px-2 py-0.5 rounded-md inline-block ${getLegalStatusColor(project.legalStatus)}`}>{getLegalStatusLabel(project.legalStatus)}</p>
                    </div>
                  </div>

                  {project.developer.website && (
                  <a
                    href={project.developer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50/50 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
                    Visitar web oficial
                  </a>
                  )}
                </div>
              </div>

              {/* Map */}
              <div className="card overflow-hidden bg-white">
                <div className="aspect-video bg-slate-100 relative">
                  <iframe
                    src={`https://maps.google.com/maps?q=${project.lat},${project.lng}&z=14&output=embed`}
                    className="w-full h-full border-0"
                    loading="lazy"
                    title="Ubicación"
                  />
                </div>
                <div className="p-3 text-center">
                  <p className="text-xs text-slate-500">{project.addressText}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ STEP: PRESUPUESTO / BENEFICIOS ══════════ */}
      {step === 'presupuesto' && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-600/25 text-white">
              <IconCalculator />
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {purchaseType === 'contado' ? 'Tus beneficios al contado' : 'Armemos tu presupuesto'}
            </h2>
            <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
              {purchaseType === 'contado'
                ? `Pago al contado para ${selectedLot ? selectedLot.label + ' (' + fmt(selectedLot.price) + ')' : 'tu lote'}. Revisa tus beneficios y elige tu premio.`
                : `Configura tu plan de financiamiento para ${selectedLot ? selectedLot.label + ' (' + fmt(selectedLot.price) + ')' : 'tu lote'}. Elige tu inicial y plazo para ver la cuota mensual estimada.`}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left — configurator */}
            <div className="lg:col-span-3 space-y-5">

              {/* Cuota inicial — visible para financiado y cuando auto-switch está activo */}
              {(purchaseType !== 'contado' || autoSwitchedToContado) && (
              <div className={`card p-6 ${autoSwitchedToContado ? 'bg-emerald-50/50 border border-emerald-200' : 'bg-white'}`}>
                {/* Banner de auto-switch */}
                {autoSwitchedToContado && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-emerald-100 border border-emerald-200">
                    <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p className="text-xs text-emerald-700 font-semibold">¡Cambiaste a pago al contado! Desliza hacia atrás si prefieres volver a financiado.</p>
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-900">{autoSwitchedToContado ? 'Monto de pago' : 'Cuota inicial'}</h3>
                  <span className={`text-lg font-black ${autoSwitchedToContado ? 'text-emerald-600' : 'text-primary-600'}`}>{fmt(initialPayment)}</span>
                </div>
                <input
                  type="range"
                  min={project.downPaymentMin}
                  max={lotPrice}
                  step={10}
                  value={initialPayment}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setInitialPayment(val);
                    // Auto-switch to contado when slider reaches 100%
                    if (val >= lotPrice && purchaseType === 'financiado') {
                      setPurchaseType('contado');
                      setAutoSwitchedToContado(true);
                    } else if (val < lotPrice && autoSwitchedToContado) {
                      // Slide back below 100% → revert to financiado
                      setPurchaseType('financiado');
                      setAutoSwitchedToContado(false);
                    }
                  }}
                  className={`w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg ${
                    autoSwitchedToContado
                      ? 'accent-emerald-600 [&::-webkit-slider-thumb]:bg-emerald-600'
                      : 'accent-primary-600 [&::-webkit-slider-thumb]:bg-primary-600'
                  }`}
                />
                <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                  <span>Mínimo: {fmt(project.downPaymentMin)}</span>
                  <span>Precio lote: {fmt(lotPrice)}</span>
                </div>

                {/* Quick buttons */}
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {[
                    { val: project.downPaymentMin, label: fmt(project.downPaymentMin) },
                    { val: Math.round(lotPrice * 0.3 / 10) * 10, label: '30%' },
                    { val: Math.round(lotPrice * 0.5 / 10) * 10, label: '50%' },
                    { val: lotPrice, label: '100%' },
                  ].map(({ val, label }) => (
                    <button
                      key={val}
                      onClick={() => {
                        setInitialPayment(val);
                        // Quick-select 100% → switch to contado
                        if (val >= lotPrice && purchaseType === 'financiado') {
                          setPurchaseType('contado');
                          setAutoSwitchedToContado(true);
                        } else if (val < lotPrice && autoSwitchedToContado) {
                          setPurchaseType('financiado');
                          setAutoSwitchedToContado(false);
                        }
                      }}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        initialPayment === val
                          ? val === lotPrice
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                            : 'bg-primary-50 border-primary-300 text-primary-700'
                          : 'border-slate-200 text-slate-500 hover:border-primary-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              )}

              {/* Beneficios por pago al contado */}
              <div className={`card p-6 border transition-all duration-300 ${
                rewardUnlocked
                  ? 'bg-white border-emerald-200 ring-1 ring-emerald-100'
                  : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      rewardUnlocked ? 'bg-emerald-100' : 'bg-slate-100'
                    }`}>
                      {rewardUnlocked
                        ? <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                        : <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                      }
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">Beneficios al contado</h3>
                      <p className="text-2xs text-slate-500">Gastos registrales <span className="font-semibold text-emerald-600">GRATIS</span> + premio a elegir</p>
                    </div>
                  </div>
                  {rewardUnlocked && (
                    <span className="text-2xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Desbloqueado
                    </span>
                  )}
                </div>

                {/* Progress bar — only shown in financiado/auto-switch mode */}
                {!isPureContado && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-2xs text-slate-400">{fmt(project.downPaymentMin)}</span>
                    <span className={`text-2xs font-semibold ${rewardUnlocked ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {fmt(rewardGoal)} (100%)
                    </span>
                  </div>
                  <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${
                        rewardUnlocked
                          ? 'bg-emerald-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${rewardProgressPercent}%` }}
                    />
                  </div>
                  <p className="text-right mt-1">
                    <span className={`text-2xs font-semibold ${rewardUnlocked ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {Math.round(rewardProgressPercent)}%
                    </span>
                  </p>
                </div>
                )}

                {/* Message */}
                {!rewardUnlocked ? (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-600">
                        Te falta <span className="font-bold text-amber-600">{fmt(amountToReward)}</span> para pagar al contado
                      </p>
                      <p className="text-2xs text-slate-400 mt-0.5">y obtener gastos registrales gratis + un premio</p>
                    </div>
                    <button
                      onClick={() => {
                        setInitialPayment(rewardGoal);
                        if (purchaseType === 'financiado') {
                          setPurchaseType('contado');
                          setAutoSwitchedToContado(true);
                        }
                      }}
                      className="flex-shrink-0 text-2xs font-semibold px-3 py-1.5 rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                    >
                      Pagar 100%
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <p className="text-sm font-semibold text-emerald-700">Pagas al contado</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Gastos registrales y notariales <strong>GRATIS</strong> + elige tu premio</p>
                  </div>
                )}

                {/* Gastos registrales */}
                <div className={`mt-4 p-3 rounded-lg border transition-all duration-300 ${
                  rewardUnlocked
                    ? 'bg-emerald-50/50 border-emerald-200'
                    : 'bg-slate-50 border-dashed border-slate-200'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                      rewardUnlocked ? 'bg-emerald-100' : 'bg-slate-100'
                    }`}>
                      {rewardUnlocked
                        ? <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        : <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-semibold ${rewardUnlocked ? 'text-emerald-700' : 'text-slate-400'}`}>
                        Gastos registrales y notariales
                      </p>
                      <p className={`text-2xs ${rewardUnlocked ? 'text-emerald-600' : 'text-slate-300'}`}>
                        {rewardUnlocked ? 'Incluido con tu pago al contado' : `Paga ${fmt(rewardGoal)} al contado para desbloquear`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bonus prize selector */}
                {rewardUnlocked && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-slate-900">Elige tu premio adicional</p>
                      <span className="text-2xs text-amber-500 font-semibold bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">Selecciona 1</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {bonusPrizes.map((prize) => {
                        const isSelected = selectedPrize === prize.id;
                        return (
                          <button
                            key={prize.id}
                            onClick={() => setSelectedPrize(isSelected ? null : prize.id)}
                            className={`group relative p-3.5 rounded-xl border-2 text-left transition-all duration-200 ${
                              isSelected
                                ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400 ring-2 ring-amber-200/60 shadow-md shadow-amber-100/50 scale-[1.02]'
                                : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/40 hover:shadow-sm hover:scale-[1.01]'
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-amber-300/50">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                              </div>
                            )}
                            <div className="flex items-start gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                                isSelected
                                  ? 'bg-gradient-to-br from-amber-400 to-orange-400 shadow-sm shadow-amber-200/50'
                                  : 'bg-slate-100 group-hover:bg-amber-100'
                              }`}>
                                {prize.icon(`w-4.5 h-4.5 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-amber-600'} transition-colors`)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-xs font-bold leading-tight transition-colors ${isSelected ? 'text-amber-800' : 'text-slate-700 group-hover:text-amber-700'}`}>{prize.label}</p>
                                <p className={`text-2xs mt-0.5 leading-tight transition-colors ${isSelected ? 'text-amber-600/80' : 'text-slate-400 group-hover:text-amber-500/70'}`}>{prize.description}</p>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Preview locked prizes */}
                {!rewardUnlocked && (
                  <div className="mt-4">
                    <p className="text-2xs text-slate-400 mb-2 font-medium">Premios adicionales al pagar al contado:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {bonusPrizes.map((prize) => (
                        <span key={prize.id} className="text-2xs text-slate-400 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-md inline-flex items-center gap-1.5">
                          <span className="opacity-40">{prize.icon('w-3 h-3')}</span>
                          {prize.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Plazo */}
              <div className={`card p-6 bg-white relative transition-all duration-300 ${rewardUnlocked ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                {rewardUnlocked && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 rounded-2xl backdrop-blur-[1px]">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 border border-slate-200">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
                      <span className="text-xs font-semibold text-slate-500">Pago al contado — sin financiamiento</span>
                    </div>
                  </div>
                )}
                <h3 className="text-sm font-bold text-slate-900 mb-4">Plazo de financiamiento</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {termOptions.map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedTermMonths(m)}
                      className={`relative py-3 rounded-xl border-2 text-center transition-all ${
                        selectedTermMonths === m
                          ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200 shadow-md'
                          : 'border-slate-200 bg-white hover:border-primary-200'
                      }`}
                    >
                      <p className={`text-lg font-black ${selectedTermMonths === m ? 'text-primary-700' : 'text-slate-800'}`}>{m}</p>
                      <p className="text-2xs text-slate-400 mt-0.5">meses</p>
                      {selectedTermMonths === m && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary-500 text-white rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
                  El plazo sugerido por la inmobiliaria es de {project.termMonthsEst} meses
                </p>
              </div>

              {/* Simulation table — only for financiado */}
              {purchaseType !== 'contado' && (
              <div className="card p-6 bg-white">
                <h3 className="text-sm font-bold text-slate-900 mb-4">Simulación por rango de lotes</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-xs text-slate-400 font-semibold pb-3 pr-4">Precio del lote</th>
                        <th className="text-right text-xs text-slate-400 font-semibold pb-3 pr-4">Saldo a financiar</th>
                        <th className="text-right text-xs text-slate-400 font-semibold pb-3">Cuota mensual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {[lotPrice, Math.round((lotPrice + project.maxPrice) / 2), project.maxPrice].filter((v, i, a) => a.indexOf(v) === i).map((price) => {
                        const remaining = Math.max(price - initialPayment, 0);
                        const monthly = remaining > 0 ? Math.ceil(remaining / selectedTermMonths) : 0;
                        return (
                          <tr key={price} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 pr-4 font-semibold text-slate-800">{fmt(price)}</td>
                            <td className="py-3 pr-4 text-right text-slate-600">{fmt(remaining)}</td>
                            <td className="py-3 text-right">
                              <span className="font-bold text-primary-600">{fmt(monthly)}/mes</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              )}
            </div>
            <div className="lg:col-span-2 space-y-5">
              {/* Main result card */}
              <div className="card p-6 bg-gradient-to-br from-primary-600 to-primary-800 text-white overflow-hidden sticky top-20">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl" />
                <div className="relative z-10">
                  <p className="text-primary-200 text-xs font-semibold uppercase tracking-wider mb-1">
                    {purchaseType === 'contado' ? 'Tu pago al contado' : 'Tu plan de financiamiento'}
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-primary-200 text-sm">{purchaseType === 'contado' ? 'Pago total' : 'Inicial'}</span>
                      <span className="font-bold text-lg">{fmt(effectiveInitialPayment)}</span>
                    </div>
                    {purchaseType !== 'contado' && (
                    <>
                    <div className="flex items-center justify-between">
                      <span className="text-primary-200 text-sm">Plazo</span>
                      <span className="font-bold text-lg">{selectedTermMonths} meses</span>
                    </div>
                    <div className="h-px bg-white/20 my-2" />
                    <div className="flex items-center justify-between">
                      <span className="text-primary-200 text-sm">Cuota estimada desde</span>
                      <span className="font-black text-2xl">{fmt(calcMonthly(lotPrice))}</span>
                    </div>
                    <p className="text-primary-300/60 text-2xs">*Basado en el precio de {selectedLot ? selectedLot.label : 'lote'} ({fmt(lotPrice)}). Sin intereses.</p>
                    </>
                    )}
                    {purchaseType === 'contado' && (
                    <>
                    <div className="h-px bg-white/20 my-2" />
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span className="text-sm text-emerald-200">Gastos registrales GRATIS</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <span className="text-sm text-emerald-200">Premio adicional a elegir</span>
                    </div>
                    </>
                    )}
                  </div>

                  <button
                    onClick={() => setStep('datos')}
                    className="w-full mt-5 bg-white text-primary-700 font-bold py-3.5 rounded-xl transition-all hover:bg-primary-50 text-sm shadow-lg"
                  >
                    Continuar a reservar →
                  </button>
                </div>
              </div>

              {/* Benefits — only for financiado */}
              {purchaseType !== 'contado' && (
              <div className="card p-5 bg-white">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Beneficios del financiamiento</h3>
                <div className="space-y-2.5">
                  {[
                    'Sin intereses — cuotas fijas mensuales',
                    `Hasta ${termOptions[termOptions.length - 1]} meses de plazo`,
                    'Terreno a tu nombre desde el primer pago',
                    'Sin evaluación crediticia',
                    'Asesoría personalizada incluida',
                  ].map((text) => (
                    <div key={text} className="flex items-start gap-2.5">
                      <svg className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      <p className="text-xs text-slate-600">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* Contact */}
              {/* Sidebar reward */}
              <div className={`card p-5 border ${rewardUnlocked ? 'bg-emerald-50/50 border-emerald-200' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center ${rewardUnlocked ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    {rewardUnlocked
                      ? <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                      : <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>
                    }
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{rewardUnlocked ? 'Premios desbloqueados' : 'Premios al contado'}</h3>
                </div>
                {/* Gastos registrales */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/80 border border-slate-100">
                  <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${rewardUnlocked ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                    {rewardUnlocked
                      ? <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                      : <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-2xs font-bold text-slate-800">Gastos registrales y notariales</p>
                    <p className={`text-2xs ${rewardUnlocked ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
                      {rewardUnlocked ? 'GRATIS' : `Paga al contado (${fmt(rewardGoal)})`}
                    </p>
                  </div>
                </div>
                {/* Selected bonus prize */}
                {rewardUnlocked && selectedPrize && (
                  <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 mt-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-amber-400 to-orange-400 shadow-sm shadow-amber-200/50">
                      {bonusPrizes.find(p => p.id === selectedPrize)?.icon('w-4 h-4 text-white')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-2xs font-bold text-amber-800">{bonusPrizes.find(p => p.id === selectedPrize)?.label}</p>
                      <p className="text-2xs text-amber-600 font-semibold">Premio elegido</p>
                    </div>
                  </div>
                )}
                {rewardUnlocked && !selectedPrize && (
                  <p className="text-2xs text-amber-600 mt-2 font-medium text-center">
                    Elige tu premio adicional
                  </p>
                )}
                {!rewardUnlocked && (
                  <p className="text-2xs text-slate-500 mt-2.5 font-medium text-center">
                    Te falta {fmt(amountToReward)} para desbloquear
                  </p>
                )}
              </div>

              {/* Contact */}
              <div className="card p-5 bg-amber-50 border border-amber-100">
                <p className="text-sm font-bold text-amber-800 mb-1">¿Necesitas ayuda?</p>
                <p className="text-xs text-amber-600 mb-3">Un asesor puede ayudarte a elegir el mejor plan.</p>
                <a
                  href={`https://wa.me/51999999999?text=${purchaseType === 'contado' ? `Hola, quiero comprar al contado un lote en ${project.name}.` : `Hola, quiero financiar un lote en ${project.name}. Inicial: ${fmt(initialPayment)}, Plazo: ${selectedTermMonths} meses.`}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-all"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Hablar con un asesor
                </a>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-start">
            <button onClick={() => setStep('seleccionar')} className="text-sm text-slate-500 hover:text-slate-700 font-medium">
              ← Volver a elegir lote
            </button>
          </div>
        </div>
      )}

      {/* ══════════ STEP 2: SELECCIONAR LOTE (EXPERIENCIA INTERACTIVA) ══════════ */}
      {step === 'seleccionar' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-40 lg:pb-6">
          {/* Interactive Lot Experience */}
          <InteractiveLotMap
            project={project}
            lots={lots}
            selectedLot={selectedLot}
            onSelectLot={setSelectedLot}
            purchaseType={purchaseType}
            calcMonthly={calcMonthly}
          />

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <button onClick={() => setStep('explorar')} className="text-sm text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              Volver a explorar
            </button>
            <button
              onClick={() => {
                if (selectedLot) {
                  setInitialPayment(Math.round(selectedLot.price * 0.34));
                  setStep('presupuesto');
                }
              }}
              disabled={!selectedLot}
              className={`group px-8 py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg flex items-center gap-2 ${
                selectedLot
                  ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-primary-200/50 hover:shadow-xl hover:shadow-primary-200/40'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {selectedLot
                ? `${purchaseType === 'financiado' ? 'Armar presupuesto' : 'Ver beneficios'} para ${selectedLot.label}`
                : 'Selecciona un lote para continuar'
              }
              {selectedLot && (
                <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ══════════ STEP 3: DATOS + PAGO ══════════ */}
      {step === 'datos' && selectedLot && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Form */}
            <div className="lg:col-span-3 space-y-5">
              <div className="card p-6 bg-white">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Datos personales</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
                    <input
                      type="text"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none"
                      placeholder="Juan Carlos Pérez López"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">DNI *</label>
                    <input
                      type="text"
                      value={formData.clientDni}
                      onChange={(e) => setFormData({ ...formData, clientDni: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none"
                      placeholder="12345678"
                      maxLength={8}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico *</label>
                    <input
                      type="email"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono / WhatsApp *</label>
                    <input
                      type="tel"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                      className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:border-primary-400 focus:ring-1 focus:ring-primary-400 outline-none"
                      placeholder="987654321"
                      maxLength={9}
                    />
                  </div>
                </div>
              </div>

              <div className="card p-6 bg-white">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Método de pago</h2>
                <p className="text-sm text-slate-500 mb-4">
                  Realiza la transferencia o pago por <strong>{fmt(project.reservationAmount || 1000)}</strong> y sube tu comprobante.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
                  {[
                    { key: 'yape' as const, label: 'Yape', emoji: '💜' },
                    { key: 'plin' as const, label: 'Plin', emoji: '💚' },
                    { key: 'transferencia' as const, label: 'Transferencia', emoji: '🏦' },
                    { key: 'otro' as const, label: 'Otro', emoji: '💳' },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setFormData({ ...formData, paymentMethod: m.key })}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        formData.paymentMethod === m.key
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{m.emoji}</span>
                      <span className="text-xs font-medium text-slate-700">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Payment instructions */}
                <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
                  <p className="text-sm font-semibold text-slate-800 mb-2">Datos para {formData.paymentMethod === 'yape' ? 'Yape' : formData.paymentMethod === 'plin' ? 'Plin' : formData.paymentMethod === 'transferencia' ? 'transferencia bancaria' : 'pago'}:</p>
                  {formData.paymentMethod === 'yape' || formData.paymentMethod === 'plin' ? (
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Número: <span className="font-bold text-slate-800">987 654 321</span></p>
                      <p>Nombre: <span className="font-bold text-slate-800">PerúInversión SAC</span></p>
                      <p>Monto: <span className="font-bold text-primary-600">{fmt(project.reservationAmount || 1000)}</span></p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>Banco: <span className="font-bold text-slate-800">BCP</span></p>
                      <p>Cuenta: <span className="font-bold text-slate-800">191-12345678-0-12</span></p>
                      <p>CCI: <span className="font-bold text-slate-800">002-191-12345678012-10</span></p>
                      <p>Titular: <span className="font-bold text-slate-800">PerúInversión SAC</span></p>
                      <p>Monto: <span className="font-bold text-primary-600">{fmt(project.reservationAmount || 1000)}</span></p>
                    </div>
                  )}
                </div>

                {/* Upload voucher */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subir comprobante de pago *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {!voucherImage ? (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-slate-300 hover:border-primary-400 rounded-xl p-8 text-center transition-colors group"
                    >
                      <IconUpload />
                      <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 group-hover:bg-primary-50 flex items-center justify-center mb-3 transition-colors">
                        <IconUpload />
                      </div>
                      <p className="text-sm font-medium text-slate-600">Haz clic para subir tu voucher</p>
                      <p className="text-xs text-slate-400 mt-1">JPG, PNG — Máximo 5MB</p>
                    </button>
                  ) : (
                    <div className="relative border border-slate-200 rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={voucherImage} alt="Comprobante" className="w-full max-h-64 object-contain bg-slate-50" />
                      <div className="p-3 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                          <IconCheck /> {voucherName}
                        </div>
                        <button
                          onClick={() => { setVoucherImage(''); setVoucherName(''); }}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order summary sidebar */}
            <div className="lg:col-span-2">
              <div className="card p-6 bg-white sticky top-[140px]">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumen de reserva</h3>
                
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <p className="text-sm font-semibold text-slate-800">{project.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{project.zone}, {project.city}</p>
                </div>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Lote seleccionado</span>
                    <span className="font-semibold text-slate-800">{selectedLot.label}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Área</span>
                    <span className="font-medium text-slate-800">{selectedLot.area} m²</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Precio del lote</span>
                    <span className="font-bold text-slate-800">{fmt(selectedLot.price)}</span>
                  </div>

                  {/* Plan de pago */}
                  <div className="border-t border-slate-200 pt-3 space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Tipo de compra</span>
                      <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${
                        purchaseType === 'contado'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-primary-50 text-primary-700 border border-primary-200'
                      }`}>
                        {purchaseType === 'contado' ? 'Al contado' : 'Financiado'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">{purchaseType === 'contado' ? 'Pago total' : 'Cuota inicial'}</span>
                      <span className="font-semibold text-slate-800">{fmt(initialPayment)}</span>
                    </div>
                    {purchaseType === 'financiado' && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Plazo</span>
                          <span className="font-semibold text-slate-800">{selectedTermMonths} meses</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Cuota mensual est.</span>
                          <span className="font-semibold text-primary-600">{fmt(calcMonthly(selectedLot.price))}/mes</span>
                        </div>
                      </>
                    )}
                    {purchaseType === 'contado' && selectedPrize && (
                      <div className="flex justify-between text-sm items-center">
                        <span className="text-slate-500">Premio elegido</span>
                        <span className="font-semibold text-amber-700 text-xs bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                          {bonusPrizes.find(p => p.id === selectedPrize)?.label}
                        </span>
                      </div>
                    )}
                    {purchaseType === 'contado' && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Gastos registrales</span>
                        <span className="font-bold text-emerald-600">GRATIS</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Monto de reserva</span>
                      <span className="text-lg font-bold text-primary-600">{fmt(project.reservationAmount || 1000)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-5">
                  <p className="text-xs text-amber-700 leading-relaxed">
                    El monto de reserva <strong>no es el precio total</strong>. Es para separar tu lote mientras un asesor te contacta para formalizar la compra.
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !formData.clientName || !formData.clientDni || !formData.clientEmail || !formData.clientPhone || !voucherImage}
                  className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all ${
                    submitting
                      ? 'bg-slate-300 text-slate-500 cursor-wait'
                      : formData.clientName && formData.clientDni && formData.clientEmail && formData.clientPhone && voucherImage
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-200/50'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                      Procesando...
                    </span>
                  ) : (
                    `Confirmar reserva — ${fmt(project.reservationAmount || 1000)}`
                  )}
                </button>

                <button onClick={() => setStep('seleccionar')} className="w-full mt-3 text-sm text-slate-500 hover:text-slate-700 font-medium py-2">
                  ← Cambiar lote
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ STEP 4: CONFIRMACIÓN ══════════ */}
      {step === 'confirmacion' && (
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="card p-8 bg-white text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Reserva enviada!</h2>
            <p className="text-slate-500 mb-6">Tu solicitud fue registrada correctamente. Un asesor revisará tu comprobante y te contactará en las próximas 24 horas.</p>
            
            <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 mb-6">
              <p className="text-xs text-primary-500 uppercase tracking-wider font-semibold mb-1">Tu código de seguimiento</p>
              <p className="text-3xl font-black text-primary-700 tracking-wider">{reservationCode}</p>
              <p className="text-xs text-primary-500 mt-2">Guarda este código para consultar el estado de tu reserva</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-6 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Proyecto</span>
                <span className="font-medium text-slate-800">{project.name}</span>
              </div>
              {selectedLot && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Lote</span>
                    <span className="font-medium text-slate-800">{selectedLot.label}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Precio del lote</span>
                    <span className="font-medium text-slate-800">{fmt(selectedLot.price)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                <span className="text-slate-500">Reserva pagada</span>
                <span className="font-bold text-primary-600">{fmt(project.reservationAmount || 1000)}</span>
              </div>
            </div>

            {/* Plan de pago details */}
            <div className={`rounded-xl p-4 mb-6 text-left space-y-2 ${
              purchaseType === 'contado' ? 'bg-emerald-50 border border-emerald-100' : 'bg-primary-50 border border-primary-100'
            }`}>
              <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                purchaseType === 'contado' ? 'text-emerald-600' : 'text-primary-500'
              }`}>
                {purchaseType === 'contado' ? 'Pago al contado' : 'Plan de financiamiento'}
              </p>
              <div className="flex justify-between text-sm">
                <span className={purchaseType === 'contado' ? 'text-emerald-600' : 'text-primary-500'}>
                  {purchaseType === 'contado' ? 'Pago total' : 'Cuota inicial'}
                </span>
                <span className={`font-semibold ${purchaseType === 'contado' ? 'text-emerald-800' : 'text-primary-800'}`}>
                  {fmt(initialPayment)}
                </span>
              </div>
              {purchaseType === 'financiado' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-primary-500">Plazo</span>
                    <span className="font-semibold text-primary-800">{selectedTermMonths} meses</span>
                  </div>
                  {selectedLot && (
                    <div className="flex justify-between text-sm">
                      <span className="text-primary-500">Cuota mensual est.</span>
                      <span className="font-bold text-primary-700">{fmt(calcMonthly(selectedLot.price))}/mes</span>
                    </div>
                  )}
                </>
              )}
              {purchaseType === 'contado' && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-600">Gastos registrales</span>
                    <span className="font-bold text-emerald-700">GRATIS</span>
                  </div>
                  {selectedPrize && (
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600">Premio elegido</span>
                      <span className="font-semibold text-emerald-800">{bonusPrizes.find(p => p.id === selectedPrize)?.label}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/mi-reserva?code=${reservationCode}`}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Ver estado de mi reserva
              </Link>
              <Link
                href="/"
                className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium py-3 rounded-xl transition-colors text-sm"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ MODAL: TIPO DE COMPRA ══════════ */}
      {showTipoModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowTipoModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="relative px-6 pt-6 pb-4">
              <button
                onClick={() => setShowTipoModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" /></svg>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">¿Cómo deseas comprar?</h2>
                  <p className="text-xs text-slate-400">Selecciona tu modalidad de pago</p>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6 space-y-3">
              <button
                onClick={() => { setPurchaseType('financiado'); setInitialPayment(project.downPaymentMin); setAutoSwitchedToContado(false); setShowTipoModal(false); }}
                className={`group w-full text-left p-4 rounded-xl border-2 transition-all ${
                  purchaseType === 'financiado' && initialTipo
                    ? 'border-primary-400 bg-primary-50/50'
                    : 'border-slate-200 hover:border-primary-400 hover:bg-primary-50/50'
                }`}
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
                      Paga tu lote en cómodas cuotas mensuales sin intereses.
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
              <button
                onClick={() => { setPurchaseType('contado'); setInitialPayment(rewardGoal); setAutoSwitchedToContado(false); setStep('presupuesto'); setShowTipoModal(false); }}
                className={`group w-full text-left p-4 rounded-xl border-2 transition-all ${
                  purchaseType === 'contado' && initialTipo
                    ? 'border-emerald-400 bg-emerald-50/50'
                    : 'border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50'
                }`}
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
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100">
              <p className="text-2xs text-slate-400 text-center">
                Podrás ver todos los detalles antes de confirmar tu reserva
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ LIGHTBOX ══════════ */}
      {lightboxOpen && currentGalleryImages.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center" onClick={() => setLightboxOpen(false)}>
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl z-10" onClick={() => setLightboxOpen(false)}>✕</button>
          {currentGalleryImages.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl z-10"
                onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i - 1 + currentGalleryImages.length) % currentGalleryImages.length); }}
              >
                ‹
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl z-10"
                onClick={(e) => { e.stopPropagation(); setGalleryIndex((i) => (i + 1) % currentGalleryImages.length); }}
              >
                ›
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentGalleryImages[galleryIndex]}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {galleryIndex + 1} / {currentGalleryImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
