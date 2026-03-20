// ============================================
// DATOS ESTÁTICOS DE PROYECTOS REALES
// Fuente: Webs oficiales de las inmobiliarias
// ============================================

export type LotStatus = 'disponible' | 'reservado' | 'vendido' | 'bloqueado';

/** Moneda del proyecto: Soles o Dólares */
export type ProjectCurrency = 'PEN' | 'USD';

export interface LotData {
  id: string;
  label: string;       // e.g. "Mz A - Lt 01"
  manzana: string;
  lote: number;        // Número numérico del lote (legacy, se mantiene por compat)
  fila?: string;       // Fila/código alfanumérico: "01", "09A", etc.
  area: number;        // m²
  price: number;       // S/
  precioM2?: number;   // Precio por m² (auto-calculable)
  status: LotStatus;
}

export type ProjectCategory = 'lotes' | 'departamentos' | 'locales-comerciales';

/* ═══════════ Plan interactivo — Detección por polígonos reales ═══════════ */

/** @deprecated — se mantiene solo por backwards-compat de datos antiguos */
export interface BlockShape {
  id: string;
  blockName: string;
  x: number; y: number; width: number; height: number;
  rotation?: number; color?: string;
}

export type DetectionReviewStatus =
  | 'auto'          // detectado, aún sin revisión
  | 'matched'       // auto-matched con inventario
  | 'ambiguous'     // múltiples candidatos
  | 'unmatched'     // no se pudo mapear
  | 'approved'      // admin aprobó
  | 'rejected';     // admin descartó (falso positivo)

export interface DetectedPlanLot {
  id: string;
  /** Polígono en % del plan (0-100) — array de [x,y] puntos */
  polygon: number[][];
  /** Bounding-box en % del plan */
  bbox: { x: number; y: number; w: number; h: number };
  /** Centroide en % del plan */
  centroid: { x: number; y: number };
  /** Label detectado por OCR (ej: "A-01", "Lt 03") */
  detectedLabel: string;
  /** Label normalizado para matching (ej: "A-01") */
  normalizedLabel: string;
  /** Confianza de detección del contorno 0-1 */
  detectionConfidence: number;
  /** Confianza del OCR 0-1 */
  ocrConfidence: number;
  /** ID del LotData matcheado (null si no resuelto) */
  matchedLotId: string | null;
  /** Estado de revisión */
  reviewStatus: DetectionReviewStatus;
  /** Override manual del admin: polígono editado */
  manualPolygon?: number[][];
  /** Override manual del admin: label corregido */
  manualLabel?: string;
}

export interface PlanData {
  imageUrl: string;            // plan image URL or base64
  imageWidth: number;          // natural pixel width (for aspect ratio)
  imageHeight: number;         // natural pixel height
  /** @deprecated — old rectangle-based blocks */
  blocks: BlockShape[];
  /** Polígonos detectados por CV + OCR (solo para revisión admin) */
  detections: DetectedPlanLot[];
  /** Timestamp de la última detección */
  lastDetectionAt?: string;
}

/**
 * Geometría APROBADA de un lote sobre el plano.
 * Esta es la única fuente de verdad que usa la vista pública.
 * Se puede crear manualmente o aprobar desde una detección automática.
 */
export interface LotShape {
  id: string;
  projectId: string;
  lotId: string;           // FK → LotData.id
  /** Polígono en % del plan (0-100), array de [x, y] */
  polygonPoints: number[][];
  /** Origen: 'manual' | 'auto-approved' */
  source: 'manual' | 'auto-approved';
  createdAt: string;
  updatedAt: string;
}

/* ═══════════════════════════════════════════════════════════════
   GENERATED LAYOUT — Vista abstracta tipo Cineplanet
   Generada automáticamente desde detecciones + inventory.
   Esta es la fuente de verdad para la vista pública abstracta.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Un lote dentro de la vista abstracta generada.
 * Posición en espacio normalizado (0-100 del viewport del bloque).
 */
export interface GeneratedLot {
  id: string;
  lotId: string | null;          // FK → LotData.id (null = no matcheado)
  label: string;                 // Etiqueta visible (ej: "A-01")
  /** Posición relativa dentro del bloque, 0-100 */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Confianza del match 0-1 */
  confidence: number;
  /** ¿Fue corregido manualmente por el admin? */
  manualOverride: boolean;
}

/**
 * Un bloque/manzana en la vista abstracta generada.
 * Posición en espacio normalizado global (0-100 del viewport total).
 */
export interface GeneratedBlock {
  id: string;
  name: string;                  // ej: "Manzana A", "Bloque 3"
  /** Posición en el canvas global, 0-100 */
  x: number;
  y: number;
  width: number;
  height: number;
  lots: GeneratedLot[];
  /** Color de acento del bloque (generado automáticamente) */
  color?: string;
  /** ¿Fue ajustado manualmente? */
  manualOverride: boolean;
}

export type GeneratedLayoutStatus = 'draft' | 'reviewed' | 'approved';

/**
 * Layout abstracto completo generado para un proyecto.
 * Listo para renderizar en CineplanView sin mostrar la foto del plano.
 */
export interface GeneratedLayout {
  id: string;
  projectId: string;
  blocks: GeneratedBlock[];
  /** Dimensiones del canvas virtual (aspect ratio) */
  canvasWidth: number;
  canvasHeight: number;
  /** Stats de generación */
  stats: {
    totalBlocks: number;
    totalLots: number;
    matchedLots: number;
    unmatchedLots: number;
    matchRate: number;          // 0-1
  };
  status: GeneratedLayoutStatus;
  generatedAt: string;
  approvedAt?: string;
}

export interface ProjectData {
  id: string;
  name: string;
  slug: string;
  category: ProjectCategory;
  description: string;
  shortDescription: string;
  developer: { name: string; slug: string; website: string; ruc?: string; razonSocial?: string; representanteLegal?: string; anoConstitucion?: number };
  partidaRegistral?: string;
  city: string;
  zone: string;
  region: string;
  addressText: string;
  minPrice: number;
  maxPrice: number;
  priceM2Min: number;
  priceM2Max: number;
  lotSizeMin: number;
  lotSizeMax: number;
  totalLots: number;
  downPaymentMin: number;
  monthlyPaymentEst: number;
  termMonthsEst: number;
  lat: number;
  lng: number;
  accessType: string;
  legalStatus: string;
  distanceToCityCenterKm: number;
  safetyScore: number;
  valorizationEstimate: number;
  services: Record<string, boolean>;
  isFeatured: boolean;
  isActive: boolean;
  imageUrl: string;
  /** Moneda del proyecto: 'PEN' (Soles) | 'USD' (Dólares). Default: 'PEN' */
  currency?: ProjectCurrency;
  /* ── Nuevos campos para reserva online ── */
  isExclusive?: boolean;
  reservationAmount?: number;
  galleryImages?: string[];
  renderImages?: string[];
  lotPlanImage?: string;
  videoUrl?: string;
  amenities?: string[];
  lots?: LotData[];
  planData?: PlanData;
  /** Visualizaciones del proyecto en los últimos 30 días (valor manual). */
  views30d?: number;
}
export const PROJECTS: ProjectData[] = [
  {
    id: 'condominio-ginebra',
    name: "Condominio Ginebra",
    slug: 'condominio-ginebra',
    category: 'lotes',
    description: "Proyecto Condominio Ginebra ubicado en la ciudad de Oxapampa en el sector Santa Cruz",
    shortDescription: "Lotes de 120.40m² con todos los servicios",
    developer: { name: "Inmobiliaria Amador & Rios Inversiones", slug: 'inmobiliaria-amador--rios-inversiones', website: '' },
    city: "Oxapampa", zone: "Oxapampa", region: "Pasco",
    addressText: "A 13 minutos de la entrada de Oxapampa",
    minPrice: 20990, maxPrice: 20990, priceM2Min: 174, priceM2Max: 174,
    lotSizeMin: 120.4, lotSizeMax: 120.4, totalLots: 92,
    downPaymentMin: 7141, monthlyPaymentEst: 1904, termMonthsEst: 12,
    lat: 0, lng: 0,
    accessType: 'PISTA_ASFALTADA', legalStatus: 'INSCRITO_SUNARP',
    distanceToCityCenterKm: 10, safetyScore: 65, valorizationEstimate: 10,
    services: { agua: true, luz: true, desague: false, internet: false, seguridad: false, areasVerdes: true },
    isFeatured: false, isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop",
    views30d: 312,
    lots: [
      { id: "condomin-A-01", label: "Mz A - Lt 01", manzana: "A", lote: 1, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-02", label: "Mz A - Lt 02", manzana: "A", lote: 2, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-03", label: "Mz A - Lt 03", manzana: "A", lote: 3, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-04", label: "Mz A - Lt 04", manzana: "A", lote: 4, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-05", label: "Mz A - Lt 05", manzana: "A", lote: 5, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-06", label: "Mz A - Lt 06", manzana: "A", lote: 6, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-07", label: "Mz A - Lt 07", manzana: "A", lote: 7, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-08", label: "Mz A - Lt 08", manzana: "A", lote: 8, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-09", label: "Mz A - Lt 09", manzana: "A", lote: 9, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-10", label: "Mz A - Lt 10", manzana: "A", lote: 10, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-11", label: "Mz A - Lt 11", manzana: "A", lote: 11, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-12", label: "Mz A - Lt 12", manzana: "A", lote: 12, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-13", label: "Mz A - Lt 13", manzana: "A", lote: 13, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-14", label: "Mz A - Lt 14", manzana: "A", lote: 14, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-15", label: "Mz A - Lt 15", manzana: "A", lote: 15, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-16", label: "Mz A - Lt 16", manzana: "A", lote: 16, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-17", label: "Mz A - Lt 17", manzana: "A", lote: 17, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-18", label: "Mz A - Lt 18", manzana: "A", lote: 18, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-A-19", label: "Mz A - Lt 19", manzana: "A", lote: 19, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-A-20", label: "Mz A - Lt 20", manzana: "A", lote: 20, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-A-21", label: "Mz A - Lt 21", manzana: "A", lote: 21, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-A-22", label: "Mz A - Lt 22", manzana: "A", lote: 22, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-B-01", label: "Mz B - Lt 01", manzana: "B", lote: 1, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-B-02", label: "Mz B - Lt 02", manzana: "B", lote: 2, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-B-03", label: "Mz B - Lt 03", manzana: "B", lote: 3, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-B-04", label: "Mz B - Lt 04", manzana: "B", lote: 4, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-B-05", label: "Mz B - Lt 05", manzana: "B", lote: 5, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-B-06", label: "Mz B - Lt 06", manzana: "B", lote: 6, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-B-07", label: "Mz B - Lt 07", manzana: "B", lote: 7, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-B-08", label: "Mz B - Lt 08", manzana: "B", lote: 8, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-B-09A", label: "Mz B - Lt 09A", manzana: "B", lote: 9, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-B-09", label: "Mz B - Lt 09", manzana: "B", lote: 9, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-B-10", label: "Mz B - Lt 10", manzana: "B", lote: 10, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-B-11", label: "Mz B - Lt 11", manzana: "B", lote: 11, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-B-12", label: "Mz B - Lt 12", manzana: "B", lote: 12, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-B-13", label: "Mz B - Lt 13", manzana: "B", lote: 13, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-B-14", label: "Mz B - Lt 14", manzana: "B", lote: 14, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-B-15", label: "Mz B - Lt 15", manzana: "B", lote: 15, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-B-16", label: "Mz B - Lt 16", manzana: "B", lote: 16, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-C-01", label: "Mz C - Lt 01", manzana: "C", lote: 1, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-C-02", label: "Mz C - Lt 02", manzana: "C", lote: 2, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-C-03", label: "Mz C - Lt 03", manzana: "C", lote: 3, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-C-04", label: "Mz C - Lt 04", manzana: "C", lote: 4, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-C-05", label: "Mz C - Lt 05", manzana: "C", lote: 5, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-C-06", label: "Mz C - Lt 06", manzana: "C", lote: 6, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-C-07", label: "Mz C - Lt 07", manzana: "C", lote: 7, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-C-08", label: "Mz C - Lt 08", manzana: "C", lote: 8, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-C-09", label: "Mz C - Lt 09", manzana: "C", lote: 9, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-C-10", label: "Mz C - Lt 10", manzana: "C", lote: 10, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-D-01", label: "Mz D - Lt 01", manzana: "D", lote: 1, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-D-02", label: "Mz D - Lt 02", manzana: "D", lote: 2, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-D-03", label: "Mz D - Lt 03", manzana: "D", lote: 3, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-D-04", label: "Mz D - Lt 04", manzana: "D", lote: 4, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-D-05", label: "Mz D - Lt 05", manzana: "D", lote: 5, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-D-06", label: "Mz D - Lt 06", manzana: "D", lote: 6, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-D-07", label: "Mz D - Lt 07", manzana: "D", lote: 7, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-D-08", label: "Mz D - Lt 08", manzana: "D", lote: 8, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-D-09", label: "Mz D - Lt 09", manzana: "D", lote: 9, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-D-10", label: "Mz D - Lt 10", manzana: "D", lote: 10, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-E-01", label: "Mz E - Lt 01", manzana: "E", lote: 1, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-E-02", label: "Mz E - Lt 02", manzana: "E", lote: 2, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-E-03", label: "Mz E - Lt 03", manzana: "E", lote: 3, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-E-04", label: "Mz E - Lt 04", manzana: "E", lote: 4, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-E-05", label: "Mz E - Lt 05", manzana: "E", lote: 5, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-E-06", label: "Mz E - Lt 06", manzana: "E", lote: 6, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-E-07", label: "Mz E - Lt 07", manzana: "E", lote: 7, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-F-01", label: "Mz F - Lt 01", manzana: "F", lote: 1, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-F-02", label: "Mz F - Lt 02", manzana: "F", lote: 2, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-F-03", label: "Mz F - Lt 03", manzana: "F", lote: 3, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-F-04", label: "Mz F - Lt 04", manzana: "F", lote: 4, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-F-05", label: "Mz F - Lt 05", manzana: "F", lote: 5, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-F-06", label: "Mz F - Lt 06", manzana: "F", lote: 6, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-F-07", label: "Mz F - Lt 07", manzana: "F", lote: 7, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-F-08", label: "Mz F - Lt 08", manzana: "F", lote: 8, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-G-01", label: "Mz G - Lt 01", manzana: "G", lote: 1, area: 120.4, price: 20990, status: "vendido" },
      { id: "condomin-G-02", label: "Mz G - Lt 02", manzana: "G", lote: 2, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-03", label: "Mz G - Lt 03", manzana: "G", lote: 3, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-04", label: "Mz G - Lt 04", manzana: "G", lote: 4, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-05", label: "Mz G - Lt 05", manzana: "G", lote: 5, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-06", label: "Mz G - Lt 06", manzana: "G", lote: 6, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-07", label: "Mz G - Lt 07", manzana: "G", lote: 7, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-08", label: "Mz G - Lt 08", manzana: "G", lote: 8, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-09", label: "Mz G - Lt 09", manzana: "G", lote: 9, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-10", label: "Mz G - Lt 10", manzana: "G", lote: 10, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-11", label: "Mz G - Lt 11", manzana: "G", lote: 11, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-12", label: "Mz G - Lt 12", manzana: "G", lote: 12, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-13", label: "Mz G - Lt 13", manzana: "G", lote: 13, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-14", label: "Mz G - Lt 14", manzana: "G", lote: 14, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-15", label: "Mz G - Lt 15", manzana: "G", lote: 15, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-16", label: "Mz G - Lt 16", manzana: "G", lote: 16, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-17", label: "Mz G - Lt 17", manzana: "G", lote: 17, area: 120.4, price: 20990, status: "disponible" },
      { id: "condomin-G-18", label: "Mz G - Lt 18", manzana: "G", lote: 18, area: 120.4, price: 20990, status: "disponible" }
    ],
  },
  {
    id: 'antioquia-condominio',
    name: "Antioquia Condominio",
    slug: 'antioquia-condominio',
    category: 'lotes',
    description: "Proyecto Antioquia Condominio ubicado en la ciudad de Iquitos  en el distrito San Juan Bautista",
    shortDescription: "Lotes desde 300m² con todos los servicios",
    developer: { name: "Inmobiliaria Amador & Rios Inversiones", slug: 'inmobiliaria-amador--rios-inversiones', website: '' },
    city: "Loreto", zone: "San Juan Bautista", region: "Loreto",
    addressText: "IQUITOS – NAUTA KM. 49",
    minPrice: 30000, maxPrice: 50000, priceM2Min: 100, priceM2Max: 100,
    lotSizeMin: 300, lotSizeMax: 500, totalLots: 168,
    downPaymentMin: 8400, monthlyPaymentEst: 1400, termMonthsEst: 24,
    lat: 0, lng: 0,
    accessType: 'PISTA_ASFALTADA', legalStatus: 'INSCRITO_SUNARP',
    distanceToCityCenterKm: 10, safetyScore: 65, valorizationEstimate: 10,
    services: { agua: true, luz: true, desague: false, internet: false, seguridad: false, areasVerdes: true },
    isFeatured: false, isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop",
    views30d: 487,
    lots: [
      { id: "antioqui-A-01", label: "Mz A - Lt 01", manzana: "A", lote: 1, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-02", label: "Mz A - Lt 02", manzana: "A", lote: 2, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-03", label: "Mz A - Lt 03", manzana: "A", lote: 3, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-04", label: "Mz A - Lt 04", manzana: "A", lote: 4, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-05", label: "Mz A - Lt 05", manzana: "A", lote: 5, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-06", label: "Mz A - Lt 06", manzana: "A", lote: 6, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-07", label: "Mz A - Lt 07", manzana: "A", lote: 7, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-08", label: "Mz A - Lt 08", manzana: "A", lote: 8, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-09", label: "Mz A - Lt 09", manzana: "A", lote: 9, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-10", label: "Mz A - Lt 10", manzana: "A", lote: 10, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-11", label: "Mz A - Lt 11", manzana: "A", lote: 11, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-12", label: "Mz A - Lt 12", manzana: "A", lote: 12, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-13", label: "Mz A - Lt 13", manzana: "A", lote: 13, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-14", label: "Mz A - Lt 14", manzana: "A", lote: 14, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-15", label: "Mz A - Lt 15", manzana: "A", lote: 15, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-16", label: "Mz A - Lt 16", manzana: "A", lote: 16, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-17", label: "Mz A - Lt 17", manzana: "A", lote: 17, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-18", label: "Mz A - Lt 18", manzana: "A", lote: 18, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-19", label: "Mz A - Lt 19", manzana: "A", lote: 19, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-20", label: "Mz A - Lt 20", manzana: "A", lote: 20, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-21", label: "Mz A - Lt 21", manzana: "A", lote: 21, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-22", label: "Mz A - Lt 22", manzana: "A", lote: 22, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-23", label: "Mz A - Lt 23", manzana: "A", lote: 23, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-24", label: "Mz A - Lt 24", manzana: "A", lote: 24, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-A-25", label: "Mz A - Lt 25", manzana: "A", lote: 25, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-26", label: "Mz A - Lt 26", manzana: "A", lote: 26, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-27", label: "Mz A - Lt 27", manzana: "A", lote: 27, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-28", label: "Mz A - Lt 28", manzana: "A", lote: 28, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-29", label: "Mz A - Lt 29", manzana: "A", lote: 29, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-30", label: "Mz A - Lt 30", manzana: "A", lote: 30, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-31", label: "Mz A - Lt 31", manzana: "A", lote: 31, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-32", label: "Mz A - Lt 32", manzana: "A", lote: 32, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-33", label: "Mz A - Lt 33", manzana: "A", lote: 33, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-34", label: "Mz A - Lt 34", manzana: "A", lote: 34, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-35", label: "Mz A - Lt 35", manzana: "A", lote: 35, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-36", label: "Mz A - Lt 36", manzana: "A", lote: 36, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-37", label: "Mz A - Lt 37", manzana: "A", lote: 37, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-38", label: "Mz A - Lt 38", manzana: "A", lote: 38, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-39", label: "Mz A - Lt 39", manzana: "A", lote: 39, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-40", label: "Mz A - Lt 40", manzana: "A", lote: 40, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-41", label: "Mz A - Lt 41", manzana: "A", lote: 41, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-42", label: "Mz A - Lt 42", manzana: "A", lote: 42, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-43", label: "Mz A - Lt 43", manzana: "A", lote: 43, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-44", label: "Mz A - Lt 44", manzana: "A", lote: 44, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-45", label: "Mz A - Lt 45", manzana: "A", lote: 45, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-46", label: "Mz A - Lt 46", manzana: "A", lote: 46, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-47", label: "Mz A - Lt 47", manzana: "A", lote: 47, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-48", label: "Mz A - Lt 48", manzana: "A", lote: 48, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-49", label: "Mz A - Lt 49", manzana: "A", lote: 49, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-50", label: "Mz A - Lt 50", manzana: "A", lote: 50, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-51", label: "Mz A - Lt 51", manzana: "A", lote: 51, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-A-52", label: "Mz A - Lt 52", manzana: "A", lote: 52, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-01", label: "Mz B - Lt 01", manzana: "B", lote: 1, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-02", label: "Mz B - Lt 02", manzana: "B", lote: 2, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-03", label: "Mz B - Lt 03", manzana: "B", lote: 3, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-04", label: "Mz B - Lt 04", manzana: "B", lote: 4, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-05", label: "Mz B - Lt 05", manzana: "B", lote: 5, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-06", label: "Mz B - Lt 06", manzana: "B", lote: 6, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-07", label: "Mz B - Lt 07", manzana: "B", lote: 7, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-08", label: "Mz B - Lt 08", manzana: "B", lote: 8, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-09", label: "Mz B - Lt 09", manzana: "B", lote: 9, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-10", label: "Mz B - Lt 10", manzana: "B", lote: 10, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-11", label: "Mz B - Lt 11", manzana: "B", lote: 11, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-12", label: "Mz B - Lt 12", manzana: "B", lote: 12, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-13", label: "Mz B - Lt 13", manzana: "B", lote: 13, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-14", label: "Mz B - Lt 14", manzana: "B", lote: 14, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-15", label: "Mz B - Lt 15", manzana: "B", lote: 15, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-16", label: "Mz B - Lt 16", manzana: "B", lote: 16, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-17", label: "Mz B - Lt 17", manzana: "B", lote: 17, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-18", label: "Mz B - Lt 18", manzana: "B", lote: 18, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-19", label: "Mz B - Lt 19", manzana: "B", lote: 19, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-20", label: "Mz B - Lt 20", manzana: "B", lote: 20, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-21", label: "Mz B - Lt 21", manzana: "B", lote: 21, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-22", label: "Mz B - Lt 22", manzana: "B", lote: 22, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-23", label: "Mz B - Lt 23", manzana: "B", lote: 23, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-24", label: "Mz B - Lt 24", manzana: "B", lote: 24, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-B-25", label: "Mz B - Lt 25", manzana: "B", lote: 25, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-26", label: "Mz B - Lt 26", manzana: "B", lote: 26, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-27", label: "Mz B - Lt 27", manzana: "B", lote: 27, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-28", label: "Mz B - Lt 28", manzana: "B", lote: 28, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-29", label: "Mz B - Lt 29", manzana: "B", lote: 29, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-30", label: "Mz B - Lt 30", manzana: "B", lote: 30, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-31", label: "Mz B - Lt 31", manzana: "B", lote: 31, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-32", label: "Mz B - Lt 32", manzana: "B", lote: 32, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-33", label: "Mz B - Lt 33", manzana: "B", lote: 33, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-34", label: "Mz B - Lt 34", manzana: "B", lote: 34, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-35", label: "Mz B - Lt 35", manzana: "B", lote: 35, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-36", label: "Mz B - Lt 36", manzana: "B", lote: 36, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-37", label: "Mz B - Lt 37", manzana: "B", lote: 37, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-38", label: "Mz B - Lt 38", manzana: "B", lote: 38, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-39", label: "Mz B - Lt 39", manzana: "B", lote: 39, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-40", label: "Mz B - Lt 40", manzana: "B", lote: 40, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-41", label: "Mz B - Lt 41", manzana: "B", lote: 41, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-42", label: "Mz B - Lt 42", manzana: "B", lote: 42, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-43", label: "Mz B - Lt 43", manzana: "B", lote: 43, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-44", label: "Mz B - Lt 44", manzana: "B", lote: 44, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-45", label: "Mz B - Lt 45", manzana: "B", lote: 45, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-46", label: "Mz B - Lt 46", manzana: "B", lote: 46, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-47", label: "Mz B - Lt 47", manzana: "B", lote: 47, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-48", label: "Mz B - Lt 48", manzana: "B", lote: 48, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-49", label: "Mz B - Lt 49", manzana: "B", lote: 49, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-50", label: "Mz B - Lt 50", manzana: "B", lote: 50, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-51", label: "Mz B - Lt 51", manzana: "B", lote: 51, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-B-52", label: "Mz B - Lt 52", manzana: "B", lote: 52, area: 300, price: 30000, status: "disponible" },
      { id: "antioqui-C-01", label: "Mz C - Lt 01", manzana: "C", lote: 1, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-02", label: "Mz C - Lt 02", manzana: "C", lote: 2, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-03", label: "Mz C - Lt 03", manzana: "C", lote: 3, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-04", label: "Mz C - Lt 04", manzana: "C", lote: 4, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-05", label: "Mz C - Lt 05", manzana: "C", lote: 5, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-06", label: "Mz C - Lt 06", manzana: "C", lote: 6, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-07", label: "Mz C - Lt 07", manzana: "C", lote: 7, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-08", label: "Mz C - Lt 08", manzana: "C", lote: 8, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-09", label: "Mz C - Lt 09", manzana: "C", lote: 9, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-10", label: "Mz C - Lt 10", manzana: "C", lote: 10, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-11", label: "Mz C - Lt 11", manzana: "C", lote: 11, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-12", label: "Mz C - Lt 12", manzana: "C", lote: 12, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-13", label: "Mz C - Lt 13", manzana: "C", lote: 13, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-14", label: "Mz C - Lt 14", manzana: "C", lote: 14, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-15", label: "Mz C - Lt 15", manzana: "C", lote: 15, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-16", label: "Mz C - Lt 16", manzana: "C", lote: 16, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-17", label: "Mz C - Lt 17", manzana: "C", lote: 17, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-18", label: "Mz C - Lt 18", manzana: "C", lote: 18, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-19", label: "Mz C - Lt 19", manzana: "C", lote: 19, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-20", label: "Mz C - Lt 20", manzana: "C", lote: 20, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-21", label: "Mz C - Lt 21", manzana: "C", lote: 21, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-22", label: "Mz C - Lt 22", manzana: "C", lote: 22, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-23", label: "Mz C - Lt 23", manzana: "C", lote: 23, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-C-24", label: "Mz C - Lt 24", manzana: "C", lote: 24, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-01", label: "Mz D - Lt 01", manzana: "D", lote: 1, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-02", label: "Mz D - Lt 02", manzana: "D", lote: 2, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-03", label: "Mz D - Lt 03", manzana: "D", lote: 3, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-04", label: "Mz D - Lt 04", manzana: "D", lote: 4, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-05", label: "Mz D - Lt 05", manzana: "D", lote: 5, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-06", label: "Mz D - Lt 06", manzana: "D", lote: 6, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-07", label: "Mz D - Lt 07", manzana: "D", lote: 7, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-08", label: "Mz D - Lt 08", manzana: "D", lote: 8, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-09", label: "Mz D - Lt 09", manzana: "D", lote: 9, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-10", label: "Mz D - Lt 10", manzana: "D", lote: 10, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-11", label: "Mz D - Lt 11", manzana: "D", lote: 11, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-12", label: "Mz D - Lt 12", manzana: "D", lote: 12, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-13", label: "Mz D - Lt 13", manzana: "D", lote: 13, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-14", label: "Mz D - Lt 14", manzana: "D", lote: 14, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-15", label: "Mz D - Lt 15", manzana: "D", lote: 15, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-16", label: "Mz D - Lt 16", manzana: "D", lote: 16, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-17", label: "Mz D - Lt 17", manzana: "D", lote: 17, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-18", label: "Mz D - Lt 18", manzana: "D", lote: 18, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-19", label: "Mz D - Lt 19", manzana: "D", lote: 19, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-20", label: "Mz D - Lt 20", manzana: "D", lote: 20, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-21", label: "Mz D - Lt 21", manzana: "D", lote: 21, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-22", label: "Mz D - Lt 22", manzana: "D", lote: 22, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-23", label: "Mz D - Lt 23", manzana: "D", lote: 23, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-D-24", label: "Mz D - Lt 24", manzana: "D", lote: 24, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-01", label: "Mz E - Lt 01", manzana: "E", lote: 1, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-02", label: "Mz E - Lt 02", manzana: "E", lote: 2, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-03", label: "Mz E - Lt 03", manzana: "E", lote: 3, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-04", label: "Mz E - Lt 04", manzana: "E", lote: 4, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-05", label: "Mz E - Lt 05", manzana: "E", lote: 5, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-06", label: "Mz E - Lt 06", manzana: "E", lote: 6, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-07", label: "Mz E - Lt 07", manzana: "E", lote: 7, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-08", label: "Mz E - Lt 08", manzana: "E", lote: 8, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-09", label: "Mz E - Lt 09", manzana: "E", lote: 9, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-10", label: "Mz E - Lt 10", manzana: "E", lote: 10, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-11", label: "Mz E - Lt 11", manzana: "E", lote: 11, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-12", label: "Mz E - Lt 12", manzana: "E", lote: 12, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-13", label: "Mz E - Lt 13", manzana: "E", lote: 13, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-14", label: "Mz E - Lt 14", manzana: "E", lote: 14, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-15", label: "Mz E - Lt 15", manzana: "E", lote: 15, area: 500, price: 50000, status: "disponible" },
      { id: "antioqui-E-16", label: "Mz E - Lt 16", manzana: "E", lote: 16, area: 500, price: 50000, status: "disponible" }
    ],
  },
  {
    id: 'ciudad-prada',
    name: "Ciudad Prada",
    slug: 'ciudad-prada',
    category: 'lotes',
    description: "Proyecto Ciudad Prada ubicado en la ciudad de Huanuco  en el distrito de Codo del Pozuzo",
    shortDescription: "Lotes desde 300m² con todos los servicios",
    developer: { name: "Inmobiliaria Amador & Rios Inversiones", slug: 'inmobiliaria-amador--rios-inversiones', website: '' },
    city: "Huanuco", zone: "Codo del Pozuzo", region: "Huánuco",
    addressText: "Carretera 5N - KM196",
    minPrice: 33000, maxPrice: 102056.9, priceM2Min: 110, priceM2Max: 110,
    lotSizeMin: 300, lotSizeMax: 927.79, totalLots: 352,
    downPaymentMin: 10000, monthlyPaymentEst: 1583, termMonthsEst: 24,
    lat: 0, lng: 0,
    accessType: 'PISTA_ASFALTADA', legalStatus: 'INSCRITO_SUNARP',
    distanceToCityCenterKm: 10, safetyScore: 65, valorizationEstimate: 10,
    services: { agua: true, luz: true, desague: true, internet: false, seguridad: false, areasVerdes: true },
    isFeatured: false, isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop",
    views30d: 271,
    lots: [
      { id: "ciudad-p-A-01", label: "Mz A - Lt 01", manzana: "A", lote: 1, area: 315, price: 34650, status: "disponible" },
      { id: "ciudad-p-A-02", label: "Mz A - Lt 02", manzana: "A", lote: 2, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-A-03", label: "Mz A - Lt 03", manzana: "A", lote: 3, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-A-04", label: "Mz A - Lt 04", manzana: "A", lote: 4, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-A-05", label: "Mz A - Lt 05", manzana: "A", lote: 5, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-A-06", label: "Mz A - Lt 06", manzana: "A", lote: 6, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-A-07", label: "Mz A - Lt 07", manzana: "A", lote: 7, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-A-08", label: "Mz A - Lt 08", manzana: "A", lote: 8, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-A-09", label: "Mz A - Lt 09", manzana: "A", lote: 9, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-A-10", label: "Mz A - Lt 10", manzana: "A", lote: 10, area: 618.12, price: 67993.2, status: "disponible" },
      { id: "ciudad-p-A-11", label: "Mz A - Lt 11", manzana: "A", lote: 11, area: 525.23, price: 57775.3, status: "vendido" },
      { id: "ciudad-p-A-12", label: "Mz A - Lt 12", manzana: "A", lote: 12, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-A-13", label: "Mz A - Lt 13", manzana: "A", lote: 13, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-A-14", label: "Mz A - Lt 14", manzana: "A", lote: 14, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-A-15", label: "Mz A - Lt 15", manzana: "A", lote: 15, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-A-16", label: "Mz A - Lt 16", manzana: "A", lote: 16, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-A-17", label: "Mz A - Lt 17", manzana: "A", lote: 17, area: 464.53, price: 51098.3, status: "disponible" },
      { id: "ciudad-p-A-18", label: "Mz A - Lt 18", manzana: "A", lote: 18, area: 457.71, price: 50348.1, status: "vendido" },
      { id: "ciudad-p-A-19", label: "Mz A - Lt 19", manzana: "A", lote: 19, area: 406.1, price: 44671, status: "disponible" },
      { id: "ciudad-p-A-20", label: "Mz A - Lt 20", manzana: "A", lote: 20, area: 512.97, price: 56426.7, status: "disponible" },
      { id: "ciudad-p-A-21", label: "Mz A - Lt 21", manzana: "A", lote: 21, area: 462.03, price: 50823.3, status: "disponible" },
      { id: "ciudad-p-A-22", label: "Mz A - Lt 22", manzana: "A", lote: 22, area: 362.65, price: 39891.5, status: "disponible" },
      { id: "ciudad-p-B-01", label: "Mz B - Lt 01", manzana: "B", lote: 1, area: 353.38, price: 38871.8, status: "disponible" },
      { id: "ciudad-p-B-02", label: "Mz B - Lt 02", manzana: "B", lote: 2, area: 420.12, price: 46213.2, status: "vendido" },
      { id: "ciudad-p-B-03", label: "Mz B - Lt 03", manzana: "B", lote: 3, area: 391.9, price: 43109, status: "disponible" },
      { id: "ciudad-p-B-04", label: "Mz B - Lt 04", manzana: "B", lote: 4, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-B-05", label: "Mz B - Lt 05", manzana: "B", lote: 5, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-B-06", label: "Mz B - Lt 06", manzana: "B", lote: 6, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-B-07", label: "Mz B - Lt 07", manzana: "B", lote: 7, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-B-08", label: "Mz B - Lt 08", manzana: "B", lote: 8, area: 652.09, price: 71729.9, status: "disponible" },
      { id: "ciudad-p-B-09", label: "Mz B - Lt 09", manzana: "B", lote: 9, area: 551.99, price: 60718.9, status: "disponible" },
      { id: "ciudad-p-B-10", label: "Mz B - Lt 10", manzana: "B", lote: 10, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-B-11", label: "Mz B - Lt 11", manzana: "B", lote: 11, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-B-12", label: "Mz B - Lt 12", manzana: "B", lote: 12, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-B-13", label: "Mz B - Lt 13", manzana: "B", lote: 13, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-B-14", label: "Mz B - Lt 14", manzana: "B", lote: 14, area: 303.32, price: 33365.2, status: "disponible" },
      { id: "ciudad-p-B-15", label: "Mz B - Lt 15", manzana: "B", lote: 15, area: 372.39, price: 40962.9, status: "disponible" },
      { id: "ciudad-p-B-16", label: "Mz B - Lt 16", manzana: "B", lote: 16, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-B-17", label: "Mz B - Lt 17", manzana: "B", lote: 17, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-B-18", label: "Mz B - Lt 18", manzana: "B", lote: 18, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-B-19", label: "Mz B - Lt 19", manzana: "B", lote: 19, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-B-20", label: "Mz B - Lt 20", manzana: "B", lote: 20, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-B-21", label: "Mz B - Lt 21", manzana: "B", lote: 21, area: 434.68, price: 47814.8, status: "vendido" },
      { id: "ciudad-p-C-01", label: "Mz C - Lt 01", manzana: "C", lote: 1, area: 551.92, price: 60711.2, status: "disponible" },
      { id: "ciudad-p-C-02", label: "Mz C - Lt 02", manzana: "C", lote: 2, area: 852.28, price: 93750.8, status: "disponible" },
      { id: "ciudad-p-C-03", label: "Mz C - Lt 03", manzana: "C", lote: 3, area: 852.28, price: 93750.8, status: "disponible" },
      { id: "ciudad-p-C-04", label: "Mz C - Lt 04", manzana: "C", lote: 4, area: 450, price: 49500, status: "disponible" },
      { id: "ciudad-p-C-05", label: "Mz C - Lt 05", manzana: "C", lote: 5, area: 450, price: 49500, status: "disponible" },
      { id: "ciudad-p-C-06", label: "Mz C - Lt 06", manzana: "C", lote: 6, area: 450, price: 49500, status: "disponible" },
      { id: "ciudad-p-C-07", label: "Mz C - Lt 07", manzana: "C", lote: 7, area: 706.61, price: 77727.1, status: "disponible" },
      { id: "ciudad-p-C-08", label: "Mz C - Lt 08", manzana: "C", lote: 8, area: 542.69, price: 59695.9, status: "disponible" },
      { id: "ciudad-p-C-09", label: "Mz C - Lt 09", manzana: "C", lote: 9, area: 450.05, price: 49505.5, status: "disponible" },
      { id: "ciudad-p-C-10", label: "Mz C - Lt 10", manzana: "C", lote: 10, area: 450.05, price: 49505.5, status: "disponible" },
      { id: "ciudad-p-C-11", label: "Mz C - Lt 11", manzana: "C", lote: 11, area: 450.05, price: 49505.5, status: "disponible" },
      { id: "ciudad-p-C-12", label: "Mz C - Lt 12", manzana: "C", lote: 12, area: 450.05, price: 49505.5, status: "disponible" },
      { id: "ciudad-p-C-13", label: "Mz C - Lt 13", manzana: "C", lote: 13, area: 450.07, price: 49507.7, status: "disponible" },
      { id: "ciudad-p-C-14", label: "Mz C - Lt 14", manzana: "C", lote: 14, area: 849.91, price: 93490.1, status: "disponible" },
      { id: "ciudad-p-C-15", label: "Mz C - Lt 15", manzana: "C", lote: 15, area: 842.25, price: 92647.5, status: "disponible" },
      { id: "ciudad-p-C-16", label: "Mz C - Lt 16", manzana: "C", lote: 16, area: 437.02, price: 48072.2, status: "disponible" },
      { id: "ciudad-p-C-17", label: "Mz C - Lt 17", manzana: "C", lote: 17, area: 425.28, price: 46780.8, status: "vendido" },
      { id: "ciudad-p-C-18", label: "Mz C - Lt 18", manzana: "C", lote: 18, area: 423.61, price: 46597.1, status: "disponible" },
      { id: "ciudad-p-C-19", label: "Mz C - Lt 19", manzana: "C", lote: 19, area: 461.02, price: 50712.2, status: "disponible" },
      { id: "ciudad-p-C-20", label: "Mz C - Lt 20", manzana: "C", lote: 20, area: 683.76, price: 75213.6, status: "disponible" },
      { id: "ciudad-p-D-01", label: "Mz D - Lt 01", manzana: "D", lote: 1, area: 718.94, price: 79083.4, status: "disponible" },
      { id: "ciudad-p-D-02", label: "Mz D - Lt 02", manzana: "D", lote: 2, area: 487.09, price: 53579.9, status: "disponible" },
      { id: "ciudad-p-D-03", label: "Mz D - Lt 03", manzana: "D", lote: 3, area: 403.39, price: 44372.9, status: "disponible" },
      { id: "ciudad-p-D-04", label: "Mz D - Lt 04", manzana: "D", lote: 4, area: 466.97, price: 51366.7, status: "disponible" },
      { id: "ciudad-p-D-05", label: "Mz D - Lt 05", manzana: "D", lote: 5, area: 524.89, price: 57737.9, status: "disponible" },
      { id: "ciudad-p-D-06", label: "Mz D - Lt 06", manzana: "D", lote: 6, area: 384.41, price: 42285.1, status: "disponible" },
      { id: "ciudad-p-D-07", label: "Mz D - Lt 07", manzana: "D", lote: 7, area: 495.8, price: 54538, status: "disponible" },
      { id: "ciudad-p-D-08", label: "Mz D - Lt 08", manzana: "D", lote: 8, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-D-09", label: "Mz D - Lt 09", manzana: "D", lote: 9, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-D-10", label: "Mz D - Lt 10", manzana: "D", lote: 10, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-D-11", label: "Mz D - Lt 11", manzana: "D", lote: 11, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-D-12", label: "Mz D - Lt 12", manzana: "D", lote: 12, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-D-13", label: "Mz D - Lt 13", manzana: "D", lote: 13, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-D-14", label: "Mz D - Lt 14", manzana: "D", lote: 14, area: 385.44, price: 42398.4, status: "disponible" },
      { id: "ciudad-p-D-15", label: "Mz D - Lt 15", manzana: "D", lote: 15, area: 8061.66, price: 0, status: "disponible" },
      { id: "ciudad-p-E-01", label: "Mz E - Lt 01", manzana: "E", lote: 1, area: 745.2, price: 81972, status: "disponible" },
      { id: "ciudad-p-E-02", label: "Mz E - Lt 02", manzana: "E", lote: 2, area: 696.75, price: 76642.5, status: "disponible" },
      { id: "ciudad-p-E-03", label: "Mz E - Lt 03", manzana: "E", lote: 3, area: 458.19, price: 50400.9, status: "disponible" },
      { id: "ciudad-p-E-04", label: "Mz E - Lt 04", manzana: "E", lote: 4, area: 440.44, price: 48448.4, status: "disponible" },
      { id: "ciudad-p-E-05", label: "Mz E - Lt 05", manzana: "E", lote: 5, area: 440.48, price: 48452.8, status: "disponible" },
      { id: "ciudad-p-E-06", label: "Mz E - Lt 06", manzana: "E", lote: 6, area: 469.53, price: 51648.3, status: "disponible" },
      { id: "ciudad-p-E-07", label: "Mz E - Lt 07", manzana: "E", lote: 7, area: 562.84, price: 61912.4, status: "disponible" },
      { id: "ciudad-p-E-08", label: "Mz E - Lt 08", manzana: "E", lote: 8, area: 632, price: 69520, status: "disponible" },
      { id: "ciudad-p-E-09", label: "Mz E - Lt 09", manzana: "E", lote: 9, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-E-10", label: "Mz E - Lt 10", manzana: "E", lote: 10, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-E-11", label: "Mz E - Lt 11", manzana: "E", lote: 11, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-E-12", label: "Mz E - Lt 12", manzana: "E", lote: 12, area: 364.47, price: 40091.7, status: "disponible" },
      { id: "ciudad-p-E-13", label: "Mz E - Lt 13", manzana: "E", lote: 13, area: 506.16, price: 55677.6, status: "disponible" },
      { id: "ciudad-p-E-14", label: "Mz E - Lt 14", manzana: "E", lote: 14, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-E-15", label: "Mz E - Lt 15", manzana: "E", lote: 15, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-E-16", label: "Mz E - Lt 16", manzana: "E", lote: 16, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-E-17", label: "Mz E - Lt 17", manzana: "E", lote: 17, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-E-18", label: "Mz E - Lt 18", manzana: "E", lote: 18, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-E-19", label: "Mz E - Lt 19", manzana: "E", lote: 19, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-E-20", label: "Mz E - Lt 20", manzana: "E", lote: 20, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-E-21", label: "Mz E - Lt 21", manzana: "E", lote: 21, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-F-01", label: "Mz F - Lt 01", manzana: "F", lote: 1, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-F-02", label: "Mz F - Lt 02", manzana: "F", lote: 2, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-F-03", label: "Mz F - Lt 03", manzana: "F", lote: 3, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-F-04", label: "Mz F - Lt 04", manzana: "F", lote: 4, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-F-05", label: "Mz F - Lt 05", manzana: "F", lote: 5, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-F-06", label: "Mz F - Lt 06", manzana: "F", lote: 6, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-F-07", label: "Mz F - Lt 07", manzana: "F", lote: 7, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-F-08", label: "Mz F - Lt 08", manzana: "F", lote: 8, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-F-09", label: "Mz F - Lt 09", manzana: "F", lote: 9, area: 300.22, price: 33024.2, status: "disponible" },
      { id: "ciudad-p-F-10", label: "Mz F - Lt 10", manzana: "F", lote: 10, area: 354.27, price: 38969.7, status: "disponible" },
      { id: "ciudad-p-F-11", label: "Mz F - Lt 11", manzana: "F", lote: 11, area: 356.65, price: 39231.5, status: "disponible" },
      { id: "ciudad-p-F-12", label: "Mz F - Lt 12", manzana: "F", lote: 12, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-F-13", label: "Mz F - Lt 13", manzana: "F", lote: 13, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-F-14", label: "Mz F - Lt 14", manzana: "F", lote: 14, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-F-15", label: "Mz F - Lt 15", manzana: "F", lote: 15, area: 653.51, price: 71886.1, status: "disponible" },
      { id: "ciudad-p-F-16", label: "Mz F - Lt 16", manzana: "F", lote: 16, area: 516.02, price: 56762.2, status: "disponible" },
      { id: "ciudad-p-F-17", label: "Mz F - Lt 17", manzana: "F", lote: 17, area: 300.09, price: 33009.9, status: "disponible" },
      { id: "ciudad-p-F-18", label: "Mz F - Lt 18", manzana: "F", lote: 18, area: 300.09, price: 33009.9, status: "disponible" },
      { id: "ciudad-p-F-19", label: "Mz F - Lt 19", manzana: "F", lote: 19, area: 300.09, price: 33009.9, status: "disponible" },
      { id: "ciudad-p-F-20", label: "Mz F - Lt 20", manzana: "F", lote: 20, area: 407.62, price: 44838.2, status: "disponible" },
      { id: "ciudad-p-F-21", label: "Mz F - Lt 21", manzana: "F", lote: 21, area: 369.58, price: 40653.8, status: "disponible" },
      { id: "ciudad-p-F-22", label: "Mz F - Lt 22", manzana: "F", lote: 22, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-F-23", label: "Mz F - Lt 23", manzana: "F", lote: 23, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-F-24", label: "Mz F - Lt 24", manzana: "F", lote: 24, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-F-25", label: "Mz F - Lt 25", manzana: "F", lote: 25, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-F-26", label: "Mz F - Lt 26", manzana: "F", lote: 26, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-F-27", label: "Mz F - Lt 27", manzana: "F", lote: 27, area: 418.32, price: 46015.2, status: "vendido" },
      { id: "ciudad-p-G-01", label: "Mz G - Lt 01", manzana: "G", lote: 1, area: 306.27, price: 33689.7, status: "disponible" },
      { id: "ciudad-p-G-02", label: "Mz G - Lt 02", manzana: "G", lote: 2, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-03", label: "Mz G - Lt 03", manzana: "G", lote: 3, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-04", label: "Mz G - Lt 04", manzana: "G", lote: 4, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-05", label: "Mz G - Lt 05", manzana: "G", lote: 5, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-06", label: "Mz G - Lt 06", manzana: "G", lote: 6, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-07", label: "Mz G - Lt 07", manzana: "G", lote: 7, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-08", label: "Mz G - Lt 08", manzana: "G", lote: 8, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-09", label: "Mz G - Lt 09", manzana: "G", lote: 9, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-10", label: "Mz G - Lt 10", manzana: "G", lote: 10, area: 494.56, price: 54401.6, status: "disponible" },
      { id: "ciudad-p-G-11", label: "Mz G - Lt 11", manzana: "G", lote: 11, area: 538.79, price: 59266.9, status: "disponible" },
      { id: "ciudad-p-G-12", label: "Mz G - Lt 12", manzana: "G", lote: 12, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-13", label: "Mz G - Lt 13", manzana: "G", lote: 13, area: 419.05, price: 46095.5, status: "disponible" },
      { id: "ciudad-p-G-14", label: "Mz G - Lt 14", manzana: "G", lote: 14, area: 606.67, price: 66733.7, status: "disponible" },
      { id: "ciudad-p-G-15", label: "Mz G - Lt 15", manzana: "G", lote: 15, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-16", label: "Mz G - Lt 16", manzana: "G", lote: 16, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-17", label: "Mz G - Lt 17", manzana: "G", lote: 17, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-18", label: "Mz G - Lt 18", manzana: "G", lote: 18, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-19", label: "Mz G - Lt 19", manzana: "G", lote: 19, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-20", label: "Mz G - Lt 20", manzana: "G", lote: 20, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-21", label: "Mz G - Lt 21", manzana: "G", lote: 21, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-22", label: "Mz G - Lt 22", manzana: "G", lote: 22, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-23", label: "Mz G - Lt 23", manzana: "G", lote: 23, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-24", label: "Mz G - Lt 24", manzana: "G", lote: 24, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-G-25", label: "Mz G - Lt 25", manzana: "G", lote: 25, area: 540.45, price: 59449.5, status: "disponible" },
      { id: "ciudad-p-H-01", label: "Mz H - Lt 01", manzana: "H", lote: 1, area: 310.15, price: 34116.5, status: "disponible" },
      { id: "ciudad-p-H-02", label: "Mz H - Lt 02", manzana: "H", lote: 2, area: 304.43, price: 33487.3, status: "disponible" },
      { id: "ciudad-p-H-03", label: "Mz H - Lt 03", manzana: "H", lote: 3, area: 307.86, price: 33864.6, status: "disponible" },
      { id: "ciudad-p-H-04", label: "Mz H - Lt 04", manzana: "H", lote: 4, area: 304.79, price: 33526.9, status: "vendido" },
      { id: "ciudad-p-H-05", label: "Mz H - Lt 05", manzana: "H", lote: 5, area: 319.71, price: 35168.1, status: "disponible" },
      { id: "ciudad-p-H-06", label: "Mz H - Lt 06", manzana: "H", lote: 6, area: 563.87, price: 62025.7, status: "disponible" },
      { id: "ciudad-p-H-07", label: "Mz H - Lt 07", manzana: "H", lote: 7, area: 484.28, price: 53270.8, status: "disponible" },
      { id: "ciudad-p-H-08", label: "Mz H - Lt 08", manzana: "H", lote: 8, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-H-09", label: "Mz H - Lt 09", manzana: "H", lote: 9, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-H-10", label: "Mz H - Lt 10", manzana: "H", lote: 10, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-H-11", label: "Mz H - Lt 11", manzana: "H", lote: 11, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-H-12", label: "Mz H - Lt 12", manzana: "H", lote: 12, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-H-13", label: "Mz H - Lt 13", manzana: "H", lote: 13, area: 433.88, price: 47726.8, status: "disponible" },
      { id: "ciudad-p-H-14", label: "Mz H - Lt 14", manzana: "H", lote: 14, area: 475.89, price: 52347.9, status: "disponible" },
      { id: "ciudad-p-H-15", label: "Mz H - Lt 15", manzana: "H", lote: 15, area: 712.08, price: 78328.8, status: "disponible" },
      { id: "ciudad-p-H-16", label: "Mz H - Lt 16", manzana: "H", lote: 16, area: 667.8, price: 73458, status: "disponible" },
      { id: "ciudad-p-H-17", label: "Mz H - Lt 17", manzana: "H", lote: 17, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-H-18", label: "Mz H - Lt 18", manzana: "H", lote: 18, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-H-19", label: "Mz H - Lt 19", manzana: "H", lote: 19, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-H-20", label: "Mz H - Lt 20", manzana: "H", lote: 20, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-H-21", label: "Mz H - Lt 21", manzana: "H", lote: 21, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-H-22", label: "Mz H - Lt 22", manzana: "H", lote: 22, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-H-23", label: "Mz H - Lt 23", manzana: "H", lote: 23, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-H-24", label: "Mz H - Lt 24", manzana: "H", lote: 24, area: 310.98, price: 34207.8, status: "disponible" },
      { id: "ciudad-p-I-01", label: "Mz I - Lt 01", manzana: "I", lote: 1, area: 665.2, price: 73172, status: "vendido" },
      { id: "ciudad-p-I-02", label: "Mz I - Lt 02", manzana: "I", lote: 2, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-I-03", label: "Mz I - Lt 03", manzana: "I", lote: 3, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-I-04", label: "Mz I - Lt 04", manzana: "I", lote: 4, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-I-05", label: "Mz I - Lt 05", manzana: "I", lote: 5, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-I-06", label: "Mz I - Lt 06", manzana: "I", lote: 6, area: 612.51, price: 67376.1, status: "disponible" },
      { id: "ciudad-p-I-07", label: "Mz I - Lt 07", manzana: "I", lote: 7, area: 609.86, price: 67084.6, status: "disponible" },
      { id: "ciudad-p-I-08", label: "Mz I - Lt 08", manzana: "I", lote: 8, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-I-09", label: "Mz I - Lt 09", manzana: "I", lote: 9, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-I-10", label: "Mz I - Lt 10", manzana: "I", lote: 10, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-I-11", label: "Mz I - Lt 11", manzana: "I", lote: 11, area: 427.65, price: 47041.5, status: "disponible" },
      { id: "ciudad-p-I-12", label: "Mz I - Lt 12", manzana: "I", lote: 12, area: 301.08, price: 33118.8, status: "disponible" },
      { id: "ciudad-p-I-13", label: "Mz I - Lt 13", manzana: "I", lote: 13, area: 301.79, price: 33196.9, status: "disponible" },
      { id: "ciudad-p-I-14", label: "Mz I - Lt 14", manzana: "I", lote: 14, area: 302.5, price: 33275, status: "disponible" },
      { id: "ciudad-p-I-15", label: "Mz I - Lt 15", manzana: "I", lote: 15, area: 303.22, price: 33354.2, status: "disponible" },
      { id: "ciudad-p-I-16", label: "Mz I - Lt 16", manzana: "I", lote: 16, area: 506.51, price: 55716.1, status: "disponible" },
      { id: "ciudad-p-I-17", label: "Mz I - Lt 17", manzana: "I", lote: 17, area: 603.33, price: 66366.3, status: "disponible" },
      { id: "ciudad-p-I-18", label: "Mz I - Lt 18", manzana: "I", lote: 18, area: 424.21, price: 46663.1, status: "vendido" },
      { id: "ciudad-p-J-01", label: "Mz J - Lt 01", manzana: "J", lote: 1, area: 470.42, price: 51746.2, status: "vendido" },
      { id: "ciudad-p-J-02", label: "Mz J - Lt 02", manzana: "J", lote: 2, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-J-03", label: "Mz J - Lt 03", manzana: "J", lote: 3, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-J-04", label: "Mz J - Lt 04", manzana: "J", lote: 4, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-J-05", label: "Mz J - Lt 05", manzana: "J", lote: 5, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-J-06", label: "Mz J - Lt 06", manzana: "J", lote: 6, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-J-07", label: "Mz J - Lt 07", manzana: "J", lote: 7, area: 472.37, price: 51960.7, status: "disponible" },
      { id: "ciudad-p-J-08", label: "Mz J - Lt 08", manzana: "J", lote: 8, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-J-09", label: "Mz J - Lt 09", manzana: "J", lote: 9, area: 415.16, price: 45667.6, status: "disponible" },
      { id: "ciudad-p-J-10", label: "Mz J - Lt 10", manzana: "J", lote: 10, area: 413.6, price: 45496, status: "disponible" },
      { id: "ciudad-p-J-11", label: "Mz J - Lt 11", manzana: "J", lote: 11, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-J-12", label: "Mz J - Lt 12", manzana: "J", lote: 12, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-J-13", label: "Mz J - Lt 13", manzana: "J", lote: 13, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-J-14", label: "Mz J - Lt 14", manzana: "J", lote: 14, area: 695.84, price: 76542.4, status: "disponible" },
      { id: "ciudad-p-J-15", label: "Mz J - Lt 15", manzana: "J", lote: 15, area: 751.64, price: 82680.4, status: "disponible" },
      { id: "ciudad-p-J-16", label: "Mz J - Lt 16", manzana: "J", lote: 16, area: 506.44, price: 55708.4, status: "disponible" },
      { id: "ciudad-p-J-17", label: "Mz J - Lt 17", manzana: "J", lote: 17, area: 513.03, price: 56433.3, status: "vendido" },
      { id: "ciudad-p-K-01", label: "Mz K - Lt 01", manzana: "K", lote: 1, area: 597.81, price: 65759.1, status: "disponible" },
      { id: "ciudad-p-K-02", label: "Mz K - Lt 02", manzana: "K", lote: 2, area: 450, price: 49500, status: "disponible" },
      { id: "ciudad-p-K-03", label: "Mz K - Lt 03", manzana: "K", lote: 3, area: 450, price: 49500, status: "disponible" },
      { id: "ciudad-p-K-04", label: "Mz K - Lt 04", manzana: "K", lote: 4, area: 450, price: 49500, status: "disponible" },
      { id: "ciudad-p-K-05", label: "Mz K - Lt 05", manzana: "K", lote: 5, area: 805.09, price: 88559.9, status: "disponible" },
      { id: "ciudad-p-K-06", label: "Mz K - Lt 06", manzana: "K", lote: 6, area: 805.09, price: 88559.9, status: "disponible" },
      { id: "ciudad-p-K-07", label: "Mz K - Lt 07", manzana: "K", lote: 7, area: 450, price: 49500, status: "disponible" },
      { id: "ciudad-p-K-08", label: "Mz K - Lt 08", manzana: "K", lote: 8, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-K-09", label: "Mz K - Lt 09", manzana: "K", lote: 9, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-K-10", label: "Mz K - Lt 10", manzana: "K", lote: 10, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-K-11", label: "Mz K - Lt 11", manzana: "K", lote: 11, area: 431.03, price: 47413.3, status: "disponible" },
      { id: "ciudad-p-K-12", label: "Mz K - Lt 12", manzana: "K", lote: 12, area: 450, price: 49500, status: "disponible" },
      { id: "ciudad-p-K-13", label: "Mz K - Lt 13", manzana: "K", lote: 13, area: 535.64, price: 58920.4, status: "disponible" },
      { id: "ciudad-p-K-14", label: "Mz K - Lt 14", manzana: "K", lote: 14, area: 923.77, price: 101614.7, status: "disponible" },
      { id: "ciudad-p-K-15", label: "Mz K - Lt 15", manzana: "K", lote: 15, area: 927.79, price: 102056.9, status: "disponible" },
      { id: "ciudad-p-K-16", label: "Mz K - Lt 16", manzana: "K", lote: 16, area: 596, price: 65560, status: "disponible" },
      { id: "ciudad-p-K-17", label: "Mz K - Lt 17", manzana: "K", lote: 17, area: 600.19, price: 66020.9, status: "disponible" },
      { id: "ciudad-p-L-01", label: "Mz L - Lt 01", manzana: "L", lote: 1, area: 506.85, price: 55753.5, status: "disponible" },
      { id: "ciudad-p-L-02", label: "Mz L - Lt 02", manzana: "L", lote: 2, area: 450, price: 49500, status: "disponible" },
      { id: "ciudad-p-L-03", label: "Mz L - Lt 03", manzana: "L", lote: 3, area: 450, price: 49500, status: "disponible" },
      { id: "ciudad-p-L-04", label: "Mz L - Lt 04", manzana: "L", lote: 4, area: 450, price: 49500, status: "disponible" },
      { id: "ciudad-p-L-05", label: "Mz L - Lt 05", manzana: "L", lote: 5, area: 450, price: 49500, status: "disponible" },
      { id: "ciudad-p-L-06", label: "Mz L - Lt 06", manzana: "L", lote: 6, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-L-07", label: "Mz L - Lt 07", manzana: "L", lote: 7, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-L-08", label: "Mz L - Lt 08", manzana: "L", lote: 8, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-L-09", label: "Mz L - Lt 09", manzana: "L", lote: 9, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-L-10", label: "Mz L - Lt 10", manzana: "L", lote: 10, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-L-11", label: "Mz L - Lt 11", manzana: "L", lote: 11, area: 708.02, price: 77882.2, status: "disponible" },
      { id: "ciudad-p-L-12", label: "Mz L - Lt 12", manzana: "L", lote: 12, area: 900, price: 99000, status: "disponible" },
      { id: "ciudad-p-L-13", label: "Mz L - Lt 13", manzana: "L", lote: 13, area: 450, price: 49500, status: "disponible" },
      { id: "ciudad-p-L-14", label: "Mz L - Lt 14", manzana: "L", lote: 14, area: 749.14, price: 82405.4, status: "disponible" },
      { id: "ciudad-p-L-15", label: "Mz L - Lt 15", manzana: "L", lote: 15, area: 744.84, price: 81932.4, status: "disponible" },
      { id: "ciudad-p-L-16", label: "Mz L - Lt 16", manzana: "L", lote: 16, area: 590.02, price: 64902.2, status: "disponible" },
      { id: "ciudad-p-L-17", label: "Mz L - Lt 17", manzana: "L", lote: 17, area: 5389.31, price: 0, status: "disponible" },
      { id: "ciudad-p-M-01", label: "Mz M - Lt 01", manzana: "M", lote: 1, area: 378.75, price: 41662.5, status: "disponible" },
      { id: "ciudad-p-M-02", label: "Mz M - Lt 02", manzana: "M", lote: 2, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-03", label: "Mz M - Lt 03", manzana: "M", lote: 3, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-04", label: "Mz M - Lt 04", manzana: "M", lote: 4, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-05", label: "Mz M - Lt 05", manzana: "M", lote: 5, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-06", label: "Mz M - Lt 06", manzana: "M", lote: 6, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-07", label: "Mz M - Lt 07", manzana: "M", lote: 7, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-08", label: "Mz M - Lt 08", manzana: "M", lote: 8, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-09", label: "Mz M - Lt 09", manzana: "M", lote: 9, area: 704.93, price: 77542.3, status: "disponible" },
      { id: "ciudad-p-M-10", label: "Mz M - Lt 10", manzana: "M", lote: 10, area: 758.45, price: 83429.5, status: "disponible" },
      { id: "ciudad-p-M-11", label: "Mz M - Lt 11", manzana: "M", lote: 11, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-12", label: "Mz M - Lt 12", manzana: "M", lote: 12, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-13", label: "Mz M - Lt 13", manzana: "M", lote: 13, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-14", label: "Mz M - Lt 14", manzana: "M", lote: 14, area: 375, price: 41250, status: "disponible" },
      { id: "ciudad-p-M-15", label: "Mz M - Lt 15", manzana: "M", lote: 15, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-16", label: "Mz M - Lt 16", manzana: "M", lote: 16, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-17", label: "Mz M - Lt 17", manzana: "M", lote: 17, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-18", label: "Mz M - Lt 18", manzana: "M", lote: 18, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-19", label: "Mz M - Lt 19", manzana: "M", lote: 19, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-M-20", label: "Mz M - Lt 20", manzana: "M", lote: 20, area: 431.5, price: 47465, status: "disponible" },
      { id: "ciudad-p-N-01", label: "Mz N - Lt 01", manzana: "N", lote: 1, area: 359.43, price: 39537.3, status: "disponible" },
      { id: "ciudad-p-N-02", label: "Mz N - Lt 02", manzana: "N", lote: 2, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-N-03", label: "Mz N - Lt 03", manzana: "N", lote: 3, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-N-04", label: "Mz N - Lt 04", manzana: "N", lote: 4, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-N-05", label: "Mz N - Lt 05", manzana: "N", lote: 5, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-N-06", label: "Mz N - Lt 06", manzana: "N", lote: 6, area: 330, price: 36300, status: "disponible" },
      { id: "ciudad-p-N-07", label: "Mz N - Lt 07", manzana: "N", lote: 7, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-N-08", label: "Mz N - Lt 08", manzana: "N", lote: 8, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-N-09", label: "Mz N - Lt 09", manzana: "N", lote: 9, area: 587.51, price: 64626.1, status: "disponible" },
      { id: "ciudad-p-N-10", label: "Mz N - Lt 10", manzana: "N", lote: 10, area: 612.51, price: 67376.1, status: "disponible" },
      { id: "ciudad-p-N-11", label: "Mz N - Lt 11", manzana: "N", lote: 11, area: 375, price: 41250, status: "disponible" },
      { id: "ciudad-p-N-12", label: "Mz N - Lt 12", manzana: "N", lote: 12, area: 444.24, price: 48866.4, status: "disponible" },
      { id: "ciudad-p-O-01", label: "Mz O - Lt 01", manzana: "O", lote: 1, area: 570.77, price: 62784.7, status: "disponible" },
      { id: "ciudad-p-O-02", label: "Mz O - Lt 02", manzana: "O", lote: 2, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-O-03", label: "Mz O - Lt 03", manzana: "O", lote: 3, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-O-04", label: "Mz O - Lt 04", manzana: "O", lote: 4, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-O-05", label: "Mz O - Lt 05", manzana: "O", lote: 5, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-O-06", label: "Mz O - Lt 06", manzana: "O", lote: 6, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-O-07", label: "Mz O - Lt 07", manzana: "O", lote: 7, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-O-08", label: "Mz O - Lt 08", manzana: "O", lote: 8, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-O-09", label: "Mz O - Lt 09", manzana: "O", lote: 9, area: 611.62, price: 67278.2, status: "disponible" },
      { id: "ciudad-p-O-10", label: "Mz O - Lt 10", manzana: "O", lote: 10, area: 607.5, price: 66825, status: "disponible" },
      { id: "ciudad-p-O-11", label: "Mz O - Lt 11", manzana: "O", lote: 11, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-O-12", label: "Mz O - Lt 12", manzana: "O", lote: 12, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-O-13", label: "Mz O - Lt 13", manzana: "O", lote: 13, area: 612.5, price: 67375, status: "disponible" },
      { id: "ciudad-p-O-14", label: "Mz O - Lt 14", manzana: "O", lote: 14, area: 616.76, price: 67843.6, status: "disponible" },
      { id: "ciudad-p-O-15", label: "Mz O - Lt 15", manzana: "O", lote: 15, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-O-16", label: "Mz O - Lt 16", manzana: "O", lote: 16, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-O-17", label: "Mz O - Lt 17", manzana: "O", lote: 17, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-O-18", label: "Mz O - Lt 18", manzana: "O", lote: 18, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-O-19", label: "Mz O - Lt 19", manzana: "O", lote: 19, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-O-20", label: "Mz O - Lt 20", manzana: "O", lote: 20, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-O-21", label: "Mz O - Lt 21", manzana: "O", lote: 21, area: 603.1, price: 66341, status: "disponible" },
      { id: "ciudad-p-O-22", label: "Mz O - Lt 22", manzana: "O", lote: 22, area: 715.26, price: 78678.6, status: "disponible" },
      { id: "ciudad-p-O-23", label: "Mz O - Lt 23", manzana: "O", lote: 23, area: 360.58, price: 39663.8, status: "disponible" },
      { id: "ciudad-p-O-24", label: "Mz O - Lt 24", manzana: "O", lote: 24, area: 390.7, price: 42977, status: "disponible" },
      { id: "ciudad-p-P-01", label: "Mz P - Lt 01", manzana: "P", lote: 1, area: 410.81, price: 45189.1, status: "disponible" },
      { id: "ciudad-p-P-02", label: "Mz P - Lt 02", manzana: "P", lote: 2, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-03", label: "Mz P - Lt 03", manzana: "P", lote: 3, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-04", label: "Mz P - Lt 04", manzana: "P", lote: 4, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-05", label: "Mz P - Lt 05", manzana: "P", lote: 5, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-06", label: "Mz P - Lt 06", manzana: "P", lote: 6, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-07", label: "Mz P - Lt 07", manzana: "P", lote: 7, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-08", label: "Mz P - Lt 08", manzana: "P", lote: 8, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-09", label: "Mz P - Lt 09", manzana: "P", lote: 9, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-10", label: "Mz P - Lt 10", manzana: "P", lote: 10, area: 618.53, price: 68038.3, status: "disponible" },
      { id: "ciudad-p-P-11", label: "Mz P - Lt 11", manzana: "P", lote: 11, area: 607.51, price: 66826.1, status: "disponible" },
      { id: "ciudad-p-P-12", label: "Mz P - Lt 12", manzana: "P", lote: 12, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-P-13", label: "Mz P - Lt 13", manzana: "P", lote: 13, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-14", label: "Mz P - Lt 14", manzana: "P", lote: 14, area: 612.5, price: 67375, status: "disponible" },
      { id: "ciudad-p-P-15", label: "Mz P - Lt 15", manzana: "P", lote: 15, area: 622.77, price: 68504.7, status: "disponible" },
      { id: "ciudad-p-P-16", label: "Mz P - Lt 16", manzana: "P", lote: 16, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-17", label: "Mz P - Lt 17", manzana: "P", lote: 17, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-18", label: "Mz P - Lt 18", manzana: "P", lote: 18, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-19", label: "Mz P - Lt 19", manzana: "P", lote: 19, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-20", label: "Mz P - Lt 20", manzana: "P", lote: 20, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-21", label: "Mz P - Lt 21", manzana: "P", lote: 21, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-P-22", label: "Mz P - Lt 22", manzana: "P", lote: 22, area: 740.42, price: 81446.2, status: "disponible" },
      { id: "ciudad-p-P-23", label: "Mz P - Lt 23", manzana: "P", lote: 23, area: 720.58, price: 79263.8, status: "disponible" },
      { id: "ciudad-p-P-24", label: "Mz P - Lt 24", manzana: "P", lote: 24, area: 360.33, price: 39636.3, status: "disponible" },
      { id: "ciudad-p-P-25", label: "Mz P - Lt 25", manzana: "P", lote: 25, area: 390.89, price: 42997.9, status: "disponible" },
      { id: "ciudad-p-Q-01", label: "Mz Q - Lt 01", manzana: "Q", lote: 1, area: 551.91, price: 60710.1, status: "disponible" },
      { id: "ciudad-p-Q-02", label: "Mz Q - Lt 02", manzana: "Q", lote: 2, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-Q-03", label: "Mz Q - Lt 03", manzana: "Q", lote: 3, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-Q-04", label: "Mz Q - Lt 04", manzana: "Q", lote: 4, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-Q-05", label: "Mz Q - Lt 05", manzana: "Q", lote: 5, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-Q-06", label: "Mz Q - Lt 06", manzana: "Q", lote: 6, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-Q-07", label: "Mz Q - Lt 07", manzana: "Q", lote: 7, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-Q-08", label: "Mz Q - Lt 08", manzana: "Q", lote: 8, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-Q-09", label: "Mz Q - Lt 09", manzana: "Q", lote: 9, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-Q-10", label: "Mz Q - Lt 10", manzana: "Q", lote: 10, area: 625.44, price: 68798.4, status: "disponible" },
      { id: "ciudad-p-Q-11", label: "Mz Q - Lt 11", manzana: "Q", lote: 11, area: 607.51, price: 66826.1, status: "vendido" },
      { id: "ciudad-p-Q-12", label: "Mz Q - Lt 12", manzana: "Q", lote: 12, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-Q-13", label: "Mz Q - Lt 13", manzana: "Q", lote: 13, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-Q-14", label: "Mz Q - Lt 14", manzana: "Q", lote: 14, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-Q-15", label: "Mz Q - Lt 15", manzana: "Q", lote: 15, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-Q-16", label: "Mz Q - Lt 16", manzana: "Q", lote: 16, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-Q-17", label: "Mz Q - Lt 17", manzana: "Q", lote: 17, area: 300, price: 33000, status: "disponible" },
      { id: "ciudad-p-Q-18", label: "Mz Q - Lt 18", manzana: "Q", lote: 18, area: 300, price: 33000, status: "vendido" },
      { id: "ciudad-p-Q-19", label: "Mz Q - Lt 19", manzana: "Q", lote: 19, area: 543.5, price: 59785, status: "disponible" },
      { id: "ciudad-p-Q-20", label: "Mz Q - Lt 20", manzana: "Q", lote: 20, area: 589.79, price: 64876.9, status: "disponible" },
      { id: "ciudad-p-Q-21", label: "Mz Q - Lt 21", manzana: "Q", lote: 21, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-Q-22", label: "Mz Q - Lt 22", manzana: "Q", lote: 22, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-Q-23", label: "Mz Q - Lt 23", manzana: "Q", lote: 23, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-Q-24", label: "Mz Q - Lt 24", manzana: "Q", lote: 24, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-Q-25", label: "Mz Q - Lt 25", manzana: "Q", lote: 25, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-Q-26", label: "Mz Q - Lt 26", manzana: "Q", lote: 26, area: 360, price: 39600, status: "disponible" },
      { id: "ciudad-p-Q-27", label: "Mz Q - Lt 27", manzana: "Q", lote: 27, area: 697.48, price: 76722.8, status: "disponible" },
      { id: "ciudad-p-Q-28", label: "Mz Q - Lt 28", manzana: "Q", lote: 28, area: 802.79, price: 88306.9, status: "disponible" },
      { id: "ciudad-p-Q-29", label: "Mz Q - Lt 29", manzana: "Q", lote: 29, area: 507.05, price: 55775.5, status: "disponible" }
    ],
  },
  {
    id: 'condominio-san-cayetano',
    name: "Condominio San Cayetano",
    slug: 'condominio-san-cayetano',
    category: 'departamentos',
    description: "Condominio San Cayetano ubicados en Lima en el distrito de Ate",
    shortDescription: "Departamentos desde 30m²",
    developer: { name: "Grupo Inmobiliaria San Jose SAC", slug: 'grupo-inmobiliaria-san-jose-sac', website: '' },
    city: "Lima", zone: "Ate", region: "Lima",
    addressText: "Av. Jose Belardo Quiñones con Av. Bolognesi",
    minPrice: 25281, maxPrice: 54666, priceM2Min: 900, priceM2Max: 900,
    lotSizeMin: 28.09, lotSizeMax: 60.74, totalLots: 112,
    downPaymentMin: 7584, monthlyPaymentEst: 710, termMonthsEst: 36,
    lat: 0, lng: 0,
    accessType: 'PISTA_ASFALTADA', legalStatus: 'EN_TRAMITE',
    distanceToCityCenterKm: 10, safetyScore: 65, valorizationEstimate: 10,
    services: { agua: true, luz: true, desague: true, internet: false, seguridad: false, areasVerdes: false },
    isFeatured: false, isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop",
    views30d: 394,
    lots: [
      { id: "condomin-NV1-101", label: "Mz NV1 - Lt 101", manzana: "NV1", lote: 101, area: 28.46, price: 25614, status: "disponible" },
      { id: "condomin-NV1-102", label: "Mz NV1 - Lt 102", manzana: "NV1", lote: 102, area: 28.09, price: 25281, status: "disponible" },
      { id: "condomin-NV1-103", label: "Mz NV1 - Lt 103", manzana: "NV1", lote: 103, area: 28.51, price: 25659, status: "disponible" },
      { id: "condomin-NV1-104", label: "Mz NV1 - Lt 104", manzana: "NV1", lote: 104, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV1-105", label: "Mz NV1 - Lt 105", manzana: "NV1", lote: 105, area: 30.52, price: 27468, status: "disponible" },
      { id: "condomin-NV1-106", label: "Mz NV1 - Lt 106", manzana: "NV1", lote: 106, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV1-107", label: "Mz NV1 - Lt 107", manzana: "NV1", lote: 107, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV2-201", label: "Mz NV2 - Lt 201", manzana: "NV2", lote: 201, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV2-202", label: "Mz NV2 - Lt 202", manzana: "NV2", lote: 202, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV2-203", label: "Mz NV2 - Lt 203", manzana: "NV2", lote: 203, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV2-204", label: "Mz NV2 - Lt 204", manzana: "NV2", lote: 204, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV2-205", label: "Mz NV2 - Lt 205", manzana: "NV2", lote: 205, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV2-206", label: "Mz NV2 - Lt 206", manzana: "NV2", lote: 206, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV2-207", label: "Mz NV2 - Lt 207", manzana: "NV2", lote: 207, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV2-208", label: "Mz NV2 - Lt 208", manzana: "NV2", lote: 208, area: 44.17, price: 39753, status: "disponible" },
      { id: "condomin-NV2-209", label: "Mz NV2 - Lt 209", manzana: "NV2", lote: 209, area: 44.91, price: 40419, status: "disponible" },
      { id: "condomin-NV3-301", label: "Mz NV3 - Lt 301", manzana: "NV3", lote: 301, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV3-302", label: "Mz NV3 - Lt 302", manzana: "NV3", lote: 302, area: 60.74, price: 54666, status: "disponible" },
      { id: "condomin-NV3-303", label: "Mz NV3 - Lt 303", manzana: "NV3", lote: 303, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV3-304", label: "Mz NV3 - Lt 304", manzana: "NV3", lote: 304, area: 60.74, price: 54666, status: "disponible" },
      { id: "condomin-NV3-305", label: "Mz NV3 - Lt 305", manzana: "NV3", lote: 305, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV3-306", label: "Mz NV3 - Lt 306", manzana: "NV3", lote: 306, area: 44.17, price: 39753, status: "disponible" },
      { id: "condomin-NV3-307", label: "Mz NV3 - Lt 307", manzana: "NV3", lote: 307, area: 44.9, price: 40410, status: "disponible" },
      { id: "condomin-NV4-401", label: "Mz NV4 - Lt 401", manzana: "NV4", lote: 401, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV4-402", label: "Mz NV4 - Lt 402", manzana: "NV4", lote: 402, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV4-403", label: "Mz NV4 - Lt 403", manzana: "NV4", lote: 403, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV4-404", label: "Mz NV4 - Lt 404", manzana: "NV4", lote: 404, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV4-405", label: "Mz NV4 - Lt 405", manzana: "NV4", lote: 405, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV4-406", label: "Mz NV4 - Lt 406", manzana: "NV4", lote: 406, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV4-407", label: "Mz NV4 - Lt 407", manzana: "NV4", lote: 407, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV4-408", label: "Mz NV4 - Lt 408", manzana: "NV4", lote: 408, area: 44.17, price: 39753, status: "disponible" },
      { id: "condomin-NV4-409", label: "Mz NV4 - Lt 409", manzana: "NV4", lote: 409, area: 44.91, price: 40419, status: "disponible" },
      { id: "condomin-NV5-501", label: "Mz NV5 - Lt 501", manzana: "NV5", lote: 501, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV5-502", label: "Mz NV5 - Lt 502", manzana: "NV5", lote: 502, area: 60.74, price: 54666, status: "disponible" },
      { id: "condomin-NV5-503", label: "Mz NV5 - Lt 503", manzana: "NV5", lote: 503, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV5-504", label: "Mz NV5 - Lt 504", manzana: "NV5", lote: 504, area: 60.74, price: 54666, status: "disponible" },
      { id: "condomin-NV5-505", label: "Mz NV5 - Lt 505", manzana: "NV5", lote: 505, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV5-506", label: "Mz NV5 - Lt 506", manzana: "NV5", lote: 506, area: 44.17, price: 39753, status: "disponible" },
      { id: "condomin-NV5-507", label: "Mz NV5 - Lt 507", manzana: "NV5", lote: 507, area: 44.9, price: 40410, status: "disponible" },
      { id: "condomin-NV6-601", label: "Mz NV6 - Lt 601", manzana: "NV6", lote: 601, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV6-602", label: "Mz NV6 - Lt 602", manzana: "NV6", lote: 602, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV6-603", label: "Mz NV6 - Lt 603", manzana: "NV6", lote: 603, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV6-604", label: "Mz NV6 - Lt 604", manzana: "NV6", lote: 604, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV6-605", label: "Mz NV6 - Lt 605", manzana: "NV6", lote: 605, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV6-606", label: "Mz NV6 - Lt 606", manzana: "NV6", lote: 606, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV6-607", label: "Mz NV6 - Lt 607", manzana: "NV6", lote: 607, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV6-608", label: "Mz NV6 - Lt 608", manzana: "NV6", lote: 608, area: 44.17, price: 39753, status: "disponible" },
      { id: "condomin-NV6-609", label: "Mz NV6 - Lt 609", manzana: "NV6", lote: 609, area: 44.91, price: 40419, status: "disponible" },
      { id: "condomin-NV7-701", label: "Mz NV7 - Lt 701", manzana: "NV7", lote: 701, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV7-702", label: "Mz NV7 - Lt 702", manzana: "NV7", lote: 702, area: 60.74, price: 54666, status: "disponible" },
      { id: "condomin-NV7-703", label: "Mz NV7 - Lt 703", manzana: "NV7", lote: 703, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV7-704", label: "Mz NV7 - Lt 704", manzana: "NV7", lote: 704, area: 60.74, price: 54666, status: "disponible" },
      { id: "condomin-NV7-705", label: "Mz NV7 - Lt 705", manzana: "NV7", lote: 705, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV7-706", label: "Mz NV7 - Lt 706", manzana: "NV7", lote: 706, area: 44.17, price: 39753, status: "disponible" },
      { id: "condomin-NV7-707", label: "Mz NV7 - Lt 707", manzana: "NV7", lote: 707, area: 44.9, price: 40410, status: "disponible" },
      { id: "condomin-NV8-801", label: "Mz NV8 - Lt 801", manzana: "NV8", lote: 801, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV8-802", label: "Mz NV8 - Lt 802", manzana: "NV8", lote: 802, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV8-803", label: "Mz NV8 - Lt 803", manzana: "NV8", lote: 803, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV8-804", label: "Mz NV8 - Lt 804", manzana: "NV8", lote: 804, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV8-805", label: "Mz NV8 - Lt 805", manzana: "NV8", lote: 805, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV8-806", label: "Mz NV8 - Lt 806", manzana: "NV8", lote: 806, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV8-807", label: "Mz NV8 - Lt 807", manzana: "NV8", lote: 807, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV8-808", label: "Mz NV8 - Lt 808", manzana: "NV8", lote: 808, area: 44.17, price: 39753, status: "disponible" },
      { id: "condomin-NV8-809", label: "Mz NV8 - Lt 809", manzana: "NV8", lote: 809, area: 44.91, price: 40419, status: "disponible" },
      { id: "condomin-NV9-901", label: "Mz NV9 - Lt 901", manzana: "NV9", lote: 901, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV9-902", label: "Mz NV9 - Lt 902", manzana: "NV9", lote: 902, area: 60.74, price: 54666, status: "disponible" },
      { id: "condomin-NV9-903", label: "Mz NV9 - Lt 903", manzana: "NV9", lote: 903, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV9-904", label: "Mz NV9 - Lt 904", manzana: "NV9", lote: 904, area: 60.74, price: 54666, status: "disponible" },
      { id: "condomin-NV9-905", label: "Mz NV9 - Lt 905", manzana: "NV9", lote: 905, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV9-906", label: "Mz NV9 - Lt 906", manzana: "NV9", lote: 906, area: 44.17, price: 39753, status: "disponible" },
      { id: "condomin-NV9-907", label: "Mz NV9 - Lt 907", manzana: "NV9", lote: 907, area: 44.9, price: 40410, status: "disponible" },
      { id: "condomin-NV10-1001", label: "Mz NV10 - Lt 1001", manzana: "NV10", lote: 1001, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV10-1002", label: "Mz NV10 - Lt 1002", manzana: "NV10", lote: 1002, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV10-1003", label: "Mz NV10 - Lt 1003", manzana: "NV10", lote: 1003, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV10-1004", label: "Mz NV10 - Lt 1004", manzana: "NV10", lote: 1004, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV10-1005", label: "Mz NV10 - Lt 1005", manzana: "NV10", lote: 1005, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV10-1006", label: "Mz NV10 - Lt 1006", manzana: "NV10", lote: 1006, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV10-1007", label: "Mz NV10 - Lt 1007", manzana: "NV10", lote: 1007, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV10-1008", label: "Mz NV10 - Lt 1008", manzana: "NV10", lote: 1008, area: 44.17, price: 39753, status: "disponible" },
      { id: "condomin-NV10-1009", label: "Mz NV10 - Lt 1009", manzana: "NV10", lote: 1009, area: 44.91, price: 40419, status: "disponible" },
      { id: "condomin-NV11-1101", label: "Mz NV11 - Lt 1101", manzana: "NV11", lote: 1101, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV11-1102", label: "Mz NV11 - Lt 1102", manzana: "NV11", lote: 1102, area: 60.74, price: 54666, status: "disponible" },
      { id: "condomin-NV11-1103", label: "Mz NV11 - Lt 1103", manzana: "NV11", lote: 1103, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV11-1104", label: "Mz NV11 - Lt 1104", manzana: "NV11", lote: 1104, area: 60.74, price: 54666, status: "disponible" },
      { id: "condomin-NV11-1105", label: "Mz NV11 - Lt 1105", manzana: "NV11", lote: 1105, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV11-1106", label: "Mz NV11 - Lt 1106", manzana: "NV11", lote: 1106, area: 44.17, price: 39753, status: "disponible" },
      { id: "condomin-NV11-1107", label: "Mz NV11 - Lt 1107", manzana: "NV11", lote: 1107, area: 44.9, price: 40410, status: "disponible" },
      { id: "condomin-NV12-1201", label: "Mz NV12 - Lt 1201", manzana: "NV12", lote: 1201, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV12-1202", label: "Mz NV12 - Lt 1202", manzana: "NV12", lote: 1202, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV12-1203", label: "Mz NV12 - Lt 1203", manzana: "NV12", lote: 1203, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV12-1204", label: "Mz NV12 - Lt 1204", manzana: "NV12", lote: 1204, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV12-1205", label: "Mz NV12 - Lt 1205", manzana: "NV12", lote: 1205, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV12-1206", label: "Mz NV12 - Lt 1206", manzana: "NV12", lote: 1206, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV12-1207", label: "Mz NV12 - Lt 1207", manzana: "NV12", lote: 1207, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV12-1208", label: "Mz NV12 - Lt 1208", manzana: "NV12", lote: 1208, area: 44.17, price: 39753, status: "disponible" },
      { id: "condomin-NV12-1209", label: "Mz NV12 - Lt 1209", manzana: "NV12", lote: 1209, area: 44.91, price: 40419, status: "disponible" },
      { id: "condomin-NV13-1301", label: "Mz NV13 - Lt 1301", manzana: "NV13", lote: 1301, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV13-1302", label: "Mz NV13 - Lt 1302", manzana: "NV13", lote: 1302, area: 60.74, price: 54666, status: "disponible" },
      { id: "condomin-NV13-1303", label: "Mz NV13 - Lt 1303", manzana: "NV13", lote: 1303, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV13-1304", label: "Mz NV13 - Lt 1304", manzana: "NV13", lote: 1304, area: 60.74, price: 54666, status: "disponible" },
      { id: "condomin-NV13-1305", label: "Mz NV13 - Lt 1305", manzana: "NV13", lote: 1305, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV13-1306", label: "Mz NV13 - Lt 1306", manzana: "NV13", lote: 1306, area: 44.17, price: 39753, status: "disponible" },
      { id: "condomin-NV13-1307", label: "Mz NV13 - Lt 1307", manzana: "NV13", lote: 1307, area: 44.9, price: 40410, status: "disponible" },
      { id: "condomin-NV14-1401", label: "Mz NV14 - Lt 1401", manzana: "NV14", lote: 1401, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV14-1402", label: "Mz NV14 - Lt 1402", manzana: "NV14", lote: 1402, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV14-1403", label: "Mz NV14 - Lt 1403", manzana: "NV14", lote: 1403, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV14-1404", label: "Mz NV14 - Lt 1404", manzana: "NV14", lote: 1404, area: 30.54, price: 27486, status: "disponible" },
      { id: "condomin-NV14-1405", label: "Mz NV14 - Lt 1405", manzana: "NV14", lote: 1405, area: 30.15, price: 27135, status: "disponible" },
      { id: "condomin-NV14-1406", label: "Mz NV14 - Lt 1406", manzana: "NV14", lote: 1406, area: 30.6, price: 27540, status: "disponible" },
      { id: "condomin-NV14-1407", label: "Mz NV14 - Lt 1407", manzana: "NV14", lote: 1407, area: 44.59, price: 40131, status: "disponible" },
      { id: "condomin-NV14-1408", label: "Mz NV14 - Lt 1408", manzana: "NV14", lote: 1408, area: 44.17, price: 39753, status: "disponible" },
      { id: "condomin-NV14-1409", label: "Mz NV14 - Lt 1409", manzana: "NV14", lote: 1409, area: 44.91, price: 40419, status: "disponible" }
    ],
  },
  {
    id: 'residencial-baviera',
    name: "Residencial Baviera",
    slug: 'residencial-baviera',
    category: 'lotes',
    description: "Proyecto Residencial Baviera ubicado en la ciudad de Oxapampa en el distrito de Pozuzo",
    shortDescription: "Lotes desde 220m² con todos los servicios",
    developer: { name: "DunavLand Desarrolladora", slug: 'dunavland-desarrolladora', website: '' },
    city: "Oxapampa", zone: "Pozuzo", region: "Pasco",
    addressText: "A 2 minutos de Prusia",
    minPrice: 35945.6, maxPrice: 67468.2, priceM2Min: 160, priceM2Max: 230,
    lotSizeMin: 220, lotSizeMax: 349.09, totalLots: 47,
    downPaymentMin: 19850, monthlyPaymentEst: 1092, termMonthsEst: 36,
    lat: 0, lng: 0,
    accessType: 'PISTA_ASFALTADA', legalStatus: 'EN_TRAMITE',
    distanceToCityCenterKm: 10, safetyScore: 65, valorizationEstimate: 10,
    services: { agua: true, luz: true, desague: true, internet: false, seguridad: true, areasVerdes: true },
    isFeatured: false, isActive: true,
    imageUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=400&fit=crop",
    views30d: 218,
    lots: [
      { id: "residenc-A-01", label: "Mz A - Lt 01", manzana: "A", lote: 1, area: 224.77, price: 60687.9, status: "disponible" },
      { id: "residenc-A-02", label: "Mz A - Lt 02", manzana: "A", lote: 2, area: 231, price: 62370, status: "disponible" },
      { id: "residenc-A-03", label: "Mz A - Lt 03", manzana: "A", lote: 3, area: 224.75, price: 60682.5, status: "disponible" },
      { id: "residenc-A-04", label: "Mz A - Lt 04", manzana: "A", lote: 4, area: 229.6, price: 61992, status: "disponible" },
      { id: "residenc-A-05", label: "Mz A - Lt 05", manzana: "A", lote: 5, area: 229.6, price: 61992, status: "disponible" },
      { id: "residenc-A-06", label: "Mz A - Lt 06", manzana: "A", lote: 6, area: 229.6, price: 61992, status: "disponible" },
      { id: "residenc-A-07", label: "Mz A - Lt 07", manzana: "A", lote: 7, area: 229.6, price: 52808, status: "disponible" },
      { id: "residenc-A-08", label: "Mz A - Lt 08", manzana: "A", lote: 8, area: 229.6, price: 52808, status: "disponible" },
      { id: "residenc-A-09", label: "Mz A - Lt 09", manzana: "A", lote: 9, area: 246, price: 56580, status: "disponible" },
      { id: "residenc-A-10", label: "Mz A - Lt 10", manzana: "A", lote: 10, area: 293.34, price: 67468.2, status: "disponible" },
      { id: "residenc-A-11", label: "Mz A - Lt 11", manzana: "A", lote: 11, area: 291.74, price: 67100.2, status: "disponible" },
      { id: "residenc-A-12", label: "Mz A - Lt 12", manzana: "A", lote: 12, area: 229.6, price: 52808, status: "disponible" },
      { id: "residenc-A-13", label: "Mz A - Lt 13", manzana: "A", lote: 13, area: 229.6, price: 52808, status: "disponible" },
      { id: "residenc-A-14", label: "Mz A - Lt 14", manzana: "A", lote: 14, area: 229.6, price: 61992, status: "disponible" },
      { id: "residenc-A-15", label: "Mz A - Lt 15", manzana: "A", lote: 15, area: 229.6, price: 61992, status: "disponible" },
      { id: "residenc-A-16", label: "Mz A - Lt 16", manzana: "A", lote: 16, area: 229.6, price: 61992, status: "disponible" },
      { id: "residenc-B-01", label: "Mz B - Lt 01", manzana: "B", lote: 1, area: 227.97, price: 61551.9, status: "disponible" },
      { id: "residenc-B-02", label: "Mz B - Lt 02", manzana: "B", lote: 2, area: 220, price: 59400, status: "disponible" },
      { id: "residenc-B-03", label: "Mz B - Lt 03", manzana: "B", lote: 3, area: 220, price: 59400, status: "disponible" },
      { id: "residenc-B-04", label: "Mz B - Lt 04", manzana: "B", lote: 4, area: 220, price: 59400, status: "disponible" },
      { id: "residenc-B-05", label: "Mz B - Lt 05", manzana: "B", lote: 5, area: 220, price: 59400, status: "disponible" },
      { id: "residenc-B-06", label: "Mz B - Lt 06", manzana: "B", lote: 6, area: 220, price: 59400, status: "disponible" },
      { id: "residenc-B-07", label: "Mz B - Lt 07", manzana: "B", lote: 7, area: 220, price: 59400, status: "disponible" },
      { id: "residenc-B-08", label: "Mz B - Lt 08", manzana: "B", lote: 8, area: 220, price: 50600, status: "disponible" },
      { id: "residenc-B-09", label: "Mz B - Lt 09", manzana: "B", lote: 9, area: 220, price: 50600, status: "disponible" },
      { id: "residenc-B-10", label: "Mz B - Lt 10", manzana: "B", lote: 10, area: 220, price: 50600, status: "disponible" },
      { id: "residenc-B-11", label: "Mz B - Lt 11", manzana: "B", lote: 11, area: 220, price: 50600, status: "disponible" },
      { id: "residenc-B-12", label: "Mz B - Lt 12", manzana: "B", lote: 12, area: 220, price: 50600, status: "disponible" },
      { id: "residenc-B-13", label: "Mz B - Lt 13", manzana: "B", lote: 13, area: 281.61, price: 64770.3, status: "disponible" },
      { id: "residenc-B-14", label: "Mz B - Lt 14", manzana: "B", lote: 14, area: 238.01, price: 54742.299999999996, status: "disponible" },
      { id: "residenc-B-15", label: "Mz B - Lt 15", manzana: "B", lote: 15, area: 260.5, price: 59915, status: "disponible" },
      { id: "residenc-B-16", label: "Mz B - Lt 16", manzana: "B", lote: 16, area: 240, price: 55200, status: "disponible" },
      { id: "residenc-B-17", label: "Mz B - Lt 17", manzana: "B", lote: 17, area: 240, price: 55200, status: "disponible" },
      { id: "residenc-B-18", label: "Mz B - Lt 18", manzana: "B", lote: 18, area: 240, price: 55200, status: "disponible" },
      { id: "residenc-B-19", label: "Mz B - Lt 19", manzana: "B", lote: 19, area: 349.09, price: 55854.399999999994, status: "disponible" },
      { id: "residenc-B-20", label: "Mz B - Lt 20", manzana: "B", lote: 20, area: 240, price: 38400, status: "disponible" },
      { id: "residenc-B-21", label: "Mz B - Lt 21", manzana: "B", lote: 21, area: 240, price: 38400, status: "disponible" },
      { id: "residenc-B-22", label: "Mz B - Lt 22", manzana: "B", lote: 22, area: 240, price: 38400, status: "disponible" },
      { id: "residenc-C-01", label: "Mz C - Lt 01", manzana: "C", lote: 1, area: 253.87, price: 58390.1, status: "disponible" },
      { id: "residenc-C-02", label: "Mz C - Lt 02", manzana: "C", lote: 2, area: 220, price: 50600, status: "disponible" },
      { id: "residenc-C-03", label: "Mz C - Lt 03", manzana: "C", lote: 3, area: 221.97, price: 51053.1, status: "disponible" },
      { id: "residenc-D-01", label: "Mz D - Lt 01", manzana: "D", lote: 1, area: 224.66, price: 42685.4, status: "disponible" },
      { id: "residenc-E-01", label: "Mz E - Lt 01", manzana: "E", lote: 1, area: 253.99, price: 40638.4, status: "disponible" },
      { id: "residenc-E-02", label: "Mz E - Lt 02", manzana: "E", lote: 2, area: 240, price: 38400, status: "disponible" },
      { id: "residenc-E-03", label: "Mz E - Lt 03", manzana: "E", lote: 3, area: 240, price: 38400, status: "disponible" },
      { id: "residenc-E-04", label: "Mz E - Lt 04", manzana: "E", lote: 4, area: 240, price: 38400, status: "disponible" },
      { id: "residenc-E-05", label: "Mz E - Lt 05", manzana: "E", lote: 5, area: 240, price: 38400, status: "disponible" }
    ],
  },
];

// ── Live projects (reads from admin store if available) ──

export function getLiveProjects(): ProjectData[] {
  if (typeof window === 'undefined') return PROJECTS.filter((p) => p.isActive);
  try {
    const stored = localStorage.getItem('peruinversion_admin_projects');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed.filter((p: ProjectData) => p.isActive);
    }
  } catch { /* fallback */ }
  return PROJECTS.filter((p) => p.isActive);
}

// Helpers
export function getFeaturedProjects(): ProjectData[] {
  return getLiveProjects().filter((p) => p.isFeatured);
}

export function getAllCities(): string[] {
  return [...new Set(getLiveProjects().map((p) => p.city))];
}

export function getAllDevelopers(): string[] {
  return [...new Set(getLiveProjects().map((p) => p.developer.name))];
}

export function getProjectBySlug(slug: string): ProjectData | undefined {
  return getLiveProjects().find((p) => p.slug === slug);
}

export function filterProjects(filters: {
  search?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  legalStatus?: string;
  sortBy?: string;
}): ProjectData[] {
  let result = [...getLiveProjects()];

  if (filters.search) {
    const s = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.zone.toLowerCase().includes(s) ||
        p.city.toLowerCase().includes(s) ||
        p.developer.name.toLowerCase().includes(s)
    );
  }
  if (filters.city) {
    result = result.filter((p) => p.city === filters.city);
  }
  if (filters.minPrice) {
    result = result.filter((p) => p.maxPrice >= filters.minPrice!);
  }
  if (filters.maxPrice) {
    result = result.filter((p) => p.minPrice <= filters.maxPrice!);
  }
  if (filters.minArea) {
    result = result.filter((p) => p.lotSizeMax >= filters.minArea!);
  }
  if (filters.maxArea) {
    result = result.filter((p) => p.lotSizeMin <= filters.maxArea!);
  }
  if (filters.legalStatus) {
    result = result.filter((p) => p.legalStatus === filters.legalStatus);
  }

  // Sort
  if (filters.sortBy === 'price_asc') {
    result.sort((a, b) => a.minPrice - b.minPrice);
  } else if (filters.sortBy === 'price_desc') {
    result.sort((a, b) => b.minPrice - a.minPrice);
  } else if (filters.sortBy === 'area_desc') {
    result.sort((a, b) => b.lotSizeMax - a.lotSizeMax);
  } else if (filters.sortBy === 'safety_desc') {
    result.sort((a, b) => b.safetyScore - a.safetyScore);
  } else if (filters.sortBy === 'valorizacion_desc') {
    result.sort((a, b) => b.valorizationEstimate - a.valorizationEstimate);
  }

  return result;
}

export function getLegalStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    INSCRITO_SUNARP: 'Inscrito SUNARP',
    EN_TRAMITE: 'En trámite',
    TITULO_MATRIZ: 'Título matriz',
    HABILITACION_URBANA: 'Habilitación urbana',
    SIN_DOCUMENTOS: 'Sin documentos',
  };
  return labels[status] || status;
}

export function getLegalStatusColor(status: string): string {
  if (status === 'INSCRITO_SUNARP') return 'bg-green-100 text-green-700';
  if (status === 'EN_TRAMITE') return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

export function getAccessLabel(access: string): string {
  const labels: Record<string, string> = {
    PISTA_ASFALTADA: 'Pista asfaltada',
    PISTA_AFIRMADA: 'Pista afirmada',
    TROCHA: 'Trocha',
    MIXTO: 'Mixto',
  };
  return labels[access] || access;
}

export function formatPrice(price: number, currency: ProjectCurrency = 'PEN'): string {
  if (currency === 'USD') {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  }
  return `S/${price.toLocaleString('es-PE')}`;
}

export function getExclusiveProjects(): ProjectData[] {
  return getLiveProjects().filter((p) => p.isExclusive);
}

export function getProjectsByCategory(category: ProjectCategory): ProjectData[] {
  return getLiveProjects().filter((p) => p.category === category);
}

export function getCategoryLabel(category: ProjectCategory): string {
  const labels: Record<ProjectCategory, string> = {
    'lotes': 'Lotes y Terrenos',
    'departamentos': 'Departamentos',
    'locales-comerciales': 'Locales Comerciales',
  };
  return labels[category];
}
