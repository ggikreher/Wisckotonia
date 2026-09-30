CREATE TABLE "SponsorLink" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "imageBytes" BYTEA,
    "imageType" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorLink_pkey" PRIMARY KEY ("id")
);
