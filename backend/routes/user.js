const express = require('express');
const cors = require('cors');
const prisma = require('../lib/prisma');
const authenticateUser = require('../middleware/authenticateUser')
const attachIfUserExists = require('../middleware/attachIfUserExists')
const { authLimiter, writeLimiter } = require('../middleware/rateLimiting');
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

      console.log(`[UserProfile] ⚠️ Cache miss for user ${userId}, fetching from DB...`);
      console.log(`[UserProfile] About to execute prisma.user.findUnique...`);
      console.log(`[UserProfile] Query params: { where: { id: "${req.userId}" } }`);

      let user;
      try {
        user = await prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            id: true,
            email: true,
            username: true,
            createdAt: true,
            avatar_url: true,
          },
        });
        console.log(`[UserProfile] ✅ Query completed. User found: ${!!user}`);
      } catch (dbError) {
        console.error(`[UserProfile] ❌ DATABASE ERROR in findUnique:`);
        console.error('Error name:', dbError.name);
        console.error('Error message:', dbError.message);
        console.error('Stack:', dbError.stack);
        throw dbError;
      }

      if (!user) {
        console.log(`[UserProfile] User not found, returning 404`);
        return res.status(404).json({ error: 'User not found' });
      }

      // Cache the user profile
      console.log(`[UserProfile] Caching user profile...`);
      try {
        await cache.set(cacheKey, user, TTL.USER_PROFILE);
        console.log(`[UserProfile] ✅ Cached user profile for ${userId} (TTL=${TTL.USER_PROFILE}s)`);
      } catch (cacheError) {
        console.error(`[UserProfile] ⚠️ Cache write failed:`, cacheError);
        // Continue anyway
      }

      console.log(`[UserProfile] Sending response...`);
      res.json(user);
      console.log(`[UserProfile] ✅ Response sent`);
    } catch (error) {
      console.error('❌ [UserProfile] CRITICAL ERROR in /me endpoint:');
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Stack trace:', error.stack);
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.put('/update', writeLimiter, authenticateUser, async (req, res) => {
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

      // Invalidate user-related caches
      await cache.invalidateUser(userId);
      console.log(`[UserUpdate] Invalidated caches for user ${userId}`);

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

  router.post('/create', authLimiter, async (req, res) => {
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

  router.delete('/delete', authLimiter, authenticateUser, async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Use a transaction to ensure all deletions succeed together
    await prisma.$transaction(async (tx) => {
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
    console.log(`[UserStats] 🔍 Starting stats request for user ${userId}`);

    const cacheKey = cache.generateKey('userStats', userId);
    console.log(`[UserStats] Generated cache key: ${cacheKey}`);

    // Try to get cached stats first
    console.log(`[UserStats] Attempting cache lookup...`);
    const cachedStats = await cache.get(cacheKey);
    if (cachedStats) {
      console.log(`[UserStats] ✅ Served from cache for user ${userId}`);
      return res.json(cachedStats);
    }

    console.log(`[UserStats] ⚠️ Cache miss for user ${userId}, calculating stats...`);

    // Ensure user exists in database
    console.log(`[UserStats] Step 1: Looking up user in database...`);
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          createdAt: true,
          avatar_url: true,
        },
      });
      console.log(`[UserStats] User lookup complete. Found: ${!!user}`);
    } catch (err) {
      console.error(`[UserStats] ❌ Error in user lookup:`, err);
      throw err;
    }

    if (!user) {
      console.log(`[UserStats] User not found in database`);
      return res.status(404).json({ error: 'User profile not found. Please complete profile setup.' });
    }

    console.log(`[UserStats] Step 2: Fetching parallel stats (books, reviews, ratings)...`);

    // Get all stats in parallel with individual error handling
    let booksInCollection, reviewsWritten, averageRatingData;

    try {
      console.log(`[UserStats] Querying userBook.count...`);
      booksInCollection = await prisma.userBook.count({
        where: { userId }
      });
      console.log(`[UserStats] ✅ Books count: ${booksInCollection}`);
    } catch (err) {
      console.error(`[UserStats] ❌ Error counting books:`, err);
      throw err;
    }

    try {
      console.log(`[UserStats] Querying review.count...`);
      reviewsWritten = await prisma.review.count({
        where: { userId }
      });
      console.log(`[UserStats] ✅ Reviews count: ${reviewsWritten}`);
    } catch (err) {
      console.error(`[UserStats] ❌ Error counting reviews:`, err);
      throw err;
    }

    try {
      console.log(`[UserStats] Querying userBook.aggregate for average rating...`);
      averageRatingData = await prisma.userBook.aggregate({
        where: {
          userId,
          rating: {
            not: null,
            gt: 0
          }
        },
        _avg: { rating: true }
      });
      console.log(`[UserStats] ✅ Average rating data:`, averageRatingData);
    } catch (err) {
      console.error(`[UserStats] ❌ Error aggregating ratings:`, err);
      throw err;
    }

    console.log(`[UserStats] Step 3: Building stats object...`);
    const stats = {
      booksInCollection,
      reviewsWritten,
      achievementsUnlocked: 0, // Achievements feature removed
      averageRating: averageRatingData._avg.rating || 0,
      user
    };
    console.log(`[UserStats] ✅ Stats object created:`, stats);

    // Cache the results
    console.log(`[UserStats] Step 4: Caching results...`);
    try {
      await cache.set(cacheKey, stats, TTL.USER_STATS);
      console.log(`[UserStats] ✅ Cached stats for user ${userId} (TTL=${TTL.USER_STATS}s)`);
    } catch (err) {
      console.error(`[UserStats] ⚠️ Warning: Failed to cache stats:`, err);
      // Continue anyway - caching failure shouldn't break the request
    }

    console.log(`[UserStats] Step 5: Sending response...`);
    res.json(stats);
    console.log(`[UserStats] ✅ Response sent successfully`);

  } catch (error) {
    console.error('❌ [UserStats] CRITICAL ERROR in /stats endpoint:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

// Achievement feature removed - endpoint disabled
// router.get('/achievements', authenticateUser, async (req, res) => {
//   const userId = req.userId;

//   if (!userId) {
//     return res.status(401).json({ error: 'Unauthorized' });
//   }

//   try {
//     // Fetch all achievements unlocked by this user
//     const userAchievements = await prisma.userAchievement.findMany({
//       where: { userId },
//       include: {
//         achievement: true,
//       },
//       orderBy: {
//         achievement: {
//           tier: 'asc'
//         }
//       }
//     });

//     const achievements = userAchievements.map(ua => ({
//       id: ua.achievement.id,
//       name: ua.achievement.name,
//       description: ua.achievement.description,
//       tier: ua.achievement.tier,
//       category: ua.achievement.category,
//       unlockedAt: ua.createdAt,
//       earned: true
//     }));

//     return res.status(200).json({ achievements });
//   } catch (error) {
//     console.error('Error fetching user achievements:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });


module.exports = router;