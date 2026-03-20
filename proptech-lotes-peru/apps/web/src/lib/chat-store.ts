// ============================================
// CHAT STORE — conversaciones bidireccionales
// ============================================

export const CHAT_CONV_KEY = 'peruinversion_conversations';

// Clave legacy (para compatibilidad)
export const CHAT_MESSAGES_KEY = 'peruinversion_chat_messages';

export type MessageRole = 'visitor' | 'admin';

export interface ChatMsg {
  id: string;
  role: MessageRole;
  text: string;
  createdAt: string; // ISO
}

export interface Conversation {
  id: string;           // sessionId del visitante
  visitorName: string;
  visitorEmail: string;
  page: string;         // página desde donde inició
  messages: ChatMsg[];
  createdAt: string;
  updatedAt: string;
  readByAdmin: boolean;
}

// Tipos legacy por si algo los importa
export type ChatMessage = Conversation;

// ─── helpers ──────────────────────────────────────────────────────────────────

function genId(prefix = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function save(convs: Conversation[]): void {
  localStorage.setItem(CHAT_CONV_KEY, JSON.stringify(convs));
  window.dispatchEvent(new StorageEvent('storage', { key: CHAT_CONV_KEY }));
}

// ─── lectura ──────────────────────────────────────────────────────────────────

export function getConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CHAT_CONV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function getConversation(id: string): Conversation | undefined {
  return getConversations().find((c) => c.id === id);
}

export function getUnreadCount(): number {
  return getConversations().filter((c) => !c.readByAdmin).length;
}

// Legacy aliases
export function getChatMessages(): Conversation[] { return getConversations(); }

// ─── visitante envía mensaje ──────────────────────────────────────────────────

export function sendVisitorMessage(opts: {
  sessionId: string;
  visitorName: string;
  visitorEmail: string;
  text: string;
  page: string;
}): Conversation {
  const convs = getConversations();
  const existing = convs.find((c) => c.id === opts.sessionId);
  const msg: ChatMsg = {
    id: genId('m'),
    role: 'visitor',
    text: opts.text,
    createdAt: new Date().toISOString(),
  };

  if (existing) {
    existing.messages.push(msg);
    existing.updatedAt = msg.createdAt;
    existing.readByAdmin = false;
    if (opts.visitorName && opts.visitorName !== 'Visitante') existing.visitorName = opts.visitorName;
    if (opts.visitorEmail) existing.visitorEmail = opts.visitorEmail;
    save(convs);
    return existing;
  } else {
    const conv: Conversation = {
      id: opts.sessionId,
      visitorName: opts.visitorName || 'Visitante',
      visitorEmail: opts.visitorEmail || '',
      page: opts.page,
      messages: [msg],
      createdAt: msg.createdAt,
      updatedAt: msg.createdAt,
      readByAdmin: false,
    };
    save([conv, ...convs]);
    return conv;
  }
}

// Legacy alias
export function sendChatMessage(data: { name: string; email: string; message: string; page: string }): Conversation {
  const sessionId = `legacy_${Date.now()}`;
  return sendVisitorMessage({ sessionId, visitorName: data.name, visitorEmail: data.email, text: data.message, page: data.page });
}

// ─── admin responde ───────────────────────────────────────────────────────────

export function sendAdminReply(sessionId: string, text: string): void {
  const convs = getConversations();
  const conv = convs.find((c) => c.id === sessionId);
  if (!conv) return;
  conv.messages.push({
    id: genId('m'),
    role: 'admin',
    text,
    createdAt: new Date().toISOString(),
  });
  conv.updatedAt = new Date().toISOString();
  conv.readByAdmin = true;
  save(convs);
}

// ─── admin marca leído ────────────────────────────────────────────────────────

export function markConversationRead(sessionId: string): void {
  const convs = getConversations();
  const conv = convs.find((c) => c.id === sessionId);
  if (!conv) return;
  conv.readByAdmin = true;
  save(convs);
}

export function markAllConversationsRead(): void {
  const convs = getConversations().map((c) => ({ ...c, readByAdmin: true }));
  save(convs);
}

// Legacy aliases
export function markMessageRead(id: string): void { markConversationRead(id); }
export function markAllMessagesRead(): void { markAllConversationsRead(); }

// ─── eliminar ─────────────────────────────────────────────────────────────────

export function deleteConversation(sessionId: string): void {
  save(getConversations().filter((c) => c.id !== sessionId));
}

// Legacy alias
export function deleteChatMessage(id: string): void { deleteConversation(id); }
