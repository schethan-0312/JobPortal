import { Module } from '@nestjs/common';
import { SeoService } from './seo.service.js';
import { SeoController } from './seo.controller.js';
import { SystemConfigModule } from '../system-config/system-config.module.js';

@Module({
  imports: [SystemConfigModule],
  providers: [SeoService],
  controllers: [SeoController],
})
export class SeoModule {}
