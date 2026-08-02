-- CreateTable
CREATE TABLE "LegalDocument" (
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "LegalDocumentRevision" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalDocumentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalDocumentRevision_slug_version_idx" ON "LegalDocumentRevision"("slug", "version");

-- AddForeignKey
ALTER TABLE "LegalDocumentRevision" ADD CONSTRAINT "LegalDocumentRevision_slug_fkey" FOREIGN KEY ("slug") REFERENCES "LegalDocument"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
