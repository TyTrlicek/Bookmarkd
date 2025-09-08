-- AlterTable
ALTER TABLE "ReviewReply" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "ReviewReply_parentId_idx" ON "ReviewReply"("parentId");

-- AddForeignKey
ALTER TABLE "ReviewReply" ADD CONSTRAINT "ReviewReply_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ReviewReply"("id") ON DELETE SET NULL ON UPDATE CASCADE;
