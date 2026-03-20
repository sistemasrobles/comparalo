'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { getChatConfig, type ChatConfig } from '@/lib/admin-store';
import {
  sendVisitorMessage,
  getConversation,
  CHAT_CONV_KEY,
  type ChatMsg,
} from '@/lib/chat-store';

const ADMIN_CHAT_KEY = 'peruinversion_admin_chat';
const SESSION_KEY = 'peruinversion_chat_session';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function FloatingChat() {
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [open, setOpen] = useState(false);
  const [showBubble, setShowBubble] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nameAsked, setNameAsked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ended, setEnded] = useState(false);
  const [sessionId] = useState(getSessionId);
  const panelRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Cargar config del chat
  useEffect(() => {
    const load = () => setConfig(getChatConfig());
    load();
    const handler = (e: StorageEvent) => {
      if (e.key === ADMIN_CHAT_KEY || e.key === null) load();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  // Polling: leer respuestas del admin desde localStorage
  const syncMessages = useCallback(() => {
    const conv = getConversation(sessionId);
    if (conv) setMessages([...conv.messages]);
  }, [sessionId]);

  useEffect(() => {
    syncMessages();
    const handler = (e: StorageEvent) => {
      if (e.key === CHAT_CONV_KEY || e.key === null) syncMessages();
    };
    window.addEventListener('storage', handler);
    // Polling cada 2s para la misma pestaña (admin responde en misma pestaña)
    const interval = setInterval(syncMessages, 2000);
    return () => {
      window.removeEventListener('storage', handler);
      clearInterval(interval);
    };
  }, [syncMessages]);

  // Mostrar burbuja de texto después de 3 segundos
  useEffect(() => {
    if (!config?.active) return;
    const t = setTimeout(() => setShowBubble(true), 3000);
    return () => clearTimeout(t);
  }, [config?.active]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Scroll al último mensaje
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (!config || !config.active) return null;

  const accent = config.accentColor || '#0098dc';
  const hasConversation = messages.length > 0;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setLoading(true);
    setInput('');
    sendVisitorMessage({
      sessionId,
      visitorName: name || 'Visitante',
      visitorEmail: email,
      text,
      page: pathname || '/',
    });
    syncMessages();
    setLoading(false);
    // Si aún no preguntamos el nombre, marcar para mostrarlo solo si no se llenó
    if (!nameAsked && !name) setNameAsked(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  function handleEnd() {
    // Limpia la sesión actual y cierra el chat
    sessionStorage.removeItem(SESSION_KEY);
    setMessages([]);
    setInput('');
    setName('');
    setEmail('');
    setNameAsked(false);
    setEnded(true);
    setTimeout(() => {
      setEnded(false);
      setOpen(false);
    }, 2000);
  }

  function timeLabel(iso: string) {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Panel de chat ── */}
      {open && (
        <div
          className="w-80 rounded-2xl shadow-2xl flex flex-col bg-white border border-slate-200 overflow-hidden"
          style={{ height: 460, animation: 'chatSlideUp 0.25s ease-out' }}
        >
          {/* Cabecera */}
          <div className="px-4 py-3 flex items-center gap-3 flex-shrink-0" style={{ background: accent }}>
            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white/20 flex-shrink-0 flex items-center justify-center">
              {config.agentAvatar ? (
                <Image src={config.agentAvatar} alt={config.agentName} fill className="object-cover" sizes="36px" />
              ) : (
                <svg className="w-5 h-5 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
                </svg>
              )}
              <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 border-2 border-white rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">{config.agentName}</p>
              <p className="text-white/70 text-[11px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Online ahora
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Hilo de mensajes */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-50">
            {/* Mensaje de bienvenida del agente */}
            <div className="flex items-end gap-2">
              <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: accent }}>
                {config.agentName.charAt(0)}
              </div>
              <div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3 py-2 text-sm text-slate-700 max-w-[210px] shadow-sm">
                  {config.welcomeMessage || '¡Hola! ¿En qué puedo ayudarte?'}
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 ml-1">Ahora</p>
              </div>
            </div>

            {/* Mensajes del hilo */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${msg.role === 'visitor' ? 'flex-row-reverse' : ''}`}
              >
                {msg.role === 'admin' && (
                  <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: accent }}>
                    {config.agentName.charAt(0)}
                  </div>
                )}
                <div className={`max-w-[210px] ${msg.role === 'visitor' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div
                    className={`px-3 py-2 text-sm rounded-2xl shadow-sm ${
                      msg.role === 'visitor'
                        ? 'text-white rounded-br-sm'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                    }`}
                    style={msg.role === 'visitor' ? { background: accent } : {}}
                  >
                    {msg.text}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 mx-1">{timeLabel(msg.createdAt)}</p>
                </div>
              </div>
            ))}

            {/* Estado "conversación finalizada" */}
            {ended && (
              <div className="flex justify-center py-2">
                <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-3 py-1">Conversación finalizada</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Formulario nombre/email — solo si no hay conversación aún */}
          {!hasConversation && !ended && (
            <div className="px-3 pt-2 pb-1 flex flex-col gap-1.5 flex-shrink-0 border-t border-slate-100 bg-white">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre (opcional)"
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-400 transition-all"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu email (opcional)"
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-blue-400 transition-all"
              />
            </div>
          )}

          {/* Input de mensaje */}
          {!ended ? (
            <div className="px-3 pb-2 pt-2 flex flex-col gap-1.5 flex-shrink-0 bg-white border-t border-slate-100">
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escribe un mensaje..."
                  rows={1}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all resize-none"
                  style={{ maxHeight: 80 }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 hover:opacity-90"
                  style={{ background: accent }}
                >
                  {loading ? (
                    <svg className="w-4 h-4 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                    </svg>
                  )}
                </button>
              </div>
              {hasConversation && (
                <button
                  onClick={handleEnd}
                  className="w-full text-xs text-slate-400 hover:text-red-500 transition-colors py-0.5"
                >
                  Finalizar conversación
                </button>
              )}
            </div>
          ) : (
            <div className="px-3 pb-3 pt-2 flex-shrink-0 bg-white border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">La conversación ha finalizado</p>
            </div>
          )}
        </div>
      )}

      {/* ── Burbuja de texto flotante animada ── */}
      {!open && showBubble && (
        <div
          className="relative flex items-center gap-2.5 bg-white rounded-2xl rounded-br-sm shadow-xl border border-slate-100 px-4 py-3 cursor-pointer group overflow-hidden"
          style={{ animation: 'chatBubbleIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both, chatBubbleFloat 3.2s 1.1s ease-in-out infinite' }}
          onClick={() => { setOpen(true); setShowBubble(false); }}
        >
          {/* Shimmer sweep */}
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent group-hover:[animation:chatShimmer_0.7s_ease-in-out]" />

          {/* Dot online */}
          <span className="relative flex-shrink-0 w-2.5 h-2.5">
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-75" />
            <span className="relative block w-2.5 h-2.5 rounded-full bg-emerald-400" />
          </span>

          {/* Texto con palabras que entran en cascada */}
          <p className="text-sm font-medium text-slate-700 whitespace-nowrap leading-snug">
            <span style={{ animation: 'chatWord 0.4s 0.1s both' }} className="inline-block opacity-0">¿Buscando</span>{' '}
            <span style={{ animation: 'chatWord 0.4s 0.22s both' }} className="inline-block opacity-0">tu</span>{' '}
            <span style={{ animation: 'chatWord 0.4s 0.34s both' }} className="inline-block opacity-0">próximo</span>{' '}
            <span style={{ animation: 'chatWord 0.4s 0.46s both' }} className="inline-block opacity-0">hogar?</span>{' '}
            <span style={{ animation: 'chatWord 0.4s 0.60s both', color: accent }} className="inline-block opacity-0 font-bold">Te</span>{' '}
            <span style={{ animation: 'chatWord 0.4s 0.70s both', color: accent }} className="inline-block opacity-0 font-bold">ayudo</span>{' '}
            <span style={{ animation: 'chatWord 0.4s 0.80s both', color: accent }} className="inline-block opacity-0 font-bold">a</span>{' '}
            <span style={{ animation: 'chatWord 0.4s 0.90s both', color: accent }} className="inline-block opacity-0 font-bold">buscar.</span>
          </p>

          {/* Cerrar */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowBubble(false); }}
            className="text-slate-300 hover:text-slate-500 transition-colors ml-1 flex-shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* ── Botón flotante con animación de levitación ── */}
      <button
        onClick={() => { setOpen((o) => !o); setShowBubble(false); }}
        className="relative w-14 h-14 rounded-full shadow-2xl flex items-center justify-center active:scale-95"
        style={{
          background: accent,
          animation: open ? 'none' : 'chatFloat 3s ease-in-out infinite',
        }}
        aria-label="Abrir chat"
      >
        {/* Halo de pulso exterior */}
        {!open && (
          <span
            className="absolute inset-0 rounded-full opacity-40 animate-ping"
            style={{ background: accent }}
          />
        )}

        {/* Ícono */}
        <span className="relative z-10 transition-transform duration-200 hover:scale-110">
          {open ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          )}
        </span>

        {/* Indicador online */}
        {!open && (
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full z-20" />
        )}
      </button>

      <style>{`
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatFloat {
          0%, 100% { transform: translateY(0px) scale(1); box-shadow: 0 10px 30px rgba(0,0,0,0.25); }
          50%       { transform: translateY(-7px) scale(1.03); box-shadow: 0 18px 40px rgba(0,0,0,0.2); }
        }
        @keyframes chatBubbleFloat {
          0%, 100% { transform: translateY(0px); box-shadow: 0 8px 24px rgba(0,0,0,0.10); }
          50%       { transform: translateY(-6px); box-shadow: 0 16px 32px rgba(0,0,0,0.13); }
        }
        @keyframes chatBubbleIn {
          from { opacity: 0; transform: translateX(20px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes chatWord {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes chatShimmer {
          from { transform: translateX(-100%); }
          to   { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
