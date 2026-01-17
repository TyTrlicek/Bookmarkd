const express = require('express');
const authenticateUser = require('../middleware/authenticateUser');
const attachIfUserExists = require('../middleware/attachIfUserExists');
const { writeLimiter } = require('../middleware/rateLimiting');
const prisma = require('../lib/prisma');
const { cache, TTL } = require('../lib/cache');

const router = express.Router();

const MAX_BOOKS_PER_LIST = 250;

// Create a new list
router.post('/', writeLimiter, authenticateUser, async (req, res) => {
  const { title, description, isPublic = true, isRanked = false } = req.body;

  if (!title || title.trim().length === 0) {
    return res.status(400).json({ error: 'Title is required' });
  }

  if (title.length > 100) {
    return res.status(400).json({ error: 'Title must be 100 characters or less' });
  }

  if (description && description.length > 500) {
    return res.status(400).json({ error: 'Description must be 500 characters or less' });
  }

  try {
    const list = await prisma.list.create({
      data: {
        userId: req.userId,
        title: title.trim(),
        description: description?.trim() || null,
        isPublic: Boolean(isPublic),
        isRanked: Boolean(isRanked),
      },
      include: {
        user: {
          select: { id: true, username: true, avatar_url: true }
        },
        _count: { select: { items: true } }
      }
    });

    // Invalidate user lists cache
    await cache.del(cache.generateKey('userLists', req.userId));

    res.status(201).json(list);
  } catch (err) {
    console.error('Error creating list:', err);
    res.status(500).json({ error: 'Failed to create list' });
  }
});

// Get current user's lists
router.get('/', authenticateUser, async (req, res) => {
  try {
    const cacheKey = cache.generateKey('userLists', req.userId);
    const cached = await cache.get(cacheKey);

    if (cached) {
      console.log(`[Lists] Served user lists from cache for user ${req.userId}`);
      return res.json(cached);
    }

    const lists = await prisma.list.findMany({
      where: { userId: req.userId },
      include: {
        user: {
          select: { id: true, username: true, avatar_url: true }
        },
        _count: { select: { items: true } },
        items: {
          take: 4,
          orderBy: { position: 'asc' },
          include: {
            book: {
              select: { id: true, title: true, image: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Format preview books
    const formattedLists = lists.map(list => ({
      ...list,
      previewBooks: list.items.map(item => item.book),
      items: undefined
    }));

    await cache.set(cacheKey, formattedLists, TTL.USER_LISTS);
    console.log(`[Lists] Cached user lists for user ${req.userId}`);

    res.json(formattedLists);
  } catch (err) {
    console.error('Error fetching user lists:', err);
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

// Get another user's public lists
router.get('/user/:userId', attachIfUserExists, async (req, res) => {
  const { userId } = req.params;
  const isOwner = req.userId === userId;

  try {
    const lists = await prisma.list.findMany({
      where: {
        userId,
        ...(isOwner ? {} : { isPublic: true })
      },
      include: {
        user: {
          select: { id: true, username: true, avatar_url: true }
        },
        _count: { select: { items: true } },
        items: {
          take: 4,
          orderBy: { position: 'asc' },
          include: {
            book: {
              select: { id: true, title: true, image: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const formattedLists = lists.map(list => ({
      ...list,
      previewBooks: list.items.map(item => item.book),
      items: undefined
    }));

    res.json(formattedLists);
  } catch (err) {
    console.error('Error fetching user lists:', err);
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

// Discover public lists (paginated)
router.get('/discover', attachIfUserExists, async (req, res) => {
  const { sort = 'recent', page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    let orderBy;
    switch (sort) {
      case 'popular':
        orderBy = { items: { _count: 'desc' } };
        break;
      case 'recent':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [lists, total] = await Promise.all([
      prisma.list.findMany({
        where: { isPublic: true },
        include: {
          user: {
            select: { id: true, username: true, avatar_url: true }
          },
          _count: { select: { items: true } },
          items: {
            take: 4,
            orderBy: { position: 'asc' },
            include: {
              book: {
                select: { id: true, title: true, image: true }
              }
            }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.list.count({ where: { isPublic: true } })
    ]);

    const formattedLists = lists.map(list => ({
      ...list,
      previewBooks: list.items.map(item => item.book),
      items: undefined
    }));

    res.json({
      lists: formattedLists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching discover lists:', err);
    res.status(500).json({ error: 'Failed to fetch lists' });
  }
});

// Get popular lists for homepage (cached)
router.get('/popular', async (req, res) => {
  try {
    const cacheKey = 'lists:popular';
    const cached = await cache.get(cacheKey);

    if (cached) {
      console.log('[Lists] Served popular lists from cache');
      return res.json(cached);
    }

    const lists = await prisma.list.findMany({
      where: {
        isPublic: true,
        items: { some: {} } // Only lists with at least one book
      },
      include: {
        user: {
          select: { id: true, username: true, avatar_url: true }
        },
        _count: { select: { items: true } },
        items: {
          take: 4,
          orderBy: { position: 'asc' },
          include: {
            book: {
              select: { id: true, title: true, image: true }
            }
          }
        }
      },
      orderBy: { items: { _count: 'desc' } },
      take: 10
    });

    const formattedLists = lists.map(list => ({
      ...list,
      previewBooks: list.items.map(item => item.book),
      items: undefined
    }));

    await cache.set(cacheKey, formattedLists, TTL.POPULAR_LISTS);
    console.log('[Lists] Cached popular lists');

    res.json(formattedLists);
  } catch (err) {
    console.error('Error fetching popular lists:', err);
    res.status(500).json({ error: 'Failed to fetch popular lists' });
  }
});

// Get single list with all books
router.get('/:id', attachIfUserExists, async (req, res) => {
  const { id } = req.params;

  try {
    const list = await prisma.list.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, username: true, avatar_url: true }
        },
        _count: { select: { items: true } },
        items: {
          orderBy: { position: 'asc' },
          include: {
            book: true
          }
        }
      }
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    // Check privacy
    if (!list.isPublic && list.userId !== req.userId) {
      return res.status(403).json({ error: 'This list is private' });
    }

    res.json(list);
  } catch (err) {
    console.error('Error fetching list:', err);
    res.status(500).json({ error: 'Failed to fetch list' });
  }
});

// Update list metadata
router.put('/:id', writeLimiter, authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { title, description, isPublic, isRanked } = req.body;

  try {
    // Verify ownership
    const existing = await prisma.list.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'List not found' });
    }

    if (existing.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to edit this list' });
    }

    // Validate inputs
    if (title !== undefined) {
      if (title.trim().length === 0) {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      if (title.length > 100) {
        return res.status(400).json({ error: 'Title must be 100 characters or less' });
      }
    }

    if (description !== undefined && description.length > 500) {
      return res.status(400).json({ error: 'Description must be 500 characters or less' });
    }

    const updated = await prisma.list.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isPublic !== undefined && { isPublic: Boolean(isPublic) }),
        ...(isRanked !== undefined && { isRanked: Boolean(isRanked) })
      },
      include: {
        user: {
          select: { id: true, username: true, avatar_url: true }
        },
        _count: { select: { items: true } }
      }
    });

    // Invalidate caches
    await cache.del(cache.generateKey('userLists', req.userId));
    await cache.del('lists:popular');

    res.json(updated);
  } catch (err) {
    console.error('Error updating list:', err);
    res.status(500).json({ error: 'Failed to update list' });
  }
});

// Delete list
router.delete('/:id', writeLimiter, authenticateUser, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify ownership
    const existing = await prisma.list.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'List not found' });
    }

    if (existing.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this list' });
    }

    await prisma.list.delete({ where: { id } });

    // Invalidate caches
    await cache.del(cache.generateKey('userLists', req.userId));
    await cache.del('lists:popular');

    res.json({ success: true, message: 'List deleted' });
  } catch (err) {
    console.error('Error deleting list:', err);
    res.status(500).json({ error: 'Failed to delete list' });
  }
});

// Add book to list
router.post('/:id/books', writeLimiter, authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { bookId, openLibraryId, bookData } = req.body;

  // Need either bookId or openLibraryId
  if (!bookId && !openLibraryId) {
    return res.status(400).json({ error: 'bookId or openLibraryId is required' });
  }

  try {
    // Verify ownership and get current item count
    const list = await prisma.list.findUnique({
      where: { id },
      select: {
        userId: true,
        _count: { select: { items: true } }
      }
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    if (list.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to modify this list' });
    }

    // Check 250 book limit
    if (list._count.items >= MAX_BOOKS_PER_LIST) {
      return res.status(400).json({ error: `Lists are limited to ${MAX_BOOKS_PER_LIST} books` });
    }

    // Try to find the book - first by bookId, then by openLibraryId
    let book = null;

    if (bookId) {
      book = await prisma.book.findUnique({
        where: { id: bookId },
        select: { id: true }
      });
    }

    // If not found by bookId, try openLibraryId
    if (!book && openLibraryId) {
      book = await prisma.book.findUnique({
        where: { openLibraryId: openLibraryId },
        select: { id: true }
      });
    }

    // If still not found but we have bookData, create the book
    if (!book && openLibraryId && bookData) {
      try {
        book = await prisma.book.create({
          data: {
            title: bookData.title || 'Unknown Title',
            author: bookData.author || 'Unknown Author',
            description: bookData.description || null,
            image: bookData.image || null,
            pageCount: bookData.pageCount || null,
            publishedDate: bookData.publishedDate || null,
            publisher: bookData.publisher || null,
            categories: bookData.categories || [],
            language: bookData.language || 'Unknown',
            openLibraryId: openLibraryId,
            isbn: bookData.isbn || null,
          },
          select: { id: true }
        });
        console.log(`[Lists] Created new book ${book.id} from openLibraryId ${openLibraryId}`);
      } catch (createErr) {
        // Book might have been created by another request, try to find it again
        if (createErr.code === 'P2002') {
          book = await prisma.book.findUnique({
            where: { openLibraryId: openLibraryId },
            select: { id: true }
          });
        } else {
          throw createErr;
        }
      }
    }

    if (!book) {
      return res.status(404).json({ error: 'Book not found. Please view the book details page first to add it to the database.' });
    }

    // Get next position
    const maxPosition = await prisma.listItem.aggregate({
      where: { listId: id },
      _max: { position: true }
    });
    const nextPosition = (maxPosition._max.position ?? -1) + 1;

    // Add the book (use book.id which is the resolved database ID)
    const item = await prisma.listItem.create({
      data: {
        listId: id,
        bookId: book.id,
        position: nextPosition
      },
      include: {
        book: true
      }
    });

    // Update list's updatedAt
    await prisma.list.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    // Invalidate caches
    await cache.del(cache.generateKey('userLists', req.userId));
    await cache.del('lists:popular');

    res.status(201).json(item);
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'Book already in this list' });
    }
    console.error('Error adding book to list:', err);
    res.status(500).json({ error: 'Failed to add book to list' });
  }
});

// Remove book from list
router.delete('/:id/books/:bookId', writeLimiter, authenticateUser, async (req, res) => {
  const { id, bookId } = req.params;

  try {
    // Verify ownership
    const list = await prisma.list.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    if (list.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to modify this list' });
    }

    // Get the item to be removed
    const itemToRemove = await prisma.listItem.findUnique({
      where: {
        listId_bookId: { listId: id, bookId }
      },
      select: { position: true }
    });

    if (!itemToRemove) {
      return res.status(404).json({ error: 'Book not found in list' });
    }

    // Delete the item
    await prisma.listItem.delete({
      where: {
        listId_bookId: { listId: id, bookId }
      }
    });

    // Reorder remaining items
    await prisma.listItem.updateMany({
      where: {
        listId: id,
        position: { gt: itemToRemove.position }
      },
      data: {
        position: { decrement: 1 }
      }
    });

    // Update list's updatedAt
    await prisma.list.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    // Invalidate caches
    await cache.del(cache.generateKey('userLists', req.userId));
    await cache.del('lists:popular');

    res.json({ success: true, message: 'Book removed from list' });
  } catch (err) {
    console.error('Error removing book from list:', err);
    res.status(500).json({ error: 'Failed to remove book from list' });
  }
});

// Reorder list items
router.put('/:id/reorder', writeLimiter, authenticateUser, async (req, res) => {
  const { id } = req.params;
  const { bookIds } = req.body; // Array of book IDs in new order

  if (!Array.isArray(bookIds) || bookIds.length === 0) {
    return res.status(400).json({ error: 'bookIds array is required' });
  }

  try {
    // Verify ownership
    const list = await prisma.list.findUnique({
      where: { id },
      select: { userId: true }
    });

    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }

    if (list.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized to modify this list' });
    }

    // Update positions in a transaction
    await prisma.$transaction(
      bookIds.map((bookId, index) =>
        prisma.listItem.update({
          where: {
            listId_bookId: { listId: id, bookId }
          },
          data: { position: index }
        })
      )
    );

    // Update list's updatedAt
    await prisma.list.update({
      where: { id },
      data: { updatedAt: new Date() }
    });

    // Invalidate caches
    await cache.del(cache.generateKey('userLists', req.userId));

    res.json({ success: true, message: 'List reordered' });
  } catch (err) {
    console.error('Error reordering list:', err);
    res.status(500).json({ error: 'Failed to reorder list' });
  }
});

module.exports = router;
