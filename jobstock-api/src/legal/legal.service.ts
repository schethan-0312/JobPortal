import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class LegalService {
  constructor(private readonly prisma: PrismaService) {}

  async getBySlug(slug: string) {
    const doc = await this.prisma.legalDocument.findUnique({ where: { slug } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  listAll() {
    return this.prisma.legalDocument.findMany({
      select: { slug: true, title: true, version: true, updatedAt: true },
      orderBy: { slug: 'asc' },
    });
  }
}
