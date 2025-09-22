const express = require('express');
const cors = require('cors');
const authenticateUser = require('../middleware/authenticateUser')
const attachIfUserExists = require('../middleware/attachIfUserExists')
const { writeLimiter } = require('../middleware/rateLimiting');
const prisma = require('../lib/prisma');

const router = express.Router();

router.get("/api/favorites", authenticateUser, async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.userId },
      include: {
        book: true,
      },
      orderBy: { addedAt: "desc" },
    });

    res.json(favorites);
  } catch (err) {
    console.error("Error fetching favorites:", err);
    res.status(500).json({ error: "Failed to fetch favorites" });
  }
});
router.post("/api/favorites", writeLimiter, authenticateUser, async (req, res) => {
  const { bookId } = req.body;

  console.log("book id", bookId);

  if (!bookId) {
    return res.status(400).json({ error: "openLibrary is required" });
  }

  try {
    const favorite = await prisma.favorite.create({
      data: {
        userId: req.userId,
        bookId,
      },
    });

    res.status(201).json(favorite);
  } catch (err) {
    if (err.code === "P2002") {
      // Prisma unique constraint violation
      return res.status(400).json({ error: "Book already in favorites" });
    }

    console.error("Error adding favorite:", err);
    res.status(500).json({ error: "Failed to add favorite" });
  }
});

// DELETE /api/favorites/:bookId
router.delete('/api/favorites/:bookId', writeLimiter, authenticateUser, async (req, res) => {
  const userId = req.userId; // set by authenticateUser middleware
  const { bookId } = req.params;

  try {
    await prisma.favorite.delete({
      where: {
        userId_bookId: {
          userId,
          bookId,
        },
      },
    });

    res.json({ success: true, message: "Book removed from favorites." });
  } catch (error) {
    console.error("Error removing favorite:", error);

    // If Prisma throws because the record doesn't exist
    if (error.code === 'P2025') {
      return res.status(404).json({ error: "Favorite not found." });
    }

    res.status(500).json({ error: "Failed to remove book from favorites." });
  }
});




module.exports = router;