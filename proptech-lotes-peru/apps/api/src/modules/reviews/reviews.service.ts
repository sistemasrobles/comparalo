import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { projectId: string; authorName: string; authorEmail?: string; type: string; rating: number; title?: string; comment: string }) {
    return this.prisma.review.create({
      data: {
        projectId: data.projectId,
        authorName: data.authorName,
        authorEmail: data.authorEmail,
        type: data.type as any,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        status: 'PENDIENTE',
      },
    });
  }

  async findByProject(projectId: string) {
    return this.prisma.review.findMany({
      where: { projectId, status: 'APROBADO' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async moderate(id: string, status: 'APROBADO' | 'RECHAZADO') {
    return this.prisma.review.update({
      where: { id },
      data: { status },
    });
  }

  async getPending() {
    return this.prisma.review.findMany({
      where: { status: 'PENDIENTE' },
      include: { project: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }
}
