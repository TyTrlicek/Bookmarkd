-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "categories" TEXT[],
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "pageCount" INTEGER,
ADD COLUMN     "publishedDate" TEXT,
ADD COLUMN     "publisher" TEXT;
