'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  project?: {
    name: string;
    slug: string;
  };
  paymentMethod: 'CASH' | 'FINANCING' | 'BANK_CREDIT' | 'MIXED';
  timeline: 'IMMEDIATE' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'EXPLORING';
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  createdAt: string;
}

interface LeadsResponse {
    data: Lead[];
}

export default function AdminLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/admin'); return; }

    const params: { limit: string; status?: string } = { limit: '50' };
    if (statusFilter) params.status = statusFilter;

    api.adminRequest<LeadsResponse>(`/leads?limit=50${statusFilter ? `&status=${statusFilter}` : ''}`)
      .then((data) => setLeads(data.data || []))
      .catch(() => router.push('/admin'))
      .finally(() => setLoading(false));
  }, [router, statusFilter]);

  const updateStatus = async (leadId: string, status: string) => {
    try {
      await api.adminRequest(`/leads/${leadId}/status`, {
        method: 'PATCH',
        body: { status },
      });
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, status: status as Lead['status'] } : l))
      );
    } catch { /* ignore */ }
  };

  const exportCsv = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/leads/export?token=${token}`, '_blank');
    } catch { /* ignore */ }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/admin/dashboard" className="hover:text-primary-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Leads</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Gestionar leads</h1>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input-field text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="NEW">Nuevo</option>
            <option value="CONTACTED">Contactado</option>
            <option value="QUALIFIED">Calificado</option>
            <option value="CONVERTED">Convertido</option>
            <option value="LOST">Perdido</option>
          </select>
          <button onClick={exportCsv} className="btn-secondary text-sm">
            📥 Exportar CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="py-3 px-4 font-medium text-gray-600">Nombre</th>
                <th className="py-3 px-4 font-medium text-gray-600">Email</th>
                <th className="py-3 px-4 font-medium text-gray-600">Teléfono</th>
                <th className="py-3 px-4 font-medium text-gray-600">Proyecto</th>
                <th className="py-3 px-4 font-medium text-gray-600">Forma de pago</th>
                <th className="py-3 px-4 font-medium text-gray-600">Timeline</th>
                <th className="py-3 px-4 font-medium text-gray-600">Estado</th>
                <th className="py-3 px-4 font-medium text-gray-600">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{lead.fullName}</td>
                  <td className="py-3 px-4 text-gray-600">{lead.email}</td>
                  <td className="py-3 px-4 text-gray-600">{lead.phone}</td>
                  <td className="py-3 px-4">
                    {lead.project ? (
                      <Link href={`/projects/${lead.project.slug}`} className="text-primary-600 hover:underline">
                        {lead.project.name}
                      </Link>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {lead.paymentMethod === 'CASH' ? 'Contado' :
                     lead.paymentMethod === 'FINANCING' ? 'Financiamiento' :
                     lead.paymentMethod === 'BANK_CREDIT' ? 'Crédito' : 'Mixto'}
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">
                    {lead.timeline === 'IMMEDIATE' ? 'Inmediato' :
                     lead.timeline === 'THREE_MONTHS' ? '3 meses' :
                     lead.timeline === 'SIX_MONTHS' ? '6 meses' : 'Explorando'}
                  </td>
                  <td className="py-3 px-4">
                    <select
                      className="text-xs border rounded px-2 py-1"
                      value={lead.status}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                    >
                      <option value="NEW">Nuevo</option>
                      <option value="CONTACTED">Contactado</option>
                      <option value="QUALIFIED">Calificado</option>
                      <option value="CONVERTED">Convertido</option>
                      <option value="LOST">Perdido</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-xs">
                    {new Date(lead.createdAt).toLocaleDateString('es-PE')}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    No hay leads con el filtro seleccionado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
