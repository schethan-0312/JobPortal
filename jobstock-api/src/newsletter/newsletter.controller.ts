import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { NewsletterService } from './newsletter.service.js';
import { IsEmail } from 'class-validator';

class SubscribeDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  email!: string;
}

@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post('subscribe')
  async subscribe(@Body(new ValidationPipe()) dto: SubscribeDto) {
    return this.newsletterService.subscribe(dto.email);
  }
}
