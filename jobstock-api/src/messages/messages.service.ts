import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async send(senderId: string, dto: SendMessageDto) {
    if (senderId === dto.receiverId) {
      throw new BadRequestException('You cannot message yourself');
    }
    const receiver = await this.prisma.user.findUnique({ where: { id: dto.receiverId } });
    if (!receiver) {
      throw new NotFoundException('Recipient not found');
    }

    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId: dto.receiverId,
        body: dto.body ?? '',
        mediaUrl: dto.mediaUrl,
        mediaType: dto.mediaType,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            candidateProfile: { select: { fullName: true, profilePhotoUrl: true } },
            employer: { select: { companyName: true, logoUrl: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            role: true,
            candidateProfile: { select: { fullName: true, profilePhotoUrl: true } },
            employer: { select: { companyName: true, logoUrl: true } },
          },
        },
      },
    });

    await this.notifications.create(dto.receiverId, 'New message', 'You have received a new message');

    return message;
  }

  /** List all conversations for a user: one row per counterpart, with the last message */
  async listConversations(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, deletedForSender: false },
          { receiverId: userId, deletedForReceiver: false }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            candidateProfile: { select: { fullName: true, profilePhotoUrl: true } },
            employer: { select: { companyName: true, logoUrl: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            role: true,
            candidateProfile: { select: { fullName: true, profilePhotoUrl: true } },
            employer: { select: { companyName: true, logoUrl: true } },
          },
        },
      },
    });

    const conversations = new Map<string, (typeof messages)[number]>();
    for (const msg of messages) {
      const counterpartId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversations.has(counterpartId)) {
        conversations.set(counterpartId, msg);
      }
    }
    return Array.from(conversations.values());
  }

  countUnread(userId: string) {
    return this.prisma.message.count({ where: { receiverId: userId, readAt: null, deletedForReceiver: false } });
  }

  async getConversation(userId: string, counterpartId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: counterpartId, deletedForSender: false },
          { senderId: counterpartId, receiverId: userId, deletedForReceiver: false },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            candidateProfile: { select: { fullName: true, profilePhotoUrl: true } },
            employer: { select: { companyName: true, logoUrl: true } },
          },
        },
        receiver: {
          select: {
            id: true,
            email: true,
            role: true,
            candidateProfile: { select: { fullName: true, profilePhotoUrl: true } },
            employer: { select: { companyName: true, logoUrl: true } },
          },
        },
      },
    });

    await this.prisma.message.updateMany({
      where: { senderId: counterpartId, receiverId: userId, readAt: null, deletedForReceiver: false },
      data: { readAt: new Date() },
    });

    return messages;
  }

  async deleteMessage(userId: string, messageId: string, type: 'me' | 'everyone') {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg) throw new NotFoundException('Message not found');

    const isSender = msg.senderId === userId;
    const isReceiver = msg.receiverId === userId;

    if (!isSender && !isReceiver) throw new BadRequestException('Not authorized');

    if (type === 'everyone') {
      if (!isSender) throw new BadRequestException('Only sender can delete for everyone');
      return this.prisma.message.update({
        where: { id: messageId },
        data: { deletedForEveryone: true, body: '🚫 This message was deleted', mediaUrl: null, mediaType: null },
      });
    } else {
      if (isSender) {
        return this.prisma.message.update({ where: { id: messageId }, data: { deletedForSender: true } });
      } else {
        return this.prisma.message.update({ where: { id: messageId }, data: { deletedForReceiver: true } });
      }
    }
  }
}
