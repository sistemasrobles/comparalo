import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProjectsService, ProjectFilters } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Get()
  async findAll(
    @Query('city') citySlug?: string,
    @Query('zone') zoneSlug?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('minPriceM2') minPriceM2?: number,
    @Query('maxPriceM2') maxPriceM2?: number,
    @Query('minSize') minSize?: number,
    @Query('maxSize') maxSize?: number,
    @Query('maxDistance') maxDistance?: number,
    @Query('accessType') accessType?: string,
    @Query('legalStatus') legalStatus?: string,
    @Query('featured') featured?: string,
    @Query('developer') developerId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const filters: ProjectFilters = {
      citySlug,
      zoneSlug,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      minPriceM2: minPriceM2 ? Number(minPriceM2) : undefined,
      maxPriceM2: maxPriceM2 ? Number(maxPriceM2) : undefined,
      minSize: minSize ? Number(minSize) : undefined,
      maxSize: maxSize ? Number(maxSize) : undefined,
      maxDistance: maxDistance ? Number(maxDistance) : undefined,
      accessType,
      legalStatus,
      isFeatured: featured === 'true' ? true : undefined,
      developerId,
      search,
      sortBy,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 12,
    };
    return this.projectsService.findAll(filters);
  }

  @Get('featured')
  async getFeatured(@Query('limit') limit?: number) {
    return this.projectsService.getFeatured(limit ? Number(limit) : 6);
  }

  @Get('top-zones')
  async getTopZones() {
    return this.projectsService.getTopZones();
  }

  @Get('stats')
  async getStats() {
    return this.projectsService.getStats();
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.projectsService.findBySlug(slug);
  }
}
