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
    featuresJson?: any;
    isActive?: boolean;
  }) {
    return this.prisma.package.create({
      data: {
        name: data.name,
        audience: data.audience,
        priceInPaisa: Number(data.priceInPaisa),
        featuresJson: data.featuresJson ?? [],
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
      featuresJson?: any;
      isActive?: boolean;
    },
  ) {
    return this.prisma.package.update({
      where: { id },
      data: {
        name: data.name,
        audience: data.audience,
        priceInPaisa: data.priceInPaisa !== undefined ? Number(data.priceInPaisa) : undefined,
        featuresJson: data.featuresJson,
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
        const sub = await this.prisma.employerPackageSubscription.findUnique({ where: { employerId: employer.id } });
        if (sub && sub.status === 'ACTIVE' && sub.expiresAt && sub.expiresAt > new Date()) {
          throw new BadRequestException('You already have an active package. You can purchase another package after your current package expires.');
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
    order: { id: string; userId: string; packageId: string; package: { audience: string; featuresJson?: any } },
    gatewayRef: string,
  ) {
    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'PAID', gatewayRef },
    });

    if (order.package.audience === 'EMPLOYER') {
      const employer = await this.prisma.employer.findUnique({ where: { userId: order.userId } });
      if (employer) {
        let expiresAt: Date | null = null;
        const pkg = order.package;
        if (pkg && pkg.featuresJson) {
          let meta: any = null;
          if (typeof pkg.featuresJson === 'object' && pkg.featuresJson !== null && !Array.isArray(pkg.featuresJson)) {
            meta = pkg.featuresJson;
          } else if (typeof pkg.featuresJson === 'string') {
            try {
              meta = JSON.parse(pkg.featuresJson);
            } catch {}
          }

          if (meta && meta.duration && meta.durationType) {
            const duration = Number(meta.duration);
            const startedAt = new Date();
            expiresAt = new Date(startedAt);
            if (meta.durationType === 'Days') {
              expiresAt.setDate(expiresAt.getDate() + duration);
            } else if (meta.durationType === 'Months') {
              expiresAt.setMonth(expiresAt.getMonth() + duration);
            } else if (meta.durationType === 'Years') {
              expiresAt.setFullYear(expiresAt.getFullYear() + duration);
            }
          }
        }

        await this.prisma.employerPackageSubscription.upsert({
          where: { employerId: employer.id },
          create: { employerId: employer.id, packageId: order.packageId, jobPostsUsed: 0, startedAt: new Date(), expiresAt, status: 'ACTIVE' },
          update: { packageId: order.packageId, jobPostsUsed: 0, startedAt: new Date(), expiresAt, status: 'ACTIVE' },
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

    let sub = await this.prisma.employerPackageSubscription.findUnique({
      where: { employerId: employer.id },
      include: { package: true },
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
