-- Declaraties van leden. De bon staat in de database, niet op schijf.
CREATE TABLE "Declaration" (
    "id" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "bankAccount" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "imageBytes" BYTEA,
    "imageType" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Declaration_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Declaration_createdById_idx" ON "Declaration"("createdById");
CREATE INDEX "Declaration_createdAt_idx" ON "Declaration"("createdAt");

ALTER TABLE "Declaration" ADD CONSTRAINT "Declaration_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
