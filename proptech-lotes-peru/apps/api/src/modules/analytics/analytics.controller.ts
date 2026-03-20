import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('event')
  async trackEvent(@Body() body: { eventName: string; data?: any; sessionId?: string; pageUrl?: string }) {
    return this.analyticsService.trackEvent(body.eventName, body.data, body.sessionId, body.pageUrl);
  }

  @Get('events')
  @UseGuards(JwtAuthGuard)
  async getEvents(
    @Query('eventName') eventName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    return this.analyticsService.getEvents({ eventName, startDate, endDate, limit: limit ? Number(limit) : 100 });
  }

  @Get('summary')
  @UseGuards(JwtAuthGuard)
  async getSummary() {
    return this.analyticsService.getEventSummary();
  }
}
