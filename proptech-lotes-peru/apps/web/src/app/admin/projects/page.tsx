'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { downloadProjectTemplate } from '@/lib/download-template';

interface Project {
  id: string;
  name: string;
  slug: string;
  zone?: {
    name: string;
  };
  minPrice: number;
  safetyScore: number;
  legalStatus: 'CLEAR' | 'IN_PROCESS' | 'PENDING';
  isFeatured: boolean;
}

interface ProjectsResponse {
    data: Project[];
}

export default function AdminProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) { router.push('/admin'); return; }

    api.getProjects({ limit: '100' })
      .then((data) => setProjects((data as unknown as ProjectsResponse).data || []))
      .catch(() => router.push('/admin'))
      .finally(() => setLoading(false));
  }, [router]);

  const toggleFeatured = async (projectId: string) => {
    try {
      await api.adminRequest(`/admin/projects/${projectId}/featured`, { method: 'PATCH' });
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, isFeatured: !p.isFeatured } : p))
      );
    } catch { /* ignore */ }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <Link href="/admin/dashboard" className="hover:text-primary-600">Dashboard</Link>
            <span>/</span>
            <span className="text-gray-900">Proyectos</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Gestionar proyectos</h1>
        </div>

        {/* Botón descarga plantilla Excel */}
        <button
          onClick={() => downloadProjectTemplate()}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl shadow transition-colors"
          title="Descarga la plantilla Excel para cargar proyectos nuevos"
        >
          {/* Ícono Excel */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Descargar plantilla Excel
        </button>
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
                <th className="py-3 px-4 font-medium text-gray-600">Zona</th>
                <th className="py-3 px-4 font-medium text-gray-600">Precio desde</th>
                <th className="py-3 px-4 font-medium text-gray-600">Seguridad</th>
                <th className="py-3 px-4 font-medium text-gray-600">Legal</th>
                <th className="py-3 px-4 font-medium text-gray-600">Destacado</th>
                <th className="py-3 px-4 font-medium text-gray-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <Link href={`/projects/${project.slug}`} className="font-medium text-primary-600 hover:underline">
                      {project.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{project.zone?.name}</td>
                  <td className="py-3 px-4 font-medium">{formatPrice(project.minPrice)}</td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${
                      project.safetyScore >= 80 ? 'text-green-600' :
                      project.safetyScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>{project.safetyScore}/100</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded ${
                      project.legalStatus === 'CLEAR' ? 'bg-green-100 text-green-700' :
                      project.legalStatus === 'IN_PROCESS' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {project.legalStatus === 'CLEAR' ? 'Saneado' :
                       project.legalStatus === 'IN_PROCESS' ? 'En proceso' : 'Pendiente'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => toggleFeatured(project.id)}
                      className={`text-lg ${project.isFeatured ? 'text-yellow-500' : 'text-gray-300'}`}
                    >
                      ⭐
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <Link href={`/projects/${project.slug}`} className="text-primary-600 hover:underline text-xs">
                      Ver →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
