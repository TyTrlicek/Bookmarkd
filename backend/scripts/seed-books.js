#!/usr/bin/env node

/**
 * Book Seeding Script for Bookmarkd
 *
 * This script bulk imports books from OpenLibrary into the local database
 * Uses the existing book creation logic to ensure data consistency
 *
 * Usage:
 *   node scripts/seed-books.js --mode=popular --limit=1000
 *   node scripts/seed-books.js --mode=genres --limit=5000
 *   node scripts/seed-books.js --mode=custom --file=book-ids.json
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Import your existing Prisma client and utils
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Rate limiting setup
const BATCH_SIZE = 10; // Process 10 books at a time
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches
const OPENLIBRARY_DELAY = 100; // 100ms between OpenLibrary API calls

// OpenLibrary API endpoints
const OPENLIBRARY_BASE = 'https://openlibrary.org';
const OPENLIBRARY_SEARCH = 'https://openlibrary.org/search.json';

// Progress tracking
let processed = 0;
let successful = 0;
let failed = 0;
let skipped = 0;

/**
 * Curated list of popular book OpenLibrary IDs
 * These are high-quality, well-known books that should be in any book database
 */
const POPULAR_BOOK_IDS = [
  // Fantasy Classics
  'OL45804W', // The Hobbit
  'OL27479W', // The Lord of the Rings
  'OL82563W', // Harry Potter and the Philosopher's Stone
  'OL82564W', // Harry Potter and the Chamber of Secrets
  'OL82565W', // Harry Potter and the Prisoner of Azkaban
  'OL14906W', // A Game of Thrones
  'OL16017W', // The Name of the Wind
  'OL15978W', // The Way of Kings

  // Science Fiction
  'OL7525W',  // Dune
  'OL2063W',  // Foundation
  'OL2841W',  // The Hitchhiker's Guide to the Galaxy
  'OL14932W', // Ender's Game
  'OL7624W',  // The Martian
  'OL24364W', // Ready Player One

  // Romance
  'OL45883W', // Pride and Prejudice
  'OL166M',   // Jane Eyre
  'OL14906W', // Outlander
  'OL7126W',  // The Notebook

  // Mystery/Thriller
  'OL1017834W', // Gone Girl
  'OL45524W',   // The Girl with the Dragon Tattoo
  'OL7317W',    // The Da Vinci Code
  'OL7932W',    // And Then There Were None

  // Classic Literature
  'OL20028W',   // To Kill a Mockingbird
  'OL37809W',   // 1984
  'OL1168007W', // The Great Gatsby
  'OL45895W',   // The Catcher in the Rye
  'OL45644W',   // Of Mice and Men

  // Contemporary Fiction
  'OL7365W',    // The Kite Runner
  'OL7366W',    // The Book Thief
  'OL7353W',    // Life of Pi
  'OL7502W',    // The Help

  // Non-Fiction
  'OL7353462W', // Sapiens
  'OL7943W',    // Steve Jobs Biography
  'OL15166M',   // Educated
  'OL20893W',   // Atomic Habits
];

/**
 * Genre-specific book collections for deeper seeding
 */
const GENRE_SEARCH_TERMS = {
  fantasy: ['fantasy', 'magic', 'dragons', 'wizards', 'epic fantasy'],
  romance: ['romance', 'love story', 'romantic fiction'],
  mystery: ['mystery', 'detective', 'thriller', 'crime'],
  'science-fiction': ['science fiction', 'sci-fi', 'space', 'future'],
  'non-fiction': ['biography', 'history', 'science', 'psychology', 'self-help']
};

/**
 * Utility function to delay execution
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Log progress with colors
 */
const log = {
  info: (msg) => console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m[SUCCESS]\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m[ERROR]\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m[WARN]\x1b[0m ${msg}`),
  progress: () => console.log(`\x1b[90m[PROGRESS]\x1b[0m Processed: ${processed}, Success: ${successful}, Failed: ${failed}, Skipped: ${skipped}`)
};

/**
 * Check if book already exists in database
 */
async function bookExists(openLibraryId) {
  try {
    const book = await prisma.book.findUnique({
      where: { openLibraryId },
      select: { id: true }
    });
    return !!book;
  } catch (error) {
    log.error(`Error checking if book exists: ${error.message}`);
    return false;
  }
}

/**
 * Fetch book data from OpenLibrary API
 */
async function fetchBookFromOpenLibrary(openLibraryId) {
  try {
    const response = await axios.get(`${OPENLIBRARY_BASE}/works/${openLibraryId}.json`, {
      timeout: 10000
    });

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch from OpenLibrary: ${error.message}`);
  }
}

/**
 * Map OpenLibrary subjects to your allowed genres
 * This replicates the logic from your existing bookdata endpoint
 */
function mapSubjectsToGenres(subjects) {
  const allowedGenres = [
    "Fantasy", "Romance", "Science Fiction", "Magic", "Mystery",
    "Thriller", "Supernatural", "Non-Fiction", "Adventure"
  ];

  const subjectToGenreMap = {
    "Fantasy": "Fantasy",
    "Fantasy fiction": "Fantasy",
    "Fiction - Fantasy": "Fantasy",
    "Fiction, fantasy, epic": "Fantasy",
    "Magic": "Magic",
    "Romance": "Romance",
    "Love stories": "Romance",
    "Science Fiction": "Science Fiction",
    "Science fiction": "Science Fiction",
    "Mystery": "Mystery",
    "Detective and mystery stories": "Mystery",
    "Thriller": "Thriller",
    "Suspense": "Thriller",
    "Supernatural": "Supernatural",
    "Non-Fiction": "Non-Fiction",
    "Adventure": "Adventure",
    "Action & Adventure": "Adventure"
  };

  const matched = new Set();

  for (const subject of subjects || []) {
    const genre = subjectToGenreMap[subject.trim()];
    if (genre && allowedGenres.includes(genre)) {
      matched.add(genre);
    }
  }

  return Array.from(matched).slice(0, 3); // Max 3 genres
}

/**
 * Create book record using your existing logic
 */
async function createBookRecord(openLibraryData, openLibraryId) {
  try {
    // Map the data similar to your existing bookdata endpoint
    const bookData = {
      openLibraryId,
      title: openLibraryData.title || 'Unknown Title',
      author: openLibraryData.authors?.[0]?.name || 'Unknown Author',
      description: openLibraryData.description?.value || openLibraryData.description || null,
      language: 'en', // Default to English
      categories: mapSubjectsToGenres(openLibraryData.subjects),
      publishedDate: openLibraryData.first_publish_date ? new Date(openLibraryData.first_publish_date).toISOString() : null,
      totalRatings: 0,
      averageRating: 0
    };

    // Handle cover image
    if (openLibraryData.covers && openLibraryData.covers.length > 0) {
      bookData.image = `https://covers.openlibrary.org/b/id/${openLibraryData.covers[0]}-L.jpg`;
    }

    // Create the book record
    const book = await prisma.book.create({
      data: bookData
    });

    return book;
  } catch (error) {
    throw new Error(`Failed to create book record: ${error.message}`);
  }
}

/**
 * Process a single book ID
 */
async function processBook(openLibraryId) {
  try {
    processed++;

    // Check if book already exists
    if (await bookExists(openLibraryId)) {
      skipped++;
      log.warn(`Book ${openLibraryId} already exists, skipping`);
      return { success: false, reason: 'already_exists' };
    }

    // Add delay to respect OpenLibrary API limits
    await delay(OPENLIBRARY_DELAY);

    // Fetch book data from OpenLibrary
    const openLibraryData = await fetchBookFromOpenLibrary(openLibraryId);

    // Create book record
    const book = await createBookRecord(openLibraryData, openLibraryId);

    successful++;
    log.success(`Created book: ${book.title} by ${book.author}`);

    return { success: true, book };

  } catch (error) {
    failed++;
    log.error(`Failed to process book ${openLibraryId}: ${error.message}`);
    return { success: false, reason: error.message };
  }
}

/**
 * Process books in batches
 */
async function processBooksInBatches(bookIds) {
  log.info(`Starting to process ${bookIds.length} books in batches of ${BATCH_SIZE}`);

  const results = [];

  for (let i = 0; i < bookIds.length; i += BATCH_SIZE) {
    const batch = bookIds.slice(i, i + BATCH_SIZE);
    log.info(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(bookIds.length / BATCH_SIZE)}`);

    // Process batch concurrently
    const batchPromises = batch.map(id => processBook(id));
    const batchResults = await Promise.allSettled(batchPromises);

    results.push(...batchResults);

    // Progress update
    log.progress();

    // Delay between batches to be respectful to APIs
    if (i + BATCH_SIZE < bookIds.length) {
      log.info(`Waiting ${DELAY_BETWEEN_BATCHES}ms before next batch...`);
      await delay(DELAY_BETWEEN_BATCHES);
    }
  }

  return results;
}

/**
 * Search OpenLibrary for books by genre/term
 */
async function searchBooksForGenre(searchTerm, limit = 100) {
  try {
    const response = await axios.get(OPENLIBRARY_SEARCH, {
      params: {
        q: searchTerm,
        limit: Math.min(limit, 100), // OpenLibrary limit
        fields: 'key,title,author_name,ratings_average',
        sort: 'rating desc' // Get highly rated books
      },
      timeout: 15000
    });

    return response.data.docs
      .filter(book => book.key && book.ratings_average > 3.5) // Filter for quality
      .map(book => book.key.replace('/works/', '')) // Extract work ID
      .slice(0, limit);

  } catch (error) {
    log.error(`Failed to search for ${searchTerm}: ${error.message}`);
    return [];
  }
}

/**
 * Generate book IDs based on mode
 */
async function generateBookIds(mode, limit) {
  switch (mode) {
    case 'popular':
      return POPULAR_BOOK_IDS.slice(0, limit);

    case 'genres':
      const genreBooks = [];
      const perGenre = Math.floor(limit / Object.keys(GENRE_SEARCH_TERMS).length);

      for (const [genre, terms] of Object.entries(GENRE_SEARCH_TERMS)) {
        log.info(`Searching for ${genre} books...`);

        for (const term of terms) {
          if (genreBooks.length >= limit) break;

          await delay(200); // Rate limit searches
          const books = await searchBooksForGenre(term, Math.floor(perGenre / terms.length));
          genreBooks.push(...books);

          if (genreBooks.length >= limit) break;
        }
      }

      // Remove duplicates and return
      return [...new Set(genreBooks)].slice(0, limit);

    case 'custom':
      // Load from file
      const filePath = process.argv.find(arg => arg.startsWith('--file='))?.split('=')[1];
      if (!filePath) {
        throw new Error('Custom mode requires --file=path/to/book-ids.json');
      }

      const fileContent = await fs.readFile(filePath, 'utf8');
      const bookIds = JSON.parse(fileContent);
      return bookIds.slice(0, limit);

    default:
      throw new Error(`Unknown mode: ${mode}. Use: popular, genres, or custom`);
  }
}

/**
 * Save failed book IDs for retry
 */
async function saveFailedBooks(failedIds) {
  if (failedIds.length === 0) return;

  const failedFile = path.join(__dirname, `failed-books-${Date.now()}.json`);
  await fs.writeFile(failedFile, JSON.stringify(failedIds, null, 2));
  log.info(`Saved ${failedIds.length} failed book IDs to ${failedFile}`);
}

/**
 * Main function
 */
async function main() {
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const mode = args.find(arg => arg.startsWith('--mode='))?.split('=')[1] || 'popular';
    const limit = parseInt(args.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 100;

    log.info(`Starting book seeding in ${mode} mode with limit ${limit}`);

    // Generate book IDs
    const bookIds = await generateBookIds(mode, limit);
    log.info(`Generated ${bookIds.length} book IDs to process`);

    if (bookIds.length === 0) {
      log.warn('No book IDs generated. Exiting.');
      return;
    }

    // Process books
    const startTime = Date.now();
    const results = await processBooksInBatches(bookIds);
    const endTime = Date.now();

    // Collect failed book IDs for retry
    const failedIds = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected' || !result.value?.success) {
        failedIds.push(bookIds[index]);
      }
    });

    // Save failed books
    await saveFailedBooks(failedIds);

    // Final summary
    log.info('='.repeat(60));
    log.info('SEEDING COMPLETE');
    log.info('='.repeat(60));
    log.success(`Successfully created: ${successful} books`);
    log.error(`Failed: ${failed} books`);
    log.warn(`Skipped (already exist): ${skipped} books`);
    log.info(`Total processed: ${processed} books`);
    log.info(`Time taken: ${Math.round((endTime - startTime) / 1000)}s`);

    if (failedIds.length > 0) {
      log.warn(`${failedIds.length} books failed - check failed-books-*.json for retry`);
    }

  } catch (error) {
    log.error(`Script failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  log.warn('Script interrupted by user');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  processBook,
  generateBookIds,
  POPULAR_BOOK_IDS
};