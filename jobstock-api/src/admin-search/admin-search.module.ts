import { Module } from '@nestjs/common';
import { AdminSearchService } from './admin-search.service.js';
import { AdminSearchController } from './admin-search.controller.js';

@Module({
  providers: [AdminSearchService],
  controllers: [AdminSearchController],
})
export class AdminSearchModule {}
