import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { SafetyScore } from '@/components/SafetyScore';
import { LeadForm } from '@/components/LeadForm';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';

interface ApiLot {
  id: string;
  lotNumber: string;
  area: number;
  price: number;
  pricePerM2: number;
  status: string;
}

interface ApiProject {
  id: string;
  name: string;
  description?: string;
  minPrice: number;
  minArea: number;
  maxArea: number;
  isFeatured?: boolean;
  deliveryDate?: string;
  images: { url: string }[];
  lots?: ApiLot[];
  features?: string[];
  amenities?: string[];
  zone?: { name?: string; city?: { name?: string; slug?: string } };
  developer?: { name?: string; website?: string };
  safetyScore?: number;
  legalStatus?: string;
  accessType?: string;
  hasWater?: boolean;
  hasElectricity?: boolean;
  hasSewer?: boolean;
  hasInternet?: boolean;
  acceptsFinancing?: boolean;
  acceptsBankCredit?: boolean;
  latitude?: number;
  longitude?: number;
}

interface ProjectPageProps {
  params: { slug: string };
}

async function getProject(slug: string): Promise<ApiProject | null> {
  try {
    return await api.getProjectBySlug(slug) as unknown as ApiProject;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: ProjectPageProps) {
  const project = await getProject(params.slug);
  if (!project) return { title: 'Proyecto no encontrado' };

  return {
    title: `${project.name} - Lotes desde ${formatPrice(project.minPrice)} | PerúInversión`,
    description: project.description?.slice(0, 160) || `Conoce ${project.name}: lotes desde ${formatPrice(project.minPrice)}, ${project.minArea}m²-${project.maxArea}m² en ${project.zone?.name}, ${project.zone?.city?.name}`,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const project = await getProject(params.slug);

  if (!project) {
    notFound();
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-primary-600">Inicio</Link>
        <span>/</span>
        <Link href="/search" className="hover:text-primary-600">Terrenos</Link>
        <span>/</span>
        <Link href={`/terrenos/${project.zone?.city?.slug}`} className="hover:text-primary-600">
          {project.zone?.city?.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900">{project.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <div className="grid grid-cols-1 gap-4">
            {project.images && project.images.length > 0 ? (
              <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
                <div className="col-span-2 md:col-span-1 md:row-span-2 relative h-64 md:h-auto md:min-h-[320px]">
                  <Image
                    src={project.images[0]?.url ?? ''}
                    alt={project.name}
                    fill
                    className="object-cover"
                  />
                </div>
                {project.images.slice(1, 3).map((img, i) => (
                  <div key={i} className="hidden md:block relative h-48">
                    <Image
                      src={img.url}
                      alt={`${project.name} ${i + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 bg-gray-100 rounded-xl flex items-center justify-center">
                <span className="text-gray-400 text-lg">Sin imágenes disponibles</span>
              </div>
            )}
          </div>

          {/* Project Info */}
          <div>
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-lg text-gray-500 mt-1">
                  {project.zone?.name}, {project.zone?.city?.name} · por {project.developer?.name}
                </p>
              </div>
              {project.isFeatured && (
                <span className="bg-accent-500 text-white text-sm font-semibold px-3 py-1 rounded-lg flex-shrink-0">
                  ⭐ Destacado
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-primary-600">{formatPrice(project.minPrice)}</p>
                <p className="text-xs text-gray-500">Desde</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{project.minArea}m²</p>
                <p className="text-xs text-gray-500">Área mínima</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">{project.maxArea}m²</p>
                <p className="text-xs text-gray-500">Área máxima</p>
              </div>
              <div className="card p-4 text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {project.deliveryDate
                    ? new Date(project.deliveryDate).toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })
                    : 'Inmediata'}
                </p>
                <p className="text-xs text-gray-500">Entrega</p>
              </div>
            </div>

            {/* Safety Score */}
            <div className="card p-6 mb-6">
              <SafetyScore score={project.safetyScore ?? 0} size="lg" />
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado legal</span>
                  <span className={`font-medium ${
                    project.legalStatus === 'CLEAR' ? 'text-green-600' :
                    project.legalStatus === 'IN_PROCESS' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {project.legalStatus === 'CLEAR' ? 'Saneado' :
                     project.legalStatus === 'IN_PROCESS' ? 'En proceso' : 'Pendiente'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Acceso</span>
                  <span className="font-medium text-gray-900">
                    {project.accessType === 'PAVED' ? 'Asfaltado' :
                     project.accessType === 'UNPAVED' ? 'Trocha' : 'Sin acceso'}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            {project.description && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Descripción</h2>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 whitespace-pre-line">{project.description}</p>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">Características</h2>
              <div className="grid grid-cols-2 gap-3">
                {project.hasWater && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span> Agua potable
                  </div>
                )}
                {project.hasElectricity && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span> Electricidad
                  </div>
                )}
                {project.hasSewer && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span> Alcantarillado
                  </div>
                )}
                {project.hasInternet && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span> Internet
                  </div>
                )}
                {project.acceptsFinancing && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span> Acepta financiamiento
                  </div>
                )}
                {project.acceptsBankCredit && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">✓</span> Crédito hipotecario
                  </div>
                )}
              </div>
            </div>

            {/* Lots Table */}
            {project.lots && project.lots.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Lotes disponibles ({project.lots.filter((l) => l.status === 'AVAILABLE').length})
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-3 px-2 font-medium text-gray-600">Lote</th>
                        <th className="py-3 px-2 font-medium text-gray-600">Área</th>
                        <th className="py-3 px-2 font-medium text-gray-600">Precio</th>
                        <th className="py-3 px-2 font-medium text-gray-600">Precio/m²</th>
                        <th className="py-3 px-2 font-medium text-gray-600">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {project.lots.map((lot) => (
                        <tr key={lot.id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-2 font-medium">{lot.lotNumber}</td>
                          <td className="py-3 px-2">{lot.area}m²</td>
                          <td className="py-3 px-2 font-semibold text-primary-600">{formatPrice(lot.price)}</td>
                          <td className="py-3 px-2 text-gray-500">{formatPrice(lot.pricePerM2)}/m²</td>
                          <td className="py-3 px-2">
                            <span className={`text-xs font-medium px-2 py-1 rounded ${
                              lot.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' :
                              lot.status === 'RESERVED' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {lot.status === 'AVAILABLE' ? 'Disponible' :
                               lot.status === 'RESERVED' ? 'Reservado' : 'Vendido'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lead Form */}
          <div className="sticky top-24">
            <LeadForm projectId={project.id} projectName={project.name} />

            {/* Quick actions */}
            <div className="card p-4 mt-4 space-y-3">
              <Link
                href={`/compare?projects=${project.id}`}
                className="btn-secondary w-full text-center block"
              >
                Agregar al comparador
              </Link>
              <Link
                href={`/simulator?price=${project.minPrice}`}
                className="btn-secondary w-full text-center block"
              >
                Simular cuota
              </Link>
            </div>

            {/* Developer info */}
            {project.developer && (
              <div className="card p-4 mt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Desarrolladora</h3>
                <p className="text-gray-600 text-sm">{project.developer.name}</p>
                {project.developer.website && (
                  <a
                    href={project.developer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 text-sm hover:underline mt-1 block"
                  >
                    Visitar web →
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
