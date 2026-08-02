import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { AuditTargetType } from '../../generated/prisma/enums.js';
import { UpsertLegalDocumentDto } from './dto/upsert-legal-document.dto.js';

@Injectable()
export class AdminLegalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  listAll() {
    return this.prisma.legalDocument.findMany({ orderBy: { slug: 'asc' } });
  }

  async getBySlug(slug: string) {
    const doc = await this.prisma.legalDocument.findUnique({ where: { slug } });
    if (!doc) {
      throw new NotFoundException('Document not found');
    }
    return doc;
  }

  async upsert(actorId: string, slug: string, dto: UpsertLegalDocumentDto, ip?: string) {
    const existing = await this.prisma.legalDocument.findUnique({ where: { slug } });
    const nextVersion = (existing?.version ?? 0) + 1;

    const [doc] = await this.prisma.$transaction([
      this.prisma.legalDocument.upsert({
        where: { slug },
        create: { slug, title: dto.title, body: dto.body, version: 1, updatedById: actorId },
        update: { title: dto.title, body: dto.body, version: nextVersion, updatedById: actorId },
      }),
      this.prisma.legalDocumentRevision.create({
        data: { slug, version: nextVersion, title: dto.title, body: dto.body, updatedById: actorId },
      }),
    ]);

    await this.auditLog.log({
      adminId: actorId,
      action: existing ? 'LEGAL_DOCUMENT_UPDATED' : 'LEGAL_DOCUMENT_CREATED',
      targetType: AuditTargetType.CONFIG,
      targetId: slug,
      metadata: { version: nextVersion },
      ipAddress: ip,
    });

    return doc;
  }

  async listRevisions(slug: string) {
    return this.prisma.legalDocumentRevision.findMany({
      where: { slug },
      orderBy: { version: 'desc' },
      select: { id: true, version: true, title: true, updatedById: true, createdAt: true },
    });
  }

  async getRevision(slug: string, version: number) {
    const revision = await this.prisma.legalDocumentRevision.findFirst({ where: { slug, version } });
    if (!revision) {
      throw new NotFoundException('Revision not found');
    }
    return revision;
  }
}
