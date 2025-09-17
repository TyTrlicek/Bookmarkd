const express = require('express');
const cors = require('cors');
const authenticateUser = require('../middleware/authenticateUser')
const attachIfUserExists = require('../middleware/attachIfUserExists')
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

    router.delete('/collection/:bookId', authenticateUser, async (req, res) => {
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


router.put('/collection/status', authenticateUser, async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { status, bookId } = req.body;

  try {
    if (!status || !bookId) {
      return res.status(400).json({ error: 'Missing status or bookId' });
    }

    // Update the userBook entry
    const updated = await prisma.userBook.update({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
      data: { status },
      include: { book: true }
    });

    if (!updated) {
      return res.status(404).json({ error: 'Book entry not found for user' });
    }

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
          message: `You changed "${updated.book.title}" to ${status}`
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


      router.put('/collection/rating', authenticateUser, async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { rating, bookId } = req.body;

  try {
    if (rating == null || !bookId) {
      return res.status(400).json({ error: 'Missing rating or bookId' });
    }

    const updated = await prisma.userBook.update({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
      data: { rating },
      include: { book: true } // so we can get title
    });

    if (!updated) {
      return res.status(404).json({ error: 'Book entry not found for user' });
    }

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
          message: `You changed "${updated.book.title}" to ${rating}/10`
        }
      }
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

router.put('/collection/comment', authenticateUser, async (req, res) => {
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