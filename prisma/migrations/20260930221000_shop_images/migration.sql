CREATE TABLE "ShopImage" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "imageBytes" BYTEA NOT NULL,
    "imageType" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopImage_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ShopImage" ("id", "itemId", "imageBytes", "imageType", "sortOrder", "createdAt")
SELECT md5(random()::text || "id"), "id", "imageBytes", COALESCE("imageType", 'image/jpeg'), 0, CURRENT_TIMESTAMP
FROM "ShopItem"
WHERE "imageBytes" IS NOT NULL;

ALTER TABLE "ShopItem" DROP COLUMN "imageBytes";
ALTER TABLE "ShopItem" DROP COLUMN "imageType";

CREATE INDEX "ShopImage_itemId_idx" ON "ShopImage"("itemId");

ALTER TABLE "ShopImage" ADD CONSTRAINT "ShopImage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ShopItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
