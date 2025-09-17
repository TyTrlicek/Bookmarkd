const { cache, TTL } = require('./lib/cache');
const prisma = require('./lib/prisma');

async function checkAndUnlockAchievements(userId, context = {}) {
  const unlocked = await prisma.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true }
  });
  const unlockedIds = unlocked.map(a => a.achievementId);

  const achievements = await prisma.achievement.findMany({
    where: {
      id: { notIn: unlockedIds }
    }
  });

  const stats = await calculateUserStats(userId);
  
  stats.isNightOwl = context.loggedAt ? new Date(context.loggedAt).getHours() === 0 : false;
  stats.isOldTbr = context.bookAddedAt ? 
    new Date(context.bookAddedAt) <= new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) : false;

  const newlyUnlocked = [];
  const achievementsToCreate = [];

  for (const ach of achievements) {
    const req = ach.requirement;
    let shouldUnlock = false;

    switch (req.type) {
      case 'books_finished':
        shouldUnlock = stats.completedBooks >= req.count;
        break;
      
      case 'unique_authors':
        shouldUnlock = stats.uniqueAuthors >= req.count;
        break;
      
      case 'unique_genres':
        shouldUnlock = stats.uniqueGenres >= req.count;
        break;
      
      case 'reviews_written':
        shouldUnlock = stats.reviewsWritten >= req.count;
        break;
      
      case 'genre_books':
        shouldUnlock = (stats.genreCounts[req.genre] || 0) >= req.count;
        break;
      
      case 'one_star_ratings':
        shouldUnlock = stats.oneStarRatings >= req.count;
        break;
      
      case 'all_rating_levels':
        shouldUnlock = stats.hasAllRatingLevels;
        break;
      
      case 'old_tbr_book':
        shouldUnlock = stats.isOldTbr;
        break;
      
      case 'midnight_log':
        shouldUnlock = stats.isNightOwl;
        break;
    }

    if (shouldUnlock) {
      achievementsToCreate.push({ userId, achievementId: ach.id });
      newlyUnlocked.push(ach);
    }
  }

  // Batch create all achievements in one call
  if (achievementsToCreate.length > 0) {
    await prisma.userAchievement.createMany({
      data: achievementsToCreate
    });
  }

  return newlyUnlocked;
}

async function calculateUserStats(userId) {
  const cacheKey = cache.generateKey('achievementStats', userId);

  // Try to get cached achievement stats first
  const cachedStats = await cache.get(cacheKey);
  if (cachedStats) {
    console.log(`[AchievementStats] Served from cache for user ${userId}`);
    return cachedStats;
  }

  console.log(`[AchievementStats] Cache miss for user ${userId}, calculating stats...`);

  // Get all user data in parallel
  const [userBooks, reviews] = await Promise.all([
    prisma.userBook.findMany({
      where: { userId },
      include: { book: { select: { author: true, categories: true } } }
    }),
    prisma.review.findMany({
      where: { userId },
      select: { id: true }
    })
  ]);

  const completedBooks = userBooks.filter(ub => ub.status === "completed");
  
  const uniqueAuthors = new Set(
    completedBooks
      .map(ub => ub.book.author)
      .filter(author => author && author.trim())
  );

  const allGenres = new Set();
  const genreCounts = {};
  
  completedBooks.forEach(ub => {
    ub.book.categories.forEach(category => {
      allGenres.add(category);
      genreCounts[category] = (genreCounts[category] || 0) + 1;
    });
  });

  const ratingsGiven = userBooks
    .map(ub => ub.rating)
    .filter(rating => rating !== null);
  
  const uniqueRatings = new Set(ratingsGiven);

  const stats = {
    completedBooks: completedBooks.length,
    uniqueAuthors: uniqueAuthors.size,
    uniqueGenres: allGenres.size,
    reviewsWritten: reviews.length,
    genreCounts: genreCounts,
    oneStarRatings: ratingsGiven.filter(rating => rating === 1).length,
    hasAllRatingLevels: [1,2,3,4,5,6,7,8,9,10].every(rating => uniqueRatings.has(rating))
  };

  // Cache the achievement stats for 30 minutes
  await cache.set(cacheKey, stats, TTL.USER_STATS);
  console.log(`[AchievementStats] Cached stats for user ${userId} (TTL=${TTL.USER_STATS}s)`);

  return stats;
}

module.exports = { checkAndUnlockAchievements }