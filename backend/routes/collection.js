const express = require('express');
const cors = require('cors');
const authenticateUser = require('../middleware/authenticateUser')
const attachIfUserExists = require('../middleware/attachIfUserExists')
const { writeLimiter } = require('../middleware/rateLimiting');
const { cache, TTL } = require('../lib/cache')
const prisma = require('../lib/prisma')

const router = express.Router();


router.get('/collection', authenticateUser, async (req, res) => {
    const userId = req.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      try {
        const cacheKey = cache.generateKey('userCollection', userId);

        // Try cache first
        const cachedCollection = await cache.get(cacheKey);
        if (cachedCollection) {
          console.log(`[Collection] Served from cache for user ${userId}`);
          return res.json(cachedCollection);
        }

        console.log(`[Collection] Cache miss for user ${userId}, fetching from DB...`);

        const userBooks = await prisma.userBook.findMany({
          where: { userId },
          include: {
            book: true,
          },
        });

        // Cache the collection
        await cache.set(cacheKey, userBooks, TTL.USER_COLLECTION);
        console.log(`[Collection] Cached collection for user ${userId} (TTL=${TTL.USER_COLLECTION}s)`);

        res.json(userBooks);
      } catch (error) {
        console.error('Error fetching user collection:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    router.delete('/collection/:bookId', writeLimiter, authenticateUser, async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { bookId } = req.params;

  try {
    if (!bookId) {
      return res.status(400).json({ error: 'Missing bookId' });
    }

    // Check if the book exists in user's collection before deleting
    const existingEntry = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
      include: { book: true } // Get title for activity log
    });

    if (!existingEntry) {
      return res.status(404).json({ error: 'Book not found in user collection' });
    }

    // Delete the book from user's collection
    const deleted = await prisma.userBook.delete({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId,
        actorId: userId,
        type: 'book_removed',
        bookId: existingEntry.bookId,
        data: {
          title: existingEntry.book.title,
          message: `You removed "${existingEntry.book.title}" from your collection`
        }
      }
    });

    // Invalidate user-related caches
    await cache.invalidateUser(userId);
    await cache.invalidateBook(existingEntry.bookId);
    await cache.invalidateGlobal();
    console.log(`[Collection] Invalidated caches after book removal for user ${userId}`);

    return res.status(200).json({
      message: 'Book removed from collection successfully',
      deletedBook: {
        bookId: deleted.bookId,
        userId: deleted.userId
      }
    });

  } catch (err) {
    console.error('Delete book error:', err);

    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Book entry not found for user' });
    }

    return res.status(500).json({ error: 'Server error while deleting book' });
  }
});


router.put('/collection/status', writeLimiter, authenticateUser, async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { status, bookId: openLibraryId } = req.body;

  try {
    if (!status || !openLibraryId) {
      return res.status(400).json({ error: 'Missing status or bookId' });
    }

    // Validate status (only "to-read", "completed", or "dropped")
    if (!['to-read', 'completed', 'dropped'].includes(status)) {
      return res.status(400).json({
        error: 'Invalid status. Must be "to-read", "completed", or "dropped"'
      });
    }

    // Look up book by openLibraryId
    const book = await prisma.book.findUnique({
      where: { openLibraryId }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found in database' });
    }

    // Use upsert to create if doesn't exist, update if it does
    const updated = await prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId,
          bookId: book.id,
        },
      },
      update: {
        status
      },
      create: {
        userId,
        bookId: book.id,
        status
      },
      include: { book: true }
    });

    // Create user activity entry
    await prisma.userActivity.create({
      data: {
        userId,
        actorId: userId,
        type: 'status_update',
        bookId: updated.bookId,
        data: {
          title: updated.book.title,
          status,
          message: status === 'to-read'
            ? `You added "${updated.book.title}" to your reading list`
            : status === 'completed'
            ? `You marked "${updated.book.title}" as completed`
            : `You marked "${updated.book.title}" as dropped`
        }
      }
    });

    // Invalidate user-related caches
    await cache.invalidateUser(userId);
    console.log(`[Collection] Invalidated user caches after status update for user ${userId}`);

    return res.status(200).json({ message: 'Status updated', status });
  } catch (err) {
    console.error('JWT or DB error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});


      router.put('/collection/rating', writeLimiter, authenticateUser, async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { rating, bookId: openLibraryId } = req.body;

  try {
    if (rating == null || !openLibraryId) {
      return res.status(400).json({ error: 'Missing rating or bookId' });
    }

    // Validate rating (0.5-5.0 in half-star increments)
    if (rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
      return res.status(400).json({
        error: 'Invalid rating. Must be 0.5-5.0 in half-star increments (e.g., 0.5, 1.0, 1.5, ..., 5.0)'
      });
    }

    // Look up book by openLibraryId
    const book = await prisma.book.findUnique({
      where: { openLibraryId }
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found in database' });
    }

    // Use upsert to create if doesn't exist, update if it does
    const updated = await prisma.userBook.upsert({
      where: {
        userId_bookId: {
          userId,
          bookId: book.id,
        },
      },
      update: {
        rating,
        status: 'completed' // Auto-set to "completed" when rating
      },
      create: {
        userId,
        bookId: book.id,
        rating,
        status: 'completed'
      },
      include: { book: true } // so we can get title
    });

    // Log activity
    await prisma.userActivity.create({
      data: {
        userId,
        actorId: userId,
        type: 'rating_update',
        bookId: updated.bookId,
        data: {
          title: updated.book.title,
          rating,
          message: `You rated "${updated.book.title}" ${rating}/5 stars`
        }
      }
    });

    // Recalculate book's average rating and total ratings
    const result = await prisma.userBook.aggregate({
      where: {
        bookId: book.id,
        rating: { gt: 0 }, // only positive ratings
      },
      _count: { rating: true },
      _avg: { rating: true },
    });

    await prisma.book.update({
      where: { id: book.id },
      data: {
        totalRatings: result._count.rating,
        averageRating: result._avg.rating ?? 0, // fallback if null
      },
    });

    // Invalidate user and book-related caches (rating affects rankings)
    await cache.invalidateUser(userId);
    await cache.invalidateBook(updated.bookId);
    await cache.invalidateGlobal();
    console.log(`[Collection] Invalidated caches after rating update for user ${userId}`);

    return res.status(200).json({ message: 'Rating updated', rating });
  } catch (err) {
    console.error('JWT or DB error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.put('/collection/comment', writeLimiter, authenticateUser, async (req, res) => {
  try {
    const { comment, bookId } = req.body;
    const userId = req.userId;

    console.log('comment', comment)
    console.log('bookId', bookId);

    const updatedUserBook = await prisma.userBook.update({
      where: {
        userId_bookId: {
          userId,
          bookId
        }
      },
      data: { 
        comment: comment || null
      },
      include: {
        book: true
      }
    });

    // Invalidate user-related caches
    await cache.invalidateUser(userId);
    console.log(`[Collection] Invalidated user caches after comment update for user ${userId}`);

    res.json(updatedUserBook);
  } catch (error) {
    console.error('Error updating comment:', error);

    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Book not found in your collection' });
    }

    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;