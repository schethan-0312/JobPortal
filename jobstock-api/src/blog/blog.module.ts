import { Module } from '@nestjs/common';
import { BlogService } from './blog.service.js';
import { BlogController } from './blog.controller.js';

@Module({
  providers: [BlogService],
  controllers: [BlogController],
})
export class BlogModule {}
