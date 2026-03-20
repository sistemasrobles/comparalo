import { Controller, Get, Param } from '@nestjs/common';
import { CitiesService } from './cities.service';

@Controller('cities')
export class CitiesController {
  constructor(private citiesService: CitiesService) {}

  @Get()
  async findAll() {
    return this.citiesService.findAll();
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.citiesService.findBySlug(slug);
  }

  @Get(':slug/zones')
  async getZones(@Param('slug') slug: string) {
    return this.citiesService.getZonesByCity(slug);
  }
}
