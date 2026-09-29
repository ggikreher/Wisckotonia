-- Profielfoto's horen bij het lid in de database, zodat een nieuwe deploy ze niet wist.
ALTER TABLE "Member" ADD COLUMN "imageBytes" BYTEA;
ALTER TABLE "Member" ADD COLUMN "imageType" TEXT;
