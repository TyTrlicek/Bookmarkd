const readline = require('readline');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const openLibraryAPI = axios.create({
  baseURL: 'https://openlibrary.org',
  headers: {
    'User-Agent': 'BookMarkd/1.0 (bookmarkd.fun@gmail.com)',
    'Accept': 'application/json',
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

  return Array.from(matched).slice(0, 3);
}

async function seedBook() {
  try {
    const bookId = await new Promise((resolve) => {
      rl.question('Enter OpenLibrary book ID (e.g., OL82563W): ', (answer) => {
        resolve(answer.trim());
      });
    });

    if (!bookId) {
      console.log('No ID provided. Exiting...');
      rl.close();
      return;
    }

    console.log(`Fetching book data from OpenLibrary for ID: ${bookId}...`);

    // Fetch from OpenLibrary API
    const response = await openLibraryAPI.get(`/works/${bookId}.json`);
    const book = response.data;

    // Fetch author names
    let authorNames = [];
    if (book.authors && Array.isArray(book.authors)) {
      authorNames = await Promise.all(
        book.authors.map(async (a) => {
          try {
            const authorKey = a.author?.key;
            if (!authorKey) return 'Unknown Author';

            const authorRes = await openLibraryAPI.get(`/${authorKey}.json`);
            return authorRes.data?.name || 'Unknown Author';
          } catch (err) {
            console.error('Error fetching author:', err.message);
            return 'Unknown Author';
          }
        })
      );
    }

    // Get cover and ISBN from editions
    let coverId = book.covers?.[0] || null;
    let isbn = null;

    if (!coverId) {
      try {
        const editionsRes = await openLibraryAPI.get(`/works/${bookId}/editions.json?limit=10`);
        const editions = editionsRes.data.entries;

        for (const ed of editions) {
          if (ed.covers?.length) {
            coverId = ed.covers[0];
            if (ed.isbn_10?.length) {
              isbn = ed.isbn_10[0];
            } else if (ed.isbn_13?.length) {
              isbn = ed.isbn_13[0];
            }
            break;
          }
        }
      } catch (editionErr) {
        console.warn(`Could not fetch edition covers for ${bookId}:`, editionErr.message);
      }
    }

    if (!isbn) {
      try {
        const editionsRes = await openLibraryAPI.get(`/works/${bookId}/editions.json?limit=10`);
        const editions = editionsRes.data.entries;

        for (const ed of editions) {
          if (ed.isbn_10?.length) {
            isbn = ed.isbn_10[0];
            break;
          } else if (ed.isbn_13?.length) {
            isbn = ed.isbn_13[0];
            break;
          }
        }
      } catch (editionErr) {
        console.warn(`Could not fetch ISBNs for ${bookId}:`, editionErr.message);
      }
    }

    const coverImage = coverId
      ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`
      : null;

    const filteredCategories = mapSubjectsToGenres(book.subjects);

    const bookData = {
      title: book.title || 'Unknown Title',
      author: authorNames.length ? authorNames[0] : 'Unknown Author',
      description: typeof book.description === 'string'
        ? book.description
        : book.description?.value || 'No description available',
      image: coverImage,
      pageCount: null,
      publishedDate: book.created?.value?.split('T')[0] || null,
      publisher: 'Unknown Publisher',
      categories: filteredCategories,
      language: 'Unknown',
      openLibraryId: bookId,
      isbn: isbn ? String(isbn) : null,
    };

    console.log('Book data fetched successfully:');
    console.log('Title:', bookData.title);
    console.log('Author:', bookData.author);
    console.log('Categories:', bookData.categories);

    // Save to database
    const savedBook = await prisma.book.create({
      data: {
        title: bookData.title,
        author: bookData.author,
        description: bookData.description,
        image: bookData.image,
        pageCount: bookData.pageCount,
        publishedDate: bookData.publishedDate,
        publisher: bookData.publisher,
        categories: bookData.categories,
        language: bookData.language,
        openLibraryId: bookData.openLibraryId,
        isbn: bookData.isbn,
      },
    });

    console.log('Book saved to database successfully!');
    console.log('Database ID:', savedBook.id);

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

seedBook();