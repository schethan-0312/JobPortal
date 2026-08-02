import { Controller, Get, Header, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { SeoService } from './seo.service.js';

@Controller()
export class SeoController {
  constructor(private readonly seoService: SeoService) {}

  @Get('seo/page')
  getForPath(@Query('path') path?: string) {
    return this.seoService.getForPath(path || '/');
  }

  // Served under the API's own prefix (this is a separate service from the
  // Next.js frontend, which is what actually needs to expose /robots.txt at
  // the site root) — the frontend fetches this content and serves it there.
  @Get('seo/robots-txt')
  @Header('Content-Type', 'text/plain')
  async robotsTxt(@Res() res: Response) {
    const content = await this.seoService.getRobotsTxt();
    res.send(content);
  }
}
