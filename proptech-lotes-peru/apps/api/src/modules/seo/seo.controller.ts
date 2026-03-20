import { Controller, Get, Param } from '@nestjs/common';
import { SeoService } from './seo.service';

@Controller('seo')
export class SeoController {
  constructor(private seoService: SeoService) {}

  @Get('paths')
  async getAllPaths() {
    return this.seoService.getAllPaths();
  }

  @Get('page/:path')
  async getPageData(@Param('path') path: string) {
    return this.seoService.getPageData(`/${path}`);
  }

  @Get('city/:slug')
  async getCityPageData(@Param('slug') slug: string) {
    return this.seoService.getCityPageData(slug);
  }
}
