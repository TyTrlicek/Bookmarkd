-- CreateIndex
CREATE INDEX "Book_averageRating_totalRatings_idx" ON "public"."Book"("averageRating", "totalRatings");

-- CreateIndex
CREATE INDEX "Book_totalRatings_averageRating_idx" ON "public"."Book"("totalRatings", "averageRating");

-- CreateIndex
CREATE INDEX "Book_title_idx" ON "public"."Book"("title");

-- CreateIndex
CREATE INDEX "Book_author_idx" ON "public"."Book"("author");

-- CreateIndex
CREATE INDEX "Book_categories_idx" ON "public"."Book"("categories");

-- CreateIndex
CREATE INDEX "Book_publishedDate_idx" ON "public"."Book"("publishedDate");

-- CreateIndex
CREATE INDEX "UserActivity_userId_createdAt_idx" ON "public"."UserActivity"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_userId_read_idx" ON "public"."UserActivity"("userId", "read");

-- CreateIndex
CREATE INDEX "UserActivity_type_createdAt_idx" ON "public"."UserActivity"("type", "createdAt");

-- CreateIndex
CREATE INDEX "UserActivity_createdAt_idx" ON "public"."UserActivity"("createdAt");

-- CreateIndex
CREATE INDEX "UserBook_userId_idx" ON "public"."UserBook"("userId");

-- CreateIndex
CREATE INDEX "UserBook_bookId_idx" ON "public"."UserBook"("bookId");

-- CreateIndex
CREATE INDEX "UserBook_addedAt_idx" ON "public"."UserBook"("addedAt");

-- CreateIndex
CREATE INDEX "UserBook_userId_rating_idx" ON "public"."UserBook"("userId", "rating");
