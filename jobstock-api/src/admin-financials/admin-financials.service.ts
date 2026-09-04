import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import Razorpay from 'razorpay';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuditLogService } from '../audit-log/audit-log.service.js';
import { EmailService } from '../email/email.service.js';
import { RefundTransactionDto } from './dto/refund-transaction.dto.js';
import { OverrideSubscriptionDto } from './dto/override-subscription.dto.js';

@Injectable()
export class AdminFinancialsService {
  private razorpay: Razorpay | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly emailService: EmailService,
  ) {}

  private getRazorpayClient(): Razorpay {
    if (this.razorpay) return this.razorpay;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new InternalServerErrorException('Razorpay is not configured.');
    }
    this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    return this.razorpay;
  }

  /** Reads the live/test mode straight from the key prefix — never trust a separate flag that could drift. */
  getMode() {
    const keyId = process.env.RAZORPAY_KEY_ID ?? '';
    const configured = Boolean(keyId && process.env.RAZORPAY_KEY_SECRET);
    const mode = keyId.startsWith('rzp_live_') ? 'LIVE' : keyId.startsWith('rzp_test_') ? 'TEST' : 'UNKNOWN';
    return { configured, mode, keyIdPrefix: keyId ? `${keyId.slice(0, 12)}...` : null };
  }

  async listTransactions(params: {
    status?: string;
    userId?: string;
    from?: Date;
    to?: Date;
    page: number;
    pageSize: number;
  }) {
    const where = {
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.from || params.to
        ? { createdAt: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          user: { select: { email: true, role: true } },
          package: { select: { name: true, audience: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page: params.page, pageSize: params.pageSize };
  }

  async revenueSummary(from?: Date, to?: Date) {
    const where = {
      status: 'PAID' as const,
      ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
    };

    const paidOrders = await this.prisma.order.findMany({
      where,
      select: { amountInPaisa: true, package: { select: { name: true, audience: true } } },
    });

    const totalPaisa = paidOrders.reduce((sum, o) => sum + o.amountInPaisa, 0);

    const byAudience: Record<string, number> = {};
    const byPlan: Record<string, number> = {};
    for (const o of paidOrders) {
      byAudience[o.package.audience] = (byAudience[o.package.audience] ?? 0) + o.amountInPaisa;
      byPlan[o.package.name] = (byPlan[o.package.name] ?? 0) + o.amountInPaisa;
    }

    return {
      totalPaisa,
      transactionCount: paidOrders.length,
      byAudience,
      byPlan,
    };
  }

  async refundRate(from?: Date, to?: Date) {
    const where = from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {};
    const [total, refunded] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.count({ where: { ...where, status: 'REFUNDED' } }),
    ]);
    return { total, refunded, refundRate: total > 0 ? refunded / total : 0 };
  }

  listSubscriptions() {
    return this.prisma.employerPackageSubscription.findMany({
      include: {
        employer: { select: { companyName: true, status: true } },
        package: { select: { name: true, priceInPaisa: true } },
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async overrideSubscription(adminId: string, subscriptionId: string, dto: OverrideSubscriptionDto, ip?: string) {
    const sub = await this.prisma.employerPackageSubscription.findUnique({ where: { id: subscriptionId } });
    if (!sub) {
      throw new NotFoundException('Subscription not found');
    }

    const updated = await this.prisma.employerPackageSubscription.update({
      where: { id: subscriptionId },
      data: {
        ...(dto.packageId ? { packageId: dto.packageId } : {}),
        ...(dto.expiresAt ? { expiresAt: new Date(dto.expiresAt) } : {}),
      },
    });

    await this.auditLog.log({
      adminId,
      action: 'OVERRIDE_SUBSCRIPTION',
      targetType: 'TRANSACTION',
      targetId: subscriptionId,
      reason: dto.reason,
      metadata: { oldPackageId: sub.packageId, newPackageId: dto.packageId, expiresAt: dto.expiresAt },
      ipAddress: ip,
    });


    if (updated.status === 'ACTIVE') {
      const sub = await this.prisma.employerPackageSubscription.findUnique({
        where: { id: subscriptionId },
        include: { employer: { include: { user: true } }, package: true }
      });
      if (sub && sub.package && sub.employer?.user) {
        this.emailService.sendPackageAssignmentConfirmation({
          email: sub.employer.user.email,
          planName: sub.package.name,
          quota: sub.package.postJobLimit || 0,
          unlocks: sub.package.jobSeekerViewLimit || 0
        }).catch(console.error);
      }
    }
    return updated;
  }

  /**
   * Refunds a real payment via Razorpay's API, then marks the local Order record
   * REFUNDED only after Razorpay confirms — never flip local state optimistically
   * on money-moving operations.
   */
  async refundTransaction(adminId: string, orderId: string, dto: RefundTransactionDto, ip?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException('Transaction not found');
    }
    if (order.status !== 'PAID') {
      throw new BadRequestException('Only PAID transactions can be refunded');
    }
    if (!order.gatewayRef) {
      throw new BadRequestException('This transaction has no Razorpay payment reference to refund');
    }

    const razorpay = this.getRazorpayClient();
    const platformFee = Math.floor(order.amountInPaisa * 0.05);
    const maxRefund = order.amountInPaisa - platformFee;
    const refundAmount = dto.amountInPaisa ?? maxRefund;
    if (refundAmount > maxRefund) {
      throw new BadRequestException(`Refund amount cannot exceed max allowed (${maxRefund / 100}) after 5% platform fee`);
    }

    let refund: { id: string };
    try {
      refund = await razorpay.payments.refund(order.gatewayRef, { amount: refundAmount });
    } catch (err) {
      // The razorpay SDK's error shape is inconsistent across failure modes — sometimes a
      // real Error with .message, sometimes a plain { statusCode, error } object where
      // `error` itself can be undefined (e.g. a 404 for an unknown payment id). Surface
      // whatever detail is actually available rather than assuming one shape.
      const rzpError = err as { error?: { description?: string }; message?: string; statusCode?: number };
      const description =
        rzpError?.error?.description ||
        rzpError?.message ||
        (rzpError?.statusCode ? `Razorpay returned HTTP ${rzpError.statusCode} — payment reference may not exist` : 'unknown error');
      throw new BadRequestException(`Razorpay refund failed: ${description}`);
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'REFUNDED' },
      include: { package: true }
    });

    if (updated.package?.audience === 'EMPLOYER') {
      const employer = await this.prisma.employer.findUnique({ where: { userId: updated.userId } });
      if (employer) {
        const activeSub = await this.prisma.employerPackageSubscription.findFirst({
          where: { employerId: employer.id, packageId: updated.packageId, status: 'ACTIVE' },
        });
        if (activeSub) {
          await this.prisma.employerPackageSubscription.update({
            where: { id: activeSub.id },
            data: { status: 'REFUNDED', expiresAt: new Date() },
          });
        }
      }
    }

    await this.auditLog.log({
      adminId,
      action: 'REFUND_TRANSACTION',
      targetType: 'TRANSACTION',
      targetId: orderId,
      reason: dto.reason,
      metadata: { refundAmountPaisa: refundAmount, razorpayRefundId: refund.id, paymentId: order.gatewayRef },
      ipAddress: ip,
    });

    return updated;
  }
}
