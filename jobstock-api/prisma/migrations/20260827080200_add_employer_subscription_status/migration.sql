-- AlterTable
ALTER TABLE "EmployerPackageSubscription" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
