// ============================================
// CHAT STORE — Supabase via API routes
// ============================================

export const CHAT_CONV_KEY = 'peruinversion_conversations'; // kept for legacy reference only

export type MessageRole = 'visitor' | 'admin' | 'bot';

export interface ChatMsg {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: string;
  read?: boolean;
}

export interface Conversation {
  id: string;
  visitorName?: string;
  visitorEmail?: string;
  projectId?: string;
  projectName?: string;
  messages: ChatMsg[];
  isRead: boolean;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────

function generateId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

function generateMsgId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Public API ────────────────────────────────────────────────

export async function getConversations(): Promise<Conversation[]> {
  try {
    return await apiFetch<Conversation[]>('/api/db/conversations');
  } catch {
    return [];
  }
}

export async function getConversation(id: string): Promise<Conversation | undefined> {
  const all = await getConversations();
  return all.find((c) => c.id === id);
}

export async function sendVisitorMessage(opts: {
  visitorName?: string;
  visitorEmail?: string;
  projectId?: string;
  projectName?: string;
  text: string;
  existingConversationId?: string;
}): Promise<Conversation> {
  const msg: ChatMsg = { id: generateMsgId(), role: 'visitor', text: opts.text, timestamp: new Date().toISOString(), read: false };

  if (opts.existingConversationId) {
    const all = await getConversations();
    const existing = all.find((c) => c.id === opts.existingConversationId);
    if (existing) {
      const updated: Conversation = { ...existing, messages: [...existing.messages, msg], isRead: false, updatedAt: new Date().toISOString() };
      return apiFetch<Conversation>('/api/db/conversations', { method: 'POST', body: JSON.stringify({ conversation: updated, action: 'update' }) });
    }
  }

  const conversation: Conversation = {
    id: generateId(),
    visitorName: opts.visitorName,
    visitorEmail: opts.visitorEmail,
    projectId: opts.projectId,
    projectName: opts.projectName,
    messages: [msg],
    isRead: false,
    isClosed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return apiFetch<Conversation>('/api/db/conversations', { method: 'POST', body: JSON.stringify({ conversation, action: 'create' }) });
}

export async function sendAdminReply(convId: string, text: string): Promise<Conversation | null> {
  const msg: ChatMsg = { id: generateMsgId(), role: 'admin', text, timestamp: new Date().toISOString(), read: true };
  try {
    return await apiFetch<Conversation>('/api/db/conversations', {
      method: 'POST',
      body: JSON.stringify({ conversationId: convId, message: msg, action: 'reply' }),
    });
  } catch {
    return null;
  }
}

export async function markConversationRead(id: string): Promise<void> {
  await apiFetch('/api/db/conversations', { method: 'PATCH', body: JSON.stringify({ id }) });
}

export async function markAllConversationsRead(): Promise<void> {
  await apiFetch('/api/db/conversations', { method: 'PATCH', body: JSON.stringify({ all: true }) });
}

export async function deleteConversation(id: string): Promise<void> {
  await apiFetch(`/api/db/conversations?id=${id}`, { method: 'DELETE' });
}

export async function closeConversation(id: string): Promise<void> {
  await apiFetch('/api/db/conversations', { method: 'PATCH', body: JSON.stringify({ id, isClosed: true }) });
}

export async function getUnreadCount(): Promise<number> {
  try {
    const convs = await getConversations();
    return convs.filter((c) => !c.isRead && !c.isClosed).length;
  } catch {
    return 0;
  }
}
