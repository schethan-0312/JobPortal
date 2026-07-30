import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ChatbotService } from './chatbot.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@Controller('chatbot')
@Throttle({ default: { ttl: 60_000, limit: 8 } })
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('message')
  sendMessage(@Body() dto: SendMessageDto) {
    return this.chatbotService.sendMessage(dto);
  }
}
