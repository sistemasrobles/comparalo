import { api } from '@/lib/api';
import { ProjectCard } from '@/components/ProjectCard';
import { formatPrice } from '@/lib/utils';
import Link from 'next/link';

interface CityPageProps {
  params: { city: string };
}

interface SeoData {
  meta?: { title?: string; description?: string };
  stats?: { avgPrice?: number; projectCount?: number; totalProjects?: number; minPrice?: number };
  content?: { intro?: string };
}

interface ProjectsData {
  data: Parameters<typeof ProjectCard>[0]['project'][];
  total?: number;
}

async function getCityData(slug: string): Promise<SeoData | null> {
  try {
    return await api.getSeoPageData(slug) as unknown as SeoData;
  } catch {
    return null;
  }
}

async function getCityProjects(citySlug: string): Promise<ProjectsData> {
  try {
    return await api.getProjects({ city: citySlug, limit: '20' }) as unknown as ProjectsData;
  } catch {
    return { data: [], total: 0 };
  }
}

export async function generateMetadata({ params }: CityPageProps) {
  const data = await getCityData(params.city);
  if (data?.meta) {
    return {
      title: data.meta.title,
      description: data.meta.description,
    };
  }
  const cityName = params.city.charAt(0).toUpperCase() + params.city.slice(1);
  return {
    title: `Terrenos en ${cityName} - Compara precios y proyectos | PerúInversión`,
    description: `Encuentra los mejores terrenos y lotes en ${cityName}, Perú. Compara precios, seguridad jurídica y proyectos verificados.`,
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const [seoData, projectsData] = await Promise.all([
    getCityData(params.city),
    getCityProjects(params.city),
  ]);

  const cityName = params.city.charAt(0).toUpperCase() + params.city.slice(1);
  const projects = projectsData.data || [];

  return (
    <main>
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-700 to-primary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-primary-200 mb-4">
            <Link href="/" className="hover:text-white">Inicio</Link>
            <span>/</span>
            <span className="text-white">Terrenos en {cityName}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Terrenos en {cityName}
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl">
            Compara {projects.length}+ proyectos de lotes en {cityName}. Precios, seguridad
            jurídica y condiciones de financiamiento verificadas.
          </p>

          {seoData?.stats && (
            <div className="mt-8 flex flex-wrap gap-8">
              <div>
                <p className="text-3xl font-bold">{seoData.stats.totalProjects || projects.length}</p>
                <p className="text-sm text-primary-200">Proyectos</p>
              </div>
              {seoData.stats.avgPrice && (
                <div>
                  <p className="text-3xl font-bold">{formatPrice(seoData.stats.avgPrice)}</p>
                  <p className="text-sm text-primary-200">Precio promedio</p>
                </div>
              )}
              {seoData.stats.minPrice && (
                <div>
                  <p className="text-3xl font-bold">{formatPrice(seoData.stats.minPrice)}</p>
                  <p className="text-sm text-primary-200">Desde</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Proyectos de lotes en {cityName}
            </h2>
            <Link href={`/search?city=${params.city}`} className="btn-secondary text-sm">
              Ver todos con filtros →
            </Link>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project: { id: string; name: string; slug: string; minPrice: number; maxPrice: number; minArea: number; maxArea: number; deliveryDate?: string; safetyScore: number; isFeatured: boolean; legalStatus: string; developer: { name: string }; zone: { name: string; city: { name: string } }; images: { url: string; isPrimary: boolean }[]; _count?: { lots: number } }) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No hay proyectos disponibles en {cityName} por el momento</p>
              <Link href="/search" className="btn-primary mt-4 inline-block">
                Buscar en otras ciudades
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* SEO Content */}
      {seoData?.content && (
        <section className="py-12 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-gray max-w-none" dangerouslySetInnerHTML={{ __html: seoData.content }} />
          </div>
        </section>
      )}

      {/* FAQ / CTA */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Preguntas frecuentes sobre terrenos en {cityName}
          </h2>
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Cuánto cuesta un terreno en {cityName}?
              </h3>
              <p className="text-gray-600 text-sm">
                Los precios de terrenos en {cityName} varían según la zona, el tamaño y los
                servicios disponibles. En PerúInversión puedes comparar precios desde diferentes
                desarrolladoras para encontrar la mejor opción.
              </p>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Es seguro comprar terrenos en {cityName}?
              </h3>
              <p className="text-gray-600 text-sm">
                Verificamos el estado legal de cada proyecto. Busca proyectos con puntaje de
                seguridad alto (80+) y estado legal &quot;Saneado&quot; para mayor tranquilidad.
              </p>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-2">
                ¿Puedo financiar la compra de un terreno?
              </h3>
              <p className="text-gray-600 text-sm">
                Muchos proyectos ofrecen financiamiento directo. Usa nuestro simulador de cuotas
                para calcular tu capacidad de pago y encontrar proyectos que se ajusten a tu
                presupuesto.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
