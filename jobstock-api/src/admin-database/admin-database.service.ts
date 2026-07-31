import { Injectable, NotFoundException } from '@nestjs/common';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { AuditTargetType, BackupStatus, Role } from '../../generated/prisma/enums.js';

interface TableSizeRow {
  table_name: string;
  row_estimate: bigint;
  total_size_bytes: bigint;
}

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(process.cwd(), '..', 'jobstock-backups');

@Injectable()
export class AdminDatabaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async overview() {
    const [sizeResult, tables] = await Promise.all([
      this.prisma.$queryRaw<{ size_bytes: bigint }[]>`SELECT pg_database_size(current_database()) AS size_bytes`,
      this.prisma.$queryRaw<TableSizeRow[]>`
        SELECT
          relname AS table_name,
          GREATEST(n_live_tup, 0) AS row_estimate,
          pg_total_relation_size(relid) AS total_size_bytes
        FROM pg_stat_user_tables
        ORDER BY total_size_bytes DESC
        LIMIT 20
      `,
    ]);

    return {
      totalSizeBytes: Number(sizeResult[0]?.size_bytes ?? 0),
      tables: tables.map((t) => ({
        tableName: t.table_name,
        rowEstimate: Number(t.row_estimate),
        totalSizeBytes: Number(t.total_size_bytes),
      })),
    };
  }

  async listBackups() {
    return this.prisma.backupRecord.findMany({ orderBy: { createdAt: 'desc' }, take: 30 });
  }

  async triggerBackup(actorId: string, ip?: string) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const filename = `jobstock-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.dump`;
    const filePath = path.join(BACKUP_DIR, filename);

    const record = await this.prisma.backupRecord.create({
      data: { filename, status: BackupStatus.RUNNING, triggeredById: actorId },
    });

    await this.auditLog.log({
      adminId: actorId,
      action: 'BACKUP_TRIGGERED',
      targetType: AuditTargetType.CONFIG,
      targetId: record.id,
      ipAddress: ip,
    });

    // Runs in the background — the caller gets the RUNNING record immediately
    // and polls listBackups() for completion rather than blocking on a
    // potentially multi-minute pg_dump.
    this.runDump(record.id, filePath).catch(() => {});

    return record;
  }

  private runDump(recordId: string, filePath: string) {
    return new Promise<void>((resolve) => {
      const child = spawn('pg_dump', ['--format=custom', `--file=${filePath}`, process.env.DATABASE_URL || ''], {
        env: process.env,
      });

      let stderr = '';
      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', async (err) => {
        await this.prisma.backupRecord.update({
          where: { id: recordId },
          data: { status: BackupStatus.FAILED, errorMessage: err.message, completedAt: new Date() },
        });
        resolve();
      });

      child.on('close', async (code) => {
        if (code === 0 && fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          await this.prisma.backupRecord.update({
            where: { id: recordId },
            data: { status: BackupStatus.SUCCESS, sizeBytes: stats.size, completedAt: new Date() },
          });
        } else {
          await this.prisma.backupRecord.update({
            where: { id: recordId },
            data: {
              status: BackupStatus.FAILED,
              errorMessage: stderr.slice(0, 2000) || `pg_dump exited with code ${code}`,
              completedAt: new Date(),
            },
          });
        }
        resolve();
      });
    });
  }

  async exportUserData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        candidateProfile: {
          include: { skillAssessments: true, mockInterviews: true },
        },
        employer: {
          include: { jobs: true },
        },
        applications: true,
        sentMessages: true,
        receivedMessages: true,
        orders: true,
        notifications: true,
        loginEvents: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash, ...safeUser } = user;
    void passwordHash;
    return safeUser;
  }

  async purgeUserData(actorId: string, userId: string, ip?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@deleted.jobstock`,
          phoneNumber: null,
          smsOptIn: false,
          whatsappOptIn: false,
          sessionRevokedAt: new Date(),
        },
      });

      if (user.role === Role.CANDIDATE) {
        await tx.candidateProfile.updateMany({
          where: { userId },
          data: {
            fullName: 'Deleted User',
            headline: null,
            location: null,
            phone: null,
            about: null,
            skills: [],
            resumeUrl: null,
            profilePhotoUrl: null,
            videoProfileUrl: null,
            githubUsername: null,
            githubProfileUrl: null,
            githubAvatarUrl: null,
            linkedinProfileUrl: null,
          },
        });
      }
    });

    await this.auditLog.log({
      adminId: actorId,
      action: 'GDPR_PURGE',
      targetType: AuditTargetType.USER,
      targetId: userId,
      reason: `Original email: ${user.email}`,
      ipAddress: ip,
    });

    return { success: true };
  }
}
