import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ResumeParserService } from './resume-parser.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator.js';

@Controller('resume-parser')
@UseGuards(JwtAuthGuard)
export class ResumeParserController {
  constructor(private readonly resumeParserService: ResumeParserService) {}

  @Post('parse')
  async parseResume(@CurrentUser() user: AuthenticatedUser, @Body('resumeUrl') resumeUrl: string) {
    if (!resumeUrl) {
      throw new Error('resumeUrl is required');
    }
    return await this.resumeParserService.parseResume(user.userId, resumeUrl);
  }
}
