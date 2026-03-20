import { Controller, Post, Get, Patch, Param, Body, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('leads')
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Post()
  async create(@Body() dto: CreateLeadDto) {
    return this.leadsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('status') status?: string,
    @Query('projectId') projectId?: string,
    @Query('source') source?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.leadsService.findAll({
      status,
      projectId,
      source,
      startDate,
      endDate,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard)
  async getMetrics() {
    return this.leadsService.getMetrics();
  }

  @Get('export')
  @UseGuards(JwtAuthGuard)
  async exportCsv(@Res() res: Response) {
    const csv = await this.leadsService.exportCsv({});
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=leads.csv');
    res.send(csv);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findById(@Param('id') id: string) {
    return this.leadsService.findById(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('note') note?: string,
  ) {
    return this.leadsService.updateStatus(id, status, note);
  }

  @Post(':id/notes')
  @UseGuards(JwtAuthGuard)
  async addNote(
    @Param('id') id: string,
    @Body('note') note: string,
  ) {
    return this.leadsService.addNote(id, note);
  }
}
