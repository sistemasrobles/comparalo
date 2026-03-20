// ============================================
// ADMIN STORE - localStorage CMS
// Gestión completa de proyectos, slider y config
// ============================================

import { type ProjectData, type LotData, type PlanData, type BlockShape, type DetectedPlanLot, type LotShape, type GeneratedLayout, type GeneratedBlock, type GeneratedLot, PROJECTS as DEFAULT_PROJECTS } from './projects-data';

// ── Keys ──
const PROJECTS_KEY   = 'peruinversion_admin_projects';
const HERO_KEY       = 'peruinversion_admin_hero';
const CONFIG_KEY     = 'peruinversion_admin_config';
const FERIA_KEY      = 'peruinversion_admin_feria';
const AD_BANNERS_KEY = 'peruinversion_admin_ad_banners';
const CHAT_KEY       = 'peruinversion_admin_chat';
const LOT_SHAPES_KEY = 'peruinversion_lot_shapes';
const GENERATED_LAYOUTS_KEY = 'peruinversion_generated_layouts';

// ── Hero Slide ──
export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  order: number;
}

// ── Site Config ──
export interface SiteConfig {
  siteName: string;
  siteSubtitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  adminPassword: string;
}

// ── Feria Banner Config ──
export interface FeriaConfig {
  active: boolean;
  name: string;
  dates: string;
  place: string;
  endDate: string;
  ctaUrl: string;
  ctaLabel: string;
  theme: 'orange' | 'blue' | 'green' | 'purple';
}

// ── Project Ad Banner ──
export interface ProjectAdBanner {
  id: string;
  active: boolean;
  order: number;
  label: string;
  bgImage: string;
  ctaUrl: string;
}

// ── Chat flotante ──
export interface ChatConfig {
  active: boolean;
  agentName: string;
  agentRole: string;
  agentAvatar: string;   // URL de foto del agente (opcional)
  welcomeMessage: string;
  whatsappNumber: string; // ej: "51987654321" (con código de país, sin +)
  accentColor: string;    // ej: "#7c3aed"
}

const DEFAULT_HERO: HeroSlide[] = [
  { id: 'h1', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&h=900&fit=crop&q=80', title: 'Encuentra el terreno ideal para tu inversión', subtitle: 'Compara precios, seguridad jurídica y proyección de valorización en las principales ciudades de Perú.', order: 0 },
  { id: 'h2', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=900&fit=crop&q=80', title: 'Compara hasta 4 proyectos lado a lado', subtitle: 'Analiza precio por m², servicios, acceso y financiamiento de forma clara y transparente.', order: 1 },
  { id: 'h3', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=900&fit=crop&q=80', title: 'Simula tu inversión y toma la mejor decisión', subtitle: 'Calcula cuotas, proyecta valorización y descubre proyectos que se ajustan a tu presupuesto.', order: 2 },
];

const DEFAULT_CONFIG: SiteConfig = {
  siteName: 'PerúInversión',
  siteSubtitle: 'La forma más inteligente de invertir en terrenos',
  ctaTitle: '¿Listo para invertir en tu terreno?',
  ctaSubtitle: 'Compara, simula y decide con datos reales.',
  adminPassword: 'admin2024',
};

const DEFAULT_FERIA: FeriaConfig = {
  active: true,
  name: 'Feria PerúInversión 2026',
  dates: '28, 29 y 30 de marzo',
  place: 'Centro de Convenciones de Lima',
  endDate: '2026-03-30T23:59:59',
  ctaUrl: '/feria',
  ctaLabel: 'Ver feria →',
  theme: 'orange',
};

// ── Helpers ──
function genId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function slugify(text: string): string {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ═══════════════════════════════
// PROJECTS CRUD
// ═══════════════════════════════

export function getAdminProjects(): ProjectData[] {
  if (typeof window === 'undefined') return DEFAULT_PROJECTS;
  try {
    const data = localStorage.getItem(PROJECTS_KEY);
    if (data) return JSON.parse(data);
    // First time: seed with defaults
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(DEFAULT_PROJECTS));
    return DEFAULT_PROJECTS;
  } catch {
    return DEFAULT_PROJECTS;
  }
}

function saveProjects(projects: ProjectData[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
}

export function createProject(data: Partial<ProjectData>): ProjectData {
  const projects = getAdminProjects();
  const newProject: ProjectData = {
    id: genId(),
    name: data.name || 'Nuevo Proyecto',
    slug: data.slug || slugify(data.name || 'nuevo-proyecto'),
    category: data.category || 'lotes',
    description: data.description || '',
    shortDescription: data.shortDescription || '',
    developer: data.developer || { name: '', slug: '', website: '' },
    city: data.city || '',
    zone: data.zone || '',
    region: data.region || '',
    addressText: data.addressText || '',
    minPrice: data.minPrice || 0,
    maxPrice: data.maxPrice || 0,
    priceM2Min: data.priceM2Min || 0,
    priceM2Max: data.priceM2Max || 0,
    lotSizeMin: data.lotSizeMin || 0,
    lotSizeMax: data.lotSizeMax || 0,
    totalLots: data.totalLots || 0,
    downPaymentMin: data.downPaymentMin || 0,
    monthlyPaymentEst: data.monthlyPaymentEst || 0,
    termMonthsEst: data.termMonthsEst || 0,
    lat: data.lat || 0,
    lng: data.lng || 0,
    accessType: data.accessType || 'PISTA_ASFALTADA',
    legalStatus: data.legalStatus || 'EN_TRAMITE',
    distanceToCityCenterKm: data.distanceToCityCenterKm || 0,
    safetyScore: data.safetyScore || 50,
    valorizationEstimate: data.valorizationEstimate || 0,
    services: data.services || {},
    isFeatured: data.isFeatured || false,
    isActive: data.isActive !== undefined ? data.isActive : true,
    imageUrl: data.imageUrl || '',
    isExclusive: data.isExclusive || false,
    reservationAmount: data.reservationAmount || 0,
    galleryImages: data.galleryImages || [],
    renderImages: data.renderImages || [],
    lotPlanImage: data.lotPlanImage || '',
    videoUrl: data.videoUrl || '',
    amenities: data.amenities || [],
    lots: data.lots || [],
  };
  projects.push(newProject);
  saveProjects(projects);
  return newProject;
}

export function updateProject(id: string, data: Partial<ProjectData>): ProjectData | null {
  const projects = getAdminProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...data };
  if (data.name && !data.slug) {
    projects[idx].slug = slugify(data.name);
  }
  saveProjects(projects);
  return projects[idx];
}

export function deleteProject(id: string): boolean {
  const projects = getAdminProjects();
  const filtered = projects.filter((p) => p.id !== id);
  if (filtered.length === projects.length) return false;
  saveProjects(filtered);
  return true;
}

export function duplicateProject(id: string): ProjectData | null {
  const projects = getAdminProjects();
  const original = projects.find((p) => p.id === id);
  if (!original) return null;
  const copy: ProjectData = {
    ...JSON.parse(JSON.stringify(original)),
    id: genId(),
    name: `${original.name} (copia)`,
    slug: `${original.slug}-copia-${Date.now()}`,
  };
  projects.push(copy);
  saveProjects(projects);
  return copy;
}

// ── Lots CRUD within a project ──

export function addLot(projectId: string, lot: Omit<LotData, 'id'>): LotData | null {
  const projects = getAdminProjects();
  const p = projects.find((x) => x.id === projectId);
  if (!p) return null;
  if (!p.lots) p.lots = [];
  const newLot: LotData = { ...lot, id: `lot_${genId()}` };
  p.lots.push(newLot);
  saveProjects(projects);
  return newLot;
}

export function updateLot(projectId: string, lotId: string, data: Partial<LotData>): LotData | null {
  const projects = getAdminProjects();
  const p = projects.find((x) => x.id === projectId);
  if (!p || !p.lots) return null;
  const idx = p.lots.findIndex((l) => l.id === lotId);
  if (idx === -1) return null;
  p.lots[idx] = { ...p.lots[idx], ...data };
  saveProjects(projects);
  return p.lots[idx];
}

export function deleteLot(projectId: string, lotId: string): boolean {
  const projects = getAdminProjects();
  const p = projects.find((x) => x.id === projectId);
  if (!p || !p.lots) return false;
  const before = p.lots.length;
  p.lots = p.lots.filter((l) => l.id !== lotId);
  if (p.lots.length === before) return false;
  saveProjects(projects);
  return true;
}

// ── Plan CRUD ──

export function updatePlanImage(projectId: string, imageUrl: string, imageWidth: number, imageHeight: number): PlanData | null {
  const projects = getAdminProjects();
  const p = projects.find((x) => x.id === projectId);
  if (!p) return null;
  if (!p.planData) {
    p.planData = { imageUrl, imageWidth, imageHeight, blocks: [], detections: [] };
  } else {
    p.planData.imageUrl = imageUrl;
    p.planData.imageWidth = imageWidth;
    p.planData.imageHeight = imageHeight;
  }
  saveProjects(projects);
  return p.planData;
}

export function removePlanImage(projectId: string): boolean {
  const projects = getAdminProjects();
  const p = projects.find((x) => x.id === projectId);
  if (!p) return false;
  p.planData = undefined;
  saveProjects(projects);
  return true;
}

/** @deprecated — kept for backward compat */
export function addBlockShape(projectId: string, block: Omit<BlockShape, 'id'>): BlockShape | null {
  const projects = getAdminProjects();
  const p = projects.find((x) => x.id === projectId);
  if (!p || !p.planData) return null;
  const newBlock: BlockShape = { ...block, id: `blk_${genId()}` };
  p.planData.blocks.push(newBlock);
  saveProjects(projects);
  return newBlock;
}

/** @deprecated — kept for backward compat */
export function updateBlockShape(projectId: string, blockId: string, data: Partial<BlockShape>): BlockShape | null {
  const projects = getAdminProjects();
  const p = projects.find((x) => x.id === projectId);
  if (!p || !p.planData) return null;
  const idx = p.planData.blocks.findIndex((b) => b.id === blockId);
  if (idx === -1) return null;
  p.planData.blocks[idx] = { ...p.planData.blocks[idx], ...data };
  saveProjects(projects);
  return p.planData.blocks[idx];
}

/** @deprecated — kept for backward compat */
export function deleteBlockShape(projectId: string, blockId: string): boolean {
  const projects = getAdminProjects();
  const p = projects.find((x) => x.id === projectId);
  if (!p || !p.planData) return false;
  const before = p.planData.blocks.length;
  p.planData.blocks = p.planData.blocks.filter((b) => b.id !== blockId);
  if (p.planData.blocks.length === before) return false;
  saveProjects(projects);
  return true;
}

// ── Detection CRUD (new polygon-based system) ──

export function saveDetections(projectId: string, detections: DetectedPlanLot[]): boolean {
  const projects = getAdminProjects();
  const p = projects.find((x) => x.id === projectId);
  if (!p || !p.planData) return false;
  p.planData.detections = detections;
  p.planData.lastDetectionAt = new Date().toISOString();
  saveProjects(projects);
  return true;
}

export function getDetections(projectId: string): DetectedPlanLot[] {
  const projects = getAdminProjects();
  const p = projects.find((x) => x.id === projectId);
  return p?.planData?.detections || [];
}

export function updateDetection(projectId: string, detectionId: string, data: Partial<DetectedPlanLot>): DetectedPlanLot | null {
  const projects = getAdminProjects();
  const p = projects.find((x) => x.id === projectId);
  if (!p || !p.planData?.detections) return null;
  const idx = p.planData.detections.findIndex((d) => d.id === detectionId);
  if (idx === -1) return null;
  p.planData.detections[idx] = { ...p.planData.detections[idx], ...data };
  saveProjects(projects);
  return p.planData.detections[idx];
}

export function deleteDetection(projectId: string, detectionId: string): boolean {
  const projects = getAdminProjects();
  const p = projects.find((x) => x.id === projectId);
  if (!p || !p.planData?.detections) return false;
  const before = p.planData.detections.length;
  p.planData.detections = p.planData.detections.filter((d) => d.id !== detectionId);
  if (p.planData.detections.length === before) return false;
  saveProjects(projects);
  return true;
}

export function clearDetections(projectId: string): boolean {
  const projects = getAdminProjects();
  const p = projects.find((x) => x.id === projectId);
  if (!p || !p.planData) return false;
  p.planData.detections = [];
  p.planData.lastDetectionAt = undefined;
  saveProjects(projects);
  return true;
}

// ═══════════════════════════════
// HERO SLIDES CRUD
// ═══════════════════════════════

export function getHeroSlides(): HeroSlide[] {
  if (typeof window === 'undefined') return DEFAULT_HERO;
  try {
    const data = localStorage.getItem(HERO_KEY);
    if (data) return JSON.parse(data);
    localStorage.setItem(HERO_KEY, JSON.stringify(DEFAULT_HERO));
    return DEFAULT_HERO;
  } catch {
    return DEFAULT_HERO;
  }
}

function saveHero(slides: HeroSlide[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HERO_KEY, JSON.stringify(slides));
}

export function createHeroSlide(data: Omit<HeroSlide, 'id' | 'order'>): HeroSlide {
  const slides = getHeroSlides();
  const newSlide: HeroSlide = { ...data, id: `hero_${genId()}`, order: slides.length };
  slides.push(newSlide);
  saveHero(slides);
  return newSlide;
}

export function updateHeroSlide(id: string, data: Partial<HeroSlide>): HeroSlide | null {
  const slides = getHeroSlides();
  const idx = slides.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  slides[idx] = { ...slides[idx], ...data };
  saveHero(slides);
  return slides[idx];
}

export function deleteHeroSlide(id: string): boolean {
  const slides = getHeroSlides();
  const filtered = slides.filter((s) => s.id !== id);
  if (filtered.length === slides.length) return false;
  // Reorder
  filtered.forEach((s, i) => (s.order = i));
  saveHero(filtered);
  return true;
}

export function reorderHeroSlides(orderedIds: string[]): void {
  const slides = getHeroSlides();
  const reordered = orderedIds.map((id, i) => {
    const s = slides.find((x) => x.id === id);
    if (s) s.order = i;
    return s;
  }).filter(Boolean) as HeroSlide[];
  saveHero(reordered);
}

// ═══════════════════════════════
// SITE CONFIG
// ═══════════════════════════════

export function getSiteConfig(): SiteConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const data = localStorage.getItem(CONFIG_KEY);
    if (data) return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
    localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function updateSiteConfig(data: Partial<SiteConfig>): SiteConfig {
  const config = getSiteConfig();
  const updated = { ...config, ...data };
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
  }
  return updated;
}

// ═══════════════════════════════
// FERIA BANNER CONFIG
// ═══════════════════════════════

export function getFeriaConfig(): FeriaConfig {
  if (typeof window === 'undefined') return DEFAULT_FERIA;
  try {
    const data = localStorage.getItem(FERIA_KEY);
    return data ? { ...DEFAULT_FERIA, ...JSON.parse(data) } : DEFAULT_FERIA;
  } catch {
    return DEFAULT_FERIA;
  }
}

export function updateFeriaConfig(data: Partial<FeriaConfig>): FeriaConfig {
  const config = getFeriaConfig();
  const updated = { ...config, ...data };
  if (typeof window !== 'undefined') {
    localStorage.setItem(FERIA_KEY, JSON.stringify(updated));
    window.dispatchEvent(new StorageEvent('storage', { key: FERIA_KEY }));
  }
  return updated;
}

// ═══════════════════════════════
// PROJECT AD BANNERS CRUD
// ═══════════════════════════════

const DEFAULT_AD_BANNERS: ProjectAdBanner[] = [];

export function getProjectAdBanners(): ProjectAdBanner[] {
  if (typeof window === 'undefined') return DEFAULT_AD_BANNERS;
  try {
    const data = localStorage.getItem(AD_BANNERS_KEY);
    return data ? JSON.parse(data) : DEFAULT_AD_BANNERS;
  } catch {
    return DEFAULT_AD_BANNERS;
  }
}

function saveProjectAdBanners(banners: ProjectAdBanner[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AD_BANNERS_KEY, JSON.stringify(banners));
  window.dispatchEvent(new StorageEvent('storage', { key: AD_BANNERS_KEY }));
}

export function createProjectAdBanner(data: Omit<ProjectAdBanner, 'id' | 'order'>): ProjectAdBanner {
  const banners = getProjectAdBanners();
  const banner: ProjectAdBanner = { ...data, id: genId(), order: banners.length };
  saveProjectAdBanners([...banners, banner]);
  return banner;
}

export function updateProjectAdBanner(id: string, data: Partial<ProjectAdBanner>): ProjectAdBanner | null {
  const banners = getProjectAdBanners();
  const idx = banners.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  banners[idx] = { ...banners[idx], ...data };
  saveProjectAdBanners(banners);
  return banners[idx];
}

export function deleteProjectAdBanner(id: string): boolean {
  const banners = getProjectAdBanners();
  const filtered = banners.filter((b) => b.id !== id);
  if (filtered.length === banners.length) return false;
  saveProjectAdBanners(filtered.map((b, i) => ({ ...b, order: i })));
  return true;
}

export function reorderProjectAdBanners(ids: string[]): ProjectAdBanner[] {
  const banners = getProjectAdBanners();
  const reordered = ids
    .map((id, i) => { const b = banners.find((x) => x.id === id); return b ? { ...b, order: i } : null; })
    .filter(Boolean) as ProjectAdBanner[];
  saveProjectAdBanners(reordered);
  return reordered;
}


// Tabla project_lot_shapes — fuente de verdad de la vista pública
// ═══════════════════════════════

function getAllLotShapes(): LotShape[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOT_SHAPES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLotShapes(shapes: LotShape[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOT_SHAPES_KEY, JSON.stringify(shapes));
}

/** Devuelve todos los LotShapes de un proyecto */
export function getLotShapes(projectId: string): LotShape[] {
  return getAllLotShapes().filter((s) => s.projectId === projectId);
}

/** Crea o reemplaza un LotShape para un lote específico */
export function upsertLotShape(
  projectId: string,
  lotId: string,
  polygonPoints: number[][],
  source: LotShape['source'] = 'manual'
): LotShape {
  const all = getAllLotShapes();
  const existing = all.findIndex((s) => s.projectId === projectId && s.lotId === lotId);
  const now = new Date().toISOString();
  if (existing !== -1) {
    all[existing] = { ...all[existing], polygonPoints, source, updatedAt: now };
    saveLotShapes(all);
    return all[existing];
  }
  const shape: LotShape = {
    id: `shape_${genId()}`,
    projectId,
    lotId,
    polygonPoints,
    source,
    createdAt: now,
    updatedAt: now,
  };
  all.push(shape);
  saveLotShapes(all);
  return shape;
}

/** Elimina el LotShape de un lote */
export function deleteLotShape(projectId: string, lotId: string): boolean {
  const all = getAllLotShapes();
  const filtered = all.filter((s) => !(s.projectId === projectId && s.lotId === lotId));
  if (filtered.length === all.length) return false;
  saveLotShapes(filtered);
  return true;
}

/** Elimina todos los LotShapes de un proyecto */
export function clearLotShapes(projectId: string): void {
  const all = getAllLotShapes().filter((s) => s.projectId !== projectId);
  saveLotShapes(all);
}

// ═══════════════════════════════
// GENERATED LAYOUTS CRUD
// ═══════════════════════════════

function getAllGeneratedLayouts(): GeneratedLayout[] {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(GENERATED_LAYOUTS_KEY) || '[]'); } catch { return []; }
}

function saveAllGeneratedLayouts(layouts: GeneratedLayout[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GENERATED_LAYOUTS_KEY, JSON.stringify(layouts));
}

/** Obtiene el GeneratedLayout activo de un proyecto (el más reciente) */
export function getGeneratedLayout(projectId: string): GeneratedLayout | null {
  const all = getAllGeneratedLayouts();
  const forProject = all.filter((l) => l.projectId === projectId);
  if (forProject.length === 0) return null;
  return forProject.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))[0];
}

/** Guarda un nuevo GeneratedLayout (reemplaza el anterior del proyecto) */
export function saveGeneratedLayout(layout: GeneratedLayout): GeneratedLayout {
  const all = getAllGeneratedLayouts().filter((l) => l.projectId !== layout.projectId);
  all.push(layout);
  saveAllGeneratedLayouts(all);
  return layout;
}

/** Actualiza el status del layout (draft → reviewed → approved) */
export function updateGeneratedLayoutStatus(projectId: string, status: GeneratedLayout['status']): boolean {
  const all = getAllGeneratedLayouts();
  const idx = all.findIndex((l) => l.projectId === projectId);
  if (idx === -1) return false;
  all[idx] = { ...all[idx], status, ...(status === 'approved' ? { approvedAt: new Date().toISOString() } : {}) };
  saveAllGeneratedLayouts(all);
  return true;
}

/** Actualiza un bloque concreto dentro del layout (para correcciones manuales) */
export function updateGeneratedBlock(projectId: string, blockId: string, patch: Partial<GeneratedBlock>): boolean {
  const all = getAllGeneratedLayouts();
  const idx = all.findIndex((l) => l.projectId === projectId);
  if (idx === -1) return false;
  const layout = all[idx];
  const blockIdx = layout.blocks.findIndex((b) => b.id === blockId);
  if (blockIdx === -1) return false;
  layout.blocks[blockIdx] = { ...layout.blocks[blockIdx], ...patch, manualOverride: true };
  all[idx] = layout;
  saveAllGeneratedLayouts(all);
  return true;
}

/** Actualiza el lotId asignado a un GeneratedLot (reasignación manual) */
export function reassignGeneratedLot(projectId: string, blockId: string, lotGenId: string, newLotId: string | null, newLabel: string): boolean {
  const all = getAllGeneratedLayouts();
  const idx = all.findIndex((l) => l.projectId === projectId);
  if (idx === -1) return false;
  const layout = all[idx];
  const blockIdx = layout.blocks.findIndex((b) => b.id === blockId);
  if (blockIdx === -1) return false;
  const lotIdx = layout.blocks[blockIdx].lots.findIndex((l) => l.id === lotGenId);
  if (lotIdx === -1) return false;
  layout.blocks[blockIdx].lots[lotIdx] = {
    ...layout.blocks[blockIdx].lots[lotIdx],
    lotId: newLotId,
    label: newLabel,
    manualOverride: true,
  };
  all[idx] = layout;
  saveAllGeneratedLayouts(all);
  return true;
}

/** Elimina el GeneratedLayout de un proyecto */
export function deleteGeneratedLayout(projectId: string): void {
  const all = getAllGeneratedLayouts().filter((l) => l.projectId !== projectId);
  saveAllGeneratedLayouts(all);
}

// ═══════════════════════════════
// RESET TO DEFAULTS
// ═══════════════════════════════

export function resetProjectsToDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(DEFAULT_PROJECTS));
}

export function resetHeroToDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(HERO_KEY, JSON.stringify(DEFAULT_HERO));
}

export function resetConfigToDefaults(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(DEFAULT_CONFIG));
}

// ══════════════════════════════════════════════════
// CHAT CONFIG
// ══════════════════════════════════════════════════

const DEFAULT_CHAT: ChatConfig = {
  active: true,
  agentName: 'Asesor PerúInversión',
  agentRole: 'Asesor inmobiliario',
  agentAvatar: '',
  welcomeMessage: '¡Hola! 👋 ¿En qué proyecto estás interesado? Estoy aquí para ayudarte.',
  whatsappNumber: '51987654321',
  accentColor: '#0098dc',
};

export function getChatConfig(): ChatConfig {
  if (typeof window === 'undefined') return DEFAULT_CHAT;
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    return raw ? { ...DEFAULT_CHAT, ...JSON.parse(raw) } : DEFAULT_CHAT;
  } catch { return DEFAULT_CHAT; }
}

export function updateChatConfig(data: Partial<ChatConfig>): ChatConfig {
  const current = getChatConfig();
  const updated = { ...current, ...data };
  localStorage.setItem(CHAT_KEY, JSON.stringify(updated));
  window.dispatchEvent(new StorageEvent('storage', { key: CHAT_KEY }));
  return updated;
}
