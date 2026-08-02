-- CreateTable
CREATE TABLE "SeoSetting" (
    "path" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "ogImageUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "SeoSetting_pkey" PRIMARY KEY ("path")
);
