import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async subscribe(email: string) {
    // Check if the user is already subscribed
    const existingSubscriber = await this.prisma.newsletterSubscription.findUnique({
      where: { email },
    });

    if (existingSubscriber) {
      throw new ConflictException('This email is already subscribed to the newsletter.');
    }

    // Save the subscriber to the database
    const subscription = await this.prisma.newsletterSubscription.create({
      data: { email },
    });

    this.logger.log(`New subscriber added: ${email}`);

    // Send the welcome email
    await this.emailService.sendSubscriberConfirmation(email);

    // Notify the admin
    await this.emailService.sendAdminNotification(email);

    return {
      message: 'Successfully subscribed to the newsletter.',
      subscription,
    };
  }
}
