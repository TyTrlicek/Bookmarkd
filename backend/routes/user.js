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

// Username validation helper
const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }

  if (trimmed.length > 20) {
    return { valid: false, error: 'Username must be 20 characters or less' };
  }

  // Only allow alphanumeric, underscore, and dash
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, underscores, and dashes' };
  }

  return { valid: true, username: trimmed };
};

router.get('/me', authenticateUser, async (req, res) => {
    try {
      const userId = req.userId;
      const cacheKey = cache.generateKey('userProfile', userId);

      // Try cache first
      const cachedUser = await cache.get(cacheKey);
      if (cachedUser) {
        return res.json(cachedUser);
      }

      let user;
      try {
        user = await prisma.user.findUnique({
          where: { id: req.userId },
          select: {
            id: true,
            email: true,
            username: true,
            bio: true,
            createdAt: true,
            avatar_url: true,
          },
        });
      } catch (dbError) {
        throw dbError;
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Cache the user profile
      try {
        await cache.set(cacheKey, user, TTL.USER_PROFILE);
      } catch (cacheError) {
        // Continue anyway
      }

      res.json(user);
    } catch (error) {
      console.error('Error in /me endpoint:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.put('/update', authLimiter, authenticateUser, async (req, res) => {
    const { username, bio, avatar_url } = req.body;
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate username if provided
    if (username !== undefined) {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        return res.status(400).json({ error: usernameValidation.error });
      }
    }

    // Validate avatar_url if provided
    if (avatar_url !== undefined && avatar_url !== null) {
      const supabaseUrl = process.env.SUPABASE_URL;
      if (!avatar_url.startsWith(supabaseUrl)) {
        return res.status(400).json({ error: 'Invalid avatar URL' });
      }
    }

    try {
      const updateData = {};
      if (username !== undefined) {
        updateData.username = validateUsername(username).username;
      }
      if (bio !== undefined) {
        // Validate bio length (max 500 characters)
        if (bio && bio.length > 500) {
          return res.status(400).json({ error: 'Bio must be 500 characters or less' });
        }
        updateData.bio = bio;
      }
      if (avatar_url !== undefined) {
        updateData.avatar_url = avatar_url;
      }

      await prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      // Invalidate user-related caches
      await cache.invalidateUser(userId);

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

    if (!id || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json({ error: usernameValidation.error });
    }

    try {
      const newUser = await prisma.user.create({
        data: {
          id,
          email,
          username: usernameValidation.username,
          avatar_url
        },
      });

      return res.status(201).json(newUser);
    } catch (err) {
      // Handle unique constraint violation (duplicate username)
      if (err.code === 'P2002' && err.meta?.target?.includes('username')) {
        return res.status(409).json({ error: 'Username already taken' });
      }
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

      // Delete follows (both as follower and following)
      await tx.follow.deleteMany({
        where: {
          OR: [
            { followerId: userId },
            { followingId: userId }
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

    // Delete all avatar files for this user from storage
    try {
      const { data: files, error: listError } = await supabaseAdmin.storage
        .from('avatar')
        .list('avatar', {
          search: userId
        });

      if (!listError && files && files.length > 0) {
        const filesToDelete = files
          .filter(f => f.name.startsWith(userId))
          .map(f => `avatar/${f.name}`);

        if (filesToDelete.length > 0) {
          await supabaseAdmin.storage
            .from('avatar')
            .remove(filesToDelete);
        }
      }
    } catch (storageError) {
      // Don't fail the whole deletion for storage cleanup issues
    }

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
      return res.json(cachedStats);
    }

    // Ensure user exists in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        bio: true,
        createdAt: true,
        avatar_url: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User profile not found. Please complete profile setup.' });
    }

    // Get all stats
    const [booksInCollection, reviewsWritten, averageRatingData] = await Promise.all([
      prisma.userBook.count({ where: { userId } }),
      prisma.review.count({ where: { userId } }),
      prisma.userBook.aggregate({
        where: {
          userId,
          rating: {
            not: null,
            gt: 0
          }
        },
        _avg: { rating: true }
      })
    ]);

    const stats = {
      booksInCollection,
      reviewsWritten,
      achievementsUnlocked: 0,
      averageRating: averageRatingData._avg.rating || 0,
      user
    };

    // Cache the results
    try {
      await cache.set(cacheKey, stats, TTL.USER_STATS);
    } catch (err) {
      // Continue anyway - caching failure shouldn't break the request
    }

    res.json(stats);

  } catch (error) {
    console.error('Error in /stats endpoint:', error);
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

// GET /api/users/search - Search users by username
router.get('/search', attachIfUserExists, async (req, res) => {
  const { q, limit = 20 } = req.query;
  const currentUserId = req.userId;

  // If no query provided, return popular users with usernames
  if (!q || q.length < 2) {
    try {
      const popularUsers = await prisma.user.findMany({
        where: {
          username: { not: null }
        },
        take: parseInt(limit),
        select: {
          id: true,
          username: true,
          avatar_url: true,
          bio: true,
          _count: {
            select: {
              followers: true,
              following: true
            }
          }
        },
        orderBy: [
          { followers: { _count: 'desc' } }
        ]
      });

      // If logged in, check which users the current user is following
      let followingSet = new Set();
      if (currentUserId) {
        const userFollowing = await prisma.follow.findMany({
          where: {
            followerId: currentUserId,
            followingId: { in: popularUsers.map(u => u.id) }
          },
          select: { followingId: true }
        });
        followingSet = new Set(userFollowing.map(f => f.followingId));
      }

      const result = popularUsers.map(user => ({
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        bio: user.bio,
        followerCount: user._count.followers,
        followingCount: user._count.following,
        isFollowing: followingSet.has(user.id)
      }));

      return res.json(result);
    } catch (error) {
      console.error('Error fetching popular users:', error);
      return res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        AND: [
          { username: { not: null } },
          {
            username: {
              contains: q,
              mode: 'insensitive'
            }
          }
        ]
      },
      take: parseInt(limit),
      select: {
        id: true,
        username: true,
        avatar_url: true,
        bio: true,
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      },
      orderBy: [
        { followers: { _count: 'desc' } }
      ]
    });

    // If logged in, check which users the current user is following
    let followingSet = new Set();
    if (currentUserId) {
      const userFollowing = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: users.map(u => u.id) }
        },
        select: { followingId: true }
      });
      followingSet = new Set(userFollowing.map(f => f.followingId));
    }

    const result = users.map(user => ({
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      bio: user.bio,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      isFollowing: followingSet.has(user.id)
    }));

    res.json(result);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// GET /api/users/u/:username - Get public profile by username
router.get('/u/:username', attachIfUserExists, async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.userId;

  try {
    const cacheKey = cache.generateKey('publicProfile', username.toLowerCase());

    // Only use cache if user is not logged in
    if (!currentUserId) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
    }

    // Try exact match first, then case-insensitive
    let user = await prisma.user.findFirst({
      where: {
        username: username
      },
      select: {
        id: true,
        username: true,
        avatar_url: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            reviews: true,
            userBooks: true,
            lists: true
          }
        }
      }
    });

    // Fall back to case-insensitive if no exact match
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          username: {
            equals: username,
            mode: 'insensitive'
          }
        },
        select: {
          id: true,
          username: true,
          avatar_url: true,
          bio: true,
          createdAt: true,
          _count: {
            select: {
              followers: true,
              following: true,
              reviews: true,
              userBooks: true,
              lists: true
            }
          }
        }
      });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if current user is following this user
    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const follow = await prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: user.id
          }
        }
      });
      isFollowing = !!follow;
    }

    // Get user's favorite books
    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      orderBy: { addedAt: 'asc' },
      take: 4,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            image: true,
            openLibraryId: true
          }
        }
      }
    });

    // Get recent rated books for this user (limited to 4 for the header section)
    const recentBooks = await prisma.userBook.findMany({
      where: {
        userId: user.id,
        rating: { gt: 0 }
      },
      orderBy: { addedAt: 'desc' },
      take: 4,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            image: true,
            openLibraryId: true
          }
        }
      }
    });

    // Get recent reviews
    const recentReviews = await prisma.review.findMany({
      where: {
        userId: user.id,
        isPrivate: false
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            image: true,
            openLibraryId: true
          }
        }
      }
    });

    // Get user's public lists
    const publicLists = await prisma.list.findMany({
      where: {
        userId: user.id,
        isPublic: true
      },
      orderBy: { updatedAt: 'desc' },
      take: 6,
      include: {
        _count: { select: { items: true } },
        items: {
          take: 4,
          orderBy: { position: 'asc' },
          include: {
            book: {
              select: {
                id: true,
                title: true,
                image: true
              }
            }
          }
        }
      }
    });

    const result = {
      id: user.id,
      username: user.username,
      avatar_url: user.avatar_url,
      bio: user.bio,
      createdAt: user.createdAt,
      followerCount: user._count.followers,
      followingCount: user._count.following,
      reviewCount: user._count.reviews,
      bookCount: user._count.userBooks,
      listCount: user._count.lists,
      isFollowing,
      favoriteBooks: favorites.map(f => ({
        id: f.book.id,
        title: f.book.title,
        author: f.book.author,
        image: f.book.image,
        openLibraryId: f.book.openLibraryId
      })),
      recentBooks: recentBooks.map(ub => ({
        id: ub.book.id,
        title: ub.book.title,
        author: ub.book.author,
        image: ub.book.image,
        openLibraryId: ub.book.openLibraryId,
        rating: ub.rating,
        addedAt: ub.addedAt
      })),
      recentReviews: recentReviews.map(r => ({
        id: r.id,
        content: r.content,
        createdAt: r.createdAt,
        helpfulCount: r.helpfulCount,
        book: r.book
      })),
      publicLists: publicLists.map(l => ({
        id: l.id,
        title: l.title,
        description: l.description,
        isRanked: l.isRanked,
        itemCount: l._count.items,
        previewBooks: l.items.map(i => ({
          id: i.book.id,
          title: i.book.title,
          image: i.book.image
        }))
      }))
    };

    // Cache if not logged in
    if (!currentUserId) {
      await cache.set(cacheKey, result, TTL.PUBLIC_PROFILE);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching public profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// GET /api/users/recommendations - Get recommended users to follow
router.get('/recommendations', authenticateUser, async (req, res) => {
  const userId = req.userId;
  const { limit = 10 } = req.query;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const cacheKey = cache.generateKey('recommendations', userId);
    const cached = await cache.get(cacheKey);

    if (cached) {
      return res.json(cached);
    }

    // Get users the current user is already following
    const alreadyFollowing = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true }
    });
    const followingIds = alreadyFollowing.map(f => f.followingId);
    followingIds.push(userId); // Exclude self

    // Strategy 1: Users followed by people you follow (mutual connections)
    let mutualRecommendations = [];
    if (followingIds.length > 1) {
      const mutualFollows = await prisma.follow.findMany({
        where: {
          followerId: { in: followingIds.filter(id => id !== userId) },
          followingId: { notIn: followingIds }
        },
        select: { followingId: true }
      });

      // Count how many of your follows are following each user
      const mutualCounts = {};
      mutualFollows.forEach(f => {
        mutualCounts[f.followingId] = (mutualCounts[f.followingId] || 0) + 1;
      });

      // Sort by mutual count and take top ones
      const sortedMutual = Object.entries(mutualCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, Math.ceil(parseInt(limit) / 2));

      if (sortedMutual.length > 0) {
        const mutualUsers = await prisma.user.findMany({
          where: {
            id: { in: sortedMutual.map(([id]) => id) },
            username: { not: null }
          },
          select: {
            id: true,
            username: true,
            avatar_url: true,
            bio: true,
            _count: { select: { followers: true, following: true } }
          }
        });

        mutualRecommendations = mutualUsers.map(u => ({
          id: u.id,
          username: u.username,
          avatar_url: u.avatar_url,
          bio: u.bio,
          followerCount: u._count.followers,
          followingCount: u._count.following,
          isFollowing: false,
          reason: 'Followed by people you follow'
        }));
      }
    }

    // Strategy 2: Popular users (most followers) that user doesn't follow
    const needed = parseInt(limit) - mutualRecommendations.length;
    const excludeIds = [...followingIds, ...mutualRecommendations.map(u => u.id)];

    const popularUsers = await prisma.user.findMany({
      where: {
        id: { notIn: excludeIds },
        username: { not: null }
      },
      orderBy: {
        followers: { _count: 'desc' }
      },
      take: needed,
      select: {
        id: true,
        username: true,
        avatar_url: true,
        bio: true,
        _count: { select: { followers: true, following: true } }
      }
    });

    const popularRecommendations = popularUsers.map(u => ({
      id: u.id,
      username: u.username,
      avatar_url: u.avatar_url,
      bio: u.bio,
      followerCount: u._count.followers,
      followingCount: u._count.following,
      isFollowing: false,
      reason: 'Popular in the community'
    }));

    const result = [...mutualRecommendations, ...popularRecommendations].slice(0, parseInt(limit));

    await cache.set(cacheKey, result, TTL.USER_RECOMMENDATIONS);

    res.json(result);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

// GET /api/users/onboarding-status - Get user's onboarding status
router.get('/onboarding-status', authenticateUser, async (req, res) => {
  const userId = req.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        hasSeenWelcome: true,
        onboardingCompletedAt: true,
        _count: {
          select: { userBooks: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const booksInCollection = user._count.userBooks;
    const isComplete = booksInCollection >= 5;

    res.json({
      hasSeenWelcome: user.hasSeenWelcome,
      onboardingCompletedAt: user.onboardingCompletedAt,
      booksInCollection,
      isComplete
    });
  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    res.status(500).json({ error: 'Failed to fetch onboarding status' });
  }
});

// PUT /api/users/onboarding - Update user's onboarding status
router.put('/onboarding', authenticateUser, async (req, res) => {
  const userId = req.userId;
  const { hasSeenWelcome, markComplete } = req.body;

  try {
    const updateData = {};

    if (hasSeenWelcome !== undefined) {
      updateData.hasSeenWelcome = hasSeenWelcome;
    }

    if (markComplete === true) {
      updateData.onboardingCompletedAt = new Date();
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        hasSeenWelcome: true,
        onboardingCompletedAt: true
      }
    });

    // Invalidate user cache
    await cache.invalidateUser(userId);

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    res.status(500).json({ error: 'Failed to update onboarding status' });
  }
});

// PUT /api/users/onboarding/reset - Reset onboarding state (DEV ONLY)
router.put('/onboarding/reset', authenticateUser, async (req, res) => {
  // Only allow in development mode
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ error: 'Not found' });
  }

  const userId = req.userId;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        hasSeenWelcome: false,
        onboardingCompletedAt: null
      },
      select: {
        hasSeenWelcome: true,
        onboardingCompletedAt: true
      }
    });

    // Invalidate user cache
    await cache.invalidateUser(userId);

    res.json({
      message: 'Onboarding state reset successfully',
      ...updatedUser
    });
  } catch (error) {
    console.error('Error resetting onboarding state:', error);
    res.status(500).json({ error: 'Failed to reset onboarding state' });
  }
});

module.exports = router;