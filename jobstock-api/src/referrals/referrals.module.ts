import { Module } from '@nestjs/common';
import { ReferralsService } from './referrals.service.js';
import { ReferralsController } from './referrals.controller.js';

@Module({
  providers: [ReferralsService],
  controllers: [ReferralsController],
})
export class ReferralsModule {}
