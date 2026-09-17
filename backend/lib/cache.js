const redis = require('./redis');

class CacheManager {
  constructor() {
    this.defaultTTL = 3600; // 1 hour
    this.maxKeysPerNamespace = {
      'search': 1000,
      'rankings': 500,
      'bookRankings': 2000,
      'userStats': 2000,
      'userCollection': 1000,
      'userProfile': 1000,
      'recommendations': 500,
      'followers': 1000,
      'following': 1000,
      'publicProfile': 1000
    };
    this.initializeMonitoring();
  }

  // Initialize memory monitoring
  initializeMonitoring() {
    // Monitor Redis memory usage every 5 minutes
    setInterval(async () => {
      try {
        const memoryInfo = await redis.info('memory');
        // Remove the incorrect memory('usage') call since we get memory info from info('memory')

        // Extract used memory from info string
        // Memory monitoring - silent
      } catch (error) {
        // Memory monitoring failed silently
      }
    }, 300000); // Every 5 minutes
  }

  // Generate cache key with consistent naming
  generateKey(namespace, ...parts) {
    return `${namespace}:${parts.filter(p => p !== null && p !== undefined).join(':')}`;
  }

  // Get cached data with JSON parsing
  async get(key) {
    try {
      const cached = await redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  // Set cached data with JSON stringification
  async set(key, data, ttl = this.defaultTTL) {
    try {
      // Check namespace limits before setting
      const namespace = key.split(':')[0];
      await this.enforceNamespaceLimit(namespace);

      await redis.set(key, JSON.stringify(data), 'EX', ttl);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  // Enforce namespace key limits to prevent memory overflow
  async enforceNamespaceLimit(namespace) {
    if (!this.maxKeysPerNamespace[namespace]) return;

    try {
      const pattern = `${namespace}:*`;
      const keys = await redis.keys(pattern);
      const maxKeys = this.maxKeysPerNamespace[namespace];

      if (keys.length >= maxKeys) {
        // Remove oldest keys (Redis doesn't track creation time, so we remove first ones found)
        const keysToRemove = keys.slice(0, Math.floor(maxKeys * 0.1)); // Remove 10% of max
        if (keysToRemove.length > 0) {
          await redis.del(...keysToRemove);
        }
      }
    } catch (error) {
      // Namespace limit enforcement failed silently
    }
  }

  // Delete cache entry
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  // Delete multiple keys by pattern
  async delPattern(pattern) {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      return keys.length;
    } catch (error) {
      console.error(`Cache delete pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  // Cache wrapper function for automatic caching
  async cached(key, fetchFunction, ttl = this.defaultTTL) {
    const cached = await this.get(key);
    if (cached) {
      return cached;
    }

    const data = await fetchFunction();
    await this.set(key, data, ttl);
    return data;
  }

  // Cache invalidation helpers
  async invalidateUser(userId) {
    const patterns = [
      `user:${userId}:*`,
      `userStats:${userId}`,
      `userCollection:${userId}`,
      `userProfile:${userId}`,
      `recommendations:${userId}`,
      `userActivity:${userId}:*`,
      `followers:${userId}`,
      `following:${userId}`,
      `publicProfile:*`
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      totalDeleted += await this.delPattern(pattern);
    }

    return totalDeleted;
  }

  async invalidateBook(bookId) {
    const patterns = [
      `book:${bookId}:*`,
      `bookData:${bookId}`,
      `rankings:*`, // Rankings may change when book data changes
      `search:*`    // Search results may include this book
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      totalDeleted += await this.delPattern(pattern);
    }

    return totalDeleted;
  }

  async invalidateGlobal() {
    const patterns = [
      'trending*',
      'rankings:*',
      'search:*',
      'activity:recent*'
    ];

    let totalDeleted = 0;
    for (const pattern of patterns) {
      totalDeleted += await this.delPattern(pattern);
    }

    return totalDeleted;
  }
}

// TTL constants for different data types
const TTL = {
  USER_STATS: 1800,        // 30 minutes
  USER_PROFILE: 1800,      // 30 minutes
  USER_COLLECTION: 900,    // 15 minutes
  BOOK_DATA: 86400,        // 24 hours
  BOOK_RANKINGS: 3600,     // 1 hour
  SEARCH_RESULTS: 1800,    // 30 minutes
  OPENLIBRARY_API: 14400,  // 4 hours
  ACTIVITY_FEED: 600,      // 10 minutes
  TRENDING: 3600,          // 1 hour
  RECOMMENDATIONS: 86400,  // 24 hours
  LIST_DETAIL: 1800,       // 30 minutes
  USER_LISTS: 900,         // 15 minutes
  POPULAR_LISTS: 3600,     // 1 hour
  FOLLOWERS: 300,          // 5 minutes
  FOLLOWING: 300,          // 5 minutes
  PUBLIC_PROFILE: 600,     // 10 minutes
  USER_RECOMMENDATIONS: 3600 // 1 hour
};

module.exports = {
  cache: new CacheManager(),
  TTL
};