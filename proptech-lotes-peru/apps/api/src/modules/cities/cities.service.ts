import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class CitiesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.city.findMany({
      where: { isActive: true },
      include: {
        zones: { where: { isActive: true } },
        _count: { select: { projects: { where: { isActive: true } } } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.city.findUnique({
      where: { slug },
      include: {
        zones: {
          where: { isActive: true },
          include: {
            _count: { select: { projects: { where: { isActive: true } } } },
          },
        },
      },
    });
  }

  async getZonesByCity(citySlug: string) {
    const city = await this.prisma.city.findUnique({ where: { slug: citySlug } });
    if (!city) return [];
    return this.prisma.zone.findMany({
      where: { cityId: city.id, isActive: true },
      include: { _count: { select: { projects: { where: { isActive: true } } } } },
    });
  }
}
