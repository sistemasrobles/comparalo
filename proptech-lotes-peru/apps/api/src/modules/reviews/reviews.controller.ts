import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Post()
  async create(@Body() data: { projectId: string; authorName: string; authorEmail?: string; type: string; rating: number; title?: string; comment: string }) {
    return this.reviewsService.create(data);
  }

  @Get('project/:projectId')
  async findByProject(@Param('projectId') projectId: string) {
    return this.reviewsService.findByProject(projectId);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard)
  async getPending() {
    return this.reviewsService.getPending();
  }

  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard)
  async moderate(@Param('id') id: string, @Body('status') status: 'APROBADO' | 'RECHAZADO') {
    return this.reviewsService.moderate(id, status);
  }
}
