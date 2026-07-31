import { Body, Controller, Delete, Get, Post, Query, UseGuards } from '@nestjs/common';
import { PushService } from './push.service.js';
import { SubscribePushDto } from './dto/subscribe-push.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@Controller('push')
export class PushController {
  constructor(private readonly pushService: PushService) {}

  @Get('public-key')
  getPublicKey() {
    return this.pushService.getPublicKey();
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  subscribe(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubscribePushDto) {
    return this.pushService.subscribe(user.userId, dto);
  }

  @Delete('subscribe')
  @UseGuards(JwtAuthGuard)
  unsubscribe(@CurrentUser() user: AuthenticatedUser, @Query('endpoint') endpoint: string) {
    return this.pushService.unsubscribe(user.userId, endpoint);
  }
}
