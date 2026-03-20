import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async trackEvent(eventName: string, data?: any, sessionId?: string, pageUrl?: string) {
    return this.prisma.analyticsEvent.create({
      data: {
        eventName,
        data,
        sessionId,
        pageUrl,
      },
    });
  }

  async getEvents(filters: { eventName?: string; startDate?: string; endDate?: string; limit?: number }) {
    const where: any = {};
    if (filters.eventName) where.eventName = filters.eventName;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
    }

    return this.prisma.analyticsEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
    });
  }

  async getEventSummary() {
    const summary = await this.prisma.analyticsEvent.groupBy({
      by: ['eventName'],
      _count: true,
      orderBy: { _count: { eventName: 'desc' } },
    });
    return summary;
  }
}
