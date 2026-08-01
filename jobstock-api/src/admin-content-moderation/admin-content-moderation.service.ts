import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { AuditTargetType } from '../../generated/prisma/enums.js';
import { ClearEmployerContentDto } from './dto/clear-employer-content.dto.js';

@Injectable()
export class AdminContentModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async listBlogPosts(params: { search?: string; page: number; pageSize: number }) {
    const where = params.search
      ? { title: { contains: params.search, mode: 'insensitive' as const } }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        include: { author: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.blogPost.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async setPostPublished(actorId: string, postId: string, published: boolean, ip?: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    const updated = await this.prisma.blogPost.update({
      where: { id: postId },
      data: { publishedAt: published ? new Date() : null },
    });

    await this.auditLog.log({
      adminId: actorId,
      action: published ? 'BLOG_POST_PUBLISHED' : 'BLOG_POST_UNPUBLISHED',
      targetType: AuditTargetType.CONFIG,
      targetId: postId,
      metadata: { title: post.title },
      ipAddress: ip,
    });

    return updated;
  }

  async deletePost(actorId: string, postId: string, ip?: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Blog post not found');
    }

    await this.prisma.blogPost.delete({ where: { id: postId } });

    await this.auditLog.log({
      adminId: actorId,
      action: 'BLOG_POST_DELETED',
      targetType: AuditTargetType.CONFIG,
      targetId: postId,
      reason: `Title: ${post.title}`,
      ipAddress: ip,
    });

    return { success: true };
  }

  async clearEmployerContent(actorId: string, employerId: string, dto: ClearEmployerContentDto, ip?: string) {
    const employer = await this.prisma.employer.findUnique({ where: { id: employerId } });
    if (!employer) {
      throw new NotFoundException('Employer not found');
    }

    const data: Record<string, null> = {};
    for (const field of dto.fields) {
      data[field] = null;
    }

    const updated = await this.prisma.employer.update({ where: { id: employerId }, data });

    await this.auditLog.log({
      adminId: actorId,
      action: 'EMPLOYER_CONTENT_CLEARED',
      targetType: AuditTargetType.EMPLOYER,
      targetId: employerId,
      reason: dto.reason,
      metadata: { fields: dto.fields },
      ipAddress: ip,
    });

    return updated;
  }
}
