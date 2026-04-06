// ============================================
// FERIA STORE — Supabase via API routes
// ============================================

export const FERIA_STORE_KEY = 'peruinversion_feria_registros'; // kept for legacy reference only

export interface FeriaRegistro {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  ciudad?: string;
  presupuesto?: string;
  interes?: string;
  comoConocio?: string;
  isRead: boolean;
  createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────

function generateId(): string {
  return `feria_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Public API ────────────────────────────────────────────────

export async function getFeriaRegistros(): Promise<FeriaRegistro[]> {
  try {
    return await apiFetch<FeriaRegistro[]>('/api/db/feria-registros');
  } catch {
    return [];
  }
}

export async function saveFeriaRegistro(data: Omit<FeriaRegistro, 'id' | 'isRead' | 'createdAt'>): Promise<FeriaRegistro> {
  const registro: FeriaRegistro = {
    ...data,
    id: generateId(),
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  return apiFetch<FeriaRegistro>('/api/db/feria-registros', { method: 'POST', body: JSON.stringify(registro) });
}

export async function markFeriaRegistroRead(id: string): Promise<void> {
  await apiFetch('/api/db/feria-registros', { method: 'PATCH', body: JSON.stringify({ id }) });
}

export async function markAllFeriaRead(): Promise<void> {
  await apiFetch('/api/db/feria-registros', { method: 'PATCH', body: JSON.stringify({ all: true }) });
}

export async function deleteFeriaRegistro(id: string): Promise<void> {
  await apiFetch(`/api/db/feria-registros?id=${id}`, { method: 'DELETE' });
}

export async function getUnreadFeriaCount(): Promise<number> {
  try {
    const registros = await getFeriaRegistros();
    return registros.filter((r) => !r.isRead).length;
  } catch {
    return 0;
  }
}
