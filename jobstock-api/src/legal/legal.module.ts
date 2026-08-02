import { Module } from '@nestjs/common';
import { LegalService } from './legal.service.js';
import { LegalController } from './legal.controller.js';

@Module({
  providers: [LegalService],
  controllers: [LegalController],
  exports: [LegalService],
})
export class LegalModule {}
