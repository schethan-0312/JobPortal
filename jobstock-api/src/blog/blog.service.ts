import { Injectable, NotFoundException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePostDto } from './dto/create-post.dto.js';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  private slugify(title: string): string {
    const base = title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `${base}-${crypto.randomBytes(3).toString('hex')}`;
  }

  create(authorId: string, dto: CreatePostDto) {
    return this.prisma.blogPost.create({
      data: {
        authorId,
        title: dto.title,
        slug: this.slugify(dto.title),
        excerpt: dto.excerpt,
        body: dto.body,
        coverImageUrl: dto.coverImageUrl,
        publishedAt: new Date(),
      },
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
