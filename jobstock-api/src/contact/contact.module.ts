import { Module } from '@nestjs/common';
import { ContactService } from './contact.service.js';
import { ContactController } from './contact.controller.js';

@Module({
  providers: [ContactService],
  controllers: [ContactController],
})
export class ContactModule {}
