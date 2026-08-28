import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { PackagesService } from './packages.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { VerifyRazorpayPaymentDto } from './dto/verify-razorpay-payment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';
import { Role } from '../../generated/prisma/enums.js';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  list(@Query('audience') audience?: 'CANDIDATE' | 'EMPLOYER' | 'RESUME') {
    return this.packagesService.listByAudience(audience);
  }

  @Get('all')
  listAll() {
    return this.packagesService.listAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  createPackage(
    @Body()
    body: {
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
    },
  ) {
    return this.packagesService.createPackage(body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  deletePackage(@Param('id') id: string) {
    return this.packagesService.deletePackage(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  updatePackage(
    @Param('id') id: string,
    @Body()
    body: {
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
    return this.packagesService.updatePackage(id, body);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  createOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrderDto) {
    return this.packagesService.createOrder(user.userId, dto);
  }

  @Post('orders/:id/confirm')
  @UseGuards(JwtAuthGuard)
  confirmOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('gatewayRef') gatewayRef: string,
  ) {
    return this.packagesService.confirmOrder(user.userId, id, gatewayRef ?? 'dev-simulated');
  }

  @Post('orders/:id/razorpay-order')
  @UseGuards(JwtAuthGuard)
  createRazorpayOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.packagesService.createRazorpayOrder(user.userId, id);
  }

  @Post('orders/:id/verify-razorpay')
  @UseGuards(JwtAuthGuard)
  verifyRazorpayPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: VerifyRazorpayPaymentDto,
  ) {
    return this.packagesService.verifyRazorpayPayment(user.userId, id, dto);
  }

  @Get('orders/mine')
  @UseGuards(JwtAuthGuard)
  listMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.packagesService.listMyOrders(user.userId);
  }

  @Post('orders/:id/track-download')
  @UseGuards(JwtAuthGuard)
  trackDownload(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.packagesService.trackDownload(user.userId, id);
  }

  @Post('orders/:id/cancel')
  @UseGuards(JwtAuthGuard)
  cancelOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.packagesService.cancelOrder(user.userId, id, reason);
  }

  @Get('active-subscription')
  @UseGuards(JwtAuthGuard)
  getActiveSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.packagesService.getActiveSubscription(user.userId);
  }

  @Post('refund-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.EMPLOYER)
  refundActiveSubscription(@CurrentUser() user: AuthenticatedUser) {
    return this.packagesService.refundActiveSubscription(user.userId);
  }
}
