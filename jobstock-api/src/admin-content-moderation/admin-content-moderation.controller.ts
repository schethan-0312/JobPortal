import { Body, Controller, Delete, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import type { Request } from 'express';
import { AdminContentModerationService } from './admin-content-moderation.service.js';
import { ClearEmployerContentDto } from './dto/clear-employer-content.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

class SetPublishedDto {
  @IsBoolean()
  published!: boolean;
}

@Controller('admin/content-moderation')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminContentModerationController {
  constructor(private readonly contentService: AdminContentModerationService) {}

  @Get('blog-posts')
  listBlogPosts(@Query('search') search?: string, @Query('page') page = '1', @Query('pageSize') pageSize = '25') {
    return this.contentService.listBlogPosts({
      search,
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(100, Math.max(1, parseInt(pageSize, 10) || 25)),
    });
  }

  @Get('blog-posts/:id')
  getBlogPost(@Param('id') id: string) {
    return this.contentService.getBlogPost(id);
  }

  @Patch('blog-posts/:id/published')
  setPublished(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SetPublishedDto,
    @Req() req: Request,
  ) {
    return this.contentService.setPostPublished(user.userId, id, dto.published, req.ip);
  }

  @Delete('blog-posts/:id')
  deletePost(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Req() req: Request) {
    return this.contentService.deletePost(user.userId, id, req.ip);
  }

  @Patch('employers/:id/clear-content')
  clearEmployerContent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ClearEmployerContentDto,
    @Req() req: Request,
  ) {
    return this.contentService.clearEmployerContent(user.userId, id, dto, req.ip);
  }
}
