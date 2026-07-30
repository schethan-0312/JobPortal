import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service.js';
import { CandidatesController } from './candidates.controller.js';

@Module({
  providers: [CandidatesService],
  controllers: [CandidatesController],
})
export class CandidatesModule {}
