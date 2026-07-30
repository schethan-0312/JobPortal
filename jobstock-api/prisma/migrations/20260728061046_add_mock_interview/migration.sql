-- CreateTable
CREATE TABLE "MockInterview" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "jobRole" TEXT NOT NULL,
    "questions" JSONB NOT NULL,
    "answers" JSONB,
    "feedback" JSONB,
    "overallRating" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "MockInterview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MockInterview_candidateId_idx" ON "MockInterview"("candidateId");

-- AddForeignKey
ALTER TABLE "MockInterview" ADD CONSTRAINT "MockInterview_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "CandidateProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
