-- CreateEnum
CREATE TYPE "JobRunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "JobRunRecord" (
    "id" TEXT NOT NULL,
    "jobName" TEXT NOT NULL,
    "status" "JobRunStatus" NOT NULL,
    "triggeredBy" TEXT NOT NULL,
    "detail" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "JobRunRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JobRunRecord_jobName_startedAt_idx" ON "JobRunRecord"("jobName", "startedAt");
