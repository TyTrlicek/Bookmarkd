const express = require('express');
const cors = require('cors');
const authenticateUser = require('../middleware/authenticateUser')
const attachIfUserExists = require('../middleware/attachIfUserExists')

const router = express.Router();
router.use(cors());

router.get('/me', authenticateUser, async (req, res) => {
    try {
  
      console.log("TRIGGERED")
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          avatar_url: true,
        },
      });
  
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.put('/update', authenticateUser, async (req, res) => {
    const { username, bio, avatar_url } = req.body;
    const userId = req.userId;
  
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          username,
          // bio,
          avatar_url,
        },
      });
  
      return res.status(200).json({ message: 'Successfully updated user' });
    } catch (error) {
      console.error('Error updating user profile:', error);
  
      if (
        error.code === 'P2002' &&
        error.meta?.target?.includes('username')
      ) {
        return res.status(400).json({ error: 'Username already taken' });
      }
  
      return res.status(500).json({ error: 'Failed to update user' });
    }
  });

  router.post('/create', async (req, res) => {
    const { id, email, username, avatar_url } = req.body;
  
    if (!id || !email || !username) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    try {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
  
      if (existingUser) {
        return res.status(409).json({ error: 'Username already taken' });
      }
  
      const newUser = await prisma.user.create({
        data: {
          id,
          email,
          username,
          avatar_url
        },
      });
  
      console.log(newUser);
  
      return res.status(201).json(newUser);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  });

  router.get('/stats', authenticateUser, async (req, res) => {
  const userId = req.userId;
  try {
    // current year start date
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

    console.log("TRIGGERED")
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          avatar_url: true,
        },
      });
  
      if (!user) return res.status(404).json({ error: 'User not found' });

    // Use Prisma transactions to run multiple aggregates in one round-trip
    const [collectionCount, avgRatingAgg, ratedThisYearCount] = await prisma.$transaction([
      prisma.userBook.count({
        where: { userId }
      }),

      prisma.userBook.aggregate({
        where: {
          userId,
          rating: { not: null }
        },
        _avg: { rating: true }
      }),

      prisma.userBook.count({
        where: {
          userId,
          rating: { not: null },
          addedAt: { gte: startOfYear }
        }
      })
    ]);

    res.json({
      booksInCollection: collectionCount,
      avgRating: avgRatingAgg._avg.rating || 0,
      booksRatedThisYear: ratedThisYearCount,
      user
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

router.get('/achievements', authenticateUser, async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch all achievements unlocked by this user
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: {
        achievement: {
          tier: 'asc'
        }
      }
    });

    const achievements = userAchievements.map(ua => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      tier: ua.achievement.tier,
      category: ua.achievement.category,
      unlockedAt: ua.createdAt,
      earned: true
    }));

    return res.status(200).json({ achievements });
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;