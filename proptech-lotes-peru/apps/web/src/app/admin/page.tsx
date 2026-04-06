'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  getAdminProjects, createProject, updateProject, deleteProject, duplicateProject,
  addLot, updateLot, deleteLot,
  getHeroSlides, createHeroSlide, updateHeroSlide, deleteHeroSlide,
  getSiteConfig, updateSiteConfig, resetProjectsToDefaults, resetHeroToDefaults,
  getFeriaConfig, updateFeriaConfig,
  getProjectAdBanners, createProjectAdBanner, updateProjectAdBanner, deleteProjectAdBanner,
  getChatConfig, updateChatConfig,
  type HeroSlide, type SiteConfig, type FeriaConfig, type ProjectAdBanner, type ChatConfig,
} from '@/lib/admin-store';
import { type ProjectData, type LotData, type ProjectCategory, formatPrice } from '@/lib/projects-data';
import {
  getAllReservations, updateReservationStatus,
  deleteReservation, type Reservation, type ReservationStatus,
} from '@/lib/reservations-store';
import { downloadProjectTemplate } from '@/lib/download-template';
import { parseLotExcel } from '@/lib/lot-import';
import {
  getConversations, sendAdminReply,
  markConversationRead, markAllConversationsRead, deleteConversation,
  getUnreadCount, type Conversation, type ChatMsg,
} from '@/lib/chat-store';
import {
  getContactSubmissions, deleteContactSubmission, markContactRead,
  markAllContactRead, getUnreadContactCount, type ContactSubmission,
} from '@/lib/contact-store';
import {
  getFeriaRegistros, deleteFeriaRegistro, markFeriaRegistroRead,
  markAllFeriaRead, getUnreadFeriaCount, type FeriaRegistro,
} from '@/lib/feria-store';
import PlanDetectionEditor from '@/components/lots/PlanDetectionEditor';
import ImageUploader from '@/components/admin/ImageUploader';
import GalleryUploader from '@/components/admin/GalleryUploader';

/* ═══════════ ICONS ═══════════ */
const I = {
  home: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
  projects: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
  slider: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" /></svg>,
  reservas: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
  config: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  plus: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  edit: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
  copy: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.5a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m0 0a2.625 2.625 0 115.25 0H12m-3.75 0h.375" /></svg>,
  check: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  x: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  eye: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  back: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>,
  save: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
  refresh: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>,
  logout: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>,
  lock: <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
  feria: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46" /></svg>,
  adbanners: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>,
  chat: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" /></svg>,
  mensajes: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>,
  consultas: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" /></svg>,
  feriaRegistros: <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 000-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" /></svg>,
};

type Tab = 'proyectos' | 'slider' | 'reservas' | 'config' | 'feria' | 'adbanners' | 'chat' | 'mensajes' | 'consultas' | 'feria-registros';

const CATEGORIES: { value: ProjectCategory; label: string }[] = [
  { value: 'lotes', label: 'Lotes y Terrenos' },
  { value: 'departamentos', label: 'Departamentos' },
  { value: 'locales-comerciales', label: 'Locales Comerciales' },
];

const ACCESS_TYPES = ['PISTA_ASFALTADA', 'PISTA_AFIRMADA', 'TROCHA', 'MIXTO'];
const LEGAL_STATUSES = ['INSCRITO_SUNARP', 'EN_TRAMITE', 'TITULO_MATRIZ', 'HABILITACION_URBANA'];
const LOT_STATUSES: LotData['status'][] = ['disponible', 'reservado', 'vendido'];

/* ═══════════ REUSABLE COMPONENTS ═══════════ */

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, type = 'text', placeholder = '', className = '' }: { value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string; className?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all bg-white ${className}`}
    />
  );
}

function Textarea({ value, onChange, rows = 3, placeholder = '' }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all bg-white resize-none"
    />
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all bg-white"
    >
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-[#0098dc]' : 'bg-slate-200'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
      </button>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 text-sm font-medium animate-fade-in">
      {I.check} {message}
    </div>
  );
}

/* ═══════════ MAIN PAGE ═══════════ */

export default function AdminPage() {
  const [isAuth, setIsAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [tab, setTab] = useState<Tab>('proyectos');
  const [toast, setToast] = useState('');

  // Projects state
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
  const [editingLots, setEditingLots] = useState<string | null>(null);
  const [projectSearch, setProjectSearch] = useState('');

  // Hero state
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [editingSlide, setEditingSlide] = useState<HeroSlide | null>(null);

  // Reservas state
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | 'todas'>('todas');
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);

  // Config state
  const [config, setConfig] = useState<SiteConfig | null>(null);

  // Feria banner state
  const [feriaConfig, setFeriaConfig] = useState<FeriaConfig | null>(null);

  // Ad banners state
  const [adBanners, setAdBanners] = useState<ProjectAdBanner[]>([]);

  // Chat flotante state
  const [chatConfig, setChatConfig] = useState<ChatConfig | null>(null);

  // Conversaciones del chat
  const [chatMessages, setChatMessages] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Consultas del formulario de contacto
  const [contactSubmissions, setContactSubmissions] = useState<ContactSubmission[]>([]);
  const [unreadContactCount, setUnreadContactCount] = useState(0);

  // Registros de la Feria PerúInversión
  const [feriaRegistros, setFeriaRegistros] = useState<FeriaRegistro[]>([]);
  const [unreadFeriaCount, setUnreadFeriaCount] = useState(0);

  useEffect(() => {
    const loadMessages = async () => {
      setChatMessages(await getConversations());
      setUnreadCount(await getUnreadCount());
    };
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadContacts = async () => {
      setContactSubmissions(await getContactSubmissions());
      setUnreadContactCount(await getUnreadContactCount());
    };
    loadContacts();
    const interval = setInterval(loadContacts, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadFeria = async () => {
      setFeriaRegistros(await getFeriaRegistros());
      setUnreadFeriaCount(await getUnreadFeriaCount());
    };
    loadFeria();
    const interval = setInterval(loadFeria, 10000);
    return () => clearInterval(interval);
  }, []);

  // Auth check
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('admin_auth');
      if (stored === 'true') setIsAuth(true);
    }
  }, []);

  // Load data on auth
  useEffect(() => {
    if (!isAuth) return;
    (async () => {
      setProjects(await getAdminProjects());
      setHeroSlides(await getHeroSlides());
      setReservations(await getAllReservations());
      setConfig(await getSiteConfig());
      setFeriaConfig(await getFeriaConfig());
      setChatConfig(await getChatConfig());
      setAdBanners(await getProjectAdBanners());
    })();
  }, [isAuth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cfg = await getSiteConfig();
    const correctPassword = cfg?.adminPassword ?? 'admin2024';
    if (password === correctPassword) {
      setIsAuth(true);
      sessionStorage.setItem('admin_auth', 'true');
      setPasswordError('');
    } else {
      setPasswordError('Contraseña incorrecta');
    }
  };

  const handleLogout = () => { setIsAuth(false); sessionStorage.removeItem('admin_auth'); };
  const showToast = (msg: string) => setToast(msg);
  const refreshProjects = async () => setProjects(await getAdminProjects());
  const refreshSlides = async () => setHeroSlides(await getHeroSlides());
  const refreshReservations = async () => setReservations(await getAllReservations());

  /* ── LOGIN SCREEN ── */
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#0098dc] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/30 text-white">
              {I.lock}
            </div>
            <h1 className="text-2xl font-black text-slate-900">Panel de Administración</h1>
            <p className="text-slate-500 text-sm mt-1">PerúInversión CMS</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Contraseña</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none bg-white shadow-sm" placeholder="••••••••" autoFocus />
              {passwordError && <p className="text-red-500 text-xs mt-2 font-medium">{passwordError}</p>}
            </div>
            <button type="submit" className="w-full bg-[#0098dc] hover:bg-[#0079b2] text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/25">Ingresar</button>
          </form>
          <div className="text-center mt-6">
            <Link href="/" className="text-xs text-slate-400 hover:text-[#0098dc]">← Volver al sitio</Link>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════ AUTHENTICATED LAYOUT ═══════════ */
  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number; countColor?: string }[] = [
    { id: 'proyectos', label: 'Proyectos', icon: I.projects, count: projects.length },
    { id: 'slider', label: 'Hero Slider', icon: I.slider, count: heroSlides.length },
    { id: 'reservas', label: 'Reservas', icon: I.reservas, count: reservations.length },
    { id: 'config', label: 'Configuración', icon: I.config },
    { id: 'feria', label: 'Banner Feria', icon: I.feria },
    { id: 'adbanners', label: 'Banners Proyectos', icon: I.adbanners, count: adBanners.length },
    { id: 'chat',      label: 'Chat en vivo',      icon: I.chat },
    { id: 'mensajes',  label: 'Mensajes',           icon: I.mensajes, count: unreadCount, countColor: 'bg-red-500' },
    { id: 'consultas', label: 'Consultas',          icon: I.consultas, count: unreadContactCount, countColor: 'bg-orange-500' },
    { id: 'feria-registros', label: 'Feria Registros', icon: I.feriaRegistros, count: unreadFeriaCount, countColor: 'bg-[#0098dc]' },
  ];

  const stats = {
    total: reservations.length,
    pendientes: reservations.filter((r) => r.status === 'pendiente').length,
    aprobadas: reservations.filter((r) => r.status === 'aprobada').length,
    rechazadas: reservations.filter((r) => r.status === 'rechazada').length,
    totalAmount: reservations.filter((r) => r.status === 'aprobada').reduce((sum, r) => sum + (r.reservationAmount || 0), 0),
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* ── SIDEBAR ── */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 h-screen">
        <div className="p-5 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0098dc] flex items-center justify-center text-white font-black text-xs">PI</div>
            <div>
              <p className="font-bold text-slate-900 text-sm leading-tight">PerúInversión</p>
              <p className="text-[10px] text-slate-400">Panel Admin</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setEditingProject(null); setEditingLots(null); setEditingSlide(null); setSelectedRes(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${tab === t.id ? 'bg-blue-50 text-[#0098dc]' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
            >
              {t.icon}
              <span className="flex-1 text-left">{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${t.countColor ?? (tab === t.id ? 'bg-[#0098dc]' : 'bg-slate-400')}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
            {I.logout} Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className={`flex-1 min-w-0 h-screen ${tab === 'mensajes' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {tab === 'proyectos' && (
          <ProjectsTab
            projects={projects} editingProject={editingProject} setEditingProject={setEditingProject}
            editingLots={editingLots} setEditingLots={setEditingLots} projectSearch={projectSearch}
            setProjectSearch={setProjectSearch} refreshProjects={refreshProjects} showToast={showToast}
          />
        )}
        {tab === 'slider' && (
          <SliderTab slides={heroSlides} editingSlide={editingSlide} setEditingSlide={setEditingSlide} refreshSlides={refreshSlides} showToast={showToast} />
        )}
        {tab === 'reservas' && (
          <ReservasTab
            reservations={reservations} filterStatus={filterStatus} setFilterStatus={setFilterStatus}
            selectedRes={selectedRes} setSelectedRes={setSelectedRes} refreshReservations={refreshReservations}
            showToast={showToast} stats={stats}
          />
        )}
        {tab === 'config' && config && <ConfigTab config={config} setConfig={setConfig} showToast={showToast} />}
        {tab === 'feria' && feriaConfig && <FeriaTab feriaConfig={feriaConfig} setFeriaConfig={setFeriaConfig} showToast={showToast} />}
        {tab === 'adbanners' && <AdBannersTab banners={adBanners} setBanners={setAdBanners} showToast={showToast} />}
        {tab === 'chat'      && chatConfig && <ChatTab chatConfig={chatConfig} setChatConfig={setChatConfig} showToast={showToast} />}
        {tab === 'mensajes'  && <MensajesTab messages={chatMessages} setMessages={setChatMessages} unreadCount={unreadCount} setUnreadCount={setUnreadCount} showToast={showToast} />}
        {tab === 'consultas' && <ConsultasTab submissions={contactSubmissions} setSubmissions={setContactSubmissions} setUnreadCount={setUnreadContactCount} showToast={showToast} />}
        {tab === 'feria-registros' && <FeriaRegistrosTab registros={feriaRegistros} setRegistros={setFeriaRegistros} setUnreadCount={setUnreadFeriaCount} showToast={showToast} />}
      </main>

      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TAB: PROYECTOS
═══════════════════════════════════════════════ */

function ProjectsTab({ projects, editingProject, setEditingProject, editingLots, setEditingLots, projectSearch, setProjectSearch, refreshProjects, showToast }: {
  projects: ProjectData[]; editingProject: ProjectData | null; setEditingProject: (p: ProjectData | null) => void;
  editingLots: string | null; setEditingLots: (id: string | null) => void;
  projectSearch: string; setProjectSearch: (s: string) => void;
  refreshProjects: () => void; showToast: (m: string) => void;
}) {
  // Editing lots view
  if (editingLots) {
    const project = projects.find((p) => p.id === editingLots);
    if (!project) { setEditingLots(null); return null; }
    return <LotsEditor project={project} onBack={() => { setEditingLots(null); refreshProjects(); }} showToast={showToast} refreshProjects={refreshProjects} />;
  }

  // Editing / Creating project
  if (editingProject) {
    return <ProjectEditor project={editingProject} onBack={() => { setEditingProject(null); refreshProjects(); }} showToast={showToast} />;
  }

  // Project list
  const filtered = projects.filter((p) => {
    if (!projectSearch) return true;
    const s = projectSearch.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.city.toLowerCase().includes(s) || p.developer.name.toLowerCase().includes(s);
  });

  const handleCreate = async () => {
    const p = await createProject({ name: 'Nuevo Proyecto' });
    await refreshProjects();
    setEditingProject(p);
    showToast('Proyecto creado');
  };

  const handleDuplicate = async (id: string) => {
    await duplicateProject(id);
    await refreshProjects();
    showToast('Proyecto duplicado');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proyecto permanentemente?')) return;
    await deleteProject(id);
    await refreshProjects();
    showToast('Proyecto eliminado');
  };

  const handleReset = async () => {
    if (!confirm('¿Restaurar todos los proyectos a los datos originales? Se perderán los cambios.')) return;
    await resetProjectsToDefaults();
    await refreshProjects();
    showToast('Proyectos restaurados');
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Proyectos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{projects.length} proyectos en total</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
            {I.refresh} Restaurar
          </button>
          <button
            onClick={() => downloadProjectTemplate()}
            title="Descarga la plantilla Excel para cargar proyectos nuevos"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-green-700 hover:text-green-800 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-all"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Plantilla Excel
          </button>
          <button onClick={handleCreate} className="flex items-center gap-1.5 px-4 py-2 bg-[#0098dc] hover:bg-[#0079b2] text-white text-sm font-semibold rounded-lg shadow-sm transition-all">
            {I.plus} Nuevo proyecto
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text" value={projectSearch} onChange={(e) => setProjectSearch(e.target.value)}
          placeholder="Buscar por nombre, ciudad o inmobiliaria..."
          className="w-full max-w-md border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Proyecto</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Ciudad</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Precio</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Lotes</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {p.imageUrl ? (
                        <Image src={p.imageUrl} alt="" width={40} height={40} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 flex-shrink-0">{I.projects}</div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-slate-400 truncate">{p.developer.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{p.city}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{formatPrice(p.minPrice, p.currency ?? 'PEN')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setEditingLots(p.id)} className="text-[#0098dc] hover:text-[#0079b2] font-medium hover:underline">
                      {p.lots?.length || 0} lotes
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-semibold">Activo</span>}
                      {p.isFeatured && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-semibold">Destacado</span>}
                      {p.isExclusive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-semibold">Exclusivo</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/proyecto/${p.slug}`} target="_blank" className="p-1.5 rounded-lg text-slate-400 hover:text-[#0098dc] hover:bg-blue-50 transition-all" title="Ver en web">{I.eye}</Link>
                      <button onClick={() => setEditingProject(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#0098dc] hover:bg-blue-50 transition-all" title="Editar">{I.edit}</button>
                      <button onClick={() => handleDuplicate(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#0098dc] hover:bg-blue-50 transition-all" title="Duplicar">{I.copy}</button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all" title="Eliminar">{I.trash}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-slate-400">No se encontraron proyectos</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PROJECT EDITOR
═══════════════════════════════════════════════ */

function ProjectEditor({ project, onBack, showToast }: { project: ProjectData; onBack: () => void; showToast: (m: string) => void }) {
  const [form, setForm] = useState<ProjectData>({ ...project });
  const [amenityInput, setAmenityInput] = useState('');

  const set = (key: keyof ProjectData, value: ProjectData[keyof ProjectData]) => setForm((prev) => ({ ...prev, [key]: value }));
  const setDev = (key: keyof ProjectData['developer'], value: string) => setForm((prev) => ({ ...prev, developer: { ...prev.developer, [key]: value } }));

  const handleSave = async () => {
    await updateProject(form.id, form);
    showToast('Proyecto guardado');
    onBack();
  };

  const addAmenity = () => {
    if (!amenityInput.trim()) return;
    set('amenities', [...(form.amenities || []), amenityInput.trim()]);
    setAmenityInput('');
  };

  const removeAmenity = (idx: number) => {
    set('amenities', (form.amenities || []).filter((_: string, i: number) => i !== idx));
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">{I.back}</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Editar proyecto</h1>
          <p className="text-sm text-slate-400">{form.name}</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-[#0098dc] hover:bg-[#0079b2] text-white font-semibold rounded-lg shadow-sm transition-all text-sm">
          {I.save} Guardar
        </button>
      </div>

      <div className="space-y-6">
        {/* Información básica */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">{I.projects} Información básica</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Nombre del proyecto" className="md:col-span-2"><Input value={form.name} onChange={(v) => set('name', v)} placeholder="Ej: Ciudad Prada" /></Field>
            <Field label="Slug (URL)"><Input value={form.slug} onChange={(v) => set('slug', v)} placeholder="ciudad-prada" /></Field>
            <Field label="Categoría"><Select value={form.category} onChange={(v) => set('category', v)} options={CATEGORIES} /></Field>
            <Field label="Descripción completa" className="md:col-span-2"><Textarea value={form.description} onChange={(v) => set('description', v)} rows={3} placeholder="Descripción detallada del proyecto..." /></Field>
            <Field label="Descripción corta" className="md:col-span-2"><Input value={form.shortDescription} onChange={(v) => set('shortDescription', v)} placeholder="Resumen en una línea" /></Field>
          </div>
        </section>

        {/* Inmobiliaria */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Inmobiliaria / Desarrollador</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Nombre"><Input value={form.developer.name} onChange={(v) => setDev('name', v)} placeholder="Amador y Rios" /></Field>
            <Field label="Slug"><Input value={form.developer.slug} onChange={(v) => setDev('slug', v)} /></Field>
            <Field label="Website"><Input value={form.developer.website} onChange={(v) => setDev('website', v)} placeholder="https://..." /></Field>
          </div>
        </section>

        {/* Ubicación */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Ubicación</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Ciudad"><Input value={form.city} onChange={(v) => set('city', v)} placeholder="Lima" /></Field>
            <Field label="Zona"><Input value={form.zone} onChange={(v) => set('zone', v)} placeholder="Ate - Santa Clara" /></Field>
            <Field label="Región"><Input value={form.region || ''} onChange={(v) => set('region', v)} /></Field>
            <Field label="Dirección" className="md:col-span-3"><Input value={form.addressText} onChange={(v) => set('addressText', v)} placeholder="Dirección completa..." /></Field>
            <Field label="Latitud"><Input type="number" value={form.lat} onChange={(v) => set('lat', parseFloat(v) || 0)} /></Field>
            <Field label="Longitud"><Input type="number" value={form.lng} onChange={(v) => set('lng', parseFloat(v) || 0)} /></Field>
            <Field label="Dist. al centro (km)"><Input type="number" value={form.distanceToCityCenterKm} onChange={(v) => set('distanceToCityCenterKm', parseFloat(v) || 0)} /></Field>
          </div>
        </section>

        {/* Precios */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Precios y Financiamiento</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Moneda del proyecto" className="md:col-span-4">
              <div className="flex gap-3">
                {([['PEN', 'S/ Soles (PEN)'], ['USD', '$ Dólares (USD)']] as const).map(([val, lbl]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => set('currency', val)}
                    className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${(form.currency ?? 'PEN') === val ? 'border-[#0098dc] bg-[#0098dc]/10 text-[#0098dc]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={`Precio mínimo (${(form.currency ?? 'PEN') === 'USD' ? '$' : 'S/'})`}><Input type="number" value={form.minPrice} onChange={(v) => set('minPrice', parseInt(v) || 0)} /></Field>
            <Field label={`Precio máximo (${(form.currency ?? 'PEN') === 'USD' ? '$' : 'S/'})`}><Input type="number" value={form.maxPrice} onChange={(v) => set('maxPrice', parseInt(v) || 0)} /></Field>
            <Field label="Precio m² mín"><Input type="number" value={form.priceM2Min} onChange={(v) => set('priceM2Min', parseInt(v) || 0)} /></Field>
            <Field label="Precio m² máx"><Input type="number" value={form.priceM2Max} onChange={(v) => set('priceM2Max', parseInt(v) || 0)} /></Field>
            <Field label={`Cuota inicial mín (${(form.currency ?? 'PEN') === 'USD' ? '$' : 'S/'})`}><Input type="number" value={form.downPaymentMin} onChange={(v) => set('downPaymentMin', parseInt(v) || 0)} /></Field>
            <Field label="Cuota mensual est."><Input type="number" value={form.monthlyPaymentEst} onChange={(v) => set('monthlyPaymentEst', parseInt(v) || 0)} /></Field>
            <Field label="Plazo (meses)"><Input type="number" value={form.termMonthsEst} onChange={(v) => set('termMonthsEst', parseInt(v) || 0)} /></Field>
            <Field label={`Monto reserva (${(form.currency ?? 'PEN') === 'USD' ? '$' : 'S/'})`}><Input type="number" value={form.reservationAmount || 0} onChange={(v) => set('reservationAmount', parseInt(v) || 0)} /></Field>
          </div>
        </section>

        {/* Terrenos */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Terrenos / Lotes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Tamaño mín (m²)"><Input type="number" value={form.lotSizeMin} onChange={(v) => set('lotSizeMin', parseInt(v) || 0)} /></Field>
            <Field label="Tamaño máx (m²)"><Input type="number" value={form.lotSizeMax} onChange={(v) => set('lotSizeMax', parseInt(v) || 0)} /></Field>
            <Field label="Total lotes"><Input type="number" value={form.totalLots} onChange={(v) => set('totalLots', parseInt(v) || 0)} /></Field>
          </div>
        </section>

        {/* Scoring */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Scoring y Legal</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Puntaje seguridad (0-100)"><Input type="number" value={form.safetyScore} onChange={(v) => set('safetyScore', Math.min(100, Math.max(0, parseInt(v) || 0)))} /></Field>
            <Field label="Valorización (%/año)"><Input type="number" value={form.valorizationEstimate} onChange={(v) => set('valorizationEstimate', parseInt(v) || 0)} /></Field>
            <Field label="Tipo de acceso"><Select value={form.accessType} onChange={(v) => set('accessType', v)} options={ACCESS_TYPES.map((a) => ({ value: a, label: a.replace(/_/g, ' ') }))} /></Field>
            <Field label="Estado legal"><Select value={form.legalStatus} onChange={(v) => set('legalStatus', v)} options={LEGAL_STATUSES.map((l) => ({ value: l, label: l.replace(/_/g, ' ') }))} /></Field>
          </div>
        </section>

        {/* Imágenes */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-5">{I.slider} Imágenes</h2>
          <div className="space-y-6">
            <ImageUploader
              label="Imagen principal"
              hint="Portada del proyecto"
              value={form.imageUrl}
              onChange={(v) => set('imageUrl', v)}
            />
            <ImageUploader
              label="Plano de lotización"
              hint="Layout de lotes"
              value={form.lotPlanImage || ''}
              onChange={(v) => set('lotPlanImage', v)}
            />
            <GalleryUploader
              value={form.galleryImages || []}
              onChange={(v) => set('galleryImages', v)}
            />
            <Field label="Video (URL)">
              <Input value={form.videoUrl || ''} onChange={(v) => set('videoUrl', v)} placeholder="https://youtube.com/..." />
            </Field>
          </div>
        </section>

        {/* Amenidades */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Amenidades</h2>
          <div className="flex gap-2 mb-3">
            <input value={amenityInput} onChange={(e) => setAmenityInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addAmenity()} placeholder="Ej: Piscina, Seguridad 24h..." className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
            <button onClick={addAmenity} className="px-3 py-2 bg-[#0098dc] text-white rounded-lg text-sm font-medium">{I.plus}</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(form.amenities || []).map((a: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-medium px-2.5 py-1 rounded-full">
                {a}
                <button onClick={() => removeAmenity(i)} className="text-slate-400 hover:text-red-500">×</button>
              </span>
            ))}
          </div>
        </section>

        {/* Servicios */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Servicios disponibles</h2>
          <div className="flex flex-wrap gap-5">
            {form.services && Object.entries(form.services).map(([key, val]: [string, boolean]) => (
              <Toggle
                key={key}
                checked={val}
                onChange={(v) => setForm((prev) => ({ ...prev, services: { ...prev.services, [key]: v } }))}
                label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              />
            ))}
          </div>
        </section>

        {/* Flags */}
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Visibilidad</h2>
          <div className="flex flex-wrap gap-6">
            <Toggle checked={form.isActive} onChange={(v) => set('isActive', v)} label="Activo (visible en web)" />
            <Toggle checked={form.isFeatured} onChange={(v) => set('isFeatured', v)} label="Destacado" />
            <Toggle checked={form.isExclusive || false} onChange={(v) => set('isExclusive', v)} label="Exclusivo (reserva online)" />
          </div>
        </section>

        {/* Save */}
        <div className="flex gap-3 pt-2">
          <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-[#0098dc] hover:bg-[#0079b2] text-white font-bold rounded-xl shadow-md transition-all">
            {I.save} Guardar cambios
          </button>
          <button onClick={onBack} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-all">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LOTS EDITOR
═══════════════════════════════════════════════ */

function LotsEditor({ project, onBack, showToast, refreshProjects }: { project: ProjectData; onBack: () => void; showToast: (m: string) => void; refreshProjects: () => void }) {
  const [lots, setLots] = useState<LotData[]>(project.lots || []);
  const [newLot, setNewLot] = useState(false);
  const [lotsTab, setLotsTab] = useState<'inventario' | 'plano'>('inventario');

  const [nManzana, setNManzana] = useState('');
  const [nLote, setNLote] = useState(1);
  const [nArea, setNArea] = useState(100);
  const [nPrice, setNPrice] = useState(30000);
  const [nStatus, setNStatus] = useState<LotData['status']>('disponible');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<{ lots: LotData[]; errors: string[]; warnings: string[] } | null>(null);
  const [importing, setImporting] = useState(false);

  const refreshLots = async () => {
    const updated = (await getAdminProjects()).find((p) => p.id === project.id);
    setLots(updated?.lots || []);
    refreshProjects();
  };

  const handleAdd = async () => {
    const label = `Mz ${nManzana} - Lt ${nLote}`;
    await addLot(project.id, { label, manzana: nManzana, lote: nLote, area: nArea, price: nPrice, status: nStatus });
    await refreshLots();
    setNewLot(false);
    setNManzana(''); setNLote(1); setNArea(100); setNPrice(30000); setNStatus('disponible');
    showToast('Lote agregado');
  };

  const handleStatusChange = async (lotId: string, status: LotData['status']) => {
    await updateLot(project.id, lotId, { status });
    await refreshLots();
    showToast('Estado actualizado');
  };

  const handleDeleteLot = async (lotId: string) => {
    if (!confirm('¿Eliminar este lote?')) return;
    await deleteLot(project.id, lotId);
    await refreshLots();
    showToast('Lote eliminado');
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const result = parseLotExcel(buffer);
      if (!result.success) {
        showToast(`Error: ${result.errors.join(', ')}`);
        setImporting(false);
        return;
      }
      setImportResult({ lots: result.lots, errors: result.errors, warnings: result.warnings });
    } catch {
      showToast('Error al leer el archivo Excel');
    }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleConfirmImport = async (mode: 'replace' | 'append') => {
    if (!importResult) return;
    if (mode === 'replace') {
      await Promise.all(lots.map((l) => deleteLot(project.id, l.id)));
    }
    await Promise.all(importResult.lots.map((lot) =>
      addLot(project.id, { label: lot.label, manzana: lot.manzana, lote: lot.lote, fila: lot.fila, area: lot.area, price: lot.price, precioM2: lot.precioM2, status: lot.status })
    ));
    await refreshLots();
    showToast(`${importResult.lots.length} lotes ${mode === 'replace' ? 'reemplazados' : 'agregados'}`);
    setImportResult(null);
  };

  const statusColors: Record<string, string> = {
    disponible: 'bg-emerald-50 text-emerald-700',
    reservado: 'bg-amber-50 text-amber-700',
    vendido: 'bg-red-50 text-red-600',
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">{I.back}</button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900">Lotes de {project.name}</h1>
          <p className="text-sm text-slate-400">{lots.length} lotes registrados</p>
        </div>
        {lotsTab === 'inventario' && (
          <>
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} disabled={importing} className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-sm transition-all">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z" clipRule="evenodd" /></svg>
              {importing ? 'Importando...' : 'Importar Excel'}
            </button>
            <button onClick={() => setNewLot(true)} className="flex items-center gap-1.5 px-4 py-2 bg-[#0098dc] hover:bg-[#0079b2] text-white text-sm font-semibold rounded-lg shadow-sm transition-all">
              {I.plus} Agregar lote
            </button>
          </>
        )}
      </div>

      {/* Sub-tabs: Inventario / Plano */}
      <div className="flex gap-1.5 mb-5">
        {([
          { key: 'inventario' as const, label: '📋 Inventario', desc: 'Tabla de lotes' },
          { key: 'plano' as const, label: '🗺️ Plano interactivo', desc: 'Editor visual' },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setLotsTab(t.key)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              lotsTab === t.key
                ? 'bg-[#0098dc] text-white shadow-sm'
                : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Plano interactivo */}
      {lotsTab === 'plano' && (
        <PlanDetectionEditor project={project} onUpdate={refreshLots} showToast={showToast} />
      )}

      {/* Tab: Inventario */}
      {lotsTab === 'inventario' && (
      <div>

      {/* Import preview */}
      {importResult && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
          <h3 className="font-semibold text-emerald-800 mb-2">Vista previa de importación</h3>
          <p className="text-sm text-emerald-700 mb-1">{importResult.lots.length} lotes listos para importar</p>
          {importResult.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">
              <p className="text-xs font-semibold text-amber-700 mb-1">Advertencias:</p>
              {importResult.warnings.map((w, i) => <p key={i} className="text-xs text-amber-600">{w}</p>)}
            </div>
          )}
          {importResult.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 mb-3">
              <p className="text-xs font-semibold text-red-700 mb-1">Errores (filas omitidas):</p>
              {importResult.errors.map((e, i) => <p key={i} className="text-xs text-red-600">{e}</p>)}
            </div>
          )}
          <div className="max-h-48 overflow-y-auto rounded-lg border border-emerald-200 bg-white mb-3">
            <table className="w-full text-xs">
              <thead><tr className="bg-emerald-50"><th className="px-2 py-1 text-left">Código</th><th className="px-2 py-1 text-left">Mz</th><th className="px-2 py-1 text-left">Área</th><th className="px-2 py-1 text-left">Precio</th><th className="px-2 py-1 text-left">Estado</th></tr></thead>
              <tbody className="divide-y divide-emerald-100">
                {importResult.lots.slice(0, 20).map((l, i) => (
                  <tr key={i}><td className="px-2 py-1">{l.label}</td><td className="px-2 py-1">{l.manzana}</td><td className="px-2 py-1">{l.area} m²</td><td className="px-2 py-1">S/ {l.price.toLocaleString()}</td><td className="px-2 py-1 capitalize">{l.status}</td></tr>
                ))}
                {importResult.lots.length > 20 && <tr><td colSpan={5} className="px-2 py-1 text-center text-emerald-500">... y {importResult.lots.length - 20} más</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleConfirmImport('replace')} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg text-sm">Reemplazar todo ({lots.length} → {importResult.lots.length})</button>
            <button onClick={() => handleConfirmImport('append')} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm">Agregar a existentes (+{importResult.lots.length})</button>
            <button onClick={() => setImportResult(null)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
          </div>
        </div>
      )}

      {/* Stock summary */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {LOT_STATUSES.map((s) => {
          const count = lots.filter((l) => l.status === s).length;
          return (
            <div key={s} className={`rounded-xl p-3 text-center ${statusColors[s]}`}>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs font-medium capitalize">{s}s</p>
            </div>
          );
        })}
      </div>

      {/* New lot form */}
      {newLot && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
          <h3 className="font-semibold text-blue-800 mb-3">Nuevo lote</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <Field label="Manzana"><Input value={nManzana} onChange={setNManzana} placeholder="A" /></Field>
            <Field label="Lote #"><Input type="number" value={nLote} onChange={(v) => setNLote(parseInt(v) || 1)} /></Field>
            <Field label="Área (m²)"><Input type="number" value={nArea} onChange={(v) => setNArea(parseInt(v) || 0)} /></Field>
            <Field label="Precio (S/)"><Input type="number" value={nPrice} onChange={(v) => setNPrice(parseInt(v) || 0)} /></Field>
            <Field label="Estado"><Select value={nStatus} onChange={(v) => setNStatus(v as LotData['status'])} options={LOT_STATUSES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))} /></Field>
            <div className="flex items-end gap-2">
              <button onClick={handleAdd} className="px-4 py-2 bg-[#0098dc] text-white font-semibold rounded-lg text-sm hover:bg-[#0079b2]">{I.check}</button>
              <button onClick={() => setNewLot(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50">{I.x}</button>
            </div>
          </div>
        </div>
      )}

      {/* Lots table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Etiqueta</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Mz</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Lt</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Área</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Precio</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lots.map((lot) => (
              <tr key={lot.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-2.5 font-medium text-slate-800">{lot.label}</td>
                <td className="px-4 py-2.5 text-slate-600">{lot.manzana}</td>
                <td className="px-4 py-2.5 text-slate-600">{lot.lote}</td>
                <td className="px-4 py-2.5 text-slate-600">{lot.area} m²</td>
                <td className="px-4 py-2.5 font-semibold text-slate-800">{formatPrice(lot.price, project.currency ?? 'PEN')}</td>
                <td className="px-4 py-2.5">
                  <select
                    value={lot.status}
                    onChange={(e) => handleStatusChange(lot.id, e.target.value as LotData['status'])}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[lot.status]}`}
                  >
                    {LOT_STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => handleDeleteLot(lot.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">{I.trash}</button>
                </td>
              </tr>
            ))}
            {lots.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No hay lotes. Agrega el primero.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </div>)}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TAB: HERO SLIDER
═══════════════════════════════════════════════ */

function SliderTab({ slides, editingSlide, setEditingSlide, refreshSlides, showToast }: {
  slides: HeroSlide[]; editingSlide: HeroSlide | null; setEditingSlide: (s: HeroSlide | null) => void;
  refreshSlides: () => void; showToast: (m: string) => void;
}) {
  const [formImage, setFormImage] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const slideFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingSlide) {
      setFormImage(editingSlide.image);
      setFormTitle(editingSlide.title);
      setFormSubtitle(editingSlide.subtitle);
    }
  }, [editingSlide]);

  const handleCreate = async () => {
    await createHeroSlide({ image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&h=900&fit=crop', title: 'Nuevo slide', subtitle: 'Descripción del slide' });
    await refreshSlides();
    showToast('Slide creado');
  };

  const handleSave = async () => {
    if (!editingSlide) return;
    await updateHeroSlide(editingSlide.id, { image: formImage, title: formTitle, subtitle: formSubtitle });
    await refreshSlides();
    setEditingSlide(null);
    showToast('Slide guardado');
  };

  const handleDeleteSlide = async (id: string) => {
    if (!confirm('¿Eliminar este slide?')) return;
    await deleteHeroSlide(id);
    await refreshSlides();
    showToast('Slide eliminado');
  };

  const handleReset = async () => {
    if (!confirm('¿Restaurar slider a los valores originales?')) return;
    await resetHeroToDefaults();
    await refreshSlides();
    showToast('Slider restaurado');
  };

  const handleSlideImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { showToast('La imagen no puede pesar más de 5MB'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) { setFormImage(data.url); showToast('Imagen subida'); }
      else showToast('Error al subir imagen');
    } catch { showToast('Error al subir imagen'); }
    finally { setUploading(false); if (slideFileRef.current) slideFileRef.current.value = ''; }
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Hero Slider</h1>
          <p className="text-sm text-slate-500 mt-0.5">{slides.length} slides en el carrusel</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
            {I.refresh} Restaurar
          </button>
          <button onClick={handleCreate} className="flex items-center gap-1.5 px-4 py-2 bg-[#0098dc] hover:bg-[#0079b2] text-white text-sm font-semibold rounded-lg shadow-sm transition-all">
            {I.plus} Nuevo slide
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editingSlide && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-6">
          <h3 className="font-semibold text-slate-900 mb-4">Editando slide</h3>
          <div className="space-y-3">
            <Field label="Imagen del slide">
              <div className="space-y-2">
                {/* Upload button */}
                <input ref={slideFileRef} type="file" accept="image/*" className="hidden" onChange={handleSlideImageUpload} />
                <button
                  type="button"
                  onClick={() => slideFileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-dashed border-slate-300 hover:border-[#0098dc] hover:bg-blue-50/40 text-slate-600 hover:text-[#0098dc] rounded-lg text-sm font-medium transition-all w-full justify-center"
                >
                  {uploading ? (
                    <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Subiendo...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg> Subir imagen desde tu PC</>
                  )}
                </button>
                {/* URL manual fallback */}
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span>o pega una URL</span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <Input value={formImage} onChange={setFormImage} placeholder="https://images.unsplash.com/..." />
              </div>
            </Field>
            <Field label="Título"><Input value={formTitle} onChange={setFormTitle} placeholder="Título del slide" /></Field>
            <Field label="Subtítulo"><Textarea value={formSubtitle} onChange={setFormSubtitle} rows={2} placeholder="Descripción del slide" /></Field>
            {formImage && <Image src={formImage} alt="Preview" width={384} height={160} className="w-full max-w-sm h-40 object-cover rounded-lg border" />}
            <div className="flex gap-2 pt-2">
              <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-[#0098dc] hover:bg-[#0079b2] text-white font-semibold rounded-lg text-sm">{I.save} Guardar</button>
              <button onClick={() => setEditingSlide(null)} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg text-sm hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Slides list */}
      <div className="space-y-3">
        {slides.sort((a, b) => a.order - b.order).map((slide, idx) => (
          <div key={slide.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex group hover:border-slate-300 transition-all">
            <Image src={slide.image} alt="" width={192} height={112} className="w-48 h-28 object-cover flex-shrink-0" />
            <div className="flex-1 p-4 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-semibold mb-0.5">SLIDE {idx + 1}</p>
                  <p className="font-semibold text-slate-900 truncate">{slide.title}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{slide.subtitle}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button onClick={() => setEditingSlide(slide)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#0098dc] hover:bg-blue-50 transition-all">{I.edit}</button>
                  <button onClick={() => handleDeleteSlide(slide.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">{I.trash}</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TAB: RESERVAS
═══════════════════════════════════════════════ */

function ReservasTab({ reservations, filterStatus, setFilterStatus, selectedRes, setSelectedRes, refreshReservations, showToast, stats }: {
  reservations: Reservation[]; filterStatus: ReservationStatus | 'todas'; setFilterStatus: (s: ReservationStatus | 'todas') => void;
  selectedRes: Reservation | null; setSelectedRes: (r: Reservation | null) => void;
  refreshReservations: () => void; showToast: (m: string) => void;
  stats: { total: number; pendientes: number; aprobadas: number; rechazadas: number; totalAmount: number };
}) {
  const filtered = useMemo(() => {
    let r = [...reservations];
    if (filterStatus !== 'todas') r = r.filter((x) => x.status === filterStatus);
    return r.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [reservations, filterStatus]);

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const statusBadge = (s: ReservationStatus) => {
    const map: Record<string, string> = { pendiente: 'bg-amber-50 text-amber-700', aprobada: 'bg-emerald-50 text-emerald-700', rechazada: 'bg-red-50 text-red-600' };
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${map[s]}`}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>;
  };

  const handleApprove = async (id: string) => {
    await updateReservationStatus(id, 'aprobada', { reviewedBy: 'Admin' });
    await refreshReservations();
    setSelectedRes(null);
    showToast('Reserva aprobada');
  };

  const handleReject = async (id: string) => {
    await updateReservationStatus(id, 'rechazada', { reviewedBy: 'Admin' });
    await refreshReservations();
    setSelectedRes(null);
    showToast('Reserva rechazada');
  };

  const handleDeleteRes = async (id: string) => {
    if (!confirm('¿Eliminar esta reserva?')) return;
    await deleteReservation(id);
    await refreshReservations();
    setSelectedRes(null);
    showToast('Reserva eliminada');
  };

  // Detail view
  if (selectedRes) {
    return (
      <div className="p-6 lg:p-8 max-w-3xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelectedRes(null)} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">{I.back}</button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reserva {selectedRes.code}</h1>
            <p className="text-sm text-slate-400">{selectedRes.projectName} · {selectedRes.lotLabel}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-xs text-slate-400">Cliente</p><p className="font-semibold text-slate-900">{selectedRes.clientName}</p></div>
            <div><p className="text-xs text-slate-400">DNI</p><p className="font-semibold">{selectedRes.clientDni}</p></div>
            <div><p className="text-xs text-slate-400">Email</p><p className="font-semibold">{selectedRes.clientEmail}</p></div>
            <div><p className="text-xs text-slate-400">Teléfono</p><p className="font-semibold">{selectedRes.clientPhone}</p></div>
            <div><p className="text-xs text-slate-400">Precio lote</p><p className="font-bold text-[#0098dc]">{formatPrice(selectedRes.lotPrice, selectedRes.currency ?? 'PEN')}</p></div>
            <div><p className="text-xs text-slate-400">Monto reserva</p><p className="font-bold">{formatPrice(selectedRes.reservationAmount, selectedRes.currency ?? 'PEN')}</p></div>
            <div><p className="text-xs text-slate-400">Estado</p>{statusBadge(selectedRes.status)}</div>
            <div><p className="text-xs text-slate-400">Fecha</p><p className="text-slate-600">{formatDate(selectedRes.createdAt)}</p></div>
            {selectedRes.purchaseType && <div><p className="text-xs text-slate-400">Tipo de compra</p><p className="font-semibold capitalize">{selectedRes.purchaseType}</p></div>}
            {selectedRes.initialPayment && <div><p className="text-xs text-slate-400">Cuota inicial</p><p className="font-semibold">{formatPrice(selectedRes.initialPayment, selectedRes.currency ?? 'PEN')}</p></div>}
            {selectedRes.termMonths && <div><p className="text-xs text-slate-400">Plazo</p><p className="font-semibold">{selectedRes.termMonths} meses</p></div>}
            {selectedRes.monthlyPayment && <div><p className="text-xs text-slate-400">Cuota mensual</p><p className="font-semibold">{formatPrice(selectedRes.monthlyPayment, selectedRes.currency ?? 'PEN')}</p></div>}
          </div>
          {selectedRes.voucherImage && (
            <div>
              <p className="text-xs text-slate-400 mb-2">Comprobante de pago</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selectedRes.voucherImage} alt="Voucher" className="max-w-xs rounded-lg border cursor-pointer" onClick={() => window.open(selectedRes.voucherImage, '_blank')} />
            </div>
          )}
          {selectedRes.status === 'pendiente' && (
            <div className="flex gap-2.5 pt-2">
              <button onClick={() => handleApprove(selectedRes.id)} className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition-all text-sm">
                {I.check} Aprobar
              </button>
              <button onClick={() => handleReject(selectedRes.id)} className="flex-1 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-600 font-bold py-3 rounded-xl hover:bg-red-50 transition-all text-sm">
                {I.x} Rechazar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reservas</h1>
          <p className="text-sm text-slate-500 mt-0.5">{reservations.length} reservas en total</p>
        </div>
        <button onClick={refreshReservations} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">
          {I.refresh} Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: stats.total, color: 'text-slate-900' },
          { label: 'Pendientes', value: stats.pendientes, color: 'text-amber-600' },
          { label: 'Aprobadas', value: stats.aprobadas, color: 'text-emerald-600' },
          { label: 'Rechazadas', value: stats.rechazadas, color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 mb-4">
        {(['todas', 'pendiente', 'aprobada', 'rechazada'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === s ? 'bg-[#0098dc] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
          >
            {s === 'todas' ? 'Todas' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Código</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Cliente</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Proyecto</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Monto</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Estado</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/50 cursor-pointer" onClick={() => setSelectedRes(r)}>
                <td className="px-4 py-3 font-mono font-semibold text-[#0098dc]">{r.code}</td>
                <td className="px-4 py-3 text-slate-800">{r.clientName}</td>
                <td className="px-4 py-3 text-slate-600">{r.projectName}</td>
                <td className="px-4 py-3 font-semibold">{formatPrice(r.reservationAmount, r.currency ?? 'PEN')}</td>
                <td className="px-4 py-3">{statusBadge(r.status)}</td>
                <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(r.createdAt)}</td>
                <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <button onClick={() => handleDeleteRes(r.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">{I.trash}</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-400">No hay reservas</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TAB: CONFIG
═══════════════════════════════════════════════ */

function ConfigTab({ config, setConfig, showToast }: { config: SiteConfig; setConfig: (c: SiteConfig) => void; showToast: (m: string) => void }) {
  const [form, setForm] = useState<SiteConfig>({ ...config });

  const handleSave = async () => {
    const updated = await updateSiteConfig(form);
    setConfig(updated);
    showToast('Configuración guardada');
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración</h1>
          <p className="text-sm text-slate-500 mt-0.5">Ajustes generales del sitio</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 bg-[#0098dc] hover:bg-[#0079b2] text-white font-semibold rounded-lg shadow-sm text-sm">
          {I.save} Guardar
        </button>
      </div>

      <div className="space-y-6">
        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Identidad del sitio</h2>
          <div className="space-y-4">
            <Field label="Nombre del sitio"><Input value={form.siteName} onChange={(v) => setForm({ ...form, siteName: v })} /></Field>
            <Field label="Subtítulo"><Input value={form.siteSubtitle} onChange={(v) => setForm({ ...form, siteSubtitle: v })} /></Field>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Call to Action final</h2>
          <div className="space-y-4">
            <Field label="Título CTA"><Input value={form.ctaTitle} onChange={(v) => setForm({ ...form, ctaTitle: v })} /></Field>
            <Field label="Subtítulo CTA"><Input value={form.ctaSubtitle} onChange={(v) => setForm({ ...form, ctaSubtitle: v })} /></Field>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Seguridad</h2>
          <Field label="Contraseña del admin">
            <Input type="password" value={form.adminPassword} onChange={(v) => setForm({ ...form, adminPassword: v })} />
          </Field>
          <p className="text-xs text-slate-400 mt-2">Cambia la contraseña de acceso al panel de administración</p>
        </section>

        <button onClick={handleSave} className="flex items-center gap-2 px-6 py-3 bg-[#0098dc] hover:bg-[#0079b2] text-white font-bold rounded-xl shadow-md transition-all">
          {I.save} Guardar cambios
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TAB: BANNER FERIA
═══════════════════════════════════════════════ */

function FeriaTab({ feriaConfig, setFeriaConfig, showToast }: {
  feriaConfig: FeriaConfig;
  setFeriaConfig: (c: FeriaConfig) => void;
  showToast: (msg: string) => void;
}) {
  const [form, setForm] = useState<FeriaConfig>(feriaConfig);

  // Preview en tiempo real: sincronizar con prop externa
  useEffect(() => { setForm(feriaConfig); }, [feriaConfig]);

  const handleSave = async () => {
    const saved = await updateFeriaConfig(form);
    setFeriaConfig(saved);
    showToast('✅ Banner guardado correctamente');
  };

  const THEME_OPTIONS: { value: FeriaConfig['theme']; label: string; class: string }[] = [
    { value: 'orange', label: 'Naranja / Rojo', class: 'bg-gradient-to-r from-amber-500 to-red-500' },
    { value: 'blue',   label: 'Azul / Cyan',    class: 'bg-gradient-to-r from-blue-600 to-cyan-500' },
    { value: 'green',  label: 'Verde / Teal',   class: 'bg-gradient-to-r from-emerald-600 to-teal-500' },
    { value: 'purple', label: 'Violeta / Fucsia',class: 'bg-gradient-to-r from-violet-600 to-fuchsia-500' },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-black text-slate-900">Banner Feria</h1>
        <p className="text-sm text-slate-500 mt-1">Configura el banner de invitación que aparece en la parte superior de todas las páginas.</p>
      </div>

      {/* Preview */}
      <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
        <p className="text-xs font-semibold text-slate-400 px-3 py-1.5 bg-slate-50 border-b border-slate-200">Vista previa</p>
        <div className={`px-4 py-2.5 ${
          form.theme === 'blue'   ? 'bg-gradient-to-r from-blue-700 via-blue-500 to-cyan-500' :
          form.theme === 'green'  ? 'bg-gradient-to-r from-emerald-700 via-emerald-500 to-teal-500' :
          form.theme === 'purple' ? 'bg-gradient-to-r from-violet-700 via-purple-600 to-fuchsia-500' :
          'bg-gradient-to-r from-amber-600 via-orange-500 to-red-500'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-white font-bold text-sm">¡Te invitamos a la {form.name || '...'}!</p>
              <p className="text-white/70 text-xs">{form.dates}{form.place ? ` · ${form.place}` : ''}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-black/20 rounded-lg px-3 py-1.5 text-white text-xs font-mono">00:00:00:00</div>
              <span className="bg-white font-bold text-xs px-3 py-1.5 rounded-lg shadow">{form.ctaLabel || 'Ver feria →'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Activar/desactivar */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <p className="font-semibold text-sm text-slate-800">Banner activo</p>
            <p className="text-xs text-slate-500">Muestra u oculta el banner en todo el sitio</p>
          </div>
          <button
            onClick={() => setForm({ ...form, active: !form.active })}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? 'bg-[#0098dc]' : 'bg-slate-300'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : ''}`} />
          </button>
        </div>

        <Field label="Nombre de la feria">
          <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Feria PerúInversión 2026" />
        </Field>

        <Field label="Fechas (texto libre)">
          <Input value={form.dates} onChange={(v) => setForm({ ...form, dates: v })} placeholder="28, 29 y 30 de marzo" />
        </Field>

        <Field label="Lugar del evento">
          <Input value={form.place} onChange={(v) => setForm({ ...form, place: v })} placeholder="Centro de Convenciones de Lima" />
        </Field>

        <Field label="Fecha y hora de cierre (la cuenta regresiva llega a 0 aquí)">
          <input
            type="datetime-local"
            value={form.endDate.slice(0, 16)}
            onChange={(e) => setForm({ ...form, endDate: e.target.value + ':00' })}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all bg-white"
          />
        </Field>

        <Field label="URL del botón CTA">
          <Input value={form.ctaUrl} onChange={(v) => setForm({ ...form, ctaUrl: v })} placeholder="/feria" />
        </Field>

        <Field label="Texto del botón CTA">
          <Input value={form.ctaLabel} onChange={(v) => setForm({ ...form, ctaLabel: v })} placeholder="Ver feria →" />
        </Field>

        {/* Selector de tema */}
        <Field label="Color del banner">
          <div className="grid grid-cols-2 gap-2 mt-1">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.value}
                onClick={() => setForm({ ...form, theme: t.value })}
                className={`flex items-center gap-2.5 p-2.5 rounded-lg border-2 transition-all ${form.theme === t.value ? 'border-[#0098dc]' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <span className={`w-6 h-6 rounded-md flex-shrink-0 ${t.class}`} />
                <span className="text-xs font-medium text-slate-700">{t.label}</span>
                {form.theme === t.value && (
                  <span className="ml-auto text-[#0098dc]">{I.check}</span>
                )}
              </button>
            ))}
          </div>
        </Field>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-3 bg-[#0098dc] hover:bg-[#0079b2] text-white font-bold rounded-xl shadow-md transition-all"
        >
          {I.save} Guardar banner
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TAB: BANNERS DE PROYECTOS
═══════════════════════════════════════════════ */

const EMPTY_AD: Omit<ProjectAdBanner, 'id' | 'order'> = {
  active: true,
  label: '',
  bgImage: '',
  ctaUrl: '/search',
};

function AdBannersTab({ banners, setBanners, showToast }: {
  banners: ProjectAdBanner[];
  setBanners: (b: ProjectAdBanner[]) => void;
  showToast: (msg: string) => void;
}) {
  const [editing, setEditing] = useState<ProjectAdBanner | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Omit<ProjectAdBanner, 'id' | 'order'>>(EMPTY_AD);

  const refresh = async () => setBanners(await getProjectAdBanners());

  const openNew = () => { setForm(EMPTY_AD); setIsNew(true); setEditing(null); };
  const openEdit = (b: ProjectAdBanner) => { setForm(b); setEditing(b); setIsNew(false); };
  const closeForm = () => { setEditing(null); setIsNew(false); };

  const handleSave = async () => {
    if (!form.bgImage.trim()) {
      showToast('⚠️ La imagen del banner es requerida');
      return;
    }
    if (!form.ctaUrl.trim()) {
      showToast('⚠️ La URL de destino es requerida');
      return;
    }
    if (isNew) {
      await createProjectAdBanner(form);
      showToast('✅ Banner creado');
    } else if (editing) {
      await updateProjectAdBanner(editing.id, form);
      showToast('✅ Banner actualizado');
    }
    await refresh();
    closeForm();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este banner?')) return;
    await deleteProjectAdBanner(id);
    await refresh();
    showToast('🗑️ Banner eliminado');
  };

  const handleToggle = async (b: ProjectAdBanner) => {
    await updateProjectAdBanner(b.id, { active: !b.active });
    await refresh();
  };

  // ── Formulario ──
  if (isNew || editing) {
    return (
      <div className="p-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={closeForm} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
            {I.back} Volver
          </button>
          <h1 className="text-xl font-black text-slate-900">{isNew ? 'Nuevo banner' : 'Editar banner'}</h1>
        </div>

        <div className="space-y-5">
          {/* Nombre interno */}
          <Field label="Nombre interno (solo para el admin)">
            <Input
              value={form.label}
              onChange={(v) => setForm({ ...form, label: v })}
              placeholder="Ej: Banner Condominio Gin — marzo 2026"
            />
          </Field>

          {/* Imagen del banner */}
          <ImageUploader
            label="Imagen del banner"
            value={form.bgImage}
            onChange={(v) => setForm({ ...form, bgImage: v })}
            hint="Medida exacta: 2048 × 512 px (relación 4:1). Formato JPG o WEBP. La imagen debe incluir todo el diseño, texto y branding."
          />

          {/* URL de destino */}
          <Field label="URL de destino al hacer clic">
            <Input
              value={form.ctaUrl}
              onChange={(v) => setForm({ ...form, ctaUrl: v })}
              placeholder="/proyecto/mi-proyecto"
            />
            <p className="text-xs text-slate-400 mt-1">El usuario será redirigido a esta URL al hacer clic en cualquier parte del banner.</p>
          </Field>

          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0098dc] hover:bg-[#0079b2] text-white font-bold rounded-xl shadow transition-all text-sm">
              {I.save} {isNew ? 'Crear banner' : 'Guardar cambios'}
            </button>
            <button onClick={closeForm}
              className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Lista ──
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">Banners de Proyectos</h1>
          <p className="text-sm text-slate-500 mt-0.5">Sube la imagen ya diseñada y define a dónde va el usuario al hacer clic.</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-[#0098dc] hover:bg-[#0079b2] text-white font-bold rounded-xl text-sm shadow transition-all">
          {I.plus} Nuevo banner
        </button>
      </div>

      {banners.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
            {I.adbanners}
          </div>
          <p className="font-semibold text-slate-600">No hay banners aún</p>
          <p className="text-sm mt-1">Crea el primer banner para mostrarlo en la homepage.</p>
          <button onClick={openNew} className="mt-4 text-sm text-[#0098dc] hover:underline font-medium">+ Crear primer banner</button>
        </div>
      ) : (
        <div className="space-y-3">
          {[...banners].sort((a, b) => a.order - b.order).map((b) => (
            <div key={b.id} className={`flex items-center gap-4 bg-white border rounded-xl p-3 shadow-sm transition-opacity ${b.active ? '' : 'opacity-50'}`}>
              {/* Thumbnail */}
              <div className="w-28 h-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 relative">
                {b.bgImage && <img src={b.bgImage} alt="" className="w-full h-full object-cover" />}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 truncate">{b.label || 'Sin nombre'}</p>
                <p className="text-xs text-slate-400 truncate mt-0.5">{b.ctaUrl}</p>
              </div>
              {/* Toggle */}
              <button onClick={() => handleToggle(b)}
                className={`relative w-9 h-5 rounded-full flex-shrink-0 transition-colors ${b.active ? 'bg-[#0098dc]' : 'bg-slate-300'}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${b.active ? 'translate-x-4' : ''}`} />
              </button>
              {/* Acciones */}
              <button onClick={() => openEdit(b)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">{I.edit}</button>
              <button onClick={() => handleDelete(b.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">{I.trash}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CHAT TAB
═══════════════════════════════════════════════ */
function ChatTab({ chatConfig, setChatConfig, showToast }: {
  chatConfig: ChatConfig;
  setChatConfig: (c: ChatConfig) => void;
  showToast: (msg: string) => void;
}) {
  const [form, setForm] = useState<ChatConfig>(chatConfig);

  const handleSave = async () => {
    const saved = await updateChatConfig(form);
    setChatConfig(saved);
    showToast('✅ Chat actualizado');
  };

  const COLORS = [
    { label: 'Azul',    value: '#0098dc' },
    { label: 'Verde',   value: '#10b981' },
    { label: 'Morado',  value: '#7c3aed' },
    { label: 'Naranja', value: '#f97316' },
    { label: 'Rojo',    value: '#ef4444' },
    { label: 'Negro',   value: '#1e293b' },
  ];

  return (
    <div className="p-6 max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-slate-900">Chat en vivo</h1>
          <p className="text-sm text-slate-500 mt-0.5">Botón flotante de WhatsApp que aparece en todas las páginas.</p>
        </div>
        <button
          onClick={() => setForm({ ...form, active: !form.active })}
          className={`relative w-12 h-6 rounded-full transition-colors ${form.active ? 'bg-[#0098dc]' : 'bg-slate-300'}`}
        >
          <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-6' : ''}`} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre del agente">
            <Input value={form.agentName} onChange={(v) => setForm({ ...form, agentName: v })} placeholder="Asesor PerúInversión" />
          </Field>
          <Field label="Cargo / Rol">
            <Input value={form.agentRole} onChange={(v) => setForm({ ...form, agentRole: v })} placeholder="Asesor inmobiliario" />
          </Field>
        </div>

        <Field label="Foto del agente (URL, opcional)">
          <Input value={form.agentAvatar} onChange={(v) => setForm({ ...form, agentAvatar: v })} placeholder="https://..." />
          {form.agentAvatar && (
            <div className="mt-2 w-12 h-12 rounded-full overflow-hidden border border-slate-200">
              <img src={form.agentAvatar} alt="avatar" className="w-full h-full object-cover" />
            </div>
          )}
        </Field>

        <Field label="Mensaje de bienvenida">
          <textarea
            value={form.welcomeMessage}
            onChange={(e) => setForm({ ...form, welcomeMessage: e.target.value })}
            rows={3}
            placeholder="¡Hola! ¿En qué proyecto estás interesado?"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all resize-none"
          />
        </Field>

        <Field label="Número de WhatsApp (con código de país, sin +)">
          <Input value={form.whatsappNumber} onChange={(v) => setForm({ ...form, whatsappNumber: v })} placeholder="51987654321" />
          <p className="text-xs text-slate-400 mt-1">Ej: 51987654321 (Perú = 51 + número sin 0)</p>
        </Field>

        <Field label="Color del botón">
          <div className="flex gap-2 mt-1 flex-wrap items-center">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setForm({ ...form, accentColor: c.value })}
                className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                style={{
                  background: c.value,
                  borderColor: form.accentColor === c.value ? '#1e293b' : 'transparent',
                  transform: form.accentColor === c.value ? 'scale(1.15)' : undefined,
                }}
                title={c.label}
              />
            ))}
            <div className="flex items-center gap-2 ml-1">
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                className="w-8 h-8 rounded-full border border-slate-200 cursor-pointer"
                title="Color personalizado"
              />
              <span className="text-xs text-slate-400">Personalizado</span>
            </div>
          </div>
        </Field>

        {/* Preview */}
        <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Vista previa</p>
          <div className="flex items-center gap-3">
            <div
              className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center flex-shrink-0"
              style={{ background: form.accentColor }}
            >
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </div>
            <div>
              <p className="font-semibold text-slate-700 text-sm">{form.agentName || 'Nombre del agente'}</p>
              <p className="text-xs text-slate-400">{form.agentRole || 'Rol'}</p>
              <p className="text-xs text-emerald-600 font-medium mt-0.5">● Online ahora</p>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#0098dc] hover:bg-[#0079b2] text-white font-bold rounded-xl shadow transition-all text-sm"
        >
          {I.save} Guardar cambios
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TAB: MENSAJES
═══════════════════════════════════════════════ */

function MensajesTab({ messages, setMessages, unreadCount, setUnreadCount, showToast }: {
  messages: Conversation[];
  setMessages: (m: Conversation[]) => void;
  unreadCount: number;
  setUnreadCount: (n: number) => void;
  showToast: (msg: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMsgCountRef = useRef(0);
  const accent = '#0098dc';

  // Refresco periódico mientras está abierta una conversación
  useEffect(() => {
    if (!selected) return;
    const interval = setInterval(async () => {
      setMessages(await getConversations());
      setUnreadCount(await getUnreadCount());
    }, 1500);
    return () => clearInterval(interval);
  }, [selected, setMessages, setUnreadCount]);

  // Scroll al fondo SOLO cuando cambia la conversación seleccionada
  // o cuando llega un mensaje nuevo (conteo aumenta)
  const activeConv = selected ? messages.find(m => m.id === selected) : null;
  const currentMsgCount = activeConv?.messages.length ?? 0;

  useEffect(() => {
    // Al abrir una conversación: scroll inmediato
    lastMsgCountRef.current = 0;
  }, [selected]);

  useEffect(() => {
    if (currentMsgCount > lastMsgCountRef.current) {
      lastMsgCountRef.current = currentMsgCount;
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMsgCount]);

  async function handleOpen(id: string) {
    setSelected(id);
    await markConversationRead(id);
    setMessages(await getConversations());
    setUnreadCount(await getUnreadCount());
  }

  async function handleMarkAllRead() {
    await markAllConversationsRead();
    setMessages(await getConversations());
    setUnreadCount(0);
    showToast('Todas las conversaciones marcadas como leídas');
  }

  async function handleDelete(id: string) {
    await deleteConversation(id);
    setMessages(await getConversations());
    setUnreadCount(await getUnreadCount());
    if (selected === id) setSelected(null);
    showToast('Conversación eliminada');
  }

  async function handleSendReply() {
    if (!reply.trim() || !selected || sending) return;
    setSending(true);
    await sendAdminReply(selected, reply.trim());
    setReply('');
    setMessages(await getConversations());
    setSending(false);
  }

  function handleReplyKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendReply(); }
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  function timeLabel(iso: string) {
    return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
  }

  const sorted = [...messages].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  // activeConv ya está calculado arriba (antes de los useEffects)

  return (
    <div className="flex gap-5 h-full p-6">

      {/* ── Lista de conversaciones ── */}
      <div className="w-72 flex-shrink-0 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header lista */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 text-sm">Conversaciones</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
            )}
          </div>
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="text-[11px] text-[#0098dc] hover:underline">
              Marcar leídas
            </button>
          )}
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {sorted.length === 0 && (
            <div className="text-center py-12 px-4">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-slate-400 text-sm">Sin conversaciones aún</p>
            </div>
          )}
          {sorted.map((conv) => {
            const last = conv.messages[conv.messages.length - 1];
            const isActive = selected === conv.id;
            return (
              <div
                key={conv.id}
                onClick={() => handleOpen(conv.id)}
                className={`px-4 py-3 cursor-pointer transition-colors hover:bg-slate-50 ${isActive ? 'bg-[#0098dc]/5 border-l-2 border-[#0098dc]' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Dot no leído */}
                    {!conv.isRead && (
                      <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 mt-1" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm truncate ${!conv.isRead ? 'font-bold text-slate-800' : 'font-medium text-slate-700'}`}>
                        {conv.visitorName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {last ? (last.role === 'admin' ? '✓ ' : '') + last.text : '—'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 flex-shrink-0 mt-0.5">{timeAgo(conv.updatedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Panel de conversación ── */}
      <div className="flex-1 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="text-5xl mb-4">💬</div>
            <p className="text-slate-500 font-medium">Selecciona una conversación</p>
            <p className="text-slate-400 text-sm mt-1">para ver el hilo y responder</p>
          </div>
        ) : (
          <>
            {/* Header conversación */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#0098dc]/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#0098dc] font-bold text-sm">
                    {(activeConv.visitorName || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{activeConv.visitorName}</p>
                  <p className="text-[11px] text-slate-400">
                    {activeConv.visitorEmail && <a href={`mailto:${activeConv.visitorEmail}`} className="text-[#0098dc] hover:underline mr-2">{activeConv.visitorEmail}</a>}
                    {activeConv.projectName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(activeConv.id)}
                className="text-xs text-slate-300 hover:text-red-500 transition-colors px-2 py-1"
              >
                Eliminar
              </button>
            </div>

            {/* Hilo de mensajes */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50">
              {activeConv.messages.map((msg: ChatMsg) => (
                <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'admin' ? 'flex-row-reverse' : ''}`}>
                  <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
                    style={{ background: msg.role === 'admin' ? accent : '#94a3b8' }}>
                    {msg.role === 'admin' ? 'A' : (activeConv.visitorName || '?')[0].toUpperCase()}
                  </div>
                  <div className={`max-w-[65%] flex flex-col ${msg.role === 'admin' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-3 py-2 text-sm rounded-2xl shadow-sm whitespace-pre-wrap ${
                      msg.role === 'admin'
                        ? 'text-white rounded-br-sm'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm'
                    }`}
                      style={msg.role === 'admin' ? { background: accent } : {}}>
                      {msg.text}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 mx-1">{timeLabel(msg.timestamp)}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input respuesta admin */}
            <div className="px-4 py-3 border-t border-slate-100 bg-white flex gap-3 items-end">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={handleReplyKey}
                placeholder="Escribe tu respuesta... (Enter para enviar)"
                rows={2}
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#0098dc] focus:ring-2 focus:ring-[#0098dc]/20 transition-all resize-none"
              />
              <button
                onClick={handleSendReply}
                disabled={!reply.trim() || sending}
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30 hover:opacity-90"
                style={{ background: accent }}
              >
                {sending ? (
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
          </>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TAB: CONSULTAS (formulario de contacto)
═══════════════════════════════════════════════ */
function ConsultasTab({ submissions, setSubmissions, setUnreadCount, showToast }: {
  submissions: ContactSubmission[];
  setSubmissions: (s: ContactSubmission[]) => void;
  setUnreadCount: (n: number) => void;
  showToast: (m: string) => void;
}) {
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const [filterUnread, setFilterUnread] = useState(false);

  const refresh = async () => {
    const all = await getContactSubmissions();
    setSubmissions(all);
    setUnreadCount(await getUnreadContactCount());
  };

  const handleMarkRead = async (id: string) => {
    await markContactRead(id);
    await refresh();
  };

  const handleMarkAllRead = async () => {
    await markAllContactRead();
    await refresh();
    showToast('Todas las consultas marcadas como leídas');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta consulta?')) return;
    await deleteContactSubmission(id);
    await refresh();
    if (selected?.id === id) setSelected(null);
    showToast('Consulta eliminada');
  };

  const handleOpen = async (s: ContactSubmission) => {
    setSelected(s);
    if (!s.isRead) {
      await markContactRead(s.id);
      await refresh();
    }
  };

  const displayed = filterUnread ? submissions.filter((s) => !s.isRead) : submissions;
  const unread = submissions.filter((s) => !s.isRead).length;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  /* ── Detail view ── */
  if (selected) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelected(null)} className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{selected.name}</h1>
            <p className="text-sm text-slate-400">Consulta sobre {selected.projectName}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-xs text-slate-400">Nombre</p><p className="font-semibold text-slate-900">{selected.name}</p></div>
            <div><p className="text-xs text-slate-400">Email</p><p className="font-semibold text-slate-800">{selected.email}</p></div>
            <div><p className="text-xs text-slate-400">Celular</p><p className="font-semibold text-slate-800">{selected.phone}</p></div>
            <div><p className="text-xs text-slate-400">Proyecto</p>
              <span className="font-semibold text-[#0098dc]">{selected.projectName}</span>
            </div>
            <div><p className="text-xs text-slate-400">Fecha</p><p className="text-slate-600">{formatDate(selected.createdAt)}</p></div>
            <div><p className="text-xs text-slate-400">Estado</p>
              <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${selected.isRead ? 'bg-slate-100 text-slate-500' : 'bg-orange-100 text-orange-600'}`}>
                {selected.isRead ? 'Leída' : 'No leída'}
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-400 mb-1">Mensaje</p>
            <p className="text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">{selected.message}</p>
          </div>
          <div className="flex gap-2 pt-2">
            <a
              href={`mailto:${selected.email}?subject=Tu consulta sobre ${selected.projectName}&body=Hola ${selected.name},%0D%0A%0D%0AGracias por tu interés en ${selected.projectName}.`}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#0098dc] hover:bg-[#0079b2] text-white font-bold rounded-xl text-sm shadow transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              Responder por email
            </a>
            <a
              href={`https://wa.me/${(selected.phone ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(`Hola ${selected.name}, gracias por tu interés en ${selected.projectName}. Estoy para ayudarte.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold rounded-xl text-sm shadow transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              WhatsApp
            </a>
            <button
              onClick={() => handleDelete(selected.id)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 font-bold rounded-xl text-sm hover:bg-red-50 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── List view ── */
  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultas</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {submissions.length} consultas totales{unread > 0 ? ` · ${unread} sin leer` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={handleMarkAllRead} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
              Marcar todo leído
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 mb-5">
        <button
          onClick={() => setFilterUnread(false)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${!filterUnread ? 'bg-[#0098dc] text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
        >
          Todas ({submissions.length})
        </button>
        <button
          onClick={() => setFilterUnread(true)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterUnread ? 'bg-orange-500 text-white' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
        >
          Sin leer ({unread})
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="text-center py-20 text-slate-400">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-300">
            {I.consultas}
          </div>
          <p className="font-semibold text-slate-600">
            {filterUnread ? 'No hay consultas sin leer' : 'Aún no hay consultas'}
          </p>
          <p className="text-sm mt-1">Aparecerán aquí cuando alguien use el botón &quot;Contactar&quot; en los proyectos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-4" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Celular</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Proyecto</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Fecha</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.map((s) => (
                <tr
                  key={s.id}
                  className={`cursor-pointer hover:bg-slate-50/50 transition-colors ${!s.isRead ? 'bg-orange-50/40' : ''}`}
                  onClick={() => handleOpen(s)}
                >
                  <td className="px-4 py-3">
                    {!s.isRead && <span className="w-2 h-2 rounded-full bg-orange-500 block" />}
                  </td>
                  <td className={`px-4 py-3 ${!s.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>{s.name}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.email}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{s.phone}</td>
                  <td className="px-4 py-3 text-[#0098dc] font-medium text-xs">{s.projectName}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(s.createdAt)}</td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {!s.isRead && (
                        <button
                          onClick={() => handleMarkRead(s.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 transition-all"
                          title="Marcar como leída"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Eliminar"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TAB: FERIA REGISTROS
═══════════════════════════════════════════════ */
const INTEREST_LABELS: Record<string, string> = {
  lotes: 'Lotes y terrenos',
  departamentos: 'Departamentos',
  inversion: 'Inversión / Rentabilidad',
  otro: 'Otro',
};

function FeriaRegistrosTab({ registros, setRegistros, setUnreadCount, showToast }: {
  registros: FeriaRegistro[];
  setRegistros: (r: FeriaRegistro[]) => void;
  setUnreadCount: (n: number) => void;
  showToast: (m: string) => void;
}) {
  const [filterUnread, setFilterUnread] = useState(false);
  const [filterInterest, setFilterInterest] = useState('');

  const refresh = async () => {
    setRegistros(await getFeriaRegistros());
    setUnreadCount(await getUnreadFeriaCount());
  };

  const handleMarkAll = async () => {
    await markAllFeriaRead();
    await refresh();
    showToast('Todos los registros marcados como leídos');
  };

  const handleDelete = async (id: string) => {
    await deleteFeriaRegistro(id);
    await refresh();
    showToast('Registro eliminado');
  };

  const handleMarkRead = async (id: string) => {
    await markFeriaRegistroRead(id);
    await refresh();
  };

  const filtered = registros.filter((r) => {
    if (filterUnread && r.isRead) return false;
    if (filterInterest && r.interes !== filterInterest) return false;
    return true;
  });

  const unread = registros.filter((r) => !r.isRead).length;

  // Export CSV
  const handleExport = () => {
    const headers = ['Nombre', 'Email', 'Teléfono', 'Interés', 'Fecha'];
    const rows = registros.map((r) => [
      r.nombre, r.email, r.telefono,
      INTEREST_LABELS[r.interes ?? ''] ?? r.interes,
      new Date(r.createdAt).toLocaleString('es-PE'),
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'feria-registros.csv'; a.click();
    URL.revokeObjectURL(url);
    showToast('CSV exportado');
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-[#0098dc]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 000-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
            Feria PerúInversión 2026 — Registros
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            {registros.length} registros · {unread} sin leer
          </p>
        </div>
        <div className="flex gap-2">
          {unread > 0 && (
            <button onClick={handleMarkAll} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-lg transition-colors">
              Marcar todo leído
            </button>
          )}
          <button onClick={handleExport} className="text-xs bg-[#0098dc] hover:bg-[#0087c5] text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {Object.entries(INTEREST_LABELS).map(([key, label]) => {
          const count = registros.filter((r) => r.interes === key).length;
          return (
            <div key={key} className="bg-white rounded-xl border border-slate-200 p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-slate-900">{count}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input type="checkbox" checked={filterUnread} onChange={(e) => setFilterUnread(e.target.checked)} className="rounded" />
          Solo no leídos
        </label>
        <select
          value={filterInterest}
          onChange={(e) => setFilterInterest(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-400 bg-white"
        >
          <option value="">Todos los intereses</option>
          {Object.entries(INTEREST_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <span className="text-xs text-slate-400">{filtered.length} resultados</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 010 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a3 3 0 000-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">No hay registros aún</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Nombre</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Contacto</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Interés</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">Fecha</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => { if (!r.isRead) { handleMarkRead(r.id); } }}
                  className={`transition-colors ${!r.isRead ? 'bg-blue-50/60 hover:bg-blue-50' : 'hover:bg-slate-50'} cursor-default`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {!r.isRead && <span className="w-2 h-2 rounded-full bg-[#0098dc] flex-shrink-0" />}
                      <span className={`font-medium text-slate-900 ${!r.isRead ? 'font-semibold' : ''}`}>{r.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600 space-y-0.5">
                      <div>{r.email}</div>
                      <div className="text-slate-400">{r.telefono}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                      {INTEREST_LABELS[r.interes ?? ''] ?? r.interes}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(r.createdAt).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <a
                        href={`mailto:${r.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-all"
                        title="Enviar email"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
                      </a>
                      <a
                        href={`https://wa.me/${r.telefono.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                        title="WhatsApp"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      </a>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(r.id); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                        title="Eliminar"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
