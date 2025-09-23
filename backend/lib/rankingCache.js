const prisma = require('./prisma');
const redis = require('./redis');

class RankingCacheManager {
  constructor() {
    this.CACHE_TTL = 7200; // 2 hours
    this.REFRESH_INTERVAL = 7200000; // 2 hours in milliseconds
    this.isRunning = false;
  }

  // Start the periodic cache refresh
  startPeriodicRefresh() {
    if (this.isRunning) return;

    this.isRunning = true;
    console.log('[RankingCache] Starting periodic refresh every 2 hours');

    // Initial cache warm-up
    this.refreshAllRankingCaches();

    // Set up interval
    this.refreshInterval = setInterval(() => {
      this.refreshAllRankingCaches();
    }, this.REFRESH_INTERVAL);
  }

  // Stop the periodic refresh
  stopPeriodicRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.isRunning = false;
      console.log('[RankingCache] Stopped periodic refresh');
    }
  }

  // Generate cache key (same format as ranking.js)
  generateRankingKey(sort, limit, page, genre, year) {
    return `rankings:sort=${sort}:limit=${limit}:page=${page}:genre=${genre ?? 'all'}:year=${year ?? 'all'}`;
  }

  // Refresh all popular ranking cache combinations
  async refreshAllRankingCaches() {
    console.log('[RankingCache] Starting cache refresh...');
    const startTime = Date.now();

    try {
      const popularQueries = [
        // Most popular combinations
        { sort: 'rating', limit: 100, page: 1, genre: 'all', year: 'all' },
        { sort: 'popularity', limit: 100, page: 1, genre: 'all', year: 'all' },

        // First few pages for both sorts
        { sort: 'rating', limit: 100, page: 2, genre: 'all', year: 'all' },
        { sort: 'rating', limit: 100, page: 3, genre: 'all', year: 'all' },
        { sort: 'popularity', limit: 100, page: 2, genre: 'all', year: 'all' },

        // Popular genres (adjust based on your data)
        { sort: 'rating', limit: 100, page: 1, genre: 'Fiction', year: 'all' },
        { sort: 'rating', limit: 100, page: 1, genre: 'Science Fiction', year: 'all' },
        { sort: 'rating', limit: 100, page: 1, genre: 'Mystery', year: 'all' },

        // Recent years
        { sort: 'rating', limit: 100, page: 1, genre: 'all', year: '2020s' },
        { sort: 'rating', limit: 100, page: 1, genre: 'all', year: '2010s' },
      ];

      let refreshed = 0;
      for (const query of popularQueries) {
        try {
          await this.refreshSingleRankingCache(query);
          refreshed++;
        } catch (error) {
          console.error(`[RankingCache] Failed to refresh query:`, query, error);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`[RankingCache] Refreshed ${refreshed}/${popularQueries.length} ranking caches in ${duration}ms`);
    } catch (error) {
      console.error('[RankingCache] Error during cache refresh:', error);
    }
  }

  // Refresh a single ranking cache entry
  async refreshSingleRankingCache({ sort, limit, page, genre, year }) {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Build query (same logic as ranking.js)
    let orderBy;
    if (sort === 'rating') {
      orderBy = [
        { averageRating: 'desc' },
        { totalRatings: 'desc' }
      ];
    } else if (sort === 'popularity') {
      orderBy = [
        { totalRatings: 'desc' },
        { averageRating: 'desc' }
      ];
    } else {
      throw new Error(`Invalid sort parameter: ${sort}`);
    }

    const whereClause = {
      totalRatings: { gt: 0 },
      averageRating: { gt: 0 }
    };

    if (genre && genre !== 'all') whereClause.categories = { has: genre };
    if (year && year !== 'all') {
      if (year === '2020s') whereClause.publishedDate = { gte: '2020-01-01' };
      else if (year === '2010s') whereClause.publishedDate = { gte: '2010-01-01', lt: '2020-01-01' };
      else if (year === '2000s') whereClause.publishedDate = { gte: '2000-01-01', lt: '2010-01-01' };
      else if (year === '1990s') whereClause.publishedDate = { gte: '1990-01-01', lt: '2000-01-01' };
      else if (year === '1980s') whereClause.publishedDate = { gte: '1980-01-01', lt: '1990-01-01' };
      else if (year === 'older') whereClause.publishedDate = { lt: '1980-01-01' };
    }

    // Fetch fresh data
    const books = await prisma.book.findMany({
      where: whereClause,
      orderBy,
      skip: offset,
      take: limitNum,
      select: {
        id: true,
        openLibraryId: true,
        title: true,
        publishedDate: true,
        author: true,
        image: true,
        averageRating: true,
        totalRatings: true,
        categories: true
      }
    });

    // Update cache
    const cacheKey = this.generateRankingKey(sort, limit, page, genre, year);
    await redis.set(cacheKey, JSON.stringify(books), 'EX', this.CACHE_TTL);

    console.log(`[RankingCache] Refreshed cache for ${cacheKey}`);
    return books;
  }

  // Force refresh a specific ranking query (for manual invalidation)
  async forceRefreshRanking(sort, limit, page, genre, year) {
    console.log(`[RankingCache] Force refreshing ranking: sort=${sort}, genre=${genre}, year=${year}`);
    return await this.refreshSingleRankingCache({ sort, limit, page, genre, year });
  }

  // Get cache status
  async getCacheStatus() {
    const pattern = 'rankings:*';
    const keys = await redis.keys(pattern);
    return {
      totalRankingCaches: keys.length,
      cacheKeys: keys,
      refreshInterval: this.REFRESH_INTERVAL / 1000 / 60, // minutes
      isRunning: this.isRunning
    };
  }
}

module.exports = new RankingCacheManager();