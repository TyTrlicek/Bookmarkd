const express = require('express');
const cors = require('cors');
const authenticateUser = require('../middleware/authenticateUser')
const attachIfUserExists = require('../middleware/attachIfUserExists')
const { cache, TTL } = require('../lib/cache')
const prisma = require('../lib/prisma')

const router = express.Router();

router.get('/unread', authenticateUser, async (req, res) => {
    const userId = req.userId;
  
    try {
      const activities = await prisma.userActivity.findMany({
        where: {
          userId,
          type: { in: ['reply', 'like'] },
          read: false
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      });
      console.log('activities', activities)
      res.json(activities);
    } catch (error) {
      console.error('Failed to fetch activity', error);
      res.status(500).json({ error: 'Failed to fetch activity' });
    }
  });

  router.post('/mark-read', authenticateUser, async (req, res) => {
    const userId = req.userId;

    try {
      await prisma.userActivity.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });

      // Invalidate user activity caches
      const activityCacheKey = cache.generateKey('userActivity', userId);
      await cache.del(activityCacheKey);
      console.log(`[Activity] Invalidated activity cache after mark-read for user ${userId}`);

      res.status(200).json({ message: 'Marked as read' });
    } catch (err) {
      res.status(500).json({ error: 'Could not mark notifications as read' });
    }
  });

  router.get('/user-activity', authenticateUser, async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const cacheKey = cache.generateKey('userActivity', userId);

    // Try cache first
    const cachedActivity = await cache.get(cacheKey);
    if (cachedActivity) {
      console.log(`[UserActivity] Served from cache for user ${userId}`);
      return res.status(200).json(cachedActivity);
    }

    console.log(`[UserActivity] Cache miss for user ${userId}, fetching from DB...`);

    const activities = await prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Cache the activity feed
    await cache.set(cacheKey, activities, TTL.ACTIVITY_FEED);
    console.log(`[UserActivity] Cached activity for user ${userId} (TTL=${TTL.ACTIVITY_FEED}s)`);

    return res.status(200).json(activities);
  } catch (err) {
    console.error('Error fetching user activity:', err);
    return res.status(500).json({ error: 'Server error while fetching activity' });
  }
});

  router.get('/recent-activity', async (req, res) => {
  const userId = req.userId;

  try {
    const cacheKey = cache.generateKey('activity', 'recent');

    // Try cache first
    const cachedActivity = await cache.get(cacheKey);
    if (cachedActivity) {
      console.log(`[RecentActivity] Served from cache`);
      return res.status(200).json(cachedActivity);
    }

    console.log(`[RecentActivity] Cache miss, fetching from DB...`);

    const activities = await prisma.userActivity.findMany({
      where: {
    type: "add_to_list"
    },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    // Cache the recent activity feed
    await cache.set(cacheKey, activities, TTL.ACTIVITY_FEED);
    console.log(`[RecentActivity] Cached recent activity (TTL=${TTL.ACTIVITY_FEED}s)`);

    return res.status(200).json(activities);
  } catch (err) {
    console.error('Error fetching user activity:', err);
    return res.status(500).json({ error: 'Server error while fetching activity' });
  }
});

  
  
  

module.exports = router;