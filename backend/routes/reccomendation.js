const express = require('express')
const authenticateUser = require('../middleware/authenticateUser')
const redis = require ('../lib/redis');


const router = express.Router();

router.get('/api/recommendations', authenticateUser, async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    console.log('[Recommendations] No userId found in request.');
    return res.status(400).json({ error: 'User not authenticated' });
  }

  const cacheKey = `recommendations:${userId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`[Recommendations] Served from cache for userId=${userId}`);
      return res.json(JSON.parse(cached));
    }

    console.log(`[Recommendations] Generating new recommendations for userId=${userId}`);

    const userBooks = await prisma.userBook.findMany({
      where: { userId },
      include: { book: true },
    });

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

    // 3️⃣ Find candidate books (exclude already owned, order by rating)
    const candidates = await prisma.book.findMany({
      where: { id: { notIn: ownedBookIds } },
      orderBy: { averageRating: 'desc' }, // prioritize high-rated books
      take: 500,
    });

    // 4️⃣ Score candidate books
    const scoredBooks = candidates.map(book => {
      let score = 0;

      // Category match
      const catMatch = book.categories
        .map(cat => favoriteCategories[cat] || 0)
        .reduce((a, b) => a + b, 0);
      score += catMatch * 2; // weight category higher

      // Author match
      const authorMatch = book.author && favoriteAuthors.includes(book.author) ? 3 : 0;
      score += authorMatch;

      // Average rating
      const ratingScore = book.averageRating || 0;
      score += ratingScore;

      return { ...book, score };
    });

    // 5️⃣ Select top 50 books
    const topBooks = scoredBooks
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);


    // 6️⃣ Cache the recommendations per user for 24 hours
    await redis.set(cacheKey, JSON.stringify(topBooks), 'EX', 24 * 60 * 60);
    console.log(`[Recommendations] Recommendations cached for userId=${userId}`);

    res.json(topBooks);
  } catch (err) {
    console.error('[Recommendations] Error generating recommendations:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;