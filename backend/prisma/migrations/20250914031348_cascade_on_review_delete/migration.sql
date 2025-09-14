-- DropForeignKey
ALTER TABLE "public"."ReviewReplyVote" DROP CONSTRAINT "ReviewReplyVote_replyId_fkey";

-- AddForeignKey
ALTER TABLE "public"."ReviewReplyVote" ADD CONSTRAINT "ReviewReplyVote_replyId_fkey" FOREIGN KEY ("replyId") REFERENCES "public"."ReviewReply"("id") ON DELETE CASCADE ON UPDATE CASCADE;
