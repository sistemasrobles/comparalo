import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface AffordabilityInput {
  totalBudget?: number;
  downPayment?: number;
  monthlyPayment?: number;
  termMonths?: number;
  citySlug?: string;
}

export interface ValorizationInput {
  zoneSlug: string;
  horizonMonths: number; // 12, 24, 36
}

@Injectable()
export class SimulatorService {
  constructor(private prisma: PrismaService) {}

  async calculateAffordability(input: AffordabilityInput) {
    const where: any = { isActive: true };

    if (input.citySlug) {
      where.city = { slug: input.citySlug };
    }

    // Calculate effective budget
    let effectiveBudget = input.totalBudget || 0;
    if (!effectiveBudget && input.downPayment && input.monthlyPayment && input.termMonths) {
      effectiveBudget = input.downPayment + (input.monthlyPayment * input.termMonths);
    }

    if (effectiveBudget > 0) {
      where.minPrice = { lte: effectiveBudget };
    }

    if (input.downPayment) {
      where.downPaymentMin = { lte: input.downPayment };
    }

    if (input.monthlyPayment) {
      where.monthlyPaymentEst = { lte: input.monthlyPayment };
    }

    const projects = await this.prisma.project.findMany({
      where,
      orderBy: [
        { safetyScore: 'desc' },
        { minPrice: 'asc' },
      ],
      take: 10,
      include: {
        city: true,
        zone: true,
        developer: { select: { id: true, name: true, slug: true, isVerified: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    // Generate recommendations with scoring
    const recommendations = projects.map(project => {
      let score = 0;
      const reasons: string[] = [];

      // Price fit score (0-30)
      if (effectiveBudget > 0) {
        const priceFit = 1 - (project.minPrice / effectiveBudget);
        score += Math.max(0, Math.min(30, priceFit * 30));
        if (project.minPrice <= effectiveBudget * 0.7) {
          reasons.push('Precio cómodo dentro de tu presupuesto');
        } else {
          reasons.push('Precio ajustado a tu presupuesto');
        }
      }

      // Safety score (0-25)
      const safety = (project.safetyScore || 0) / 100 * 25;
      score += safety;
      if ((project.safetyScore || 0) >= 80) {
        reasons.push('Alta seguridad legal y de servicios');
      }

      // Down payment fit (0-20)
      if (input.downPayment && project.downPaymentMin) {
        if (input.downPayment >= project.downPaymentMin) {
          score += 20;
          reasons.push('Tu inicial cubre el mínimo requerido');
        }
      }

      // Monthly payment fit (0-15)
      if (input.monthlyPayment && project.monthlyPaymentEst) {
        if (input.monthlyPayment >= project.monthlyPaymentEst) {
          score += 15;
          reasons.push('Cuota mensual dentro de tu capacidad');
        }
      }

      // Valorization bonus (0-10)
      if (project.valorizationEstimate && project.valorizationEstimate > 8) {
        score += 10;
        reasons.push(`Valorización estimada de ${project.valorizationEstimate}% anual`);
      }

      return {
        project,
        score: Math.round(score),
        reasons,
      };
    });

    recommendations.sort((a, b) => b.score - a.score);

    return {
      input: {
        totalBudget: effectiveBudget,
        downPayment: input.downPayment,
        monthlyPayment: input.monthlyPayment,
        termMonths: input.termMonths,
      },
      totalResults: recommendations.length,
      recommendations,
    };
  }

  async calculateValorization(input: ValorizationInput) {
    // Get zone data
    const zone = await this.prisma.zone.findUnique({
      where: { slug: input.zoneSlug },
      include: {
        city: true,
        projects: {
          where: { isActive: true },
          select: {
            priceM2Min: true,
            priceM2Max: true,
            valorizationEstimate: true,
          },
        },
      },
    });

    if (!zone) {
      return { error: 'Zona no encontrada' };
    }

    // Calculate average metrics from projects in zone
    const projects = zone.projects;
    const avgPriceM2 = projects.reduce((sum, p) => sum + (p.priceM2Min || 0), 0) / (projects.length || 1);
    const avgValorization = projects.reduce((sum, p) => sum + (p.valorizationEstimate || 5), 0) / (projects.length || 1);

    // Valorization model (simplified - document assumptions)
    // Base annual rate from zone average
    const annualRate = avgValorization / 100;
    const months = input.horizonMonths;
    const years = months / 12;

    // Compound growth
    const growthFactor = Math.pow(1 + annualRate, years);
    const estimatedPriceM2 = avgPriceM2 * growthFactor;

    // Conservative and optimistic ranges
    const conservativeRate = annualRate * 0.6;
    const optimisticRate = annualRate * 1.4;
    const conservativePrice = avgPriceM2 * Math.pow(1 + conservativeRate, years);
    const optimisticPrice = avgPriceM2 * Math.pow(1 + optimisticRate, years);

    return {
      zone: { name: zone.name, city: zone.city.name },
      currentAvgPriceM2: Math.round(avgPriceM2),
      horizonMonths: months,
      estimates: {
        conservative: {
          priceM2: Math.round(conservativePrice),
          totalGrowth: `${((conservativePrice / avgPriceM2 - 1) * 100).toFixed(1)}%`,
          annualRate: `${(conservativeRate * 100).toFixed(1)}%`,
        },
        expected: {
          priceM2: Math.round(estimatedPriceM2),
          totalGrowth: `${((estimatedPriceM2 / avgPriceM2 - 1) * 100).toFixed(1)}%`,
          annualRate: `${(annualRate * 100).toFixed(1)}%`,
        },
        optimistic: {
          priceM2: Math.round(optimisticPrice),
          totalGrowth: `${((optimisticPrice / avgPriceM2 - 1) * 100).toFixed(1)}%`,
          annualRate: `${(optimisticRate * 100).toFixed(1)}%`,
        },
      },
      disclaimer: 'Esta estimación se basa en datos históricos y promedios de la zona. No constituye una garantía de rentabilidad. Los valores reales pueden variar significativamente según condiciones del mercado, regulaciones y factores económicos.',
      methodology: 'Cálculo basado en tasa de valorización promedio de proyectos activos en la zona, con rangos conservador (60% de la tasa base) y optimista (140% de la tasa base). Se usa crecimiento compuesto.',
      dataPoints: projects.length,
    };
  }
}
