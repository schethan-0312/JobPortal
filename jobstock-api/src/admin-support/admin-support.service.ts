import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { EmailService } from '../email/email.service.js';
import { AuditTargetType, TicketPriority, TicketStatus } from '../../generated/prisma/enums.js';
import { UpdateTicketDto } from './dto/update-ticket.dto.js';
import { AdminReplyDto } from './dto/admin-reply.dto.js';

@Injectable()
export class AdminSupportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  async overview() {
    const [open, inProgress, resolved, closed, unassigned] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.RESOLVED } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.CLOSED } }),
      this.prisma.supportTicket.count({
        where: { status: { in: [TicketStatus.OPEN, TicketStatus.IN_PROGRESS] }, assignedAdminId: null },
      }),
    ]);
    return { open, inProgress, resolved, closed, unassigned };
  }

  async list(params: { status?: TicketStatus; priority?: TicketPriority; page: number; pageSize: number }) {
    const where = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.priority ? { priority: params.priority } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        select: {
          id: true,
          subject: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { email: true, role: true } },
          assignedAdmin: { select: { email: true } },
          _count: { select: { messages: true } },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.supportTicket.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async getDetail(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { email: true, role: true } },
        assignedAdmin: { select: { email: true } },
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { email: true } } } },
      },
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async update(actorId: string, ticketId: string, dto: UpdateTicketDto, ip?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(dto.status ? { status: dto.status, closedAt: dto.status === 'CLOSED' ? new Date() : ticket.closedAt } : {}),
        ...(dto.priority ? { priority: dto.priority } : {}),
      },
    });

    await this.auditLog.log({
      adminId: actorId,
      action: 'SUPPORT_TICKET_UPDATED',
      targetType: AuditTargetType.CONFIG,
      targetId: ticketId,
      metadata: { status: dto.status, priority: dto.priority },
      ipAddress: ip,
    });

    if (dto.status && (dto.status === 'RESOLVED' || dto.status === 'CLOSED')) {
      const ticketWithUser = await this.prisma.supportTicket.findUnique({ where: { id: ticketId }, include: { user: true } });
      if (ticketWithUser) {
        this.emailService.sendSupportTicketUpdate({
          email: ticketWithUser.user.email,
          ticketId: ticketId,
          subject: ticketWithUser.subject,
          snippet: `Your ticket has been marked as ${dto.status}.`
        }).catch(console.error);
      }
    }
    return updated;
  }

  async assign(actorId: string, ticketId: string, ip?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: { assignedAdminId: actorId, status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status },
    });

    await this.auditLog.log({
      adminId: actorId,
      action: 'SUPPORT_TICKET_ASSIGNED',
      targetType: AuditTargetType.CONFIG,
      targetId: ticketId,
      ipAddress: ip,
    });

    return updated;
  }

  async reply(actorId: string, ticketId: string, dto: AdminReplyDto, ip?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.ticketMessage.create({ data: { ticketId, senderId: actorId, body: dto.body, isAdminReply: true } }),
      this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status },
      }),
    ]);

    await this.auditLog.log({
      adminId: actorId,
      action: 'SUPPORT_TICKET_REPLIED',
      targetType: AuditTargetType.CONFIG,
      targetId: ticketId,
      ipAddress: ip,
    });

    return message;
  }
}
