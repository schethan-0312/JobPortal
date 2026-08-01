import { Module } from '@nestjs/common';
import { SupportService } from './support.service.js';
import { SupportController } from './support.controller.js';

@Module({
  providers: [SupportService],
  controllers: [SupportController],
})
export class SupportModule {}
