/*
  Warnings:

  - You are about to drop the column `bookRating` on the `Book` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Book" DROP COLUMN "bookRating",
ADD COLUMN     "averageRating" INTEGER NOT NULL DEFAULT 0;
