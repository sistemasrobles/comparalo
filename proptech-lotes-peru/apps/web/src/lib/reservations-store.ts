// ============================================
// STORE DE RESERVAS - localStorage
// En producción esto sería una base de datos
// ============================================

export type ReservationStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface ReservationDocument {
  id: string;
  name: string;           // e.g. "Contrato de compraventa"
  description?: string;
  fileType: 'pdf' | 'image' | 'other';
  fileUrl: string;        // base64 data URL or URL
  uploadedAt: string;     // ISO date
  uploadedBy: string;     // "Asesor", etc.
}

export interface ReservationTimelineEvent {
  id: string;
  type: 'created' | 'approved' | 'rejected' | 'document' | 'note';
  title: string;
  description?: string;
  date: string;           // ISO date
  by?: string;
}

export interface Reservation {
  id: string;
  code: string;             // Código de seguimiento: RES-XXXXX
  projectId: string;
  projectName: string;
  lotId: string;
  lotLabel: string;
  lotArea: number;
  lotPrice: number;
  reservationAmount: number;
  // Moneda del proyecto al momento de la reserva (se guarda para mostrar correctamente en el panel)
  currency?: 'PEN' | 'USD';
  // Cliente
  clientName: string;
  clientDni: string;
  clientEmail: string;
  clientPhone: string;
  // Pago
  paymentMethod: 'yape' | 'plin' | 'transferencia' | 'otro';
  purchaseType?: 'financiado' | 'contado';
  voucherImage: string;     // base64 data URL
  // Plan de pago
  initialPayment?: number;       // Cuota inicial elegida
  termMonths?: number;           // Plazo en meses (solo financiado)
  monthlyPayment?: number;       // Cuota mensual estimada (solo financiado)
  selectedPrize?: string;        // ID del premio elegido (solo contado)
  selectedPrizeLabel?: string;   // Nombre del premio elegido (solo contado)
  // Estado
  status: ReservationStatus;
  createdAt: string;        // ISO date
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
  // Documentos y timeline
  documents?: ReservationDocument[];
  timeline?: ReservationTimelineEvent[];
}

const STORAGE_KEY = 'peruinversion_reservations';

function generateCode(): string {
  const num = Math.floor(10000 + Math.random() * 90000);
  return `RES-${num}`;
}

function generateId(): string {
  return `res_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export function getAllReservations(): Reservation[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getReservationByCode(code: string): Reservation | undefined {
  return getAllReservations().find((r) => r.code === code);
}

export function getReservationsByProject(projectId: string): Reservation[] {
  return getAllReservations().filter((r) => r.projectId === projectId);
}

export function getReservationsByStatus(status: ReservationStatus): Reservation[] {
  return getAllReservations().filter((r) => r.status === status);
}

export function createReservation(data: Omit<Reservation, 'id' | 'code' | 'status' | 'createdAt'>): Reservation {
  const reservation: Reservation = {
    ...data,
    id: generateId(),
    code: generateCode(),
    status: 'pendiente',
    createdAt: new Date().toISOString(),
  };
  const all = getAllReservations();
  all.push(reservation);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return reservation;
}

export function updateReservationStatus(
  id: string,
  status: ReservationStatus,
  reviewedBy?: string,
  rejectionReason?: string,
  notes?: string
): Reservation | null {
  const all = getAllReservations();
  const index = all.findIndex((r) => r.id === id);
  if (index === -1) return null;
  
  all[index] = {
    ...all[index],
    status,
    reviewedAt: new Date().toISOString(),
    reviewedBy,
    rejectionReason,
    notes,
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all[index];
}

export function deleteReservation(id: string): boolean {
  const all = getAllReservations();
  const filtered = all.filter((r) => r.id !== id);
  if (filtered.length === all.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

export function getReservationStats() {
  const all = getAllReservations();
  return {
    total: all.length,
    pendientes: all.filter((r) => r.status === 'pendiente').length,
    aprobadas: all.filter((r) => r.status === 'aprobada').length,
    rechazadas: all.filter((r) => r.status === 'rechazada').length,
    totalAmount: all.filter((r) => r.status === 'aprobada').reduce((sum, r) => sum + r.reservationAmount, 0),
  };
}

// ── Documentos ──

export function addDocumentToReservation(
  reservationId: string,
  doc: Omit<ReservationDocument, 'id' | 'uploadedAt'>
): Reservation | null {
  const all = getAllReservations();
  const index = all.findIndex((r) => r.id === reservationId);
  if (index === -1) return null;

  const newDoc: ReservationDocument = {
    ...doc,
    id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    uploadedAt: new Date().toISOString(),
  };

  if (!all[index].documents) all[index].documents = [];
  all[index].documents!.push(newDoc);

  // Add timeline event
  if (!all[index].timeline) all[index].timeline = [];
  all[index].timeline!.push({
    id: `evt_${Date.now()}`,
    type: 'document',
    title: `Documento adjuntado: ${doc.name}`,
    description: doc.description,
    date: new Date().toISOString(),
    by: doc.uploadedBy,
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all[index];
}

export function removeDocumentFromReservation(
  reservationId: string,
  documentId: string
): Reservation | null {
  const all = getAllReservations();
  const index = all.findIndex((r) => r.id === reservationId);
  if (index === -1) return null;

  all[index].documents = (all[index].documents || []).filter((d) => d.id !== documentId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return all[index];
}

export function getReservationByCodeAndDni(code: string, dni: string): Reservation | undefined {
  return getAllReservations().find((r) => r.code === code && r.clientDni === dni);
}

export function getReservationsByDni(dni: string): Reservation[] {
  return getAllReservations().filter((r) => r.clientDni === dni);
}

export function buildTimeline(reservation: Reservation): ReservationTimelineEvent[] {
  const events: ReservationTimelineEvent[] = [];

  // Creation event
  events.push({
    id: 'evt_created',
    type: 'created',
    title: 'Reserva registrada',
    description: `Lote ${reservation.lotLabel} en ${reservation.projectName}`,
    date: reservation.createdAt,
  });

  // Review event
  if (reservation.reviewedAt) {
    events.push({
      id: 'evt_reviewed',
      type: reservation.status === 'aprobada' ? 'approved' : 'rejected',
      title: reservation.status === 'aprobada' ? 'Reserva aprobada' : 'Reserva rechazada',
      description: reservation.status === 'rechazada' ? reservation.rejectionReason : 'Tu comprobante fue verificado correctamente',
      date: reservation.reviewedAt,
      by: reservation.reviewedBy,
    });
  }

  // Document events from timeline
  if (reservation.timeline) {
    events.push(...reservation.timeline.filter((e) => e.type === 'document'));
  }

  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return events;
}
