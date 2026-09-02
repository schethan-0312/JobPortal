import { Module } from '@nestjs/common';
import { BlogService } from './blog.service.js';
import { BlogController } from './blog.controller.js';

import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [EmailModule],
  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
