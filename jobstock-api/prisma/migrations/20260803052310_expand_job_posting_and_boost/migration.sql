-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "SalaryType" AS ENUM ('MONTHLY', 'ANNUAL');

-- AlterEnum
ALTER TYPE "PackageAudience" ADD VALUE 'JOB_BOOST';

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "applicationDeadline" TIMESTAMP(3),
ADD COLUMN     "benefits" TEXT,
ADD COLUMN     "department" TEXT,
ADD COLUMN     "experienceMax" INTEGER,
ADD COLUMN     "experienceMin" INTEGER,
ADD COLUMN     "featuredUntil" TIMESTAMP(3),
ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "locations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "niceToHave" TEXT,
ADD COLUMN     "openings" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "requiredSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "requirements" TEXT,
ADD COLUMN     "salaryType" "SalaryType" NOT NULL DEFAULT 'ANNUAL',
ADD COLUMN     "salaryVisible" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "screeningQuestions" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "workMode" "WorkMode";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "jobId" TEXT;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- DataMigration: backfill locations[] from the existing single location field
-- so pre-existing jobs render correctly in the new multi-location UI.
UPDATE "Job" SET "locations" = ARRAY["location"] WHERE "locations" = ARRAY[]::TEXT[];

-- DataMigration: seed the one real "Featured Job Listing" boost package so the
-- employer-submit-job boost checkout has something to purchase (packages are
-- data rows, not code, mirroring how CANDIDATE/EMPLOYER/RESUME packages exist).
INSERT INTO "Package" ("id", "audience", "name", "priceInPaisa", "featuresJson", "isActive")
VALUES ('job-boost-30d', 'JOB_BOOST', 'Featured Job Listing (30 days)', 49900, '{"durationDays": 30, "description": "Pin this job to the top of search results and mark it Featured for 30 days."}', true)
ON CONFLICT ("id") DO NOTHING;
