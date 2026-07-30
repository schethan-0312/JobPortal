import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { ResumeScannerService } from './resume-scanner.service.js';
import { ResumeScannerController } from './resume-scanner.controller.js';

@Module({
  imports: [AiModule],
  providers: [ResumeScannerService],
  controllers: [ResumeScannerController],
})
export class ResumeScannerModule {}
