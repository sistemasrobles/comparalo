// ── Recently Viewed Projects Store ──────────────────────────────────────
// Guarda los últimos proyectos visitados en localStorage.
// Máximo 6 proyectos, ordenados del más reciente al más antiguo.

export const RECENTLY_VIEWED_KEY = 'peruinversion_recently_viewed';
const MAX_ITEMS = 6;

export interface RecentlyViewedProject {
  slug: string;
  name: string;
  city: string;
  zone: string;
  imageUrl: string;
  minPrice: number;
  currency: 'PEN' | 'USD';
  category: string;
  visitedAt: string; // ISO
}

export function getRecentlyViewed(): RecentlyViewedProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? (JSON.parse(raw) as RecentlyViewedProject[]) : [];
  } catch {
    return [];
  }
}

export function saveRecentlyViewed(project: Omit<RecentlyViewedProject, 'visitedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = getRecentlyViewed();
    // Eliminar si ya existe (para mover al frente)
    const filtered = existing.filter((p) => p.slug !== project.slug);
    const updated: RecentlyViewedProject[] = [
      { ...project, visitedAt: new Date().toISOString() },
      ...filtered,
    ].slice(0, MAX_ITEMS);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
  } catch {
    // silently fail
  }
}

export function clearRecentlyViewed(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(RECENTLY_VIEWED_KEY);
  } catch { /* noop */ }
}
