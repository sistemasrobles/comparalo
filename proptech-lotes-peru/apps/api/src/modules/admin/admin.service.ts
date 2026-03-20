import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ===== PROJECTS CRUD =====
  async createProject(data: any) {
    return this.prisma.project.create({ data, include: { city: true, zone: true, developer: true } });
  }

  async updateProject(id: string, data: any) {
    return this.prisma.project.update({ where: { id }, data, include: { city: true, zone: true, developer: true } });
  }

  async deleteProject(id: string) {
    return this.prisma.project.update({ where: { id }, data: { isActive: false } });
  }

  async getAllProjects(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: { city: true, zone: true, developer: { select: { name: true } }, _count: { select: { leads: true, reviews: true } } },
      }),
      this.prisma.project.count(),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  // ===== CITIES CRUD =====
  async createCity(data: any) {
    return this.prisma.city.create({ data });
  }

  async updateCity(id: string, data: any) {
    return this.prisma.city.update({ where: { id }, data });
  }

  async deleteCity(id: string) {
    return this.prisma.city.update({ where: { id }, data: { isActive: false } });
  }

  // ===== ZONES CRUD =====
  async createZone(data: any) {
    return this.prisma.zone.create({ data });
  }

  async updateZone(id: string, data: any) {
    return this.prisma.zone.update({ where: { id }, data });
  }

  async deleteZone(id: string) {
    return this.prisma.zone.update({ where: { id }, data: { isActive: false } });
  }

  // ===== DEVELOPERS CRUD =====
  async createDeveloper(data: any) {
    return this.prisma.developer.create({ data });
  }

  async updateDeveloper(id: string, data: any) {
    return this.prisma.developer.update({ where: { id }, data });
  }

  async getAllDevelopers() {
    return this.prisma.developer.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { projects: true } } } });
  }

  // ===== ROUTING RULES =====
  async createRoutingRule(data: any) {
    return this.prisma.routingRule.create({ data });
  }

  async updateRoutingRule(id: string, data: any) {
    return this.prisma.routingRule.update({ where: { id }, data });
  }

  async deleteRoutingRule(id: string) {
    return this.prisma.routingRule.delete({ where: { id } });
  }

  async getRoutingRules(projectId?: string) {
    const where: any = {};
    if (projectId) where.projectId = projectId;
    return this.prisma.routingRule.findMany({ where, include: { project: { select: { name: true } } } });
  }

  // ===== FEATURED MANAGEMENT =====
  async toggleFeatured(projectId: string, isFeatured: boolean) {
    return this.prisma.project.update({ where: { id: projectId }, data: { isFeatured } });
  }

  // ===== DASHBOARD METRICS =====
  async getDashboard() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProjects, activeProjects, totalLeads, todayLeads, monthLeads,
      totalDevelopers, totalReviews, pendingReviews,
      leadsByProject, leadsBySource,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.count({ where: { isActive: true } }),
      this.prisma.lead.count(),
      this.prisma.lead.count({ where: { createdAt: { gte: today } } }),
      this.prisma.lead.count({ where: { createdAt: { gte: thisMonth } } }),
      this.prisma.developer.count(),
      this.prisma.review.count(),
      this.prisma.review.count({ where: { status: 'PENDIENTE' } }),
      this.prisma.lead.groupBy({
        by: ['projectId'],
        _count: true,
        orderBy: { _count: { projectId: 'desc' } },
        take: 10,
      }),
      this.prisma.lead.groupBy({ by: ['source'], _count: true }),
    ]);

    return {
      totalProjects, activeProjects, totalLeads, todayLeads, monthLeads,
      totalDevelopers, totalReviews, pendingReviews,
      leadsByProject, leadsBySource,
    };
  }

  // ===== SEO PAGES =====
  async getAllSeoPages() {
    return this.prisma.seoPage.findMany({ orderBy: { path: 'asc' } });
  }

  async upsertSeoPage(data: any) {
    return this.prisma.seoPage.upsert({
      where: { path: data.path },
      create: data,
      update: data,
    });
  }
}
