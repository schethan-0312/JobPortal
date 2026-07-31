import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { EmployersModule } from './employers/employers.module.js';
import { JobsModule } from './jobs/jobs.module.js';
import { AdminModule } from './admin/admin.module.js';
import { ApplicationsModule } from './applications/applications.module.js';
import { CandidatesModule } from './candidates/candidates.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { MessagesModule } from './messages/messages.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { BlogModule } from './blog/blog.module.js';
import { PackagesModule } from './packages/packages.module.js';
import { ReferralsModule } from './referrals/referrals.module.js';
import { ContactModule } from './contact/contact.module.js';
import { StatsModule } from './stats/stats.module.js';
import { AiModule } from './ai/ai.module.js';
import { ResumeScannerModule } from './resume-scanner/resume-scanner.module.js';
import { ChatbotModule } from './chatbot/chatbot.module.js';
import { SkillAssessmentModule } from './skill-assessment/skill-assessment.module.js';
import { MockInterviewModule } from './mock-interview/mock-interview.module.js';
import { CareerNavigatorModule } from './career-navigator/career-navigator.module.js';
import { SmartMatchModule } from './smart-match/smart-match.module.js';
import { AutoShortlistModule } from './auto-shortlist/auto-shortlist.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { ResumeBuilderModule } from './resume-builder/resume-builder.module.js';
import { GamificationModule } from './gamification/gamification.module.js';
import { SocialAuthModule } from './social-auth/social-auth.module.js';
import { PushModule } from './push/push.module.js';
import { SmsModule } from './sms/sms.module.js';
import { AuditLogModule } from './audit-log/audit-log.module.js';
import { AdminFinancialsModule } from './admin-financials/admin-financials.module.js';
import { AdminIntegrationsModule } from './admin-integrations/admin-integrations.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        // Default limit for every route: 60 requests/minute per IP.
        name: 'default',
        ttl: 60_000,
        limit: 60,
      },
    ]),
    PrismaModule,
    AuthModule,
    EmployersModule,
    JobsModule,
    AdminModule,
    ApplicationsModule,
    CandidatesModule,
    NotificationsModule,
    MessagesModule,
    ReportsModule,
    BlogModule,
    PackagesModule,
    ReferralsModule,
    ContactModule,
    StatsModule,
    AiModule,
    ResumeScannerModule,
    ChatbotModule,
    SkillAssessmentModule,
    MockInterviewModule,
    CareerNavigatorModule,
    SmartMatchModule,
    AutoShortlistModule,
    ResumeBuilderModule,
    UploadsModule,
    GamificationModule,
    SocialAuthModule,
    PushModule,
    SmsModule,
    AuditLogModule,
    AdminFinancialsModule,
    AdminIntegrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
