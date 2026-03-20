import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EDITOR')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // Dashboard
  @Get('dashboard')
  async getDashboard() {
    return this.adminService.getDashboard();
  }

  // Projects
  @Get('projects')
  async getProjects(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAllProjects(page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Post('projects')
  async createProject(@Body() data: any) {
    return this.adminService.createProject(data);
  }

  @Put('projects/:id')
  async updateProject(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateProject(id, data);
  }

  @Delete('projects/:id')
  async deleteProject(@Param('id') id: string) {
    return this.adminService.deleteProject(id);
  }

  @Patch('projects/:id/featured')
  async toggleFeatured(@Param('id') id: string, @Body('isFeatured') isFeatured: boolean) {
    return this.adminService.toggleFeatured(id, isFeatured);
  }

  // Cities
  @Post('cities')
  async createCity(@Body() data: any) {
    return this.adminService.createCity(data);
  }

  @Put('cities/:id')
  async updateCity(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateCity(id, data);
  }

  @Delete('cities/:id')
  async deleteCity(@Param('id') id: string) {
    return this.adminService.deleteCity(id);
  }

  // Zones
  @Post('zones')
  async createZone(@Body() data: any) {
    return this.adminService.createZone(data);
  }

  @Put('zones/:id')
  async updateZone(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateZone(id, data);
  }

  @Delete('zones/:id')
  async deleteZone(@Param('id') id: string) {
    return this.adminService.deleteZone(id);
  }

  // Developers
  @Get('developers')
  async getDevelopers() {
    return this.adminService.getAllDevelopers();
  }

  @Post('developers')
  async createDeveloper(@Body() data: any) {
    return this.adminService.createDeveloper(data);
  }

  @Put('developers/:id')
  async updateDeveloper(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateDeveloper(id, data);
  }

  // Routing Rules
  @Get('routing-rules')
  async getRoutingRules(@Query('projectId') projectId?: string) {
    return this.adminService.getRoutingRules(projectId);
  }

  @Post('routing-rules')
  async createRoutingRule(@Body() data: any) {
    return this.adminService.createRoutingRule(data);
  }

  @Put('routing-rules/:id')
  async updateRoutingRule(@Param('id') id: string, @Body() data: any) {
    return this.adminService.updateRoutingRule(id, data);
  }

  @Delete('routing-rules/:id')
  async deleteRoutingRule(@Param('id') id: string) {
    return this.adminService.deleteRoutingRule(id);
  }

  // SEO Pages
  @Get('seo-pages')
  async getSeoPages() {
    return this.adminService.getAllSeoPages();
  }

  @Post('seo-pages')
  async upsertSeoPage(@Body() data: any) {
    return this.adminService.upsertSeoPage(data);
  }
}
