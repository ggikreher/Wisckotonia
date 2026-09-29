-- CreateEnum
CREATE TYPE "MemberCategory" AS ENUM ('WISCKO', 'LES_WISKO', 'MALT_WISCKO');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN "category" "MemberCategory";
