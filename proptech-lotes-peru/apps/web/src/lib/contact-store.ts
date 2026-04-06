// ============================================
// CONTACT STORE — Supabase via API routes
// ============================================

export const CONTACT_STORE_KEY = 'peruinversion_contact_submissions'; // kept for legacy reference only

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectId?: string;
  projectName?: string;
  message: string;
  source?: string;
  isRead: boolean;
  createdAt: string;
}

// ── Helpers ──────────────────────────────────────────────────

function generateId(): string {
  return `contact_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Public API ────────────────────────────────────────────────

export async function getContactSubmissions(): Promise<ContactSubmission[]> {
  try {
    return await apiFetch<ContactSubmission[]>('/api/db/contact');
  } catch {
    return [];
  }
}

export async function saveContactSubmission(data: Omit<ContactSubmission, 'id' | 'isRead' | 'createdAt'>): Promise<ContactSubmission> {
  const submission: ContactSubmission = {
    ...data,
    id: generateId(),
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  return apiFetch<ContactSubmission>('/api/db/contact', { method: 'POST', body: JSON.stringify(submission) });
}

export async function markContactRead(id: string): Promise<void> {
  await apiFetch('/api/db/contact', { method: 'PATCH', body: JSON.stringify({ id }) });
}

export async function markAllContactRead(): Promise<void> {
  await apiFetch('/api/db/contact', { method: 'PATCH', body: JSON.stringify({ all: true }) });
}

export async function deleteContactSubmission(id: string): Promise<void> {
  await apiFetch(`/api/db/contact?id=${id}`, { method: 'DELETE' });
}

export async function getUnreadContactCount(): Promise<number> {
  try {
    const submissions = await getContactSubmissions();
    return submissions.filter((s) => !s.isRead).length;
  } catch {
    return 0;
  }
}
