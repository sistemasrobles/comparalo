import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class SeoService {
  constructor(private prisma: PrismaService) {}

  async getPageData(path: string) {
    return this.prisma.seoPage.findUnique({ where: { path } });
  }

  async getAllPaths() {
    const [cities, zones, seoPages] = await Promise.all([
      this.prisma.city.findMany({ where: { isActive: true }, select: { slug: true } }),
      this.prisma.zone.findMany({
        where: { isActive: true },
        select: { slug: true, city: { select: { slug: true } } },
      }),
      this.prisma.seoPage.findMany({ where: { isActive: true }, select: { path: true } }),
    ]);

    const paths: string[] = [];

    // City pages
    for (const city of cities) {
      paths.push(`/terrenos/${city.slug}`);
      paths.push(`/terrenos/${city.slug}/baratos`);
      paths.push(`/terrenos/${city.slug}/cuotas`);
    }

    // Zone pages
    for (const zone of zones) {
      paths.push(`/terrenos/${zone.city.slug}/${zone.slug}`);
    }

    // Special pages
    paths.push('/terrenos/cerca-de-lima');

    // Custom SEO pages
    for (const page of seoPages) {
      if (!paths.includes(page.path)) {
        paths.push(page.path);
      }
    }

    return paths;
  }

  async getCityPageData(citySlug: string) {
    const city = await this.prisma.city.findUnique({
      where: { slug: citySlug },
      include: {
        zones: { where: { isActive: true } },
      },
    });

    if (!city) return null;

    const projects = await this.prisma.project.findMany({
      where: { cityId: city.id, isActive: true },
      include: {
        zone: true,
        developer: { select: { name: true, isVerified: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
      orderBy: { safetyScore: 'desc' },
    });

    const priceRange = await this.prisma.project.aggregate({
      where: { cityId: city.id, isActive: true },
      _min: { minPrice: true },
      _max: { maxPrice: true },
      _avg: { priceM2Min: true },
    });

    // Get custom SEO page data if exists
    const seoPage = await this.prisma.seoPage.findUnique({
      where: { path: `/terrenos/${citySlug}` },
    });

    return {
      city,
      projects,
      priceRange: {
        min: priceRange._min.minPrice,
        max: priceRange._max.maxPrice,
        avgM2: Math.round(priceRange._avg.priceM2Min || 0),
      },
      seo: seoPage || {
        title: city.seoTitle || `Terrenos en ${city.name} | ComparaLotes`,
        metaDescription: city.seoDescription || `Encuentra terrenos en ${city.name}. Compara precios y proyectos verificados.`,
        content: city.seoContent,
        faqs: null,
      },
    };
  }
}
