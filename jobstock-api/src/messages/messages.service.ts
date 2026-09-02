import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly emailService: EmailService,
  ) {}

  async getSupportAdmin() {
    const admin = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true },
    });
    if (!admin) {
      throw new NotFoundException('Support admin not found');
    }
    return admin;
  }

  async resolveUserId(id: string): Promise<string> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (user) return user.id;

    const candidate = await this.prisma.candidateProfile.findUnique({ where: { id } });
    if (candidate) return candidate.userId;

    const employer = await this.prisma.employer.findUnique({ where: { id } });
    if (employer) return employer.userId;

    return id;
  }

  async send(senderId: string, dto: SendMessageDto) {
    const resolvedReceiverId = await this.resolveUserId(dto.receiverId);
    const isSelfMessage = senderId === resolvedReceiverId;

    const receiver = await this.prisma.user.findUnique({ where: { id: resolvedReceiverId } });
    if (!receiver) {
      throw new NotFoundException('Recipient not found');
    }

    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
    const isCandidateToCandidate = sender?.role === 'CANDIDATE' && receiver.role === 'CANDIDATE';

    if (isCandidateToCandidate && !isSelfMessage) {
      const isConnected = await this.prisma.candidateEmployerFollow.findFirst({
        where: {
          OR: [
            { followerId: senderId, followingId: resolvedReceiverId, status: 'ACCEPTED' },
            { followerId: resolvedReceiverId, followingId: senderId, status: 'ACCEPTED' },
          ],
        },
      });

      if (!isConnected) {
        throw new ForbiddenException(
          'You can only message candidates who have accepted your connection request.'
        );
      }
    }

    const message = await this.prisma.message.create({
      data: {
        senderId,
        receiverId: resolvedReceiverId,
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

    if (!isSelfMessage) {
      await this.notifications.create(resolvedReceiverId, 'New message', 'You have received a new message');

      // Send email notification in background
      (async () => {
        try {
          const senderName =
            message.sender.role === 'EMPLOYER'
              ? message.sender.employer?.companyName || 'Recruiter'
              : message.sender.candidateProfile?.fullName || 'User';

          const senderCompany = message.sender.role === 'EMPLOYER' ? message.sender.employer?.companyName : undefined;
          const receiverName =
            message.receiver.candidateProfile?.fullName || message.receiver.employer?.companyName || 'User';

          if (message.receiver.role === 'CANDIDATE' && message.receiver.email) {
            await this.emailService.sendRecruiterMessageNotificationEmail({
              recipientEmail: message.receiver.email,
              recipientName: receiverName,
              senderName,
              senderCompany,
              messageSnippet: dto.body || 'Attachment sent',
            });
          }
        } catch (e) {
          // Fail silently
        }
      })();
    }

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
      if (counterpartId && counterpartId !== userId && !conversations.has(counterpartId)) {
        conversations.set(counterpartId, msg);
      }
    }
    return Array.from(conversations.values());
  }

  countUnread(userId: string, role?: 'ADMIN' | 'NON_ADMIN') {
    const where: any = { receiverId: userId, readAt: null, deletedForReceiver: false };
    if (role === 'ADMIN') {
      where.sender = { role: 'ADMIN' };
    } else if (role === 'NON_ADMIN') {
      where.sender = { role: { not: 'ADMIN' } };
    }
    return this.prisma.message.count({ where });
  }

  async getConversation(userId: string, rawCounterpartId: string) {
    const counterpartId = await this.resolveUserId(rawCounterpartId);
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
