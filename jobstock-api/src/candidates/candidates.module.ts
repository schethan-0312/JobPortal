import { Module } from '@nestjs/common';
import { CandidatesService } from './candidates.service.js';
import { CandidatesController } from './candidates.controller.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [EmailModule],
  providers: [CandidatesService],
  controllers: [CandidatesController],
})
export class CandidatesModule {}
