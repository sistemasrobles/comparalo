// ============================================================
// useAdminProjects — hook que carga proyectos desde Supabase
// vía la API route /api/db/projects.
//
// Uso:
//   const projects = useAdminProjects();         // todos los activos
//   const projects = useAdminProjects(false);    // incluyendo inactivos
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { getAdminProjects } from '@/lib/admin-store';
import type { ProjectData } from '@/lib/projects-data';

export function useAdminProjects(onlyActive = true): ProjectData[] {
  const [projects, setProjects] = useState<ProjectData[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const all = await getAdminProjects();
      if (!cancelled) {
        setProjects(onlyActive ? all.filter((p) => p.isActive !== false) : all);
      }
    };

    load();

    // Re-cargar cuando el usuario vuelve a esta pestaña
    const handleFocus = () => load();
    window.addEventListener('focus', handleFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', handleFocus);
    };
  }, [onlyActive]);

  return projects;
}

// Versión para un único proyecto (por slug)
export function useAdminProject(slug: string): ProjectData | null {
  const projects = useAdminProjects(false);
  return projects.find((p) => p.slug === slug) ?? null;
}
