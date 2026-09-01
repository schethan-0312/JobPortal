import { Controller, Post, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AiService } from './ai.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { Role } from '../../generated/prisma/enums.js';
import { getCapacityConfig } from '../config/capacity.config.js';

@Controller('admin/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('blog-from-document')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: Number.parseInt(getCapacityConfig().ai.documentUploadLimit, 10) * 1024 * 1024 } }))
  async generateBlogFromDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.aiService.extractBlogFromDocument(file);
  }
}
