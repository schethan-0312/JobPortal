-- AlterTable
ALTER TABLE "MockInterview" ADD COLUMN     "timeExceeded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timeLimitSeconds" INTEGER NOT NULL DEFAULT 1200,
ADD COLUMN     "violations" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "SkillAssessment" ADD COLUMN     "proctored" BOOLEAN,
ADD COLUMN     "timeExceeded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "timeLimitSeconds" INTEGER NOT NULL DEFAULT 600,
ADD COLUMN     "violations" INTEGER NOT NULL DEFAULT 0;
