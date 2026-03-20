import { Controller, Post, Body } from '@nestjs/common';
import { CompareService } from './compare.service';

@Controller('compare')
export class CompareController {
  constructor(private compareService: CompareService) {}

  @Post()
  async compare(@Body('slugs') slugs: string[]) {
    return this.compareService.compare(slugs);
  }
}
