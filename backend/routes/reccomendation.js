const express = require('express')
const authenticateUser = require('../middleware/authenticateUser')
const redis = require ('../lib/redis');


const router = express.Router();

router.get('/api/recommendations', authenticateUser, async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ error: 'User not authenticated' });
  }

  const cacheKey = `recommendations:${userId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }


    const userBooks = await prisma.userBook.findMany({
      where: { userId },
      include: { book: true },
    });

    // 🔑 If the user has no books, return an empty array immediately
    if (!userBooks.length) {
      return res.json([]);
    }

    const ownedBookIds = userBooks.map(b => b.bookId);

    const favoriteCategories = userBooks
      .flatMap(b => b.book.categories)
      .reduce((acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {});

    const favoriteAuthors = userBooks
      .map(b => b.book.author)
      .filter(Boolean);

    // Find candidate books
    const candidates = await prisma.book.findMany({
      where: { id: { notIn: ownedBookIds } },
      orderBy: { averageRating: 'desc' },
      take: 500,
    });

    // Score candidate books
    const scoredBooks = candidates.map(book => {
      let score = 0;

      const catMatch = book.categories
        .map(cat => favoriteCategories[cat] || 0)
        .reduce((a, b) => a + b, 0);
      score += catMatch * 2;

      const authorMatch = book.author && favoriteAuthors.includes(book.author) ? 3 : 0;
      score += authorMatch;

      score += book.averageRating || 0;

      return { ...book, score };
    });

    // Pick top 50
    const topBooks = scoredBooks
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    await redis.set(cacheKey, JSON.stringify(topBooks), 'EX', 24 * 60 * 60);

    res.json(topBooks);
  } catch (err) {
    console.error('[Recommendations] Error generating recommendations:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = router;