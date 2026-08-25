import { Module } from '@nestjs/common';
import { AdminTokensController } from './admin-tokens.controller.js';
import { AdminTokensService } from './admin-tokens.service.js';

@Module({
  controllers: [AdminTokensController],
  providers: [AdminTokensService],
})
export class AdminTokensModule {}
