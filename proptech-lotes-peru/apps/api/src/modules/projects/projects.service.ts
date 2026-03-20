import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';
import { Prisma } from '@prisma/client';

export interface ProjectFilters {
  citySlug?: string;
  zoneSlug?: string;
  minPrice?: number;
  maxPrice?: number;
  minPriceM2?: number;
  maxPriceM2?: number;
  minSize?: number;
  maxSize?: number;
  minDownPayment?: number;
  maxDownPayment?: number;
  minMonthlyPayment?: number;
  maxMonthlyPayment?: number;
  accessType?: string;
  legalStatus?: string;
  maxDistance?: number;
  services?: string[];
  isFeatured?: boolean;
  developerId?: string;
  search?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(filters: ProjectFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 12;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.ProjectWhereInput = {
      isActive: true,
    };

    if (filters.citySlug) {
      where.city = { slug: filters.citySlug };
    }
    if (filters.zoneSlug) {
      where.zone = { slug: filters.zoneSlug };
    }
    if (filters.minPrice || filters.maxPrice) {
      where.minPrice = {};
      if (filters.minPrice) where.minPrice.gte = filters.minPrice;
      if (filters.maxPrice) where.minPrice.lte = filters.maxPrice;
    }
    if (filters.minPriceM2 || filters.maxPriceM2) {
      where.priceM2Min = {};
      if (filters.minPriceM2) where.priceM2Min.gte = filters.minPriceM2;
      if (filters.maxPriceM2) where.priceM2Min.lte = filters.maxPriceM2;
    }
    if (filters.minSize || filters.maxSize) {
      where.lotSizeMin = {};
      if (filters.minSize) where.lotSizeMin.gte = filters.minSize;
      if (filters.maxSize) where.lotSizeMin.lte = filters.maxSize;
    }
    if (filters.maxDistance) {
      where.distanceToCityCenterKm = { lte: filters.maxDistance };
    }
    if (filters.accessType) {
      where.accessType = filters.accessType as any;
    }
    if (filters.legalStatus) {
      where.legalStatus = filters.legalStatus as any;
    }
    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }
    if (filters.developerId) {
      where.developerId = filters.developerId;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { addressText: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Build order
    let orderBy: Prisma.ProjectOrderByWithRelationInput = { createdAt: 'desc' };
    switch (filters.sortBy) {
      case 'price-asc':
        orderBy = { minPrice: 'asc' };
        break;
      case 'price-desc':
        orderBy = { minPrice: 'desc' };
        break;
      case 'price-m2':
        orderBy = { priceM2Min: 'asc' };
        break;
      case 'distance':
        orderBy = { distanceToCityCenterKm: 'asc' };
        break;
      case 'safety':
        orderBy = { safetyScore: 'desc' };
        break;
      case 'featured':
        orderBy = { isFeatured: 'desc' };
        break;
    }

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          city: true,
          zone: true,
          developer: { select: { id: true, name: true, slug: true, isVerified: true, yearsActive: true } },
          images: { where: { isPrimary: true }, take: 1 },
          _count: { select: { reviews: { where: { status: 'APROBADO' } }, lots: { where: { status: 'DISPONIBLE' } } } },
        },
      }),
      this.prisma.project.count({ where }),
    ]);

    return {
      data: projects,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    // Try cache first
    const cached = await this.redis.getJson(`project:${slug}`);
    if (cached) return cached;

    const project = await this.prisma.project.findUnique({
      where: { slug },
      include: {
        city: true,
        zone: true,
        developer: true,
        images: { orderBy: { order: 'asc' } },
        lots: { orderBy: { code: 'asc' } },
        legalDocuments: true,
        reviews: {
          where: { status: 'APROBADO' },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            reviews: { where: { status: 'APROBADO' } },
            lots: { where: { status: 'DISPONIBLE' } },
            leads: true,
          },
        },
      },
    });

    if (project) {
      // Increment view count
      await this.prisma.project.update({
        where: { id: project.id },
        data: { viewCount: { increment: 1 } },
      });
      // Cache for 5 minutes
      await this.redis.setJson(`project:${slug}`, project, 300);
    }

    return project;
  }

  async getFeatured(limit = 6) {
    const cached = await this.redis.getJson('projects:featured');
    if (cached) return cached;

    const projects = await this.prisma.project.findMany({
      where: { isActive: true, isFeatured: true },
      take: limit,
      orderBy: { safetyScore: 'desc' },
      include: {
        city: true,
        zone: true,
        developer: { select: { id: true, name: true, slug: true, isVerified: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    });

    await this.redis.setJson('projects:featured', projects, 600);
    return projects;
  }

  async getTopZones() {
    const zones = await this.prisma.zone.findMany({
      where: { isActive: true },
      include: {
        city: true,
        _count: { select: { projects: { where: { isActive: true } } } },
      },
      orderBy: { projects: { _count: 'desc' } },
      take: 6,
    });
    return zones;
  }

  async getStats() {
    const [totalProjects, totalCities, totalDevelopers, priceRange] = await Promise.all([
      this.prisma.project.count({ where: { isActive: true } }),
      this.prisma.city.count({ where: { isActive: true } }),
      this.prisma.developer.count(),
      this.prisma.project.aggregate({
        where: { isActive: true },
        _min: { minPrice: true },
        _max: { maxPrice: true },
      }),
    ]);

    return {
      totalProjects,
      totalCities,
      totalDevelopers,
      minPrice: priceRange._min.minPrice,
      maxPrice: priceRange._max.maxPrice,
    };
  }
}
