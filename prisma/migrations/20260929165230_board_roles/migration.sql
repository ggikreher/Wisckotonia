-- CreateEnum
CREATE TYPE "BoardRole" AS ENUM ('VOORZITTER', 'PENNINGMEESTER', 'SECRETARIS');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN "boardRole" "BoardRole";

-- CreateIndex
CREATE UNIQUE INDEX "Member_boardRole_key" ON "Member"("boardRole");
