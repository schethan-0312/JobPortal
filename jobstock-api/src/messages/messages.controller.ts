import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendMessageDto) {
    return this.messagesService.send(user.userId, dto);
  }

  @Get('conversations')
  listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.listConversations(user.userId);
  }

  @Get('unread-count')
  countUnread(@CurrentUser() user: AuthenticatedUser) {
    return this.messagesService.countUnread(user.userId);
  }

  @Get('conversations/:counterpartId')
  getConversation(@CurrentUser() user: AuthenticatedUser, @Param('counterpartId') counterpartId: string) {
    return this.messagesService.getConversation(user.userId, counterpartId);
  }
}
