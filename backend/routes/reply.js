const express = require('express');
const cors = require('cors');
const authenticateUser = require('../middleware/authenticateUser')

const router = express.Router();
router.use(cors());

router.post('/create-review', authenticateUser, async (req, res) => { 
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { bookId, content, recommendation, containsSpoilers, isPrivate } = req.body;

  if (!bookId || !content || !recommendation) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const book = await prisma.book.findUnique({
      where: { openLibraryId: bookId },
    });

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const review = await prisma.review.create({
      data: {
        userId,
        bookId: book.id,
        content,
        recommendation,
        containsSpoilers,
        isPrivate,
      },
    });

    return res.status(201).json(review);

  } catch (error) {
    console.error(error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return res.status(400).json({ error: 'You have already submitted a review for this book.' });
    }

    return res.status(500).json({ error: 'Error creating review' });
  }
});


router.post('/create-reply', authenticateUser, async (req, res) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    const { reviewId, content } = req.body; // Remove parentId since it's always null
    
    // Validation
    if (!reviewId || !content?.trim()) {
      return res.status(400).json({ error: 'Missing required fields: reviewId and content' });
    }
  
    if (content.length > 1000) {
      return res.status(400).json({ error: 'Reply content too long (max 1000 characters)' });
    }
  
    try {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: { book: true }
      });
  
      if (!review) {
        return res.status(404).json({ error: 'Review not found' });
      }

      const reply = await prisma.reviewReply.create({
        data: {
          userId,
          reviewId,
          parentId: null,
          content: content.trim(),
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
            },
          },
        },
      });
  
      const formattedReply = {
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        username: reply.user.username,
        userId: reply.user.id,
        helpfulCount: 0,
        avatar_url: reply.user.avatar_url,
      };

      if (review.userId !== userId) {
          await prisma.userActivity.create({
          data: {
              userId: review.userId,
              actorId: userId,
              type: 'reply',
              reviewId: review.id,
              bookId: review.book.id,
              data: {
              message: `${reply.user.username} replied to your review of ${review.book.title}.`,
              replyId: reply.id,
              avatar_url: reply.user.avatar_url,
              },
          }
          });
      }

      return res.status(201).json(formattedReply);
    } catch (error) {
      console.error('Error creating reply:', error);
      return res.status(500).json({ error: 'Failed to create reply' });
    }
  });

  router.get('/replies/:replyId/vote-status', authenticateUser, async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.userId;

    const existingVote = await prisma.reviewReplyVote.findUnique({
      where: {
        userId_replyId: {
          userId: userId,
          replyId: replyId
        }
      }
    });

    res.json({
      hasVoted: !!existingVote
    });

  } catch (error) {
    console.error('Error checking reply vote status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check reply vote status'
    });
  }
});

router.get('/reviews/:openLibraryId', async (req, res) => {
    const { openLibraryId } = req.params;
  
    try {
      // 1. Find the book by its openLibraryId
      const book = await prisma.book.findUnique({
        where: { openLibraryId },
      });
  
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
  
      // 2. Fetch reviews with ONLY direct replies (single layer)
      const reviews = await prisma.review.findMany({
        where: {
          bookId: book.id,
          isPrivate: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
            },
          },
          replies: {
            where: {
              parentId: null, // Only direct replies to reviews
            },
            orderBy: {
              createdAt: 'asc',
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatar_url: true,
                },
              },
              // Remove all the nested 'children' includes since we don't need them
            },
          },
        },
      });
  
      // 3. Simplified formatting (no recursion needed)
      const formatted = reviews.map((review) => ({
        id: review.id,
        username: review.user.username,
        userId: review.user.id,
        recommendation: review.recommendation,
        content: review.content,
        createdAt: review.createdAt,
        helpfulCount: review.helpfulCount,
        replies: review.replies.map((reply) => ({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          username: reply.user.username,
          userId: reply.user.id,
          helpfulCount: reply.helpfulCount,
          avatar_url: reply.user.avatar_url,
          isOfficial: reply.user.isOfficial || false, // Add this if you have official users
        })),
        avatar_url: review.user.avatar_url,
      }));
  
      return res.json(formatted);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

router.post('/reviews/:reviewId/vote', authenticateUser, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.userId; // authenticated voter

    // Check if the user has already voted
    const existingVote = await prisma.reviewVote.findUnique({
      where: { userId_reviewId: { userId, reviewId } },
    });

    let isHelpful = false;
    let updatedHelpfulCount = 0;

    if (existingVote) {
      // Remove vote and decrement helpfulCount atomically
      const [, updatedReview] = await prisma.$transaction([
        prisma.reviewVote.delete({ where: { id: existingVote.id } }),
        prisma.review.update({
          where: { id: reviewId },
          data: { helpfulCount: { decrement: 1 } },
          select: { helpfulCount: true },
        }),
      ]);

      isHelpful = false;
      updatedHelpfulCount = updatedReview.helpfulCount;
    } else {
      // Fetch review info for activity log
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        include: { book: true },
      });

      if (!review) {
        return res.status(404).json({ success: false, message: 'Review not found' });
      }

      // Fetch voter info
      const voter = await prisma.user.findUnique({
        where: { id: userId },
        select: { username: true, avatar_url: true },
      });

      if (!voter) {
        return res.status(404).json({ success: false, message: 'Voter not found' });
      }

      // Create vote, increment helpfulCount, and log activity in a single transaction
      const [, updatedReview] = await prisma.$transaction([
        prisma.reviewVote.create({ data: { userId, reviewId } }),
        prisma.review.update({
          where: { id: reviewId },
          data: { helpfulCount: { increment: 1 } },
          select: { helpfulCount: true },
        }),
        prisma.userActivity.create({
          data: {
            userId: review.userId, // review author
            actorId: userId,       // voter
            type: 'like',
            reviewId: review.id,
            bookId: review.book.id,
            data: {
              message: `${voter.username} Liked Your Review of ${review.book.title}.`,
              avatar_url: voter.avatar_url,
            },
          },
        }),
      ]);

      isHelpful = true;
      updatedHelpfulCount = updatedReview.helpfulCount;
    }

    // Return updated helpfulCount and vote status
    res.json({ success: true, isHelpful, helpfulCount: updatedHelpfulCount });
  } catch (error) {
    console.error('Error handling review vote:', error);
    res.status(500).json({ success: false, message: 'Failed to update vote' });
  }
});



router.get('/reviews/:reviewId/vote-status', authenticateUser, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.userId;

    const existingVote = await prisma.reviewVote.findUnique({
      where: {
        userId_reviewId: {
          userId: userId,
          reviewId: reviewId
        }
      }
    });

    res.json({
      hasVoted: !!existingVote
    });

  } catch (error) {
    console.error('Error checking vote status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check vote status'
    });
  }
});

router.post('/replies/:replyId/vote', authenticateUser, async (req, res) => {
  try {
    const { replyId } = req.params;
    const userId = req.userId;

    // Check if user already voted on this reply
    const existingVote = await prisma.reviewReplyVote.findUnique({
      where: {
        userId_replyId: { userId, replyId }
      }
    });

    let isHelpful;

    if (existingVote) {
      console.log("existing vote")
      // Remove vote
      await prisma.reviewReplyVote.delete({ where: { id: existingVote.id } });
      await prisma.reviewReply.update({
        where: { id: replyId },
        data: { helpfulCount: { decrement: 1 } }
      });
      isHelpful = false;
    } else {
      console.log("New Vote")
      // Add vote
      await prisma.reviewReplyVote.create({ data: { userId, replyId } });
      await prisma.reviewReply.update({
        where: { id: replyId },
        data: { helpfulCount: { increment: 1 } }
      });
      isHelpful = true;
    }

    // Get updated helpfulCount
    const updatedReply = await prisma.reviewReply.findUnique({
      where: { id: replyId },
      select: { helpfulCount: true }
    });

    console.log("Updated: ", updatedReply.helpfulCount)

    res.json({
      success: true,
      isHelpful,
      helpfulCount: updatedReply.helpfulCount
    });
  } catch (error) {
    console.error('Error handling reply vote:', error);
    res.status(500).json({ success: false, message: 'Failed to update reply vote' });
  }
});



      

module.exports = router;