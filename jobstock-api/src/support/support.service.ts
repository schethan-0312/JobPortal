import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTicketDto } from './dto/create-ticket.dto.js';
import { AddMessageDto } from './dto/add-message.dto.js';

@Injectable()
export class SupportService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        messages: { create: { senderId: userId, body: dto.message, isAdminReply: false } },
      },
      include: { messages: true },
    });
  }

  async listMine(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, subject: true, status: true, priority: true, createdAt: true, updatedAt: true },
    });
  }

  async getMine(userId: string, ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { email: true } } } },
      },
    });
    if (!ticket || ticket.userId !== userId) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async addMessage(userId: string, ticketId: string, dto: AddMessageDto) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.userId !== userId) {
      throw new NotFoundException('Ticket not found');
    }
    if (ticket.status === 'CLOSED') {
      throw new ForbiddenException('This ticket is closed. Open a new one if you need further help.');
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.ticketMessage.create({ data: { ticketId, senderId: userId, body: dto.body, isAdminReply: false } }),
      this.prisma.supportTicket.update({
        where: { id: ticketId },
        data: { status: ticket.status === 'RESOLVED' ? 'OPEN' : ticket.status },
      }),
    ]);

    return message;
  }
}
