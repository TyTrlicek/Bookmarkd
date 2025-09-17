const express = require('express');
const cors = require('cors');
const authenticateUser = require('../middleware/authenticateUser')
const attachIfUserExists = require('../middleware/attachIfUserExists')
const { createClient } = require('@supabase/supabase-js');
const { cache, TTL } = require('../lib/cache');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const router = express.Router();

router.get('/me', authenticateUser, async (req, res) => {
    try {
      const userId = req.userId;
      const cacheKey = cache.generateKey('userProfile', userId);

      // Try cache first
      const cachedUser = await cache.get(cacheKey);
      if (cachedUser) {
        console.log(`[UserProfile] Served from cache for user ${userId}`);
        return res.json(cachedUser);
      }

      console.log(`[UserProfile] Cache miss for user ${userId}, fetching from DB...`);
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

      // Cache the user profile
      await cache.set(cacheKey, user, TTL.USER_PROFILE);
      console.log(`[UserProfile] Cached user profile for ${userId} (TTL=${TTL.USER_PROFILE}s)`);

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

  router.delete('/delete', authenticateUser, async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Use a transaction to ensure all deletions succeed together
    await prisma.$transaction(async (tx) => {
      // Delete user achievements
      await tx.userAchievement.deleteMany({
        where: { userId }
      });

      // Delete user activities (both as actor and target)
      await tx.userActivity.deleteMany({
        where: { 
          OR: [
            { userId },
            { actorId: userId }
          ]
        }
      });

      // Delete review reply votes
      await tx.reviewReplyVote.deleteMany({
        where: { userId }
      });

      // Delete review votes
      await tx.reviewVote.deleteMany({
        where: { userId }
      });

      // Delete review replies
      await tx.reviewReply.deleteMany({
        where: { userId }
      });

      // Delete reviews
      await tx.review.deleteMany({
        where: { userId }
      });

      // Delete user books
      await tx.userBook.deleteMany({
        where: { userId }
      });

      // Delete favorites
      await tx.favorite.deleteMany({
        where: { userId }
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });
 const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Failed to delete user from Supabase Auth:', authError);
    }

    // Delete profile image from storage if it exists
    const { error: storageError } = await supabaseAdmin.storage
      .from('avatar')
      .remove([`avatar/${userId}`]);

    return res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

  router.get('/stats', authenticateUser, async (req, res) => {
  const userId = req.userId;
  try {
    const cacheKey = cache.generateKey('userStats', userId);

    // Try to get cached stats first
    
    const cachedStats = await cache.get(cacheKey);
    if (cachedStats) {
      console.log(`[UserStats] Served from cache for user ${userId}`);
      return res.json(cachedStats);
    }

    console.log(`[UserStats] Cache miss for user ${userId}, calculating stats...`);

    // current year start date
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);

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

    if (!user) {
      const username = req.user.email ? req.user.email.split('@')[0] : 'user';

      await prisma.user.create({
        data: {
          id: userId,
          email: req.user?.email,
          username: username
        },
      });
    }

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

    const stats = {
      booksInCollection: collectionCount,
      avgRating: avgRatingAgg._avg.rating || 0,
      booksRatedThisYear: ratedThisYearCount,
      user
    };

    // Cache the results
    await cache.set(cacheKey, stats, TTL.USER_STATS);
    console.log(`[UserStats] Cached stats for user ${userId} (TTL=${TTL.USER_STATS}s)`);

    res.json(stats);

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