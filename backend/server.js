const express = require('express');
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const prisma = require('./lib/prisma');
const authenticateUser = require('./middleware/authenticateUser')
const attachIfUserExists = require('./middleware/attachIfUserExists')
const collectionRoute = require('./routes/collection')
const rankingRoute = require('./routes/ranking')
const replyRoute = require('./routes/reply')
const userRoute = require('./routes/user')
const activityRoute = require('./routes/activity')
const favoriteRoute = require('./routes/favorite')
const recomendationRoute = require('./routes/reccomendation')
const redis = require ('./lib/redis');
const { checkAndUnlockAchievements } = require('./utils');

const openLibraryAPI = axios.create({
  baseURL: 'https://openlibrary.org',
  headers: {
    'User-Agent': 'BookMarkd/1.0 (bookmarkd.fun@gmail.com)',
    'Accept': 'application/json',
  },
});


const app = express();
const PORT = process.env.PORT || 7000;
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'https://bookmarkd.fun',  
    'https://www.bookmarkd.fun'
  ],
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(collectionRoute);
app.use(rankingRoute)
app.use(replyRoute)
app.use('/api/users', userRoute);
app.use('/api/activity', activityRoute);
app.use(favoriteRoute);
app.use(recomendationRoute)


app.get('/api/search', async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter `q`' });
  }

  try {
    // Fetch local results
    const localResults = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { author: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 50, // get more, we’ll re-rank below
    });

    if (localResults.length > 0) {
      // Score matches for relevance
      const scored = localResults.map(book => {
        let score = 0;
        if (book.title.toLowerCase() === query.toLowerCase()) score += 100; // exact title match
        else if (book.title.toLowerCase().startsWith(query.toLowerCase())) score += 50;
        else if (book.title.toLowerCase().includes(query.toLowerCase())) score += 20;

        if (book.author.toLowerCase() === query.toLowerCase()) score += 80; // exact author match
        else if (book.author.toLowerCase().startsWith(query.toLowerCase())) score += 40;
        else if (book.author.toLowerCase().includes(query.toLowerCase())) score += 15;

        return { ...book, _score: score };
      });



      // Sort by score (descending), then alphabetically
      scored.sort((a, b) => b._score - a._score || a.title.localeCompare(b.title));

      console.log('scored', scored)

      return res.json(scored.slice(0, 20));
    }

    // Fallback to OpenLibrary
    const response = await openLibraryAPI.get('/search.json', {
      params: {
        q: query,
        limit: 50,
      },
    });

    const rawBooks = response.data.docs;

    const filteredBooks = rawBooks
      .filter(book =>
        book.title &&
        book.author_name?.length &&
        book.cover_i &&
        book.key
        && book.title !== 'Study Guide'
      )
      .map(book => {
        let score = 0;
        const title = book.title.toLowerCase();
        const author = book.author_name?.[0]?.toLowerCase() || "";

        if (title === query.toLowerCase()) score += 100;
        else if (title.startsWith(query.toLowerCase())) score += 50;
        else if (title.includes(query.toLowerCase())) score += 20;

        if (author === query.toLowerCase()) score += 80;
        else if (author.startsWith(query.toLowerCase())) score += 40;
        else if (author.includes(query.toLowerCase())) score += 15;

        return {
          title: book.title || 'Unknown Title',
          author: book.author_name?.[0] || 'Unknown Author',
          image: book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`
            : null,
          description:
            typeof book.first_sentence === 'string'
              ? book.first_sentence
              : Array.isArray(book.first_sentence)
                ? book.first_sentence.join(' ')
                : 'No description available',
          pageCount: book.number_of_pages_median || null,
          publishedDate: book.first_publish_year?.toString() || 'Unknown Date',
          publisher: book.publisher?.[0] || 'Unknown Publisher',
          categories: book.subject?.slice(0, 3) || [],
          language: book.language?.[0] || 'Unknown',
          openLibraryId: book.key?.split('/').pop() || null,
          isbn: book.isbn?.[0] || null,
          _score: score + Math.min(15, (book.edition_count || 0)),
        };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 20);

    if (!filteredBooks.length) {
      return res.status(404).json({ error: 'No books found' });
    }

    console.log('filtered books', filteredBooks)

    res.json(filteredBooks);
  } catch (err) {
    console.error('Error fetching book from Open Library:', err.message);
    res.status(500).json({ error: 'Failed to fetch book data' });
  }
});

app.get('/api/trending', async (req, res) => {
  try {
    // 1️⃣ Check if cached
    const cached = await redis.get('trendingBooks');
    if (cached) {
      console.log('Serving trending books from cache');
      return res.json(JSON.parse(cached));
    }

    // 2️⃣ Recalculate trending books
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingBooksGrouped = await prisma.userBook.groupBy({
      by: ['bookId'],
      where: { addedAt: { gte: sevenDaysAgo } },
      _count: { bookId: true },
      orderBy: { _count: { bookId: 'desc' } },
      take: 10,
    });

    const trendingBookIds = trendingBooksGrouped.map((b) => b.bookId);

    const trendingBooks = await prisma.book.findMany({
      where: { id: { in: trendingBookIds } },
    });

    // Maintain the correct order
    const orderedTrendingBooks = trendingBookIds.map(
      (id) => trendingBooks.find((book) => book.id === id)
    );

    

    const cacheTTL = process.env.TRENDING_CACHE_TTL
  ? parseInt(process.env.TRENDING_CACHE_TTL)
  : 3600; // fallback to 1 hour

await redis.set(
  'trendingBooks',
  JSON.stringify(orderedTrendingBooks),
  'EX',
  cacheTTL
);


    console.log('Trending books recalculated and cached');

    res.json(orderedTrendingBooks);
  } catch (err) {
    console.error('Error fetching trending books:', err.message);
    res.status(500).json({ error: 'Failed to fetch trending books' });
  }
});


app.get('/api/bookdata', attachIfUserExists, async (req, res) => {
  const id = req.query.id;
  const userId = req.userId || null;

  if (!id) {
    return res.status(400).json({ error: 'Missing parameter `id`' });
  }

  const allowedGenres = [
    "Fantasy",
    "Romance",
    "Science Fiction",
    "Magic",
    "Mystery",
    "Thriller",
    "Supernatural",
    "Non-Fiction",
    "Adventure"
  ];
  
  const subjectToGenreMap = {
    "Fantasy": "Fantasy",
    "Fantasy fiction": "Fantasy",
    "Fiction - Fantasy": "Fantasy",
    "Fiction, fantasy, epic": "Fantasy",
    "Fiction / Fantasy / Epic": "Fantasy",
    "Fantasy - Epic": "Fantasy",
    "Fantasy - Series": "Fantasy",
    "American Fantasy fiction": "Fantasy",
    "Ficción": "Fantasy",
    "Novela": "Fantasy",
  
    "Romance": "Romance",
    "Love": "Romance",
    "Love stories": "Romance",
    "Love, fiction": "Romance",
    "Man-woman relationships": "Romance",
    "Kärlek": "Romance",
    "Shipping": "Romance",
  
    "Science Fiction": "Science Fiction",
    "Science fiction": "Science Fiction",
    "Fiction, science fiction, general": "Science Fiction",
    "Dystopia": "Science Fiction",
    "Dystopian": "Science Fiction",
  
    "Magic": "Magic",
    "Magi": "Magic",
    "Alchemy": "Magic",
    "Alquimia": "Magic",
    "Wizards": "Magic",
    "Blessing and cursing": "Magic",
  
    "Mystery": "Mystery",
    "mystery": "Mystery",
    "Heist": "Mystery",
    "Detective and mystery stories": "Mystery",
    "Brigands and robbers": "Mystery",
    "Robbers and outlaws, fiction": "Mystery",
  
    "Thriller": "Thriller",
    "Suspense": "Thriller",
    "Assassins": "Thriller",
    "Violence": "Thriller",
  
    "Supernatural": "Supernatural",
    "Fairies": "Supernatural",
    "Fairies, fiction": "Supernatural",
    "Faerie": "Supernatural",
    "Occultism": "Supernatural",
    "Ghosts": "Supernatural",
    "Älvor": "Supernatural",
  
    "Non-Fiction": "Non-Fiction",
  
    "Adventure": "Adventure",
    "Action & Adventure": "Adventure",
    "Adventure stories": "Adventure",
    "Voyages and travels": "Adventure",
    "Viajes": "Adventure",
    "FICTION / Fantasy / Action & Adventure": "Adventure"
  };
  
  function mapSubjectsToGenres(subjects) {
    const matched = new Set();
  
    for (const subject of subjects || []) {
      const genre = subjectToGenreMap[subject.trim()];
      if (genre && allowedGenres.includes(genre)) {
        matched.add(genre);
      }
    }
  
    return Array.from(matched).slice(0, 3); // Max 3 genres
  }
  


  try {
    // Check if book already exists
    const existingBook = await prisma.book.findUnique({
      where: { openLibraryId: id },
    });

    if (existingBook) {
      let ratingRank = null;
      let popularityRank = null;

      if (existingBook.totalRatings && existingBook.totalRatings > 0) {
        // Rank by average rating
        const ratingSorted = await prisma.book.findMany({
          where: { totalRatings: { gt: 0 } },
          orderBy: [
            { averageRating: 'desc' },
            { totalRatings: 'desc' },
          ],
          select: { id: true },
        });

        // Rank by popularity
        const popularitySorted = await prisma.book.findMany({
          where: { totalRatings: { gt: 0 } },
          orderBy: [
            { totalRatings: 'desc' },
            { averageRating: 'desc' },
          ],
          select: { id: true },
        });

        ratingRank = ratingSorted.findIndex(b => b.id === existingBook.id) + 1;
        popularityRank = popularitySorted.findIndex(b => b.id === existingBook.id) + 1;
      }

      let userStatus = null;

  // If user is logged in, get their status for this book
  if (userId) {
    const userBook = await prisma.userBook.findUnique({
      where: {
        userId_bookId: {
          userId,
          bookId: existingBook.id,
        },
      },
    });
    userStatus = userBook?.status ?? null;
    console.log('user', userId)
    console.log('userStatus', userStatus);
  }
      return res.json({
        ...existingBook,
        ratingRank,
        popularityRank,
        userStatus
      });
    }

    // Fetch from Open Library if not in DB
    const response = await axios.openLibraryAPI(`/works/${id}.json`);
    const book = response.data;

    // Fetch author names from author keys
    let authorNames = [];

    if (book.authors && Array.isArray(book.authors)) {
      authorNames = await Promise.all(
        book.authors.map(async (a) => {
          try {
            const authorKey = a.author?.key;
            if (!authorKey) return 'Unknown Author';

            const authorRes = await axios.openLibraryAPI(`/${authorKey}.json`);
            return authorRes.data?.name || 'Unknown Author';
          } catch (err) {
            console.error('Error fetching author:', err.message);
            return 'Unknown Author';
          }
        })
      );
    }

    let coverId = book.covers?.[0] || null;
    let isbn = null;

if (!coverId) {
  try {
    const editionsRes = await axios.openLibraryAPI(`/${id}/editions.json?limit=10`);
    const editions = editionsRes.data.entries;

    for (const ed of editions) {
      if (ed.covers?.length) {
        coverId = ed.covers[0];
        isbn = ed.isbn_10 ?? null;
        break;
      }
    }
  } catch (editionErr) {
    console.warn(`Could not fetch edition covers for ${id}:`, editionErr.message);
  }
}

if(!isbn) {
  try {
    const editionsRes = await axios.openLibraryAPI(`/${id}/editions.json?limit=10`);
    const editions = editionsRes.data.entries;

    for (const ed of editions) {
      if (ed.isbn_10) {
        isbn = ed.isbn_10 ?? null;
        break;
      }
    }
  } catch (editionErr) {
    console.warn(`Could not fetch edition covers for ${id}:`, editionErr.message);
  }
}


const coverImage = coverId
  ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
  : null;

  const filteredCategories = mapSubjectsToGenres(book.subjects);

    const bookData = {
      title: book.title || 'Unknown Title',
      authors: authorNames.length ? authorNames : ['Unknown Author'],
      description:
        typeof book.description === 'string'
          ? book.description
          : book.description?.value || 'No description available',
      image: coverImage,
      pageCount: null,
      publishedDate: book.created?.value?.split('T')[0] || null,
      publisher: 'Unknown Publisher',
      categories: filteredCategories,
      language: 'Unknown',
      openLibraryId: id,
      isbn: isbn ? String(isbn) : null,
    };

    console.log("ISBN", isbn);

    // Save to DB
    const savedBook = await prisma.book.create({
      data: {
        title: bookData.title,
        author: bookData.authors[0],
        description: bookData.description,
        image: bookData.image,
        pageCount: bookData.pageCount,
        publishedDate: bookData.publishedDate,
        publisher: bookData.publisher,
        categories: bookData.categories,
        language: bookData.language,
        openLibraryId: id,
        isbn: bookData.isbn,
      }
    });

    return res.json(savedBook);

  } catch (err) {
    console.error('Error fetching book from Open Library:', err.message);
    res.status(500).json({ error: 'Failed to fetch book data' });
  }
});

app.post('/api/user/booklist', authenticateUser, async (req, res) => {
    
    const userId = req.userId;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        // Ensure user exists in database
        let user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    id: userId,
                    email: user ? (user.email || '') : '',
                },
            });
        }

        const {
            openLibraryId,
            rating,
            comment,
            status,
        } = req.body;

        console.log("id", openLibraryId);

        if (!openLibraryId) {
            return res.status(400).json({ error: 'Missing required book fields' });
        }

        let book = await prisma.book.findUnique({ where: { openLibraryId } });
        if (!book) {
            return res.status(404).json({ error: 'Book not found in database' });
        }

        const existing = await prisma.userBook.findUnique({
            where: {
                userId_bookId: {
                    userId,
                    bookId: book.id
                },
            },
        });

        if (existing) {
            return res.status(200).json({ message: 'Book already in user list', book });
        }

        const userBook = await prisma.userBook.create({
            data: {
                userId,
                bookId: book.id,
                rating,
                comment,
                status,
            },
        });

        const achievementContext = {
            loggedAt: new Date(), // For "Night Owl" achievement
            bookAddedAt: userBook.addedAt, // For "Old Timer" achievement
            newStatus: status,
            newRating: rating,
            bookData: book 
        };
        
        const unlockedAchievements = await checkAndUnlockAchievements(userId, achievementContext);

        await prisma.userActivity.create({
            data: {
                userId,
                actorId: userId,
                type: 'add_to_list',
                bookId: book.id,
                data: {
                    status,
                    rating,
                    title: book.title,
                    message: rating > 0 ? `You rated "${book.title}" ${rating}/10` : `You added "${book.title}" to your collection`,
                    globalMessage: rating > 0 ? `${user.username} rated "${book.title}" ${rating}/10` : `${user.username} added "${book.title}" to their collection`,
                    avatar_url: user.avatar_url,
                }
            }
        });

        const result = await prisma.userBook.aggregate({
        where: {
          bookId: book.id,
          rating: { gt: 0 }, // only positive ratings
        },
        _count: { rating: true },
        _avg: { rating: true },
      });

      await prisma.book.update({
        where: { id: book.id },
        data: {
          totalRatings: result._count.rating,
          averageRating: result._avg.rating ?? 0, // fallback if null
        },
      });



              return res.status(201).json({ 
                  message: 'Book added to user list', 
                  book, 
                  unlockedAchievements
              });
              
          } catch (error) {
              console.error('Error adding book:', error);
              return res.status(500).json({ error: 'Internal server error' });
          }
      });
  
  
  

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});