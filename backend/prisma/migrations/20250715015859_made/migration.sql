/*
  Warnings:

  - You are about to drop the column `googleId` on the `Book` table. All the data in the column will be lost.
  - Made the column `openLibraryId` on table `Book` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Book_googleId_key";

-- AlterTable
ALTER TABLE "Book" DROP COLUMN "googleId",
ALTER COLUMN "openLibraryId" SET NOT NULL;
