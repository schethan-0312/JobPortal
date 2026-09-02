import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';

import { EmailService } from '../email/email.service.js';

@Injectable()
export class BlogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService
  ) {}

  private slugify(title: string): string {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${base}-${crypto.randomBytes(3).toString('hex')}`;
  }

  async create(authorId: string, dto: CreatePostDto) {
    const isPublished = dto.status === 'published';
    const publishedAt = isPublished ? new Date() : null;

    const blogPost = await this.prisma.blogPost.create({
      data: {
        authorId,
        customAuthorName: dto.author,
        title: dto.title,
        slug: this.slugify(dto.title),
        excerpt: dto.excerpt,
        body: dto.body,
        coverImageUrl: dto.coverImageUrl,
        category: dto.category,
        servicePageLink: dto.servicePageLink,
        readTimeMinutes: dto.readTimeMinutes,
        seoTitle: dto.seoTitle,
        seoKeywords: dto.seoKeywords,
        seoDescription: dto.seoDescription,
        images: dto.images || [],
        publishedAt,
      },
    });

    // Notify all candidates and employers asynchronously
    this.notifyUsersOfNewBlog(blogPost.title, blogPost.slug).catch(err => {
      console.error('Error notifying users of new blog:', err);
    });

    return blogPost;
  }

  private async notifyUsersOfNewBlog(title: string, slug: string) {
    const users = await this.prisma.user.findMany({
      where: {
        role: { in: ['CANDIDATE', 'EMPLOYER'] }
      },
      select: { email: true }
    });

    for (const user of users) {
      await this.emailService.sendNewBlogPost(user.email, title, slug);
    }
  }

  async update(id: string, dto: any) {
    let publishedAt: Date | null | undefined = undefined;
    if (dto.status === 'published') {
      publishedAt = new Date();
    } else if (dto.status === 'draft') {
      publishedAt = null;
    }

    const data: any = { ...dto };
    delete data.status;
    if (data.author !== undefined) {
      data.customAuthorName = data.author;
      delete data.author;
    }
    if (publishedAt !== undefined) {
      data.publishedAt = publishedAt;
    }

    // slug could be updated if title changes, but to keep it simple we won't change slug on update unless specified.
    
    return this.prisma.blogPost.update({
      where: { id },
      data,
    });
  }

  async listPublished(params: { page: number; pageSize: number }) {
    const where = { publishedAt: { not: null } };
    const [items, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy: { publishedAt: 'desc' },
        include: { author: { select: { email: true } } },
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
      include: { author: { select: { email: true } } },
    });
    if (!post || !post.publishedAt) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }
}
