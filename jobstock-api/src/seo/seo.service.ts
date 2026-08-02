import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SystemConfigService } from '../system-config/system-config.service.js';

@Injectable()
export class SeoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly systemConfig: SystemConfigService,
  ) {}

  async getForPath(path: string) {
    const [override, defaultTitle, defaultDescription] = await Promise.all([
      this.prisma.seoSetting.findUnique({ where: { path } }),
      this.systemConfig.get('seoDefaultTitle'),
      this.systemConfig.get('seoDefaultDescription'),
    ]);

    return {
      path,
      metaTitle: override?.metaTitle || defaultTitle,
      metaDescription: override?.metaDescription || defaultDescription,
      ogImageUrl: override?.ogImageUrl ?? null,
    };
  }

  async getRobotsTxt() {
    return this.systemConfig.get('seoRobotsTxt');
  }
}
