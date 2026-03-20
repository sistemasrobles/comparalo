// ── Feria PerúInversión — Store de registros ──────────────────────────────

export const FERIA_STORE_KEY = 'peruinversion_feria_registros';

export interface FeriaRegistro {
  id: string;
  name: string;
  email: string;
  phone: string;
  interest: string; // 'lotes' | 'departamentos' | 'inversion' | 'otro'
  createdAt: string; // ISO
  read: boolean;
}

// ── Utilidad ──────────────────────────────────────────────────────────────

function generateId(): string {
  return `feria_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── CRUD ──────────────────────────────────────────────────────────────────

export function getFeriaRegistros(): FeriaRegistro[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FERIA_STORE_KEY);
    return raw ? (JSON.parse(raw) as FeriaRegistro[]) : [];
  } catch {
    return [];
  }
}

export function saveFeriaRegistro(data: Omit<FeriaRegistro, 'id' | 'createdAt' | 'read'>): FeriaRegistro {
  const registros = getFeriaRegistros();
  const nuevo: FeriaRegistro = {
    id: generateId(),
    ...data,
    createdAt: new Date().toISOString(),
    read: false,
  };
  localStorage.setItem(FERIA_STORE_KEY, JSON.stringify([nuevo, ...registros]));
  return nuevo;
}

export function markFeriaRegistroRead(id: string): void {
  const registros = getFeriaRegistros().map((r) =>
    r.id === id ? { ...r, read: true } : r,
  );
  localStorage.setItem(FERIA_STORE_KEY, JSON.stringify(registros));
}

export function markAllFeriaRead(): void {
  const registros = getFeriaRegistros().map((r) => ({ ...r, read: true }));
  localStorage.setItem(FERIA_STORE_KEY, JSON.stringify(registros));
}

export function deleteFeriaRegistro(id: string): void {
  const registros = getFeriaRegistros().filter((r) => r.id !== id);
  localStorage.setItem(FERIA_STORE_KEY, JSON.stringify(registros));
}

export function getUnreadFeriaCount(): number {
  return getFeriaRegistros().filter((r) => !r.read).length;
}
