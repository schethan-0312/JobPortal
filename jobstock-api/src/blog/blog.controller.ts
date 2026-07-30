import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { BlogService } from './blog.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('blog')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePostDto) {
    return this.blogService.create(user.userId, dto);
  }

  @Get()
  listPublished(@Query('page') page = '1', @Query('pageSize') pageSize = '10') {
    return this.blogService.listPublished({
      page: Math.max(1, parseInt(page, 10) || 1),
      pageSize: Math.min(50, Math.max(1, parseInt(pageSize, 10) || 10)),
    });
  }

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }
}
