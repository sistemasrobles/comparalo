// ============================================
// ADMIN STORE  Supabase via API routes
// ============================================

import { type ProjectData, type LotData, type PlanData, type LotShape, type GeneratedLayout, type GeneratedBlock, type DetectedPlanLot, type BlockShape, PROJECTS as DEFAULT_PROJECTS } from './projects-data';

//  Types 
export interface HeroSlide { id: string; image: string; title: string; subtitle: string; order: number; }
export interface SiteConfig { siteName: string; siteSubtitle: string; ctaTitle: string; ctaSubtitle: string; adminPassword: string; }
export interface FeriaConfig { active: boolean; name: string; dates: string; place: string; endDate: string; ctaUrl: string; ctaLabel: string; theme: 'orange' | 'blue' | 'green' | 'purple'; }
export interface ProjectAdBanner { id: string; active: boolean; order: number; label: string; bgImage: string; ctaUrl: string; }
export interface ChatConfig { active: boolean; agentName: string; agentRole: string; agentAvatar: string; welcomeMessage: string; whatsappNumber: string; accentColor: string; }

//  Defaults 
const DEFAULT_HERO: HeroSlide[] = [
  { id: 'h1', image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&h=900&fit=crop&q=80', title: 'Encuentra el terreno ideal para tu inversión', subtitle: 'Compara precios, seguridad jurídica y proyección de valorización en las principales ciudades de Perú.', order: 0 },
  { id: 'h2', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=900&fit=crop&q=80', title: 'Compara hasta 4 proyectos lado a lado', subtitle: 'Analiza precio por m, servicios, acceso y financiamiento de forma clara y transparente.', order: 1 },
  { id: 'h3', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=900&fit=crop&q=80', title: 'Simula tu inversión y toma la mejor decisión', subtitle: 'Calcula cuotas, proyecta valorización y descubre proyectos que se ajustan a tu presupuesto.', order: 2 },
];
const DEFAULT_CONFIG: SiteConfig = { siteName: 'PerúInversión', siteSubtitle: 'La forma más inteligente de invertir en terrenos', ctaTitle: '¿Listo para invertir en tu terreno?', ctaSubtitle: 'Compara, simula y decide con datos reales.', adminPassword: 'admin2024' };
const DEFAULT_FERIA: FeriaConfig = { active: true, name: 'Feria PerúInversión 2026', dates: '28, 29 y 30 de marzo', place: 'Centro de Convenciones de Lima', endDate: '2026-03-30T23:59:59', ctaUrl: '/feria', ctaLabel: 'Ver feria ', theme: 'orange' };
const DEFAULT_CHAT: ChatConfig = { active: true, agentName: 'Asesor PerúInversión', agentRole: 'Asesor inmobiliario', agentAvatar: '', welcomeMessage: '¡Hola!  ¿En qué proyecto estás interesado? Estoy aquí para ayudarte.', whatsappNumber: '51987654321', accentColor: '#0098dc' };

//  Helpers 
function genId(): string { return `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`; }
function slugify(t: string): string { return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }
async function apiFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

//  Projects 
export async function getAdminProjects(): Promise<ProjectData[]> {
  try { return await apiFetch<ProjectData[]>('/api/db/projects'); } catch { return DEFAULT_PROJECTS as ProjectData[]; }
}
export async function createProject(partial: Partial<ProjectData> = {}): Promise<ProjectData> {
  const id = `proj_${genId()}`;
  const slug = partial.slug || `${slugify(partial.name || 'nuevo-proyecto')}-${Date.now().toString(36)}`;
  const project: ProjectData = { id, slug, name: 'Nuevo Proyecto', shortDescription: '', description: '', category: 'lotes', city: 'Lima', zone: '', region: '', addressText: '', lat: -12.0464, lng: -77.0428, distanceToCityCenterKm: 0, minPrice: 30000, maxPrice: 60000, currency: 'PEN', priceM2Min: 150, priceM2Max: 300, downPaymentMin: 3000, monthlyPaymentEst: 800, termMonthsEst: 60, reservationAmount: 500, lotSizeMin: 100, lotSizeMax: 200, totalLots: 0, safetyScore: 75, valorizationEstimate: 15, accessType: 'PISTA_ASFALTADA', legalStatus: 'INSCRITO_SUNARP', imageUrl: '', galleryImages: [], videoUrl: '', lotPlanImage: '', amenities: [], services: { agua: true, luz: true, desague: false, internet: false, gas: false }, developer: { name: '', slug: '', website: '' }, isActive: true, isFeatured: false, isExclusive: false, lots: [], ...partial };
  return apiFetch<ProjectData>('/api/db/projects', { method: 'POST', body: JSON.stringify(project) });
}
export async function updateProject(id: string, data: Partial<ProjectData>): Promise<ProjectData> {
  return apiFetch<ProjectData>(`/api/db/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteProject(id: string): Promise<void> { await apiFetch(`/api/db/projects/${id}`, { method: 'DELETE' }); }
export async function duplicateProject(id: string): Promise<ProjectData> {
  const all = await getAdminProjects();
  const src = all.find(p => p.id === id);
  if (!src) throw new Error('Project not found');
  const copy: ProjectData = { ...src, id: `proj_${genId()}`, slug: `${src.slug}-copia-${Date.now().toString(36)}`, name: `${src.name} (copia)`, isFeatured: false, lots: (src.lots||[]).map(l=>({...l,id:`lot_${genId()}`})) };
  return apiFetch<ProjectData>('/api/db/projects', { method: 'POST', body: JSON.stringify(copy) });
}
export async function resetProjectsToDefaults(): Promise<void> {
  const all = await getAdminProjects();
  await Promise.all(all.map(p => deleteProject(p.id)));
  await Promise.all(DEFAULT_PROJECTS.map(p => apiFetch('/api/db/projects', { method: 'POST', body: JSON.stringify(p) })));
}
export async function addLot(projectId: string, lot: Partial<LotData>): Promise<ProjectData> {
  const all = await getAdminProjects();
  const project = all.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');
  const newLot: LotData = { id: `lot_${genId()}`, label: lot.label||'', manzana: lot.manzana||'', lote: lot.lote||0, fila: lot.fila, area: lot.area||100, price: lot.price||30000, precioM2: lot.precioM2, status: lot.status||'disponible' };
  return updateProject(projectId, { ...project, lots: [...(project.lots||[]), newLot] });
}
export async function updateLot(projectId: string, lotId: string, data: Partial<LotData>): Promise<ProjectData> {
  const all = await getAdminProjects();
  const project = all.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');
  return updateProject(projectId, { ...project, lots: (project.lots||[]).map(l => l.id===lotId ? {...l,...data} : l) });
}
export async function deleteLot(projectId: string, lotId: string): Promise<ProjectData> {
  const all = await getAdminProjects();
  const project = all.find(p => p.id === projectId);
  if (!project) throw new Error('Project not found');
  return updateProject(projectId, { ...project, lots: (project.lots||[]).filter(l => l.id!==lotId) });
}
export async function getLotShapes(projectId: string): Promise<LotShape[]> {
  const all = await getAdminProjects(); const p = all.find(x=>x.id===projectId); return p?.lotShapes||[];
}
export async function saveLotShapes(projectId: string, shapes: LotShape[]): Promise<void> { await updateProject(projectId, { lotShapes: shapes }); }
export async function getGeneratedLayout(projectId: string): Promise<GeneratedLayout|null> {
  const all = await getAdminProjects(); const p = all.find(x=>x.id===projectId); return p?.generatedLayout||null;
}
export async function saveGeneratedLayout(projectId: string, layout: GeneratedLayout): Promise<void> { await updateProject(projectId, { generatedLayout: layout }); }
export async function getPlanData(projectId: string): Promise<PlanData|null> {
  const all = await getAdminProjects(); const p = all.find(x=>x.id===projectId); return p?.planData||null;
}
export async function savePlanData(projectId: string, plan: PlanData): Promise<void> { await updateProject(projectId, { planData: plan }); }

//  Hero Slides 
export async function getHeroSlides(): Promise<HeroSlide[]> {
  try { return await apiFetch<HeroSlide[]>('/api/db/hero'); } catch { return DEFAULT_HERO; }
}
export async function createHeroSlide(data: Omit<HeroSlide,'id'|'order'>): Promise<HeroSlide> {
  const slides = await getHeroSlides();
  const slide: HeroSlide = { id: `slide_${genId()}`, ...data, order: slides.length };
  await apiFetch('/api/db/hero', { method: 'POST', body: JSON.stringify([...slides, slide]) });
  return slide;
}
export async function updateHeroSlide(id: string, data: Partial<HeroSlide>): Promise<void> {
  const slides = await getHeroSlides();
  await apiFetch('/api/db/hero', { method: 'POST', body: JSON.stringify(slides.map(s=>s.id===id?{...s,...data}:s)) });
}
export async function deleteHeroSlide(id: string): Promise<void> {
  const slides = await getHeroSlides();
  await apiFetch('/api/db/hero', { method: 'POST', body: JSON.stringify(slides.filter(s=>s.id!==id).map((s,i)=>({...s,order:i}))) });
}
export async function resetHeroToDefaults(): Promise<void> { await apiFetch('/api/db/hero', { method: 'POST', body: JSON.stringify(DEFAULT_HERO) }); }

//  Site Config 
export async function getSiteConfig(): Promise<SiteConfig> {
  try { return await apiFetch<SiteConfig>('/api/db/config'); } catch { return DEFAULT_CONFIG; }
}
export async function updateSiteConfig(data: Partial<SiteConfig>): Promise<SiteConfig> {
  const current = await getSiteConfig();
  return apiFetch<SiteConfig>('/api/db/config', { method: 'POST', body: JSON.stringify({ ...current, ...data }) });
}

//  Feria Config 
export async function getFeriaConfig(): Promise<FeriaConfig> {
  try { return await apiFetch<FeriaConfig>('/api/db/feria-config'); } catch { return DEFAULT_FERIA; }
}
export async function updateFeriaConfig(data: Partial<FeriaConfig>): Promise<FeriaConfig> {
  const current = await getFeriaConfig();
  return apiFetch<FeriaConfig>('/api/db/feria-config', { method: 'POST', body: JSON.stringify({ ...current, ...data }) });
}

//  Ad Banners 
export async function getProjectAdBanners(): Promise<ProjectAdBanner[]> {
  try { return await apiFetch<ProjectAdBanner[]>('/api/db/ad-banners'); } catch { return []; }
}
export async function createProjectAdBanner(data: Omit<ProjectAdBanner,'id'|'order'>): Promise<ProjectAdBanner> {
  const banners = await getProjectAdBanners();
  const banner: ProjectAdBanner = { id: `banner_${genId()}`, order: banners.length, ...data };
  await apiFetch('/api/db/ad-banners', { method: 'POST', body: JSON.stringify([...banners, banner]) });
  return banner;
}
export async function updateProjectAdBanner(id: string, data: Partial<ProjectAdBanner>): Promise<void> {
  const banners = await getProjectAdBanners();
  await apiFetch('/api/db/ad-banners', { method: 'POST', body: JSON.stringify(banners.map(b=>b.id===id?{...b,...data}:b)) });
}
export async function deleteProjectAdBanner(id: string): Promise<void> {
  const banners = await getProjectAdBanners();
  await apiFetch('/api/db/ad-banners', { method: 'POST', body: JSON.stringify(banners.filter(b=>b.id!==id).map((b,i)=>({...b,order:i}))) });
}

//  Chat Config 
export async function getChatConfig(): Promise<ChatConfig> {
  try { return await apiFetch<ChatConfig>('/api/db/chat-config'); } catch { return DEFAULT_CHAT; }
}
export async function updateChatConfig(data: Partial<ChatConfig>): Promise<ChatConfig> {
  const current = await getChatConfig();
  return apiFetch<ChatConfig>('/api/db/chat-config', { method: 'POST', body: JSON.stringify({ ...current, ...data }) });
}

// ── Compatibility shims for PlanDetectionEditor / ManualPlanMapper / LayoutReviewEditor / PlanEditor ──
export async function updatePlanImage(projectId: string, imageUrl: string, imageWidth?: number, imageHeight?: number): Promise<void> {
  const existing = await getPlanData(projectId);
  await savePlanData(projectId, { ...(existing ?? { blocks: [], detections: [] }), imageUrl, imageWidth: imageWidth ?? existing?.imageWidth ?? 0, imageHeight: imageHeight ?? existing?.imageHeight ?? 0 } as PlanData);
}
export async function removePlanImage(projectId: string): Promise<void> {
  await savePlanData(projectId, { imageUrl: '' } as PlanData);
}
export async function saveDetections(projectId: string, detections: unknown[]): Promise<void> {
  const existing = await getPlanData(projectId);
  await savePlanData(projectId, { ...(existing ?? {}), detections } as PlanData);
}
export async function updateDetection(projectId: string, detectionId: string, data: Record<string, unknown>): Promise<void> {
  const existing = await getPlanData(projectId);
  const detections = (existing?.detections ?? []).map((d: DetectedPlanLot) => d.id === detectionId ? { ...d, ...data } as DetectedPlanLot : d);
  await savePlanData(projectId, { ...(existing ?? {}), detections } as PlanData);
}
export async function deleteDetection(projectId: string, detectionId: string): Promise<void> {
  const existing = await getPlanData(projectId);
  const detections = (existing?.detections ?? []).filter((d: DetectedPlanLot) => d.id !== detectionId);
  await savePlanData(projectId, { ...(existing ?? {}), detections } as PlanData);
}
export async function clearDetections(projectId: string): Promise<void> {
  const existing = await getPlanData(projectId);
  await savePlanData(projectId, { ...(existing ?? {}), detections: [] } as PlanData);
}
export async function upsertLotShape(projectId: string, lotId: string, polygonPoints: number[][], source: 'manual' | 'auto-approved' = 'manual'): Promise<void> {
  const shapes = await getLotShapes(projectId);
  const now = new Date().toISOString();
  const existing = shapes.find(s => s.lotId === lotId);
  const shape: LotShape = existing
    ? { ...existing, polygonPoints, source, updatedAt: now }
    : { id: `shape_${Date.now()}`, projectId, lotId, polygonPoints, source, createdAt: now, updatedAt: now };
  const updated = existing ? shapes.map(s => s.lotId === lotId ? shape : s) : [...shapes, shape];
  await saveLotShapes(projectId, updated);
}
export async function deleteLotShape(projectId: string, shapeId: string): Promise<void> {
  const shapes = await getLotShapes(projectId);
  await saveLotShapes(projectId, shapes.filter(s => s.id !== shapeId));
}
export async function clearLotShapes(projectId: string): Promise<void> {
  await saveLotShapes(projectId, []);
}
export async function updateGeneratedLayoutStatus(projectId: string, status: string): Promise<void> {
  const layout = await getGeneratedLayout(projectId);
  if (layout) await saveGeneratedLayout(projectId, { ...layout, status } as GeneratedLayout);
}
export async function updateGeneratedBlock(projectId: string, blockId: string, data: Record<string, unknown>): Promise<void> {
  const layout = await getGeneratedLayout(projectId);
  if (!layout) return;
  const blocks = (layout.blocks ?? []).map((b: GeneratedBlock) => b.id === blockId ? { ...b, ...data } as GeneratedBlock : b);
  await saveGeneratedLayout(projectId, { ...layout, blocks });
}
export async function reassignGeneratedLot(projectId: string, genLotId: string, newLotId: string): Promise<void> {
  const layout = await getGeneratedLayout(projectId);
  if (!layout) return;
  const blocks = (layout.blocks ?? []).map((b: GeneratedBlock) => ({
    ...b,
    lots: (b.lots ?? []).map((l) => l.id === genLotId ? { ...l, lotId: newLotId } : l),
  }));
  await saveGeneratedLayout(projectId, { ...layout, blocks });
}
export async function deleteGeneratedLayout(projectId: string): Promise<void> {
  await saveGeneratedLayout(projectId, null as unknown as GeneratedLayout);
}

// ── BlockShape shims for PlanEditor (legacy block-based plan editor) ──
export async function addBlockShape(projectId: string, block: Omit<BlockShape, 'id'>): Promise<BlockShape> {
  const existing = await getPlanData(projectId);
  const newBlock: BlockShape = { id: `block_${Date.now()}`, ...block };
  const blocks = [...(existing?.blocks ?? []), newBlock];
  await savePlanData(projectId, { ...(existing ?? { imageUrl: '', imageWidth: 0, imageHeight: 0, detections: [] }), blocks } as PlanData);
  return newBlock;
}
export async function updateBlockShape(projectId: string, blockId: string, data: Partial<BlockShape>): Promise<void> {
  const existing = await getPlanData(projectId);
  const blocks = (existing?.blocks ?? []).map((b) => b.id === blockId ? { ...b, ...data } : b);
  await savePlanData(projectId, { ...(existing ?? { imageUrl: '', imageWidth: 0, imageHeight: 0, detections: [] }), blocks } as PlanData);
}
export async function deleteBlockShape(projectId: string, blockId: string): Promise<void> {
  const existing = await getPlanData(projectId);
  const blocks = (existing?.blocks ?? []).filter((b) => b.id !== blockId);
  await savePlanData(projectId, { ...(existing ?? { imageUrl: '', imageWidth: 0, imageHeight: 0, detections: [] }), blocks } as PlanData);
}
