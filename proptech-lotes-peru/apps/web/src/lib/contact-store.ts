/* ═══════════════════════════════════════════════════════
   CONTACT SUBMISSIONS STORE  (localStorage)
   Guarda los mensajes enviados desde el popup "Contactar"
   de la página de búsqueda para que aparezcan en el
   panel admin → pestaña "Consultas".
════════════════════════════════════════════════════════ */

export interface ContactSubmission {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  projectName: string;
  projectSlug: string;
  read: boolean;
  createdAt: string;
}

export const CONTACT_STORE_KEY = 'peruinversion_contact_submissions';

/* ── Helpers ── */
function loadAll(): ContactSubmission[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(CONTACT_STORE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveAll(items: ContactSubmission[]): void {
  localStorage.setItem(CONTACT_STORE_KEY, JSON.stringify(items));
}

/* ── Public API ── */

export function saveContactSubmission(
  data: Omit<ContactSubmission, 'id' | 'read' | 'createdAt'>
): ContactSubmission {
  const submission: ContactSubmission = {
    ...data,
    id: `contact_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const all = loadAll();
  saveAll([submission, ...all]);
  return submission;
}

export function getContactSubmissions(): ContactSubmission[] {
  return loadAll();
}

export function markContactRead(id: string): void {
  const all = loadAll().map((s) => (s.id === id ? { ...s, read: true } : s));
  saveAll(all);
}

export function markAllContactRead(): void {
  const all = loadAll().map((s) => ({ ...s, read: true }));
  saveAll(all);
}

export function deleteContactSubmission(id: string): void {
  saveAll(loadAll().filter((s) => s.id !== id));
}

export function getUnreadContactCount(): number {
  return loadAll().filter((s) => !s.read).length;
}
