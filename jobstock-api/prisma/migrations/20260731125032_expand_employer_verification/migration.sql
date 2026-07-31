-- CreateEnum
CREATE TYPE "VerificationDecision" AS ENUM ('VERIFIED', 'REJECTED', 'INFO_REQUESTED');

-- AlterEnum
ALTER TYPE "EmployerStatus" ADD VALUE 'INFO_REQUESTED';

-- CreateTable
CREATE TABLE "VerificationHistoryEntry" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "decision" "VerificationDecision" NOT NULL,
    "reason" TEXT,
    "requestedDocuments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "adminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationHistoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VerificationHistoryEntry_employerId_createdAt_idx" ON "VerificationHistoryEntry"("employerId", "createdAt");

-- AddForeignKey
ALTER TABLE "VerificationHistoryEntry" ADD CONSTRAINT "VerificationHistoryEntry_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
