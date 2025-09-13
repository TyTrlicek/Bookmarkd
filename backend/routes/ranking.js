const express = require('express');
const attachIfUserExists = require('../middleware/attachIfUserExists')
const redis = require ('../lib/redis');

const router = express.Router();

router.get('/api/rankings', attachIfUserExists, async (req, res) => {
  const {
    sort = 'rating',
    limit = 100,
    page = 1,
    genre,
    year
  } = req.query;

  // userId may be undefined if not signed in
  const userId = req.userId;

  try {
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    // Order
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
      return res.status(400).json({ error: 'Invalid sort parameter. Use "rating" or "popularity".' });
    }

    // Filter
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

    // Global cache key (user-independent)
    const cacheKey = `rankings:sort=${sort}:limit=${limit}:page=${page}:genre=${genre ?? 'all'}:year=${year ?? 'all'}`;

    // Try cache
    let cached = await redis.get(cacheKey);
    let books;
    if (cached) {
      console.log(`[Rankings] Served from cache for key=${cacheKey}`);
      books = JSON.parse(cached);
    } else {
      console.log(`[Rankings] Cache miss for key=${cacheKey}, querying DB`);

      // Fetch books
      books = await prisma.book.findMany({
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

      // Cache for 1 hour
      const cacheTTL = 3600;
      await redis.set(cacheKey, JSON.stringify(books), 'EX', cacheTTL);
      console.log(`[Rankings] Cached result for key=${cacheKey} (TTL=${cacheTTL}s)`);
    }

    // If user is signed in, fetch their ratings separately
    let userRatings = {};
    if (userId) {
      const ratings = await prisma.userBook.findMany({
        where: { userId, bookId: { in: books.map(b => b.id) } },
        select: { bookId: true, rating: true },
      });
      ratings.forEach(r => {
        userRatings[r.bookId] = r.rating;
      });
    }

    const result = books.map(book => ({
      ...book,
      userRating: userRatings[book.id] ?? null
    }));

    // Pagination metadata
    const totalBooks = await prisma.book.count({ where: whereClause });
    const totalPages = Math.ceil(totalBooks / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPreviousPage = pageNum > 1;

    res.json({
      books: result,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalBooks,
        booksPerPage: limitNum,
        hasNextPage,
        hasPreviousPage,
        startIndex: offset + 1,
        endIndex: Math.min(offset + limitNum, totalBooks)
      }
    });

  } catch (err) {
    console.error('[Rankings] Error fetching rankings:', err);
    res.status(500).json({ error: 'Failed to fetch ranked books' });
  }
});

module.exports = router;