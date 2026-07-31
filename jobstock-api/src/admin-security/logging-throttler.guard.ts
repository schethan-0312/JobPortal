import { ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerLimitDetail } from '@nestjs/throttler';
import { PrismaService } from '../prisma/prisma.service.js';

/**
 * Same rate-limiting behavior as the stock ThrottlerGuard, but records every
 * limit-exceeded event to RateLimitHit first — otherwise there's no way to see
 * "which IPs/users are hitting rate limits most" (module 14's own requirement)
 * since @nestjs/throttler doesn't persist hits anywhere by default.
 *
 * Uses property injection (not a custom constructor) so ThrottlerGuard's own
 * constructor-injected dependencies keep resolving via the inherited constructor,
 * rather than fighting its internal @Inject metadata by redeclaring one.
 */
@Injectable()
export class LoggingThrottlerGuard extends ThrottlerGuard {
  @Inject(PrismaService)
  private readonly prisma!: PrismaService;

  protected async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const req = context.switchToHttp().getRequest<{ ip?: string; path?: string; url?: string }>();
    await this.prisma.rateLimitHit
      .create({ data: { ipAddress: req.ip, path: req.path ?? req.url ?? 'unknown' } })
      .catch(() => {});
    return super.throwThrottlingException(context, detail);
  }
}
