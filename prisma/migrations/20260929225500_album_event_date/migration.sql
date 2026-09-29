-- De datum van een fotomap bepaalt de volgorde op de pagina.
ALTER TABLE "PhotoAlbum" ADD COLUMN "eventDate" DATE;

CREATE INDEX "PhotoAlbum_eventDate_idx" ON "PhotoAlbum"("eventDate");
