-- Letterboxd Rating System Migration
-- Changes rating from Int (1-10) to Float (0.5-5.0)
-- Removes recommendation field from reviews
-- Resets all data for fresh start

-- Step 1: Reset all ratings to NULL (fresh start)
UPDATE "UserBook" SET rating = NULL;

-- Step 2: Delete all reviews (cascade will delete votes and replies automatically)
-- This is safe because of onDelete: Cascade in ReviewVote and ReviewReply
DELETE FROM "Review";

-- Step 3: Reset Book aggregate data
UPDATE "Book" SET "totalRatings" = 0, "averageRating" = 0;

-- Step 4: Change rating column type from INTEGER to DOUBLE PRECISION (Float)
ALTER TABLE "UserBook" ALTER COLUMN rating TYPE DOUBLE PRECISION;

-- Step 5: Drop the recommendation column from Review
ALTER TABLE "Review" DROP COLUMN recommendation;

-- Step 6: Drop the index that uses recommendation
DROP INDEX IF EXISTS "Review_bookId_recommendation_idx";

-- Step 7: Reset all statuses to NULL for clean slate
UPDATE "UserBook" SET status = NULL;
