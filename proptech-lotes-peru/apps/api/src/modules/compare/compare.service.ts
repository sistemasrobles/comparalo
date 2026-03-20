import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CompareService {
  constructor(private prisma: PrismaService) {}

  async compare(slugs: string[]) {
    if (!slugs || slugs.length < 2 || slugs.length > 4) {
      throw new BadRequestException('Debe seleccionar entre 2 y 4 proyectos para comparar');
    }

    const projects = await this.prisma.project.findMany({
      where: { slug: { in: slugs }, isActive: true },
      include: {
        city: true,
        zone: true,
        developer: { select: { id: true, name: true, slug: true, isVerified: true, yearsActive: true } },
        images: { where: { isPrimary: true }, take: 1 },
        _count: {
          select: {
            reviews: { where: { status: 'APROBADO' } },
            lots: { where: { status: 'DISPONIBLE' } },
          },
        },
      },
    });

    if (projects.length < 2) {
      throw new BadRequestException('No se encontraron suficientes proyectos para comparar');
    }

    // Normalize comparison data
    const comparisonFields = projects.map((p: any) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      image: p.images[0]?.url || null,
      developer: p.developer.name,
      developerVerified: p.developer.isVerified,
      city: p.city.name,
      zone: p.zone.name,
      priceRange: `S/${p.minPrice.toLocaleString()} - S/${p.maxPrice.toLocaleString()}`,
      minPrice: p.minPrice,
      maxPrice: p.maxPrice,
      priceM2Range: p.priceM2Min && p.priceM2Max
        ? `S/${p.priceM2Min} - S/${p.priceM2Max}/m²`
        : 'No disponible',
      priceM2Min: p.priceM2Min,
      lotSizes: p.lotSizeMin && p.lotSizeMax
        ? `${p.lotSizeMin} - ${p.lotSizeMax} m²`
        : 'No disponible',
      downPayment: p.downPaymentMin
        ? `Desde S/${p.downPaymentMin.toLocaleString()}`
        : 'Consultar',
      monthlyPayment: p.monthlyPaymentEst
        ? `Desde S/${p.monthlyPaymentEst.toLocaleString()}/mes`
        : 'Consultar',
      termMonths: p.termMonthsEst ? `${p.termMonthsEst} meses` : 'Consultar',
      distance: p.distanceToCityCenterKm
        ? `${p.distanceToCityCenterKm} km`
        : 'No disponible',
      accessType: p.accessType || 'No especificado',
      legalStatus: p.legalStatus,
      safetyScore: p.safetyScore || 0,
      services: p.services || {},
      valorizationEstimate: p.valorizationEstimate
        ? `${p.valorizationEstimate}% anual`
        : 'No disponible',
      availableLots: p._count.lots,
      reviewCount: p._count.reviews,
    }));

    return {
      projects: comparisonFields,
      comparedAt: new Date().toISOString(),
    };
  }
}
