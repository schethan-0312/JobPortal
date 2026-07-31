import { Module } from '@nestjs/common';
import { SocialAuthService } from './social-auth.service.js';
import { SocialAuthController } from './social-auth.controller.js';

@Module({
  providers: [SocialAuthService],
  controllers: [SocialAuthController],
})
export class SocialAuthModule {}
