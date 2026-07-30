import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module.js';
import { ChatbotService } from './chatbot.service.js';
import { ChatbotController } from './chatbot.controller.js';

@Module({
  imports: [AiModule],
  providers: [ChatbotService],
  controllers: [ChatbotController],
})
export class ChatbotModule {}
