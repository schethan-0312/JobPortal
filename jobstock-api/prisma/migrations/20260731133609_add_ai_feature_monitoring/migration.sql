-- CreateEnum
CREATE TYPE "AiFeature" AS ENUM ('RESUME_SCANNER', 'CHATBOT', 'SKILL_ASSESSMENT', 'MOCK_INTERVIEW', 'CAREER_NAVIGATOR', 'SMART_MATCH', 'AUTO_SHORTLIST', 'RESUME_BUILDER');

-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "feature" "AiFeature" NOT NULL,
    "userId" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMessage" TEXT,
    "latencyMs" INTEGER NOT NULL,
    "promptTokens" INTEGER,
    "responseTokens" INTEGER,
    "totalTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiFeatureConfig" (
    "feature" "AiFeature" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "AiFeatureConfig_pkey" PRIMARY KEY ("feature")
);

-- CreateIndex
CREATE INDEX "AiUsageLog_feature_createdAt_idx" ON "AiUsageLog"("feature", "createdAt");

-- CreateIndex
CREATE INDEX "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");
