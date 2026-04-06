// ============================================
// RESERVATIONS STORE — Supabase via API routes
// ============================================

export type ReservationStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface ReservationDocument {
  id: string;
  name: string;
  description?: string;
  fileType: 'pdf' | 'image' | 'other';
  fileUrl: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface ReservationTimelineEvent {
  id: string;
  type: 'created' | 'approved' | 'rejected' | 'document' | 'note';
  title: string;
  description?: string;
  date: string;
  by?: string;
}

export interface Reservation {
  id: string;
  code: string;
  projectId: string;
  projectName: string;
  lotId: string;
  lotLabel: string;
  lotArea: number;
  lotPrice: number;
  reservationAmount: number;
  currency?: 'PEN' | 'USD';
  clientName: string;
  clientDni: string;
  clientEmail: string;
  clientPhone: string;
  paymentMethod: 'yape' | 'plin' | 'transferencia' | 'otro';
  purchaseType?: 'financiado' | 'contado';
  voucherImage: string;
  initialPayment?: number;
  termMonths?: number;
  monthlyPayment?: number;
  selectedPrize?: string;
  selectedPrizeLabel?: string;
  status: ReservationStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
  documents?: ReservationDocument[];
  timeline?: ReservationTimelineEvent[];
}

// ── Helpers ──────────────────────────────────────────────────

function generateCode(): string {
  return `RES-${Math.floor(10000 + Math.random() * 90000)}`;
}

function generateId(): string {
  return `res_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Public API ────────────────────────────────────────────────

export async function getAllReservations(): Promise<Reservation[]> {
  try {
    return await apiFetch<Reservation[]>('/api/db/reservations');
  } catch {
    return [];
  }
}

export async function getReservationByCode(code: string): Promise<Reservation | null> {
  const all = await getAllReservations();
  return all.find((r) => r.code === code) ?? null;
}

export async function createReservation(data: Omit<Reservation, 'id' | 'code' | 'createdAt'>): Promise<Reservation> {
  const reservation: Reservation = {
    ...data,
    id: generateId(),
    code: generateCode(),
    createdAt: new Date().toISOString(),
    timeline: [{ id: `tl_${Date.now()}`, type: 'created', title: 'Reserva creada', date: new Date().toISOString() }],
  };
  return apiFetch<Reservation>('/api/db/reservations', { method: 'POST', body: JSON.stringify(reservation) });
}

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
  opts?: { reviewedBy?: string; rejectionReason?: string; notes?: string }
): Promise<Reservation | null> {
  const patch = {
    status,
    reviewedAt: new Date().toISOString(),
    ...(opts?.reviewedBy ? { reviewedBy: opts.reviewedBy } : {}),
    ...(opts?.rejectionReason ? { rejectionReason: opts.rejectionReason } : {}),
    ...(opts?.notes ? { notes: opts.notes } : {}),
  };
  try {
    return await apiFetch<Reservation>(`/api/db/reservations/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
  } catch {
    return null;
  }
}

export async function updateReservation(id: string, patch: Partial<Reservation>): Promise<Reservation | null> {
  try {
    return await apiFetch<Reservation>(`/api/db/reservations/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
  } catch {
    return null;
  }
}

export async function deleteReservation(id: string): Promise<boolean> {
  try {
    await apiFetch(`/api/db/reservations/${id}`, { method: 'DELETE' });
    return true;
  } catch {
    return false;
  }
}

export async function getReservationStats() {
  const all = await getAllReservations();
  return {
    total: all.length,
    pendientes: all.filter((r) => r.status === 'pendiente').length,
    aprobadas: all.filter((r) => r.status === 'aprobada').length,
    rechazadas: all.filter((r) => r.status === 'rechazada').length,
    totalAmount: all.filter((r) => r.status === 'aprobada').reduce((sum, r) => sum + (r.reservationAmount || 0), 0),
  };
}

export async function getReservationByCodeAndDni(code: string, dni: string): Promise<Reservation | null> {
  const all = await getAllReservations();
  return all.find((r) => r.code === code && r.clientDni === dni) ?? null;
}

export async function getReservationsByDni(dni: string): Promise<Reservation[]> {
  const all = await getAllReservations();
  return all.filter((r) => r.clientDni === dni);
}

export function buildTimeline(reservation: Reservation): ReservationTimelineEvent[] {
  if (reservation.timeline && reservation.timeline.length > 0) return reservation.timeline;
  const events: ReservationTimelineEvent[] = [
    {
      id: `tl_created_${reservation.id}`,
      type: 'created',
      title: 'Reserva creada',
      description: `Reserva del lote ${reservation.lotLabel} en ${reservation.projectName}`,
      date: reservation.createdAt,
    },
  ];
  if (reservation.status === 'aprobada' && reservation.reviewedAt) {
    events.push({
      id: `tl_approved_${reservation.id}`,
      type: 'approved',
      title: 'Reserva aprobada',
      description: reservation.notes,
      date: reservation.reviewedAt,
      by: reservation.reviewedBy,
    });
  }
  if (reservation.status === 'rechazada' && reservation.reviewedAt) {
    events.push({
      id: `tl_rejected_${reservation.id}`,
      type: 'rejected',
      title: 'Reserva rechazada',
      description: reservation.rejectionReason,
      date: reservation.reviewedAt,
      by: reservation.reviewedBy,
    });
  }
  return events;
}
