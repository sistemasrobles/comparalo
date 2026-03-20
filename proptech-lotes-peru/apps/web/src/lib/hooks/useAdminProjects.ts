// ============================================================
// useAdminProjects — hook reactivo que sincroniza los datos
// del admin-store en TIEMPO REAL en cualquier página/componente.
//
// Cómo funciona:
//   1. Al montar, lee los proyectos desde localStorage (admin-store).
//   2. Escucha el evento nativo "storage" del browser: se dispara
//      automáticamente cuando CUALQUIER otra pestaña escribe en
//      localStorage, por ejemplo cuando el admin guarda un cambio
//      (nombre, descripción, precio, moneda, imagen, etc.).
//   3. También re-sincroniza cada vez que la ventana recupera el
//      foco (el usuario vuelve a la pestaña después de editar).
//
// Uso:
//   const projects = useAdminProjects();         // todos los activos
//   const projects = useAdminProjects(false);    // incluyendo inactivos
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import { getAdminProjects } from '@/lib/admin-store';
import type { ProjectData } from '@/lib/projects-data';

const PROJECTS_KEY = 'peruinversion_admin_projects';

export function useAdminProjects(onlyActive = true): ProjectData[] {
  // Siempre iniciar con [] para que servidor y cliente coincidan
  // en la primera render y no haya hydration mismatch.
  // El useEffect carga los datos reales justo después del montaje.
  const [projects, setProjects] = useState<ProjectData[]>([]);

  useEffect(() => {
    // Carga inicial en cliente
    const load = () => {
      const all = getAdminProjects();
      setProjects(onlyActive ? all.filter((p) => p.isActive !== false) : all);
    };

    load(); // sincronizar inmediatamente al montar

    // Escuchar cambios de OTRA pestaña (evento nativo del browser)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === PROJECTS_KEY || e.key === null) {
        load();
      }
    };

    // Escuchar cuando el usuario vuelve a esta pestaña
    const handleFocus = () => load();

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorage);
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
