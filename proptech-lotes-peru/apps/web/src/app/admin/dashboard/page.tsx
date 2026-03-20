'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

interface DashboardData {
  totalProjects: number;
  totalLeads: number;
  leadsToday: number;
  pendingReviews: number;
}

interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  project?: {
    name: string;
  };
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'UNQUALIFIED';
  createdAt: string;
}

interface LeadsResponse {
    data: Lead[];
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/admin');
      return;
    }

    const fetchData = async () => {
      try {
        const [dashData, leadsData] = await Promise.all([
          api.adminRequest<DashboardData>('/admin/dashboard'),
          api.adminRequest<LeadsResponse>('/leads?limit=10'),
        ]);
        setDashboard(dashData);
        setLeads(leadsData.data || []);
      } catch {
        router.push('/admin');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    router.push('/admin');
  };

  if (loading) {
    return (
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Panel de administración de PerúInversión</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="btn-secondary text-sm">Ver sitio →</Link>
          <button onClick={handleLogout} className="text-sm text-red-600 hover:underline">
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <p className="text-sm text-gray-500">Proyectos</p>
            <p className="text-3xl font-bold text-gray-900">{dashboard.totalProjects || 0}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-gray-500">Leads totales</p>
            <p className="text-3xl font-bold text-primary-600">{dashboard.totalLeads || 0}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-gray-500">Leads hoy</p>
            <p className="text-3xl font-bold text-green-600">{dashboard.leadsToday || 0}</p>
          </div>
          <div className="card p-6">
            <p className="text-sm text-gray-500">Reviews pendientes</p>
            <p className="text-3xl font-bold text-yellow-600">{dashboard.pendingReviews || 0}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/admin/projects" className="card p-6 hover:border-primary-300 transition-colors">
          <h3 className="font-semibold text-gray-900 mb-1">📋 Gestionar proyectos</h3>
          <p className="text-sm text-gray-500">Crear, editar y administrar proyectos de lotes</p>
        </Link>
        <Link href="/admin/leads" className="card p-6 hover:border-primary-300 transition-colors">
          <h3 className="font-semibold text-gray-900 mb-1">👥 Gestionar leads</h3>
          <p className="text-sm text-gray-500">Ver leads, actualizar estados, exportar CSV</p>
        </Link>
        <Link href="/admin/reviews" className="card p-6 hover:border-primary-300 transition-colors">
          <h3 className="font-semibold text-gray-900 mb-1">⭐ Moderar reviews</h3>
          <p className="text-sm text-gray-500">Aprobar o rechazar reviews de usuarios</p>
        </Link>
      </div>

      {/* Recent Leads */}
      <div className="card">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Últimos leads</h2>
            <Link href="/admin/leads" className="text-sm text-primary-600 hover:underline">
              Ver todos →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left">
                <th className="py-3 px-4 font-medium text-gray-600">Nombre</th>
                <th className="py-3 px-4 font-medium text-gray-600">Email</th>
                <th className="py-3 px-4 font-medium text-gray-600">Teléfono</th>
                <th className="py-3 px-4 font-medium text-gray-600">Proyecto</th>
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
                  <td className="py-3 px-4">{lead.project?.name || '-'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      lead.status === 'NEW' ? 'bg-blue-100 text-blue-700' :
                      lead.status === 'CONTACTED' ? 'bg-yellow-100 text-yellow-700' :
                      lead.status === 'QUALIFIED' ? 'bg-green-100 text-green-700' :
                      lead.status === 'CONVERTED' ? 'bg-purple-100 text-purple-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500">
                    {new Date(lead.createdAt).toLocaleDateString('es-PE')}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-400">
                    No hay leads registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
