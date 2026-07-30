import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { PackagesService } from './packages.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { VerifyRazorpayPaymentDto } from './dto/verify-razorpay-payment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get()
  list(@Query('audience') audience?: 'CANDIDATE' | 'EMPLOYER' | 'RESUME') {
    return this.packagesService.listByAudience(audience);
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
}
