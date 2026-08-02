import { Controller, Get, Param } from '@nestjs/common';
import { LegalService } from './legal.service.js';

@Controller('legal')
export class LegalController {
  constructor(private readonly legalService: LegalService) {}

  @Get()
  listAll() {
    return this.legalService.listAll();
  }

  @Get(':slug')
  getBySlug(@Param('slug') slug: string) {
    return this.legalService.getBySlug(slug);
  }
}
