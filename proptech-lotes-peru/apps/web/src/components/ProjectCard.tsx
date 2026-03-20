import Link from 'next/link';
import Image from 'next/image';
import { formatPrice } from '@/lib/utils';

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    slug: string;
    minPrice: number;
    maxPrice: number;
    minArea: number;
    maxArea: number;
    deliveryDate?: string;
    safetyScore: number;
    isFeatured: boolean;
    legalStatus: string;
    developer: { name: string };
    zone: { name: string; city: { name: string } };
    images: { url: string; isPrimary: boolean }[];
    _count?: { lots: number };
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
  const primaryImage = project.images?.find((i) => i.isPrimary) || project.images?.[0];

  return (
    <Link href={`/projects/${project.slug}`} className="card group block overflow-hidden">
      {/* Image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {primaryImage ? (
          <Image
            src={primaryImage.url}
            alt={project.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {project.isFeatured && (
          <span className="absolute top-2 left-2 bg-accent-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Destacado
          </span>
        )}

      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors line-clamp-1">
            {project.name}
          </h3>
        </div>
        <p className="text-sm text-gray-500 mb-2">
          {project.zone?.name}, {project.zone?.city?.name} · {project.developer?.name}
        </p>

        <div className="flex items-center justify-between text-sm mb-3">
          <span className="font-semibold text-primary-600">
            {formatPrice(project.minPrice)} - {formatPrice(project.maxPrice)}
          </span>
          <span className="text-gray-500">
            {project.minArea}m² - {project.maxArea}m²
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          {project.deliveryDate && (
            <span className="flex items-center gap-1">
              📅 {new Date(project.deliveryDate).toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })}
            </span>
          )}
          {project._count?.lots && (
            <span className="flex items-center gap-1">
              📦 {project._count.lots} lotes
            </span>
          )}
          <span className={`ml-auto badge ${
            project.legalStatus === 'CLEAR' ? 'badge-green' :
            project.legalStatus === 'IN_PROCESS' ? 'badge-yellow' :
            'badge-red'
          }`}>
            {project.legalStatus === 'CLEAR' ? 'Saneado' :
             project.legalStatus === 'IN_PROCESS' ? 'En proceso' : 'Pendiente'}
          </span>
        </div>
      </div>
    </Link>
  );
}
