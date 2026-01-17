const express = require('express');
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const prisma = require('./lib/prisma');
const authenticateUser = require('./middleware/authenticateUser')
const attachIfUserExists = require('./middleware/attachIfUserExists')
const { generalLimiter, searchLimiter, writeLimiter } = require('./middleware/rateLimiting');
const collectionRoute = require('./routes/collection')
const rankingRoute = require('./routes/ranking')
const replyRoute = require('./routes/reply')
const userRoute = require('./routes/user')
const activityRoute = require('./routes/activity')
const favoriteRoute = require('./routes/favorite')
const recomendationRoute = require('./routes/reccomendation')
const listRoute = require('./routes/list')
const redis = require ('./lib/redis');
const { cache, TTL } = require('./lib/cache');
const rankingCache = require('./lib/rankingCache');

// Process-level error handlers for crash debugging
process.on('uncaughtException', (error) => {
  console.error('🔴 UNCAUGHT EXCEPTION - Process will exit!');
  console.error('Error name:', error.name);
  console.error('Error message:', error.message);
  console.error('Stack trace:', error.stack);
  console.error('Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔴 UNHANDLED REJECTION - Process may crash!');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  if (reason instanceof Error) {
    console.error('Stack trace:', reason.stack);
  }
});

process.on('SIGTERM', () => {
  console.log('📛 SIGTERM signal received - graceful shutdown');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📛 SIGINT signal received - graceful shutdown');
  process.exit(0);
});

process.on('SIGSEGV', () => {
  console.error('🔴 SIGSEGV (Segmentation Fault) - Critical error!');
  console.error('Process memory:', process.memoryUsage());
  process.exit(139);
});

const openLibraryAPI = axios.create({
  baseURL: 'https://openlibrary.org',
  headers: {
    'User-Agent': 'Bookmarkd/1.0 (bookmarkd.fun@gmail.com)',
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

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use(express.json());

// Apply general rate limiting to all routes
app.use(generalLimiter);

app.use(collectionRoute);
app.use(rankingRoute)
app.use(replyRoute)
app.use('/api/users', userRoute);
app.use('/api/activity', activityRoute);
app.use(favoriteRoute);
app.use(recomendationRoute)
app.use('/api/lists', listRoute);


app.get('/api/search', async (req, res) => {
  let query = req.query.q;

  let externalSearch = false;

  if (!query) {
    return res.status(400).json({ error: 'Missing query parameter `q`' });
  }

  if(query.endsWith('.'))
  {
    externalSearch = true;
  }

  try {

    if(!externalSearch)
      {
    // Create cache key for this search query
    const searchCacheKey = cache.generateKey('search', 'local', query.toLowerCase().trim());

    // Try to get cached search results first
    const cachedResults = await cache.get(searchCacheKey);
    if (cachedResults) {
      console.log(`[Search] Served local results from cache for query: "${query}"`);
      return res.json(cachedResults);
    }

    console.log(`[Search] Cache miss for local search: "${query}", querying database...`);

    // Fetch local results - prioritize English books
    const localResults = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { author: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 100, // get more so we can filter/prioritize English books
    });

    if (localResults.length > 0) {
      // Score matches for relevance
      const scored = localResults.map(book => {
        let score = 0;

        // Title matching
        if (book.title.toLowerCase() === query.toLowerCase()) score += 100; // exact title match
        else if (book.title.toLowerCase().startsWith(query.toLowerCase())) score += 50;
        else if (book.title.toLowerCase().includes(query.toLowerCase())) score += 20;

        // Author matching
        if (book.author.toLowerCase() === query.toLowerCase()) score += 80; // exact author match
        else if (book.author.toLowerCase().startsWith(query.toLowerCase())) score += 40;
        else if (book.author.toLowerCase().includes(query.toLowerCase())) score += 15;

        // Heavy English language bonus - prioritize English books
        const language = book.language?.toLowerCase() || 'unknown';
        if (language === 'eng' || language === 'english' || language === 'en') {
          score += 200; // Major boost for English books
        } else if (language === 'unknown') {
          score += 50; // Moderate boost for unknown (likely English)
        }
        // Non-English books get no bonus, effectively deprioritizing them

        return { ...book, _score: score };
      });



      // Sort by score (descending), then alphabetically
      scored.sort((a, b) => b._score - a._score || a.title.localeCompare(b.title));

      const results = scored.slice(0, 50);

      // Cache the local search results
      await cache.set(searchCacheKey, results, TTL.SEARCH_RESULTS);
      console.log(`[Search] Cached local search results for "${query}" (TTL=${TTL.SEARCH_RESULTS}s)`);

      return res.json(results);
    }
  }

  if(externalSearch){
    query = query.slice(0,-1);
  }

    // Fallback to OpenLibrary - check cache first
    const openLibraryCacheKey = cache.generateKey('search', 'openlibrary', query.toLowerCase().trim());

    let cachedOpenLibraryResults = await cache.get(openLibraryCacheKey);
    if (cachedOpenLibraryResults) {
      console.log(`[Search] Served OpenLibrary results from cache for query: "${query}"`);
      return res.json(cachedOpenLibraryResults);
    }

    console.log(`[Search] Cache miss for OpenLibrary search: "${query}", calling API...`);

    // Request more results and filter by English language
    const response = await openLibraryAPI.get('/search.json', {
      params: {
        q: query,
        language: 'eng', // Filter for English books in API call
        limit: 100,
      },
    });

    const rawBooks = response.data.docs;

    const filteredBooks = rawBooks
      .filter(book => {
        // Basic filtering
        if (!book.title || !book.author_name?.length || !book.cover_i || !book.key) {
          return false;
        }
        if (book.title === 'Study Guide') {
          return false;
        }

        // Heavy English language filtering
        const languages = book.language || [];

        // If no language specified, assume it might be English (keep it)
        if (languages.length === 0) {
          return true;
        }

        // Check if any language is English
        const hasEnglish = languages.some(lang =>
          lang === 'eng' ||
          lang === 'en' ||
          lang === 'english' ||
          lang.toLowerCase() === 'eng' ||
          lang.toLowerCase() === 'en'
        );

        // Only keep if it has English or no language specified
        return hasEnglish || languages.length === 0;
      })

      .map(book => {
        let score = 0;
        const title = book.title.toLowerCase();
        const author = book.author_name?.[0]?.toLowerCase() || "";

        // Title matching
        if (title === query.toLowerCase()) score += 100;
        else if (title.startsWith(query.toLowerCase())) score += 50;
        else if (title.includes(query.toLowerCase())) score += 20;

        // Author matching
        if (author === query.toLowerCase()) score += 80;
        else if (author.startsWith(query.toLowerCase())) score += 40;
        else if (author.includes(query.toLowerCase())) score += 15;

        // Edition count bonus (popular books)
        score += Math.min(15, (book.edition_count || 0));

        // Heavy English language bonus for scoring
        const languages = book.language || [];
        if (languages.length === 0) {
          score += 100; // Big bonus for unknown (likely English)
        } else {
          const hasEnglish = languages.some(lang =>
            lang === 'eng' || lang === 'en' || lang === 'english' ||
            lang.toLowerCase() === 'eng' || lang.toLowerCase() === 'en'
          );
          if (hasEnglish) {
            score += 200; // Massive bonus for confirmed English
          }
        }

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
          _score: score,
        };
      })
      .sort((a, b) => b._score - a._score)
      .slice(0, 50);



    if (!filteredBooks.length) {
      return res.status(404).json({ error: 'No books found' });
    }

    // Cache the OpenLibrary search results for longer since external API is slower
    await cache.set(openLibraryCacheKey, filteredBooks, TTL.OPENLIBRARY_API);
    console.log(`[Search] Cached OpenLibrary search results for "${query}" (TTL=${TTL.OPENLIBRARY_API}s)`);

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
      take: 15,
    });

    const trendingBookIds = trendingBooksGrouped.map((b) => b.bookId);

    let finalBooks = await prisma.book.findMany({
      where: { id: { in: trendingBookIds } },
    });

    // Maintain the correct order
    let orderedTrendingBooks = trendingBookIds.map(
      (id) => finalBooks.find((book) => book.id === id)
    );

    // 3️⃣ If less than 15 trending books, fill with most popular books
    if (orderedTrendingBooks.length < 15) {
      console.log(`Only ${orderedTrendingBooks.length} trending books found, filling with popular books...`);

      const needed = 15 - orderedTrendingBooks.length;
      const existingIds = orderedTrendingBooks.map(b => b.id);

      const popularBooks = await prisma.book.findMany({
        where: {
          id: { notIn: existingIds },
          totalRatings: { gt: 0 }
        },
        orderBy: [
          { totalRatings: 'desc' },
          { averageRating: 'desc' }
        ],
        take: needed
      });

      orderedTrendingBooks = [...orderedTrendingBooks, ...popularBooks];
    }

    const cacheTTL = process.env.TRENDING_CACHE_TTL
      ? parseInt(process.env.TRENDING_CACHE_TTL)
      : 3600; // fallback to 1 hour

    await redis.set(
      'trendingBooks',
      JSON.stringify(orderedTrendingBooks),
      'EX',
      cacheTTL
    );

    console.log(`Trending books recalculated and cached (${orderedTrendingBooks.length} books)`);

    res.json(orderedTrendingBooks);
  } catch (err) {
    console.error('Error fetching trending books:', err.message);
    res.status(500).json({ error: 'Failed to fetch trending books' });
  }
});

app.get('/api/recently-rated', async (req, res) => {
  try {
    // 1️⃣ Check if cached
    const cached = await redis.get('recentlyRatedBooks');
    if (cached) {
      console.log('Serving recently rated books from cache');
      return res.json(JSON.parse(cached));
    }

    // 2️⃣ Query UserBook for entries with ratings, ordered by most recent
    const recentRatings = await prisma.userBook.findMany({
      where: { rating: { not: null } },
      orderBy: { addedAt: 'desc' },
      take: 50,  // Get more to dedupe
      select: { bookId: true, addedAt: true }
    });

    // 3️⃣ Dedupe by bookId (keep first/most recent occurrence)
    const seenBookIds = new Set();
    const uniqueBookIds = [];
    for (const entry of recentRatings) {
      if (!seenBookIds.has(entry.bookId)) {
        seenBookIds.add(entry.bookId);
        uniqueBookIds.push(entry.bookId);
      }
      if (uniqueBookIds.length >= 15) break;
    }

    // 4️⃣ Fetch full book data and maintain order
    const books = await prisma.book.findMany({
      where: { id: { in: uniqueBookIds } }
    });
    const orderedBooks = uniqueBookIds.map(id => books.find(b => b.id === id));

    // 5️⃣ Cache for 30 minutes
    await redis.set('recentlyRatedBooks', JSON.stringify(orderedBooks), 'EX', 1800);

    console.log(`Recently rated books calculated and cached (${orderedBooks.length} books)`);

    res.json(orderedBooks);
  } catch (err) {
    console.error('Error fetching recently rated books:', err.message);
    res.status(500).json({ error: 'Failed to fetch recently rated books' });
  }
});

app.get('/api/bookdata', attachIfUserExists, async (req, res) => {
  const id = req.query.id;
  const searchAuthor = req.query.searchAuthor;
  const userId = req.userId || null;

  console.log('search author', searchAuthor)

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
    "Novela": "Fantasy",
  
    "Romance": "Romance",
    "romance": 'Romance',
    "Love": "Romance",
    'Love & Romance': 'Romance',
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
      // Cache key for book rankings
      const rankingCacheKey = cache.generateKey('bookRankings', existingBook.id);

      let rankings = await cache.get(rankingCacheKey);

      if (!rankings && existingBook.totalRatings && existingBook.totalRatings > 0) {
        console.log(`[BookData] Computing rankings for book ${existingBook.id}...`);

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

        rankings = {
          ratingRank: ratingSorted.findIndex(b => b.id === existingBook.id) + 1,
          popularityRank: popularitySorted.findIndex(b => b.id === existingBook.id) + 1
        };

        // Cache rankings for 1 hour
        await cache.set(rankingCacheKey, rankings, TTL.BOOK_RANKINGS);
        console.log(`[BookData] Cached rankings for book ${existingBook.id} (TTL=${TTL.BOOK_RANKINGS}s)`);
      } else if (rankings) {
        console.log(`[BookData] Served rankings from cache for book ${existingBook.id}`);
      }

      let ratingRank = rankings?.ratingRank || null;
      let popularityRank = rankings?.popularityRank || null;

      let userStatus = null;
      let userRating = null;

  // If user is logged in, get their status and rating for this book
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
    userRating = userBook?.rating ?? null;
  }
      return res.json({
        ...existingBook,
        ratingRank,
        popularityRank,
        userStatus,
        userRating
      });
    }

    // Fetch from Open Library if not in DB
    const response = await openLibraryAPI.get(`/works/${id}.json`);
    const book = response.data;

    // Fetch author names from author keys
    let authorNames = [];

    console.log('search author:', searchAuthor)

    if (book.authors && Array.isArray(book.authors) && !searchAuthor) {
      console.log('no search author...')
      // Only fetch the first author to avoid N+1 problem
      const firstAuthor = book.authors[0];
      if (firstAuthor?.author?.key) {
        try {
          const authorRes = await openLibraryAPI.get(`/${firstAuthor.author.key}.json`);
          console.log(authorRes.data?.name)
          authorNames = [authorRes.data?.name || 'Unknown Author'];
        } catch (err) {
          console.error('Error fetching author:', err.message);
          authorNames = ['Unknown Author'];
        }
      } else {
        authorNames = ['Unknown Author'];
      }
    }

    let coverId = book.covers?.[0] || null;
    let isbn = null;

// Helper function to check if edition is in English
const isEnglishEdition = (edition) => {
  if (!edition.languages || edition.languages.length === 0) {
    // If no language specified, assume English (common for older entries)
    return true;
  }
  return edition.languages.some(lang =>
    lang.key === '/languages/eng' ||
    lang === '/languages/eng' ||
    (typeof lang === 'object' && lang.key === '/languages/eng')
  );
};

// Helper function to filter out box sets, omnibus editions, etc.
const isNotBoxSet = (edition) => {
  const title = (edition.title || '').toLowerCase();
  return !(/box\s?set|trilogy|collection|omnibus|complete series|books?\s*\d+\s*-\s*\d+|volume\s*\d+\s*-\s*\d+/i.test(title));
};

// Helper function to calculate edition priority score
const calculateEditionPriority = (edition) => {
  let score = 0;

  // Prioritize major English publishers
  const majorPublishers = ['Tor', 'Gollancz', 'Orion', 'Harper', 'Penguin', 'Random House', 'Del Rey', 'Orbit'];
  const publisherStr = edition.publishers?.join(' ').toLowerCase() || '';

  if (majorPublishers.some(pub => publisherStr.includes(pub.toLowerCase()))) {
    score += 100;
  }

  // Prefer editions with ISBN-10 (better Amazon compatibility)
  if (edition.isbn_10?.length) {
    score += 50;
  }

  // Prefer editions with covers
  if (edition.covers?.length) {
    score += 30;
  }

  // Prefer editions with ISBN-13 as fallback
  if (edition.isbn_13?.length) {
    score += 20;
  }

  // Prefer more recent editions (US market tends to have newer ISBNs)
  const pubDate = edition.publish_date;
  if (pubDate) {
    const year = parseInt(pubDate.match(/\d{4}/)?.[0]);
    if (year && year >= 2000) {
      score += 10;
    }
  }

  return score;
};

// Fetch editions to find the best ISBN (cover already set from works level)
try {
  const editionsRes = await openLibraryAPI.get(`/works/${id}/editions.json?limit=50`);
  let editions = editionsRes.data.entries || [];

  // Filter for English editions with ISBNs, excluding box sets
  const validEditions = editions
    .filter(isEnglishEdition)
    .filter(isNotBoxSet)
    .filter(ed => ed.isbn_10?.length || ed.isbn_13?.length);

  console.log(`Found ${editions.length} total editions, ${validEditions.length} valid English editions with ISBN for ${id}`);

  if (validEditions.length > 0) {
    // Sort by priority score (highest first)
    validEditions.sort((a, b) => calculateEditionPriority(b) - calculateEditionPriority(a));

    // Take the best edition's ISBN (prefer ISBN-10 for Amazon compatibility)
    const bestEdition = validEditions[0];
    isbn = bestEdition.isbn_10?.[0] || bestEdition.isbn_13?.[0];
    console.log(`Selected ISBN ${isbn} from ${bestEdition.publishers?.[0] || 'unknown publisher'} (${bestEdition.title})`);
  } else {
    console.warn(`No valid English editions with ISBN found for ${id}, trying any edition with ISBN`);
    // Fallback: use any edition with ISBN if no English ones found
    const anyWithIsbn = editions
      .filter(isNotBoxSet)
      .filter(ed => ed.isbn_10?.length || ed.isbn_13?.length)
      .sort((a, b) => calculateEditionPriority(b) - calculateEditionPriority(a));

    if (anyWithIsbn.length > 0) {
      isbn = anyWithIsbn[0].isbn_10?.[0] || anyWithIsbn[0].isbn_13?.[0];
      console.log(`Fallback: Selected ISBN ${isbn} from ${anyWithIsbn[0].publishers?.[0] || 'unknown publisher'}`);
    }
  }
} catch (editionErr) {
  console.warn(`Could not fetch editions for ${id}:`, editionErr.message);
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
        author: searchAuthor || bookData.authors[0],
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

app.post('/api/user/booklist', writeLimiter, authenticateUser, async (req, res) => {
    
    const userId = req.userId;
    const user = req.user;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }


    try {
        // Ensure user exists in database
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: 'User profile not found. Please complete profile setup.' });
        }
        const {
            openLibraryId,
            rating,
            comment,
            status,
        } = req.body;


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

        // Validate rating (0.5-5.0 in half-star increments)
        let validatedRating = rating;
        let validatedStatus = status;

        if (rating !== null && rating !== undefined) {
            if (rating < 0.5 || rating > 5 || (rating * 2) % 1 !== 0) {
                return res.status(400).json({
                    error: 'Invalid rating. Must be 0.5-5.0 in half-star increments (e.g., 0.5, 1.0, 1.5, ..., 5.0)'
                });
            }
            // Auto-set to "completed" when rating is provided
            validatedStatus = 'completed';
        }

        // Validate status (only "to-read" or "completed")
        if (validatedStatus && !['to-read', 'completed'].includes(validatedStatus)) {
            return res.status(400).json({
                error: 'Invalid status. Must be "to-read" or "completed"'
            });
        }

        const userBook = await prisma.userBook.create({
            data: {
                userId,
                bookId: book.id,
                rating: validatedRating,
                comment,
                status: validatedStatus,
            },
        });

        await prisma.userActivity.create({
            data: {
                userId,
                actorId: userId,
                type: 'add_to_list',
                bookId: book.id,
                data: {
                    status: validatedStatus,
                    rating: validatedRating,
                    title: book.title,
                    message: validatedRating > 0 ? `You rated "${book.title}" ${validatedRating}/5 stars` : `You added "${book.title}" to your collection`,
                    globalMessage: validatedRating > 0 ? `${user.username} rated "${book.title}" ${validatedRating}/5 stars` : `${user.username} added "${book.title}" to their collection`,
                    avatar_url: user.avatar_url,
                }
            }
        });

        // Invalidate only the caches that actually changed
        // (Don't invalidate book data, rankings, search, trending - those didn't change)
        await cache.del(cache.generateKey('userStats', userId));
        await cache.del(cache.generateKey('userCollection', userId));
        await cache.del(cache.generateKey('userActivity', userId));
        await cache.del(cache.generateKey('notifications', userId));
        await cache.del('activity:recent');
        console.log(`[BookList] Invalidated caches after book addition for user ${userId}`);;

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
                  book
              });
              
          } catch (error) {
              console.error('Error adding book:', error);
              return res.status(500).json({ error: 'Internal server error' });
          }
      });
  
  
  

// Get books by the same author
app.get('/api/books/by-author', async (req, res) => {
  const { author, excludeBookId, limit = 6 } = req.query;

  if (!author) {
    return res.status(400).json({ error: 'Author parameter is required' });
  }

  try {
    const books = await prisma.book.findMany({
      where: {
        author: {
          equals: author,
          mode: 'insensitive'
        },
        ...(excludeBookId && { id: { not: excludeBookId } })
      },
      orderBy: [
        { totalRatings: 'desc' },
        { averageRating: 'desc' }
      ],
      take: parseInt(limit)
    });

    res.json(books);
  } catch (err) {
    console.error('Error fetching books by author:', err.message);
    res.status(500).json({ error: 'Failed to fetch books by author' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});