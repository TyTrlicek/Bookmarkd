/*
  Warnings:

  - You are about to drop the column `read` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "read";

-- AlterTable
ALTER TABLE "UserActivity" ADD COLUMN     "read" BOOLEAN NOT NULL DEFAULT false;
