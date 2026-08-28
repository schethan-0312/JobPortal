import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import * as crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { VerifyRazorpayPaymentDto } from './dto/verify-razorpay-payment.dto.js';

@Injectable()
export class PackagesService {
  private razorpay: Razorpay | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private getRazorpayClient(): Razorpay {
    if (this.razorpay) return this.razorpay;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new InternalServerErrorException(
        'Razorpay is not configured yet — RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are missing.',
      );
    }
    this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    return this.razorpay;
  }

  listByAudience(audience?: 'CANDIDATE' | 'EMPLOYER' | 'RESUME') {
    return this.prisma.package.findMany({
      where: { isActive: true, ...(audience ? { audience } : {}) },
      orderBy: { priceInPaisa: 'asc' },
    });
  }

  listAll() {
    return this.prisma.package.findMany({
      orderBy: { priceInPaisa: 'asc' },
    });
  }

  createPackage(data: {
    name: string;
    audience: 'CANDIDATE' | 'EMPLOYER' | 'RESUME';
    priceInPaisa: number;
    durationType?: 'DAYS' | 'MONTHS' | 'YEARS';
    duration?: number;
    postJobLimit?: number;
    applicantViewLimit?: number;
    jobSeekerViewLimit?: number;
    chatEnabled?: boolean;
    filterShortlistEnabled?: boolean;
    scheduleInterviewsEnabled?: boolean;
    companyBrandingEnabled?: boolean;
    verifiedRecruiterBadgeEnabled?: boolean;
    isActive?: boolean;
  }) {
    return this.prisma.package.create({
      data: {
        name: data.name,
        audience: data.audience,
        priceInPaisa: Number(data.priceInPaisa),
        durationType: data.durationType ?? 'MONTHS',
        duration: data.duration !== undefined ? Number(data.duration) : 1,
        postJobLimit: data.postJobLimit !== undefined ? Number(data.postJobLimit) : 0,
        applicantViewLimit: data.applicantViewLimit !== undefined ? Number(data.applicantViewLimit) : 0,
        jobSeekerViewLimit: data.jobSeekerViewLimit !== undefined ? Number(data.jobSeekerViewLimit) : 0,
        chatEnabled: data.chatEnabled ?? false,
        filterShortlistEnabled: data.filterShortlistEnabled ?? false,
        scheduleInterviewsEnabled: data.scheduleInterviewsEnabled ?? false,
        companyBrandingEnabled: data.companyBrandingEnabled ?? false,
        verifiedRecruiterBadgeEnabled: data.verifiedRecruiterBadgeEnabled ?? false,
        isActive: data.isActive ?? true,
      },
    });
  }

  async deletePackage(id: string) {
    try {
      await this.prisma.order.deleteMany({
        where: { packageId: id },
      });
      await this.prisma.employerPackageSubscription.deleteMany({
        where: { packageId: id },
      });
      return await this.prisma.package.delete({
        where: { id },
      });
    } catch {
      return await this.prisma.package.update({
        where: { id },
        data: { isActive: false },
      });
    }
  }

  updatePackage(
    id: string,
    data: {
      name?: string;
      audience?: 'CANDIDATE' | 'EMPLOYER' | 'RESUME';
      priceInPaisa?: number;
      durationType?: 'DAYS' | 'MONTHS' | 'YEARS';
      duration?: number;
      postJobLimit?: number;
      applicantViewLimit?: number;
      jobSeekerViewLimit?: number;
      chatEnabled?: boolean;
      filterShortlistEnabled?: boolean;
      scheduleInterviewsEnabled?: boolean;
      companyBrandingEnabled?: boolean;
      verifiedRecruiterBadgeEnabled?: boolean;
      isActive?: boolean;
    },
  ) {
    return this.prisma.package.update({
      where: { id },
      data: {
        name: data.name,
        audience: data.audience,
        priceInPaisa: data.priceInPaisa !== undefined ? Number(data.priceInPaisa) : undefined,
        durationType: data.durationType,
        duration: data.duration !== undefined ? Number(data.duration) : undefined,
        postJobLimit: data.postJobLimit !== undefined ? Number(data.postJobLimit) : undefined,
        applicantViewLimit: data.applicantViewLimit !== undefined ? Number(data.applicantViewLimit) : undefined,
        jobSeekerViewLimit: data.jobSeekerViewLimit !== undefined ? Number(data.jobSeekerViewLimit) : undefined,
        chatEnabled: data.chatEnabled,
        filterShortlistEnabled: data.filterShortlistEnabled,
        scheduleInterviewsEnabled: data.scheduleInterviewsEnabled,
        companyBrandingEnabled: data.companyBrandingEnabled,
        verifiedRecruiterBadgeEnabled: data.verifiedRecruiterBadgeEnabled,
        isActive: data.isActive,
      },
    });
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const pkg = await this.prisma.package.findUnique({ where: { id: dto.packageId } });
    if (!pkg || !pkg.isActive) {
      throw new NotFoundException('Package not found');
    }

    if (pkg.audience === 'EMPLOYER') {
      const employer = await this.prisma.employer.findUnique({ where: { userId } });
      if (employer) {
        const sub = await this.prisma.employerPackageSubscription.findFirst({ 
          where: { employerId: employer.id, status: 'ACTIVE' },
          include: { package: true },
          orderBy: { createdAt: 'desc' }
        });
        if (sub && sub.status === 'ACTIVE' && sub.expiresAt && sub.expiresAt > new Date()) {
          if (sub.package && pkg.priceInPaisa <= sub.package.priceInPaisa) {
            throw new BadRequestException('You can only upgrade to a higher tier package.');
          }
        }
      }
    }

    return this.prisma.order.create({
      data: {
        userId,
        packageId: pkg.id,
        amountInPaisa: pkg.priceInPaisa,
        status: 'PENDING',
      },
    });
  }

  /**
   * Creates a real Razorpay order for an existing pending Order, and returns
   * everything the frontend needs to open Razorpay's Checkout widget.
   */
  async createRazorpayOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not pending payment');
    }

    const razorpay = this.getRazorpayClient();
    const rpOrder = await razorpay.orders.create({
      amount: order.amountInPaisa,
      currency: 'INR',
      receipt: order.id,
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { razorpayOrderId: rpOrder.id },
    });

    return {
      razorpayOrderId: rpOrder.id,
      amount: rpOrder.amount,
      currency: rpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    };
  }

  /**
   * Verifies the HMAC-SHA256 signature Razorpay sends back after a successful
   * checkout, per their official verification scheme. Only activates the
   * package if the signature is genuinely valid — this is the real payment
   * confirmation, not a simulation.
   */
  async verifyRazorpayPayment(userId: string, orderId: string, dto: VerifyRazorpayPaymentDto) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { package: true } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not pending payment');
    }
    if (order.razorpayOrderId !== dto.razorpayOrderId) {
      throw new BadRequestException('Razorpay order id does not match this order');
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      throw new InternalServerErrorException('Razorpay is not configured yet.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${dto.razorpayOrderId}|${dto.razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== dto.razorpaySignature) {
      throw new BadRequestException('Payment signature verification failed');
    }

    return this.activatePackage(order, dto.razorpayPaymentId);
  }

  /**
   * Dev/test-only path: simulates a successful payment without a real gateway.
   * Kept so the flow can still be exercised before Razorpay keys are configured.
   */
  async confirmOrder(userId: string, orderId: string, gatewayRef: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { package: true } });
    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found');
    }
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not pending payment');
    }
    return this.activatePackage(order, gatewayRef);
  }

  private async activatePackage(
    order: { id: string; userId: string; packageId: string; package: any },
    gatewayRef: string,
  ) {
    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'PAID', gatewayRef },
    });

    if (order.package.audience === 'EMPLOYER') {
      const employer = await this.prisma.employer.findUnique({ where: { userId: order.userId } });
      if (employer) {
        const pkg = order.package;
        const startedAt = new Date();
        const expiresAt = new Date(startedAt);

        if (pkg.durationType === 'DAYS') {
          expiresAt.setDate(expiresAt.getDate() + pkg.duration);
        } else if (pkg.durationType === 'MONTHS') {
          expiresAt.setMonth(expiresAt.getMonth() + pkg.duration);
        } else if (pkg.durationType === 'YEARS') {
          expiresAt.setFullYear(expiresAt.getFullYear() + pkg.duration);
        }

        // Find existing active subscription
        const activeSub = await this.prisma.employerPackageSubscription.findFirst({
          where: { employerId: employer.id, status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' }
        });

        if (activeSub) {
          // Mark previous as UPGRADED
          await this.prisma.employerPackageSubscription.update({
            where: { id: activeSub.id },
            data: { status: 'UPGRADED' }
          });
        }

        // Create new subscription
        await this.prisma.employerPackageSubscription.create({
          data: {
            employerId: employer.id,
            packageId: order.packageId,
            previousPackageId: activeSub ? activeSub.packageId : null,
            paymentStatus: 'PAID',
            jobPostsUsed: 0,
            applicantsViewed: 0,
            jobSeekersViewed: 0,
            startedAt,
            expiresAt,
            status: 'ACTIVE'
          }
        });
      }
    }

    return updatedOrder;
  }

  listMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getActiveSubscription(userId: string) {
    const employer = await this.prisma.employer.findUnique({ where: { userId } });
    if (!employer) return null;

    let sub = await this.prisma.employerPackageSubscription.findFirst({
      where: { employerId: employer.id, status: 'ACTIVE' },
      include: { package: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!sub) return null;

    const now = new Date();
    if (sub.status === 'ACTIVE' && sub.expiresAt && sub.expiresAt <= now) {
      sub = await this.prisma.employerPackageSubscription.update({
        where: { id: sub.id },
        data: { status: 'EXPIRED' },
        include: { package: true },
      });
    }

    return sub;
  }
}
