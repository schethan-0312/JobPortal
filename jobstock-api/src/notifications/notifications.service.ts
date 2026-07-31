import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PushService } from '../push/push.service.js';
import { SmsService } from '../sms/sms.service.js';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly push: PushService,
    private readonly sms: SmsService,
  ) {}

  /**
   * Internal helper used by other modules (messages, applications, admin) to notify a user.
   * Always writes the in-app notification; also fans out to push/SMS/WhatsApp for users who
   * opted in and have the relevant channel configured. The fan-out is fire-and-forget — a
   * dead push subscription or Twilio hiccup must never block the caller's main flow.
   */
  async create(userId: string, title: string, body: string) {
    const notification = await this.prisma.notification.create({ data: { userId, title, body } });

    void this.push.notify(userId, title, body);

    if (this.sms.isConfigured()) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { phoneNumber: true, smsOptIn: true, whatsappOptIn: true },
      });
      if (user?.phoneNumber) {
        const message = `${title}: ${body}`;
        if (user.smsOptIn) void this.sms.sendSms(user.phoneNumber, message);
        if (user.whatsappOptIn) void this.sms.sendWhatsapp(user.phoneNumber, message);
      }
    }

    return notification;
  }

  listMine(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  countUnread(userId: string) {
    return this.prisma.notification.count({ where: { userId, isRead: false } });
  }

  async markRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    return this.prisma.notification.update({ where: { id: notificationId }, data: { isRead: true } });
  }

  async markAllRead(userId: string) {
    await this.prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
    return { success: true };
  }

  async getChannelStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { phoneNumber: true, smsOptIn: true, whatsappOptIn: true },
    });
    return {
      ...user,
      smsAvailable: this.sms.isConfigured(),
      pushAvailable: this.push.isConfigured(),
    };
  }

  async updateChannelPrefs(
    userId: string,
    prefs: { phoneNumber?: string; smsOptIn?: boolean; whatsappOptIn?: boolean },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: prefs,
      select: { phoneNumber: true, smsOptIn: true, whatsappOptIn: true },
    });
  }
}
