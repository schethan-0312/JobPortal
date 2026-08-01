import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
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
import { AdminSecurityModule } from './admin-security/admin-security.module.js';
import { LoggingThrottlerGuard } from './admin-security/logging-throttler.guard.js';
import { IpBlocklistMiddleware } from './admin-security/ip-blocklist.middleware.js';
import { AdminEmployerManagementModule } from './admin-employer-management/admin-employer-management.module.js';
import { AdminTeamModule } from './admin-team/admin-team.module.js';
import { AdminAiModule } from './admin-ai/admin-ai.module.js';
import { AdminDatabaseModule } from './admin-database/admin-database.module.js';
import { AdminCandidateManagementModule } from './admin-candidate-management/admin-candidate-management.module.js';
import { AdminJobModerationModule } from './admin-job-moderation/admin-job-moderation.module.js';
import { AdminContentModerationModule } from './admin-content-moderation/admin-content-moderation.module.js';
import { AdminProctoringModule } from './admin-proctoring/admin-proctoring.module.js';
import { SupportModule } from './support/support.module.js';
import { AdminSupportModule } from './admin-support/admin-support.module.js';

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
    AdminSecurityModule,
    AdminEmployerManagementModule,
    AdminTeamModule,
    AdminAiModule,
    AdminDatabaseModule,
    AdminCandidateManagementModule,
    AdminJobModerationModule,
    AdminContentModerationModule,
    AdminProctoringModule,
    SupportModule,
    AdminSupportModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: LoggingThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(IpBlocklistMiddleware).forRoutes('*');
  }
}
