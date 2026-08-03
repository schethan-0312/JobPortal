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

  async createOrder(userId: string, dto: CreateOrderDto) {
    const pkg = await this.prisma.package.findUnique({ where: { id: dto.packageId } });
    if (!pkg || !pkg.isActive) {
      throw new NotFoundException('Package not found');
    }

    if (pkg.audience === 'JOB_BOOST') {
      if (!dto.jobId) {
        throw new BadRequestException('jobId is required for a job boost purchase');
      }
      const employer = await this.prisma.employer.findUnique({ where: { userId } });
      const job = await this.prisma.job.findUnique({ where: { id: dto.jobId } });
      if (!employer || !job || job.employerId !== employer.id) {
        throw new NotFoundException('Job not found');
      }
    }

    return this.prisma.order.create({
      data: {
        userId,
        packageId: pkg.id,
        jobId: pkg.audience === 'JOB_BOOST' ? dto.jobId : undefined,
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
    order: { id: string; userId: string; packageId: string; jobId: string | null; package: { audience: string } },
    gatewayRef: string,
  ) {
    const updatedOrder = await this.prisma.order.update({
      where: { id: order.id },
      data: { status: 'PAID', gatewayRef },
    });

    if (order.package.audience === 'EMPLOYER') {
      const employer = await this.prisma.employer.findUnique({ where: { userId: order.userId } });
      if (employer) {
        await this.prisma.employerPackageSubscription.upsert({
          where: { employerId: employer.id },
          create: { employerId: employer.id, packageId: order.packageId, jobPostsUsed: 0 },
          update: { packageId: order.packageId, jobPostsUsed: 0, startedAt: new Date() },
        });
      }
    }

    if (order.package.audience === 'JOB_BOOST' && order.jobId) {
      const BOOST_DURATION_DAYS = 30;
      await this.prisma.job.update({
        where: { id: order.jobId },
        data: {
          isFeatured: true,
          featuredUntil: new Date(Date.now() + BOOST_DURATION_DAYS * 24 * 60 * 60 * 1000),
        },
      });
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
}
