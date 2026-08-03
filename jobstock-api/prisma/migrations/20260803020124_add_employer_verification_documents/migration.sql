-- AlterTable
ALTER TABLE "Employer" ADD COLUMN     "documentsSubmittedAt" TIMESTAMP(3),
ADD COLUMN     "gstCertificateUrl" TEXT,
ADD COLUMN     "incorporationCertUrl" TEXT,
ADD COLUMN     "signatoryIdUrl" TEXT;
