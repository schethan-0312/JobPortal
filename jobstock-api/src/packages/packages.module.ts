import { Module } from '@nestjs/common';
import { PackagesService } from './packages.service.js';
import { PackagesController } from './packages.controller.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [EmailModule],
  providers: [PackagesService],
  controllers: [PackagesController],
})
export class PackagesModule {}
