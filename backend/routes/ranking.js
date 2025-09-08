const express = require('express');
const cors = require('cors');
const authenticateUser = require('../middleware/authenticateUser')
const attachIfUserExists = require('../middleware/attachIfUserExists')

const router = express.Router();
router.use(cors());

router.get('/api/rankings', authenticateUser, async (req, res) => {
    const { 
      sort = 'rating', 
      limit = 100, 
      page = 1,
      genre,
      year,
      search 
    } = req.query;
  
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('genre', genre);
  
    try {
      // Calculate offset for pagination
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // Cap at 100, min 1
      const offset = (pageNum - 1) * limitNum;

      let orderBy;
      if (sort === 'rating') {
        orderBy = [
          { averageRating: 'desc' },
          { totalRatings: 'desc' },
        ];
      } else if (sort === 'popularity') {
        orderBy = [
          { totalRatings: 'desc' },
          { averageRating: 'desc' },
        ];
      } else {
        return res.status(400).json({ error: 'Invalid sort parameter. Use "rating" or "popularity".' });
      }

      // Build where clause for filters
      const whereClause = {
        totalRatings: { gt: 0 },
        averageRating: { gt: 0 }
      };

      // Add genre filter
      if (genre && genre !== 'all') {
        whereClause.categories = {
          has: genre
        };
      }

      // Add year filter
      if (year && year !== 'all') {
        if (year === '2020s') {
          whereClause.publishedDate = { gte: '2020-01-01' };
        } else if (year === '2010s') {
          whereClause.publishedDate = { gte: '2010-01-01', lt: '2020-01-01' };
        } else if (year === '2000s') {
          whereClause.publishedDate = { gte: '2000-01-01', lt: '2010-01-01' };
        } else if (year === '1990s') {
          whereClause.publishedDate = { gte: '1990-01-01', lt: '2000-01-01' };
        } else if (year === '1980s') {
          whereClause.publishedDate = { gte: '1980-01-01', lt: '1990-01-01' };
        } else if (year === 'older') {
          whereClause.publishedDate = { lt: '1980-01-01' };
        }
      }

      // Add search filter
      if (search) {
        whereClause.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { author: { contains: search, mode: 'insensitive' } }
        ];
      }

      // Get total count for pagination info
      const totalBooks = await prisma.book.count({
        where: whereClause
      });

      // Get books with pagination
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
          categories: true,
          userBooks: {
            where: {
              userId: userId,
            },
            select: {
              rating: true,
            },
          },
        },
      });
  
      const result = books.map(book => ({
        ...book,
        userRating: book.userBooks[0]?.rating ?? null,
        userBooks: undefined,
      }));

      // Calculate pagination metadata
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
      console.error('Error fetching ranked books:', err.message);
      res.status(500).json({ error: 'Failed to fetch ranked books' });
    }
});

module.exports = router;