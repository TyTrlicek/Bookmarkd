const readline = require('readline');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const openLibraryAPI = axios.create({
  baseURL: 'https://openlibrary.org',
  headers: {
    'User-Agent': 'Bookmarkd/1.0 (bookmarkd.fun@gmail.com)',
    'Accept': 'application/json',
  },
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ============================================================
// GENRE CLASSIFICATION CONFIGURATION
// ============================================================

// Noise patterns to filter out garbage subjects from OpenLibrary
const noisePatterns = [
  /^nyt:/i,                          // NYT bestseller metadata
  /^collectionid:/i,                 // Collection IDs
  /^series:/i,                       // Series tags
  /reading\s*level/i,                // Reading level info
  /fictitious\s*character/i,         // Character names
  /\(\d{4}-?\d{0,4}\)/,              // Birth/death years
  /telephone/i,                      // Obvious errors
  /^pr\d+/i,                         // Library codes
  /^\d{3}(\.\d+)?$/,                 // Dewey decimal
  /^isbn/i,
  /^oclc/i,
  /^genre:/i,                        // Genre prefix tags
];

// Genre overrides - compound labels that force a specific primary genre
const genreOverrides = {
  "Fantasy": [/\burban\s*fantasy\b/i, /\bepic\s*fantasy\b/i, /\bhigh\s*fantasy\b/i, /\bdark\s*fantasy\b/i, /\bcozy\s*fantasy\b/i],
  "Romance": [/\bdark\s*romance\b/i, /\bsports\s*romance\b/i, /\bcontemporary\s*romance\b/i, /\bhistorical\s*romance\b/i, /\bparanormal\s*romance\b/i, /\bregency\s*romance\b/i],
  "Science Fiction": [/\bhard\s*sci-?fi\b/i, /\bhard\s*science[\s-]fiction\b/i, /\bspace\s*opera\b/i],
  "Horror": [/\bgothic\s*horror\b/i, /\bpsychological\s*horror\b/i, /\bfolk\s*horror\b/i]
};

// Primary genre patterns - determines the FIRST item in categories array
const primaryGenrePatterns = {
  "Fantasy": [/\bfantasy\s*(fiction)?\b/i, /\bwizards?\b/i, /\bdragons?\b/i, /\belves\b/i, /\bfaeries?\b/i, /\bfae\b/i, /\bvampires?\b/i, /\bwerewol/i, /\bparanormal\b/i, /\bimmortalis/i],
  "Romance": [/\bromance\b/i, /\blove\s*(stories|story)\b/i, /\bman-woman\s*relationship/i, /\bfirst\s*loves?\b/i],
  "Science Fiction": [/\bscience[\s-]+fiction\b/i, /\bsci-?fi\b/i, /\bscifi\b/i, /\brobots?\b/i, /\bartificial\s*intelligence\b/i, /\bsolarpunk\b/i],
  "Mystery": [/\bmystery\s*fiction\b/i, /\bdetective\b/i, /\bcrime\s*fiction\b/i, /\bwhodunit\b/i],
  "Thriller": [/\bthriller/i, /\bsuspense\s*fiction\b/i],
  "Horror": [/\bhorror\s*(fiction|stories|tales?)\b/i, /\bhorror,/i, /\bfiction,\s*horror\b/i, /\bhorror\s*-\s*general\b/i],
  "Historical Fiction": [/\bhistorical\s*(fiction|novel)/i],
  "Literary Fiction": [/\bliterary\s*fiction\b/i, /\ballegories?\b/i, /\bclassics?\b/i],
  "Non-Fiction": [/\bnon-?fiction\b/i, /\bbiography\b/i, /\bmemoir\b/i, /\bself-?help\b/i],
  "Young Adult": [/\byoung\s*adult\b/i, /\bjuvenile\s*fiction\b/i, /\bteen\s*fiction\b/i]
};

// Sub-tag patterns - added AFTER the primary genre
const subTagPatterns = {
  // ==================== FANTASY SUBTYPES ====================
  "Dark Fantasy": [/\bdark\s*fantasy\b/i, /\bgrimdark\b/i],
  "High Fantasy": [/\bhigh\s*fantasy\b/i],
  "Low Fantasy": [/\blow\s*fantasy\b/i],
  "Urban Fantasy": [/\burban\s*fantasy\b/i],
  "Epic Fantasy": [/\bepic\s*(fantasy)?\b/i],
  "Grimdark": [/\bgrimdark\b/i],
  "Portal Fantasy": [/\bportal\s*fantasy\b/i],
  "Sword & Sorcery": [/\bsword\s*(and|&)\s*sorcery\b/i],
  "Mythological": [/\bmytholog/i],
  "Fairy Tale Retelling": [/\bfairy\s*tale/i, /\bretelling\b/i],
  "LitRPG": [/\blitrpg\b/i],
  "Cozy Fantasy": [/\bcozy\s*fantasy\b/i],
  "Romantasy": [/\bromantasy\b/i],

  // ==================== SCI-FI SUBTYPES ====================
  "Dystopian": [/\bdystopia/i],
  "Post-Apocalyptic": [/\bpost-?apocalyptic\b/i, /\bapocalypse\b/i],
  "Space Opera": [/\bspace\s*opera\b/i, /\bspace\s*flight\b/i, /\bintergalactic\b/i, /\bspaceship/i],
  "Cyberpunk": [/\bcyberpunk\b/i],
  "Steampunk": [/\bsteampunk\b/i],
  "Hard Science Fiction": [/\bhard\s*sci/i, /\bhard\s*science/i],
  "Solarpunk": [/\bsolarpunk\b/i],
  "Cozy Sci-Fi": [/\bcozy\b/i],
  "Time Travel": [/\btime\s*travel/i],
  "Alternate History": [/\balternate\s*history\b/i, /\balternative\s*history\b/i],
  "First Contact": [/\bfirst\s*contact\b/i, /\baliens?\b/i],
  "AI": [/\bartificial\s*intelligence\b/i, /\brobots?\b/i, /\bandroid/i],

  // ==================== ROMANCE TROPES ====================
  "Enemies to Lovers": [/\benemies\s*to\s*lovers\b/i],
  "Friends to Lovers": [/\bfriends\s*to\s*lovers\b/i],
  "Second Chance": [/\bsecond\s*chance\b/i],
  "Forbidden Love": [/\bforbidden\s*(love|romance)\b/i],
  "Fake Dating": [/\bfake\s*(dating|relationship)\b/i],
  "Marriage of Convenience": [/\bmarriage\s*of\s*convenience\b/i],
  "Arranged Marriage": [/\barranged\s*marriage\b/i],
  "Love Triangle": [/\blove\s*triangle\b/i, /\btriangles?\s*\(interpersonal/i],
  "Slow Burn": [/\bslow\s*burn\b/i],
  "Grumpy-Sunshine": [/\bgrumpy\s*(and|&)?\s*sunshine\b/i],
  "Forced Proximity": [/\bforced\s*proximity\b/i],
  "Soulmates": [/\bsoulmates?\b/i],
  "Fated Mates": [/\bfated\s*mates?\b/i],
  "Found Family": [/\bfound\s*family\b/i],

  // ==================== ROMANCE STYLES ====================
  "Contemporary Romance": [/\bcontemporary\s*romance\b/i, /\bfiction,?\s*romance,?\s*contemporary\b/i],
  "Historical Romance": [/\bhistorical\s*romance\b/i, /\bregency\b/i],
  "Paranormal Romance": [/\bparanormal\s*romance\b/i],
  "Romantic Suspense": [/\bromantic\s*suspense\b/i],
  "Romantic Comedy": [/\bromantic\s*comedy\b/i, /\brom-?com\b/i],
  "Sports Romance": [/\bsports\s*romance\b/i, /\bhockey\s*(player|romance)?\b/i],
  "Dark Romance": [/\bdark\s*romance\b/i],
  "Mafia Romance": [/\bmafia\b/i, /\borganized\s*crime\b/i],
  "Billionaire Romance": [/\bbillionaire\b/i],
  "Small Town Romance": [/\bsmall\s*town\b/i],
  "Steamy": [/\bsteamy\b/i, /\bspicy\b/i, /\berotic/i],

  // ==================== MYSTERY/THRILLER SUBTYPES ====================
  "Cozy Mystery": [/\bcozy\s*mystery\b/i],
  "Noir": [/\bnoir\b/i],
  "Psychological Thriller": [/\bpsychological\s*(thriller)?\b/i],
  "Legal Thriller": [/\blegal\s*(thriller)?\b/i],
  "Domestic Thriller": [/\bdomestic\s*thriller\b/i],
  "Espionage": [/\bespionage\b/i, /\bspy\b/i],
  "Police Procedural": [/\bpolice\s*procedural\b/i],
  "Whodunit": [/\bwhodunit\b/i],
  "True Crime": [/\btrue\s*crime\b/i],

  // ==================== HORROR SUBTYPES ====================
  "Gothic Horror": [/\bgothic\s*(horror)?\b/i],
  "Cosmic Horror": [/\bcosmic\s*horror\b/i, /\blovecraft/i],
  "Folk Horror": [/\bfolk\s*horror\b/i],
  "Psychological Horror": [/\bpsychological\s*horror\b/i],
  "Haunted House": [/\bhaunted\s*(house)?\b/i],

  // ==================== CREATURE/BEING TYPES ====================
  "Vampires": [/\bvampires?\b/i],
  "Werewolves": [/\bwerewol/i, /\blycanthrope\b/i],
  "Shifters": [/\bshifters?\b/i, /\bshapeshifter/i],
  "Fae": [/\bfairies\b/i, /\bfaerie\b/i, /\bfae\b/i],
  "Dragons": [/\bdragons?\b/i],
  "Witches": [/\bwitches?\b/i, /\bwitchcraft\b/i],
  "Wizards": [/\bwizards?\b/i],
  "Ghosts": [/\bghosts?\b(?!\s*stories)/i, /\bhaunted\b/i],
  "Demons": [/\bdemons?\b/i, /\bdevils?\b/i],
  "Angels": [/\bangels?\b/i],
  "Mermaids": [/\bmermaids?\b/i, /\bsirens?\b/i],
  "Elves": [/\belves\b/i, /\belf\b/i],
  "Zombies": [/\bzombies?\b/i],
  "Gods": [/\bgods?\b/i, /\bdemigods?\b/i],

  // ==================== SETTING ELEMENTS ====================
  "Academy": [/\bacademy\b/i, /\bboarding\s*school\b/i, /\bmagic\s*school\b/i],
  "Royal Court": [/\broyalty\b/i, /\bprincess\b/i, /\bprince\b/i, /\bkings?\b.*\brulers?\b/i, /\bqueen\b/i],
  "Medieval": [/\bmedieval\b/i, /\bknight/i],
  "Victorian": [/\bvictorian\b/i],
  "Small Town": [/\bsmall\s*town\b/i],
  "Big City": [/\bnew\s*york\b/i, /\blos\s*angeles\b/i, /\blondon\b/i, /\burban\b/i],

  // ==================== CHARACTER ARCHETYPES ====================
  "Morally Grey": [/\bmorally\s*grey\b/i, /\bgray\s*moral/i],
  "Anti-Hero": [/\banti-?hero\b/i],
  "Villain": [/\bvillain/i],
  "Redemption Arc": [/\bredemption\b/i],
  "Chosen One": [/\bchosen\s*one\b/i],
  "LGBTQ+": [/\blgbt/i, /\bqueer\b/i, /\bgay\b/i, /\blesbian\b/i, /\bbisexual\b/i],

  // ==================== MOOD/TONE ====================
  "Dark": [/\bdark\b/i],
  "Emotional": [/\bemotional\b/i, /\btear-?jerker\b/i],
  "Angsty": [/\bangst/i],
  "Heartwarming": [/\bheartwarming\b/i, /\bfeel-?good\b/i, /\bwholesome\b/i],
  "Humorous": [/\bhumou?rous\b/i, /\bcomedy\b/i, /\bfunny\b/i],
  "Satirical": [/\bsatir/i],
  "Atmospheric": [/\batmospher/i],
  "Action-Packed": [/\baction/i],

  // ==================== THEME/CONTENT ====================
  "Coming of Age": [/\bcoming\s*of\s*age\b/i, /\bbildungsroman\b/i],
  "Adventure": [/\badventure\b/i],
  "Quest": [/\bquest\b/i, /\bjourney\b/i, /\bexpedition\b/i],
  "War": [/\bwar\b/i, /\bmilitary\b/i],
  "Rebellion": [/\brebellion\b/i, /\brevolution\b/i],
  "Survival": [/\bsurvival\b/i],
  "Heist": [/\bheist\b/i, /\bthiev/i],
  "Political": [/\bpolitical\b/i, /\btotalitarian/i, /\bcourt\s*intrigue\b/i],
  "Mystery": [/\bmystery\b/i, /\bsecrets?\b/i],
  "Revenge": [/\brevenge\b/i],
  "Betrayal": [/\bbetrayal\b/i],
  "Family Drama": [/\bfamily\s*(drama|saga)\b/i, /\bgenerational\b/i],
  "Mental Health": [/\bmental\s*health\b/i, /\bdepression\b/i, /\banxiety\b/i],
  "Trauma": [/\btrauma\b/i],
  "Self-Discovery": [/\bself-?discovery\b/i, /\bidentity\b/i],

  // ==================== MAGIC SYSTEM ====================
  "Magic": [/\bmagic\b/i, /\bspells?\b/i, /\bsorcery\b/i, /\balchemy\b/i],
  "Supernatural": [/\bsupernatural\b/i, /\bparanormal\b/i, /\boccult\b/i]
};

// Priority order for primary genres (higher = takes precedence)
const primaryGenrePriority = {
  "Horror": 10,
  "Thriller": 9,
  "Mystery": 8,
  "Romance": 7,
  "Fantasy": 6,
  "Science Fiction": 5,
  "Historical Fiction": 4,
  "Young Adult": 3,
  "Literary Fiction": 2,
  "Non-Fiction": 1
};

// Map sub-tags to their parent genres for tie-breaking
const subTagGenreAffinity = {
  "Dark Fantasy": "Fantasy", "High Fantasy": "Fantasy", "Low Fantasy": "Fantasy",
  "Urban Fantasy": "Fantasy", "Epic Fantasy": "Fantasy", "Grimdark": "Fantasy",
  "Portal Fantasy": "Fantasy", "Sword & Sorcery": "Fantasy", "Mythological": "Fantasy",
  "Fairy Tale Retelling": "Fantasy", "LitRPG": "Fantasy", "Cozy Fantasy": "Fantasy",
  "Fae": "Fantasy", "Dragons": "Fantasy", "Elves": "Fantasy", "Wizards": "Fantasy",
  "Magic": "Fantasy",
  "Dystopian": "Science Fiction", "Post-Apocalyptic": "Science Fiction",
  "Space Opera": "Science Fiction", "Cyberpunk": "Science Fiction",
  "Steampunk": "Science Fiction", "Hard Science Fiction": "Science Fiction",
  "Time Travel": "Science Fiction", "Alternate History": "Science Fiction",
  "First Contact": "Science Fiction", "AI": "Science Fiction",
  "Solarpunk": "Science Fiction", "Cozy Sci-Fi": "Science Fiction",
  "Enemies to Lovers": "Romance", "Friends to Lovers": "Romance",
  "Second Chance": "Romance", "Forbidden Love": "Romance", "Fake Dating": "Romance",
  "Marriage of Convenience": "Romance", "Arranged Marriage": "Romance",
  "Love Triangle": "Romance", "Slow Burn": "Romance", "Grumpy-Sunshine": "Romance",
  "Forced Proximity": "Romance", "Soulmates": "Romance", "Fated Mates": "Romance",
  "Contemporary Romance": "Romance", "Historical Romance": "Romance",
  "Paranormal Romance": "Romance", "Romantic Suspense": "Romance",
  "Romantic Comedy": "Romance", "Sports Romance": "Romance", "Dark Romance": "Romance",
  "Mafia Romance": "Romance", "Billionaire Romance": "Romance", "Small Town Romance": "Romance",
  "Cozy Mystery": "Mystery", "Noir": "Mystery", "Whodunit": "Mystery",
  "Police Procedural": "Mystery",
  "Psychological Thriller": "Thriller", "Legal Thriller": "Thriller",
  "Domestic Thriller": "Thriller", "Espionage": "Thriller",
  "Gothic Horror": "Horror", "Cosmic Horror": "Horror", "Folk Horror": "Horror",
  "Psychological Horror": "Horror", "Haunted House": "Horror",
  "Vampires": "Horror", "Werewolves": "Horror", "Ghosts": "Horror",
  "Demons": "Horror", "Zombies": "Horror"
};

// ============================================================
// MAIN CLASSIFICATION FUNCTION
// ============================================================

function mapSubjectsToCategories(subjects) {
  if (!subjects || !Array.isArray(subjects)) return [];

  const cleanSubjects = subjects.filter(subject =>
    !noisePatterns.some(pattern => pattern.test(subject))
  );
  const subjectText = cleanSubjects.join(' ');

  // Find ALL sub-tags first (we'll use these for tie-breaking)
  const matchedSubTags = new Set();
  for (const [tag, patterns] of Object.entries(subTagPatterns)) {
    if (patterns.some(p => p.test(subjectText))) {
      matchedSubTags.add(tag);
    }
  }

  // Check for genre overrides
  let primaryGenre = null;
  for (const [genre, patterns] of Object.entries(genreOverrides)) {
    if (patterns.some(p => p.test(subjectText))) {
      primaryGenre = genre;
      break;
    }
  }

  // If no override, find all matching genres and use sub-tags as tie-breaker
  if (!primaryGenre) {
    const matchingGenres = [];
    for (const [genre, patterns] of Object.entries(primaryGenrePatterns)) {
      if (patterns.some(p => p.test(subjectText))) {
        matchingGenres.push(genre);
      }
    }

    if (matchingGenres.length === 1) {
      primaryGenre = matchingGenres[0];
    } else if (matchingGenres.length > 1) {
      const genreScores = {};
      for (const genre of matchingGenres) {
        genreScores[genre] = 0;
      }
      for (const tag of matchedSubTags) {
        const affinity = subTagGenreAffinity[tag];
        if (affinity && genreScores[affinity] !== undefined) {
          genreScores[affinity]++;
        }
      }
      let bestGenre = null;
      let bestScore = -1;
      for (const genre of matchingGenres) {
        if (genreScores[genre] > bestScore) {
          bestScore = genreScores[genre];
          bestGenre = genre;
        }
      }
      if (bestScore > 0) {
        primaryGenre = bestGenre;
      } else {
        let highestPriority = -1;
        for (const genre of matchingGenres) {
          const priority = primaryGenrePriority[genre] || 0;
          if (priority > highestPriority) {
            highestPriority = priority;
            primaryGenre = genre;
          }
        }
      }
    }
  }

  if (!primaryGenre) {
    primaryGenre = "Literary Fiction";
  }

  // Special handling for Romantasy
  const hasFantasyElements = /\bfantasy\b/i.test(subjectText) || /\bfae\b/i.test(subjectText) || /\bmagic\b/i.test(subjectText);
  const hasRomanceElements = /\bromance\b/i.test(subjectText) || /\blove\s*stor/i.test(subjectText);
  if (hasFantasyElements && hasRomanceElements && (primaryGenre === "Fantasy" || primaryGenre === "Romance")) {
    matchedSubTags.add("Romantasy");
  }

  const subTagsArray = Array.from(matchedSubTags).slice(0, 4);
  return [primaryGenre, ...subTagsArray];
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

    const filteredCategories = mapSubjectsToCategories(book.subjects);

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