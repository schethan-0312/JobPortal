import { Body, Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service.js';
import { UpdateChannelPrefsDto } from './dto/update-channel-prefs.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.listMine(user.userId);
  }

  @Get('unread-count')
  countUnread(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.countUnread(user.userId);
  }

  @Patch(':id/read')
  markRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user.userId, id);
  }

  @Patch('read-all')
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.userId);
  }

  @Get('channels')
  getChannelStatus(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.getChannelStatus(user.userId);
  }

  @Patch('channels')
  updateChannelPrefs(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateChannelPrefsDto) {
    return this.notificationsService.updateChannelPrefs(user.userId, dto);
  }
}
