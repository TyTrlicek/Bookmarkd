-- CreateTable
CREATE TABLE "ReviewReplyVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "replyId" TEXT NOT NULL,

    CONSTRAINT "ReviewReplyVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReviewReplyVote_userId_replyId_key" ON "ReviewReplyVote"("userId", "replyId");

-- AddForeignKey
ALTER TABLE "ReviewReplyVote" ADD CONSTRAINT "ReviewReplyVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewReplyVote" ADD CONSTRAINT "ReviewReplyVote_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "ReviewReply"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
