import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ChatbotService } from './chatbot.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@Controller('chatbot')
@Throttle({ default: { ttl: 60_000, limit: 8 } })
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  @UseGuards(OptionalJwtAuthGuard)
  sendMessage(@CurrentUser() user: AuthenticatedUser | null, @Body() dto: SendMessageDto) {
    return this.chatbotService.sendMessage(user?.userId, dto);
  }
}
