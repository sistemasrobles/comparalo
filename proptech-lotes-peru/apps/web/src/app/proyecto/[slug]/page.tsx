import { PROJECTS, getProjectBySlug } from '@/lib/projects-data';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ProjectDetailClient from './ProjectDetailClient';

export function generateStaticParams() {
  return PROJECTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const project = getProjectBySlug(params.slug);
  if (!project) return { title: 'Proyecto no encontrado' };
  return {
    title: `${project.name} \u2014 ${project.city}`,
    description: project.shortDescription,
  };
}

export default function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const project = getProjectBySlug(params.slug);
  if (!project) notFound();

  return <ProjectDetailClient slug={params.slug} serverProject={project} />;
}