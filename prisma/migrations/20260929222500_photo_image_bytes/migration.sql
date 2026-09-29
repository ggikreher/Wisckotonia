-- Albumfoto's horen in de database, zodat een nieuwe deploy ze niet wist.
ALTER TABLE "Photo" ADD COLUMN "imageBytes" BYTEA;
ALTER TABLE "Photo" ADD COLUMN "imageType" TEXT;
