import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadRoutingService } from './lead-routing.service';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private leadRouting: LeadRoutingService,
  ) {}

  async create(dto: CreateLeadDto) {
    if (!dto.consentGiven) {
      throw new BadRequestException('Debe aceptar las políticas de privacidad');
    }

    const lead = await this.prisma.lead.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        projectId: dto.projectId,
        budget: dto.budget,
        cityInterest: dto.cityInterest,
        paymentMethod: dto.paymentMethod as any,
        timeline: dto.timeline as any,
        comment: dto.comment,
        utmSource: dto.utmSource,
        utmMedium: dto.utmMedium,
        utmCampaign: dto.utmCampaign,
        source: dto.source || 'web',
        pageUrl: dto.pageUrl,
        consentGiven: dto.consentGiven,
      },
      include: { project: { select: { name: true, slug: true } } },
    });

    // Trigger lead routing (async, don't block response)
    this.leadRouting.routeLead(lead).catch(err => {
      console.error('Lead routing error:', err);
    });

    // Create initial event
    await this.prisma.leadEvent.create({
      data: {
        leadId: lead.id,
        type: 'CREATED',
        data: { source: dto.source, pageUrl: dto.pageUrl },
      },
    });

    return { success: true, leadId: lead.id };
  }

  async findAll(filters: {
    status?: string;
    projectId?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.source) where.source = filters.source;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    const [leads, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          project: { select: { name: true, slug: true } },
          events: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return {
      data: leads,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: {
        project: true,
        events: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async updateStatus(id: string, status: string, note?: string, createdBy?: string) {
    const lead = await this.prisma.lead.update({
      where: { id },
      data: { status: status as any },
    });

    await this.prisma.leadEvent.create({
      data: {
        leadId: id,
        type: 'STATUS_CHANGE',
        data: { newStatus: status },
        note,
        createdBy,
      },
    });

    return lead;
  }

  async addNote(id: string, note: string, createdBy?: string) {
    return this.prisma.leadEvent.create({
      data: {
        leadId: id,
        type: 'NOTE',
        note,
        createdBy,
      },
    });
  }

  async exportCsv(filters: any) {
    const leads = await this.prisma.lead.findMany({
      where: filters,
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const headers = 'ID,Nombre,Teléfono,Email,Proyecto,Presupuesto,Estado,Fuente,Fecha\n';
    const rows = leads.map(l =>
      `${l.id},${l.name},${l.phone},${l.email || ''},${(l as any).project?.name || ''},${l.budget || ''},${l.status},${l.source || ''},${l.createdAt.toISOString()}`
    ).join('\n');

    return headers + rows;
  }

  async getMetrics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalLeads, todayLeads, weekLeads, monthLeads, byStatus, bySource] = await Promise.all([
      this.prisma.lead.count(),
      this.prisma.lead.count({ where: { createdAt: { gte: today } } }),
      this.prisma.lead.count({ where: { createdAt: { gte: thisWeek } } }),
      this.prisma.lead.count({ where: { createdAt: { gte: thisMonth } } }),
      this.prisma.lead.groupBy({ by: ['status'], _count: true }),
      this.prisma.lead.groupBy({ by: ['source'], _count: true }),
    ]);

    return {
      totalLeads,
      todayLeads,
      weekLeads,
      monthLeads,
      byStatus,
      bySource,
    };
  }
}
