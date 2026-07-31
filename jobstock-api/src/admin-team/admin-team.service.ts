import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { AdminRole, AuditTargetType, Role } from '../../generated/prisma/enums.js';
import { InviteAdminDto } from './dto/invite-admin.dto.js';
import { UpdateAdminRoleDto } from './dto/update-admin-role.dto.js';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AdminTeamService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async list() {
    const admins = await this.prisma.user.findMany({
      where: { role: Role.ADMIN },
      select: {
        id: true,
        email: true,
        adminRole: true,
        createdAt: true,
        sessionRevokedAt: true,
        invitedBy: { select: { email: true } },
        loginEvents: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true, ipAddress: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return admins.map((a) => ({
      id: a.id,
      email: a.email,
      adminRole: a.adminRole,
      createdAt: a.createdAt,
      invitedByEmail: a.invitedBy?.email ?? null,
      lastLoginAt: a.loginEvents[0]?.createdAt ?? null,
      lastLoginIp: a.loginEvents[0]?.ipAddress ?? null,
    }));
  }

  async invite(inviterId: string, dto: InviteAdminDto, ip?: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const tempPassword = crypto.randomBytes(9).toString('base64url');
    const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

    const admin = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: Role.ADMIN,
        adminRole: dto.adminRole,
        isEmailVerified: true,
        invitedById: inviterId,
      },
    });

    await this.auditLog.log({
      adminId: inviterId,
      action: 'ADMIN_INVITED',
      targetType: AuditTargetType.ADMIN,
      targetId: admin.id,
      reason: `Invited as ${dto.adminRole}`,
      ipAddress: ip,
    });

    // No transactional email provider is wired up yet, so the one-time temp
    // password is returned directly to the inviting super admin to hand off
    // out-of-band, rather than silently vanishing.
    return { id: admin.id, email: admin.email, adminRole: admin.adminRole, tempPassword };
  }

  async updateRole(actorId: string, targetId: string, dto: UpdateAdminRoleDto, ip?: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target || target.role !== Role.ADMIN) {
      throw new NotFoundException('Admin not found');
    }

    if (target.adminRole === AdminRole.SUPER_ADMIN && dto.adminRole !== AdminRole.SUPER_ADMIN) {
      const superAdminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN, adminRole: AdminRole.SUPER_ADMIN },
      });
      if (superAdminCount <= 1) {
        throw new BadRequestException('Cannot demote the last remaining SUPER_ADMIN');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { adminRole: dto.adminRole },
    });

    await this.auditLog.log({
      adminId: actorId,
      action: 'ADMIN_ROLE_CHANGED',
      targetType: AuditTargetType.ADMIN,
      targetId,
      reason: `${target.adminRole} -> ${dto.adminRole}`,
      ipAddress: ip,
    });

    return { id: updated.id, email: updated.email, adminRole: updated.adminRole };
  }

  async forceLogout(actorId: string, targetId: string, ip?: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target || target.role !== Role.ADMIN) {
      throw new NotFoundException('Admin not found');
    }
    if (targetId === actorId) {
      throw new ForbiddenException('Use the normal logout flow to end your own session');
    }

    await this.prisma.user.update({ where: { id: targetId }, data: { sessionRevokedAt: new Date() } });

    await this.auditLog.log({
      adminId: actorId,
      action: 'ADMIN_FORCE_LOGOUT',
      targetType: AuditTargetType.ADMIN,
      targetId,
      ipAddress: ip,
    });

    return { success: true };
  }

  async listSessions(targetId: string) {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target || target.role !== Role.ADMIN) {
      throw new NotFoundException('Admin not found');
    }
    return this.prisma.loginEvent.findMany({
      where: { userId: targetId },
      orderBy: { createdAt: 'desc' },
      take: 25,
    });
  }
}
