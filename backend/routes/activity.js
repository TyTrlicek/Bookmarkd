const express = require('express');
const cors = require('cors');
const authenticateUser = require('../middleware/authenticateUser')
const attachIfUserExists = require('../middleware/attachIfUserExists')

const router = express.Router();
router.use(cors());

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
    const activities = await prisma.userActivity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.status(200).json(activities);
  } catch (err) {
    console.error('Error fetching user activity:', err);
    return res.status(500).json({ error: 'Server error while fetching activity' });
  }
});

  router.get('/recent-activity', async (req, res) => {
  const userId = req.userId;

  try {
    const activities = await prisma.userActivity.findMany({
      where: {
    type: "add_to_list"
    },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return res.status(200).json(activities);
  } catch (err) {
    console.error('Error fetching user activity:', err);
    return res.status(500).json({ error: 'Server error while fetching activity' });
  }
});

  
  
  

module.exports = router;