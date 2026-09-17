const express = require('express');
const prisma = require('../lib/prisma');
const authenticateUser = require('../middleware/authenticateUser');
const attachIfUserExists = require('../middleware/attachIfUserExists');
const { writeLimiter } = require('../middleware/rateLimiting');
const { cache, TTL } = require('../lib/cache');

const router = express.Router();

// POST /api/follow/:userId - Follow a user
router.post('/:userId', writeLimiter, authenticateUser, async (req, res) => {
  const followerId = req.userId;
  const followingId = req.params.userId;

  if (!followerId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (followerId === followingId) {
    return res.status(400).json({ error: 'You cannot follow yourself' });
  }

  try {
    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: followingId },
      select: { id: true, username: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Get follower info for activity
    const follower = await prisma.user.findUnique({
      where: { id: followerId },
      select: { username: true, avatar_url: true }
    });

    // Create follow relationship and activity in transaction
    const [follow] = await prisma.$transaction([
      prisma.follow.create({
        data: {
          followerId,
          followingId
        }
      }),
      prisma.userActivity.create({
        data: {
          userId: followingId,
          actorId: followerId,
          type: 'follow',
          data: {
            message: `${follower.username} started following you`,
            avatar_url: follower.avatar_url
          }
        }
      })
    ]);

    // Invalidate caches
    await cache.del(cache.generateKey('followers', followingId));
    await cache.del(cache.generateKey('following', followerId));

    res.status(201).json({
      success: true,
      message: 'Successfully followed user',
      follow
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// DELETE /api/follow/:userId - Unfollow a user
router.delete('/:userId', writeLimiter, authenticateUser, async (req, res) => {
  const followerId = req.userId;
  const followingId = req.params.userId;

  if (!followerId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check if follow relationship exists
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (!existingFollow) {
      return res.status(400).json({ error: 'Not following this user' });
    }

    // Delete follow relationship
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    // Invalidate caches
    await cache.del(cache.generateKey('followers', followingId));
    await cache.del(cache.generateKey('following', followerId));

    res.json({
      success: true,
      message: 'Successfully unfollowed user'
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// GET /api/follow/:userId/status - Check if current user follows target user
router.get('/:userId/status', authenticateUser, async (req, res) => {
  const followerId = req.userId;
  const followingId = req.params.userId;

  if (!followerId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    res.json({
      isFollowing: !!existingFollow
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// GET /api/users/:userId/followers - Get paginated followers list
router.get('/users/:userId/followers', attachIfUserExists, async (req, res) => {
  const { userId } = req.params;
  const { cursor, limit = 20 } = req.query;
  const currentUserId = req.userId;

  try {
    const cacheKey = cache.generateKey('followers', userId, cursor || 'first', limit);
    const cached = await cache.get(cacheKey);

    if (cached && !currentUserId) {
      return res.json(cached);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit) + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      }),
      include: {
        follower: {
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
          }
        }
      }
    });

    const hasMore = followers.length > parseInt(limit);
    const items = hasMore ? followers.slice(0, -1) : followers;

    // If logged in, check which users the current user is following
    let followingSet = new Set();
    if (currentUserId) {
      const userFollowing = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: items.map(f => f.follower.id) }
        },
        select: { followingId: true }
      });
      followingSet = new Set(userFollowing.map(f => f.followingId));
    }

    const result = {
      users: items.map(f => ({
        id: f.follower.id,
        username: f.follower.username,
        avatar_url: f.follower.avatar_url,
        bio: f.follower.bio,
        followerCount: f.follower._count.followers,
        followingCount: f.follower._count.following,
        isFollowing: followingSet.has(f.follower.id),
        followedAt: f.createdAt
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };

    // Only cache if no user is logged in
    if (!currentUserId) {
      await cache.set(cacheKey, result, TTL.FOLLOWERS);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// GET /api/users/:userId/following - Get paginated following list
router.get('/users/:userId/following', attachIfUserExists, async (req, res) => {
  const { userId } = req.params;
  const { cursor, limit = 20 } = req.query;
  const currentUserId = req.userId;

  try {
    const cacheKey = cache.generateKey('following', userId, cursor || 'first', limit);
    const cached = await cache.get(cacheKey);

    if (cached && !currentUserId) {
      return res.json(cached);
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit) + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1
      }),
      include: {
        following: {
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
          }
        }
      }
    });

    const hasMore = following.length > parseInt(limit);
    const items = hasMore ? following.slice(0, -1) : following;

    // If logged in, check which users the current user is following
    let followingSet = new Set();
    if (currentUserId) {
      const userFollowing = await prisma.follow.findMany({
        where: {
          followerId: currentUserId,
          followingId: { in: items.map(f => f.following.id) }
        },
        select: { followingId: true }
      });
      followingSet = new Set(userFollowing.map(f => f.followingId));
    }

    const result = {
      users: items.map(f => ({
        id: f.following.id,
        username: f.following.username,
        avatar_url: f.following.avatar_url,
        bio: f.following.bio,
        followerCount: f.following._count.followers,
        followingCount: f.following._count.following,
        isFollowing: followingSet.has(f.following.id),
        followedAt: f.createdAt
      })),
      nextCursor: hasMore ? items[items.length - 1].id : null
    };

    // Only cache if no user is logged in
    if (!currentUserId) {
      await cache.set(cacheKey, result, TTL.FOLLOWING);
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

module.exports = router;
