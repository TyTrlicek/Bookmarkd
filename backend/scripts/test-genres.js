// Test script for genre classification

const noisePatterns = [
  /^nyt:/i,
  /^collectionid:/i,
  /^series:/i,
  /reading\s*level/i,
  /fictitious\s*character/i,
  /\(\d{4}-?\d{0,4}\)/,
  /telephone/i,
  /^pr\d+/i,
  /^\d{3}(\.\d+)?$/,
  /^isbn/i,
  /^oclc/i,
  /^genre:/i,
];

// Genre overrides - compound labels that force a specific primary genre
const genreOverrides = {
  "Fantasy": [/\burban\s*fantasy\b/i, /\bepic\s*fantasy\b/i, /\bhigh\s*fantasy\b/i, /\bdark\s*fantasy\b/i, /\bcozy\s*fantasy\b/i],
  "Romance": [/\bdark\s*romance\b/i, /\bsports\s*romance\b/i, /\bcontemporary\s*romance\b/i, /\bhistorical\s*romance\b/i, /\bparanormal\s*romance\b/i, /\bregency\s*romance\b/i],
  "Science Fiction": [/\bhard\s*sci-?fi\b/i, /\bhard\s*science[\s-]fiction\b/i, /\bspace\s*opera\b/i],
  "Horror": [/\bgothic\s*horror\b/i, /\bpsychological\s*horror\b/i, /\bfolk\s*horror\b/i]
};

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

const subTagPatterns = {
  "Dark Fantasy": [/\bdark\s*fantasy\b/i, /\bgrimdark\b/i],
  "High Fantasy": [/\bhigh\s*fantasy\b/i],
  "Epic Fantasy": [/\bepic\s*(fantasy)?\b/i],
  "Urban Fantasy": [/\burban\s*fantasy\b/i],
  "Mythological": [/\bmytholog/i],
  "Fairy Tale Retelling": [/\bfairy\s*tale/i, /\bretelling\b/i],
  "LitRPG": [/\blitrpg\b/i],
  "Cozy Fantasy": [/\bcozy\s*fantasy\b/i],
  "Romantasy": [/\bromantasy\b/i],
  "Dystopian": [/\bdystopia/i],
  "Post-Apocalyptic": [/\bpost-?apocalyptic\b/i, /\bapocalypse\b/i],
  "Space Opera": [/\bspace\s*opera\b/i, /\bspace\s*flight\b/i, /\bintergalactic\b/i, /\bspaceship/i],
  "Cyberpunk": [/\bcyberpunk\b/i],
  "Hard Science Fiction": [/\bhard\s*sci/i, /\bhard\s*science/i],
  "Solarpunk": [/\bsolarpunk\b/i],
  "Cozy Sci-Fi": [/\bcozy\b/i],
  "Time Travel": [/\btime\s*travel/i],
  "First Contact": [/\bfirst\s*contact\b/i, /\baliens?\b/i],
  "Enemies to Lovers": [/\benemies\s*to\s*lovers\b/i],
  "Friends to Lovers": [/\bfriends\s*to\s*lovers\b/i],
  "Fake Dating": [/\bfake\s*dating\b/i],
  "Slow Burn": [/\bslow\s*burn\b/i],
  "Found Family": [/\bfound\s*family\b/i],
  "Contemporary Romance": [/\bcontemporary\s*romance\b/i, /\bfiction,?\s*romance,?\s*contemporary\b/i],
  "Historical Romance": [/\bhistorical\s*romance\b/i, /\bregency\b/i],
  "Paranormal Romance": [/\bparanormal\s*romance\b/i],
  "Sports Romance": [/\bsports\s*romance\b/i, /\bhockey\s*(player|romance)?\b/i],
  "Dark Romance": [/\bdark\s*romance\b/i],
  "Mafia Romance": [/\bmafia\b/i, /\borganized\s*crime\b/i],
  "Cozy Mystery": [/\bcozy\s*mystery\b/i],
  "Whodunit": [/\bwhodunit\b/i],
  "Noir": [/\bnoir\b/i],
  "Psychological Thriller": [/\bpsychological\s*(thriller)?\b/i],
  "Domestic Thriller": [/\bdomestic\s*thriller\b/i],
  "Espionage": [/\bespionage\b/i, /\bspy\b/i],
  "Gothic Horror": [/\bgothic\s*(horror)?\b/i],
  "Haunted House": [/\bhaunted\s*(house)?\b/i],
  "Vampires": [/\bvampires?\b/i],
  "Werewolves": [/\bwerewol/i, /\blycanthrope\b/i],
  "Fae": [/\bfairies\b/i, /\bfaerie\b/i, /\bfae\b/i],
  "Dragons": [/\bdragons?\b/i],
  "Witches": [/\bwitches?\b/i, /\bwitchcraft\b/i],
  "Wizards": [/\bwizards?\b/i],
  "Ghosts": [/\bghosts?\b(?!\s*stories)/i, /\bhaunted\b/i],
  "Demons": [/\bdemons?\b/i, /\bdevils?\b/i],
  "Zombies": [/\bzombies?\b/i],
  "Monsters": [/\bmonsters?\b/i],
  "Academy": [/\bacademy\b/i, /\bboarding\s*school\b/i, /\bmagic\s*school\b/i],
  "Royal Court": [/\broyalty\b/i, /\bprincess\b/i, /\bprince\b/i, /\bkings?\b.*\brulers?\b/i, /\bqueen\b/i],
  "Medieval": [/\bmedieval\b/i, /\bknight/i],
  "Victorian": [/\bvictorian\b/i],
  "Morally Grey": [/\bmorally\s*grey\b/i, /\bgray\s*moral/i],
  "LGBTQ+": [/\blgbt/i, /\bqueer\b/i, /\bgay\b/i, /\blesbian\b/i, /\bbisexual\b/i],
  "Dark": [/\bdark\b/i],
  "Emotional": [/\bemotional\b/i, /\btear-?jerker\b/i],
  "Humorous": [/\bhumou?rous\b/i, /\bcomedy\b/i, /\bfunny\b/i],
  "Satirical": [/\bsatir/i],
  "Coming of Age": [/\bcoming\s*of\s*age\b/i, /\bbildungsroman\b/i],
  "Adventure": [/\badventure\b/i],
  "War": [/\bwar\b/i, /\bmilitary\b/i],
  "Survival": [/\bsurvival\b/i],
  "Political": [/\bpolitical\b/i, /\btotalitarian/i, /\bcourt\s*intrigue\b/i],
  "Magic": [/\bmagic\b/i, /\bspells?\b/i, /\bsorcery\b/i, /\balchemy\b/i],
  "Supernatural": [/\bsupernatural\b/i, /\bparanormal\b/i, /\boccult\b/i]
};

const primaryGenrePriority = {
  "Horror": 10, "Thriller": 9, "Mystery": 8, "Romance": 7,
  "Fantasy": 6, "Science Fiction": 5, "Historical Fiction": 4,
  "Young Adult": 3, "Literary Fiction": 2, "Non-Fiction": 1
};

// Map sub-tags to their parent genres for tie-breaking
const subTagGenreAffinity = {
  "Dark Fantasy": "Fantasy", "High Fantasy": "Fantasy", "Urban Fantasy": "Fantasy",
  "Epic Fantasy": "Fantasy", "Mythological": "Fantasy", "Fairy Tale Retelling": "Fantasy",
  "LitRPG": "Fantasy", "Cozy Fantasy": "Fantasy", "Fae": "Fantasy", "Dragons": "Fantasy",
  "Wizards": "Fantasy", "Magic": "Fantasy",
  "Dystopian": "Science Fiction", "Post-Apocalyptic": "Science Fiction",
  "Space Opera": "Science Fiction", "Cyberpunk": "Science Fiction",
  "Hard Science Fiction": "Science Fiction", "Time Travel": "Science Fiction",
  "First Contact": "Science Fiction", "Solarpunk": "Science Fiction", "Cozy Sci-Fi": "Science Fiction",
  "Enemies to Lovers": "Romance", "Friends to Lovers": "Romance", "Fake Dating": "Romance",
  "Slow Burn": "Romance", "Contemporary Romance": "Romance", "Historical Romance": "Romance",
  "Paranormal Romance": "Romance", "Sports Romance": "Romance", "Dark Romance": "Romance",
  "Mafia Romance": "Romance",
  "Cozy Mystery": "Mystery", "Whodunit": "Mystery", "Noir": "Mystery",
  "Psychological Thriller": "Thriller", "Domestic Thriller": "Thriller", "Espionage": "Thriller",
  "Gothic Horror": "Horror", "Haunted House": "Horror", "Vampires": "Horror",
  "Werewolves": "Horror", "Ghosts": "Horror", "Demons": "Horror", "Zombies": "Horror"
};

function mapSubjectsToCategories(subjects) {
  if (!subjects || !Array.isArray(subjects)) return [];
  const cleanSubjects = subjects.filter(subject =>
    !noisePatterns.some(pattern => pattern.test(subject))
  );
  const subjectText = cleanSubjects.join(" ");

  // Find ALL sub-tags first (for tie-breaking)
  const matchedSubTags = new Set();
  for (const [tag, patterns] of Object.entries(subTagPatterns)) {
    if (patterns.some(p => p.test(subjectText))) {
      matchedSubTags.add(tag);
    }
  }

  // Check for genre overrides first
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
      for (const genre of matchingGenres) genreScores[genre] = 0;
      for (const tag of matchedSubTags) {
        const affinity = subTagGenreAffinity[tag];
        if (affinity && genreScores[affinity] !== undefined) genreScores[affinity]++;
      }
      let bestGenre = null, bestScore = -1;
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

  if (!primaryGenre) primaryGenre = "Literary Fiction";

  // Special handling for Romantasy
  const hasFantasyElements = /\bfantasy\b/i.test(subjectText) || /\bfae\b/i.test(subjectText) || /\bmagic\b/i.test(subjectText);
  const hasRomanceElements = /\bromance\b/i.test(subjectText) || /\blove\s*stor/i.test(subjectText);
  if (hasFantasyElements && hasRomanceElements && (primaryGenre === "Fantasy" || primaryGenre === "Romance")) {
    matchedSubTags.add("Romantasy");
  }

  const subTagsArray = Array.from(matchedSubTags).slice(0, 4);
  return [primaryGenre, ...subTagsArray];
}

// Test books with their actual OpenLibrary subjects
const books = {
  "The Hunger Games": [
    "severe poverty", "starvation", "oppression", "effects of war", "self-sacrifice",
    "Science fiction", "Apocalyptic fiction", "Dystopian fiction", "Fiction",
    "Juvenile works", "Novels", "Young adult works", "Juvenile fiction",
    "Young adult fiction", "Game shows", "Television programs", "Contests",
    "Survival", "Interpersonal relations", "Sisters", "Young women", "Dystopias",
    "Survival skills", "Action & Adventure", "Survival Stories", "Fantasy fiction",
    "Action and adventure fiction"
  ],

  "A Court of Thorns and Roses": [
    "Fantasy", "Love", "Blessing and cursing", "Fairies", "Fiction",
    "Juvenile fiction", "Love stories", "Fantasy fiction", "Fairies, fiction",
    "Magic", "Man-woman relationships", "Älvor", "Kärlek", "Young adult fiction",
    "Teen fiction", "Magi", "Faerie", "Romance", "Courts ect.", "Shipping"
  ],

  "Pride and Prejudice": [
    "Fiction, Romance, Historical, Regency", "Brothers and sisters", "Courtship",
    "English fiction", "Families", "Family life", "Literary Fiction", "Love stories",
    "manners", "Manners and customs", "marriage", "Sisters", "Social classes",
    "Young women", "Romance fiction", "Historical fiction", "Classical literature",
    "Domestic fiction"
  ],

  "It (Stephen King)": [
    "coming of age", "thrillers", "suspense", "horror", "ghosts", "Fiction",
    "Good and evil", "horror stories", "horror tales", "Horror fiction",
    "Fiction, horror", "American literature", "Monsters", "Clowns", "Literary"
  ],

  "Misery": [
    "Captives", "Fiction", "Prisoners", "Suspense fiction", "horror",
    "isolation", "suspense", "thriller", "Horror tales", "Fiction, horror",
    "Thrillers", "Fiction, thrillers, suspense", "Horror - General"
  ],

  "The Da Vinci Code": [
    "Suspense & Thriller", "mystery & suspense", "suspense fiction",
    "adventure fiction", "International thriller", "Mystery fiction",
    "thrillers", "suspense", "Historical Mystery & Detective Fiction",
    "Mystery", "Cryptographers", "Fiction", "Detective and mystery stories",
    "Fiction, mystery & detective, general", "Fiction, thrillers", "Fiction, suspense"
  ],

  "Dune": [
    "Dune (Imaginary place)", "Fiction", "Fiction, science fiction, general",
    "Dune (imaginary place), fiction", "Science fiction", "Science-fiction",
    "American literature", "Hugo Award Winner", "American Science fiction",
    "Ecology", "Fantasy fiction"
  ],

  "Gone Girl": [
    "FICTION / Mystery & Detective / General", "Married people", "Crimes against",
    "Wives", "Husbands", "FICTION / Thrillers", "FICTION / Suspense", "Fiction",
    "mystery fiction", "suspense fiction", "Detective and mystery fiction",
    "American detective and mystery stories", "thrillers", "suspense", "diaries",
    "secrets", "victims of crimes", "Mystery & Detective fiction", "Disappeared persons",
    "Missing persons", "Marriage", "Fiction, thrillers, suspense"
  ],

  "1984": [
    "futurology", "censorship", "surveillance", "rebels", "sting operations",
    "Satirical literature", "English science fiction", "Political fiction",
    "Totalitarisme", "Fiction", "Totalitarismo", "Classic Literature", "Dystopias",
    "Ciencia-ficción", "Totalitarianism", "Science Fiction", "Dystopian plays",
    "Satire", "Psychological fiction", "Fantasy", "SciFi"
  ],

  "Twilight": [
    "Vampires", "Juvenile Fiction", "Fiction", "Science Fiction, Fantasy, & Magic",
    "Schools", "Love & Romance", "Horror & Ghost Stories", "High schools",
    "High school students", "First loves", "Vampires, fiction", "Schools, fiction",
    "Love, fiction", "Werewolves", "Interpersonal attraction", "Romance",
    "Paranormal", "Supernatural fiction", "Young adult fiction"
  ],

  // ========== LESSER-KNOWN TITLES ==========

  "House in the Cerulean Sea": [
    "American literature", "LGBTQ science fiction & fantasy", "LGBTQ young adult",
    "Fiction, fantasy, paranormal", "Fiction, occult & supernatural", "Magic",
    "Fiction", "Orphans", "Children", "Orphanages", "Institutional care",
    "Social workers", "Mythical animals", "FICTION / Fantasy / Contemporary",
    "FICTION / Fantasy / Humorous", "FICTION / Fantasy / Romantic", "End of the world"
  ],

  "Mexican Gothic": [
    "English literature", "Fiction, gothic", "Fiction, historical", "Mexico, fiction",
    "Fiction, historical, general", "Haunted houses", "Fiction", "Families",
    "Family secrets", "Gothic", "Horror", "Ghosts", "Research", "Debutantes",
    "Cousins", "Country homes", "Historical Fiction", "Mystery", "Fantasy", "Thriller"
  ],

  "Piranesi": [
    "form:novel", "genre:fantasy", "English literature", "Labyrinths", "Fiction",
    "Curiosities and wonders", "Dwellings", "Dead"
  ],

  "The Silent Patient": [
    "Fiction, psychological", "Fiction, thrillers", "London (england), fiction",
    "Artists, fiction", "Marriage, fiction", "Fiction, thrillers, general",
    "Family violence", "Fiction", "Marriage", "Artists", "Psychotherapy patients",
    "FICTION / Thrillers / Psychological", "FICTION / Thrillers / Suspense"
  ],

  "Circe": [
    "Fantasy", "Mythology", "Historical Fiction", "Retellings", "Gods", "Fiction",
    "Paranormal fiction", "Fiction, fantasy, historical", "Witches", "Magic",
    "Greek Mythology", "Historical", "Ancient", "General", "Literary", "Witchcraft",
    "Witches--fiction", "Magic--fiction", "Mythology, greek", "Mythology, greek--fiction",
    "Gods--fiction", "Animals, mythical", "Circe (greek mythology)"
  ],

  "The Night Circus": [
    "Fiction", "Magicians", "Circus", "Games", "Circus performers", "Psychokinesis",
    "Magic", "Fate and fatalism", "Night", "Competition (Psychology)", "Large type books",
    "Fiction, romance, fantasy", "Fiction, fantasy, historical"
  ],

  "Project Hail Mary": [
    "hard science-fiction", "science-fiction", "sci-fi", "hard sci-fi",
    "Fiction, science fiction, action & adventure", "Fiction, science fiction, hard science fiction",
    "End of the world", "Fiction", "Astronauts", "Space flight", "Memory disorders",
    "Survival", "FICTION / Science Fiction / Action & Adventure",
    "FICTION / Science Fiction / Hard Science Fiction", "FICTION / Thrillers / Suspense"
  ],

  // ========== MORE OBSCURE TITLES ==========

  "The Poppy War": [
    "Fiction", "Fantasy", "Historical", "Epic", "Cultural Heritage", "Goddesses",
    "Imaginary wars and battles", "Magic", "Military education", "Shamans",
    "Fiction, fantasy, epic", "Fiction, fantasy, paranormal"
  ],

  "Seven Husbands of Evelyn Hugo": [
    "Biographers", "Fiction", "Fiction, general", "Hollywood (los angeles, calif.), fiction",
    "Fiction, romance, contemporary", "Women journalists", "Motion picture actors and actresses",
    "Motion picture industry", "Biography", "Authorship", "Man-woman relationships",
    "LGBTQ novels", "Actors and actresses", "Contemporary Women", "Family Life", "Romance", "Contemporary"
  ],

  "Southern Book Club's Guide to Slaying Vampires": [
    "American literature", "Fiction, thrillers, general", "Fiction, occult & supernatural",
    "Fiction, horror", "Horror", "Fiction", "Fantasy", "Vampires", "Thriller", "Paranormal", "Mystery"
  ],

  "Anxious People": [
    "Fiction, humorous", "Sweden, fiction", "Fiction, humorous, general", "Germanic literature",
    "Hostages", "Fiction", "Married people", "Real estate agents", "City and town life", "Theft"
  ],

  // ========== NEW TEST CASES ==========

  "The Martian (Hard Sci-Fi)": [
    "Science-Fiction", "Science Fiction & Fantasy", "Suspense & Thriller", "Astronauts",
    "Survival", "Survival skills", "New York Times bestseller", "Fiction",
    "Mars (Planet)", "Space flight to Mars"
  ],

  "Ender's Game (Military Sci-Fi)": [
    "New York Times bestseller", "Military education", "Space warfare", "Child soldiers",
    "Science fiction", "Aliens", "Hugo Award Winner", "War games",
    "Artificial intelligence", "Genetic engineering", "American Science fiction",
    "Children's stories, American", "Fiction"
  ],

  "The Name of the Wind (Epic Fantasy)": [
    "Fantasy fiction", "Magic", "Wizards", "Coming-of-age", "Orphans", "Quests",
    "Legends", "Storytelling", "Kingkiller Chronicle", "Antiheroes", "Revenge",
    "Mystery", "University", "Inn", "Imaginary places", "American fantasy literature",
    "Young adult fiction", "Fiction"
  ],

  "The Shining (Horror)": [
    "Fiction", "horror fiction", "demonology", "precognition", "authors", "hotelkeepers",
    "gothic & horror", "paranormal fiction", "suspense & thriller", "horror",
    "supernatural thrillers", "ghost fiction", "horror tales", "haunted houses",
    "alcoholism", "psychics", "telepathy", "clairvoyance", "ghosts",
    "Fiction, horror", "Colorado fiction", "American literature", "Families",
    "New York Times bestseller", "Fiction, thrillers, psychological", "Hotels",
    "Occultism", "Paranormal fiction", "Horror - General"
  ],

  "Divergent (YA Dystopian)": [
    "Dystopian fiction", "Young adult literature", "Science fiction", "Family dynamics",
    "Identity", "Psychology", "Social classes", "Courage", "Individuality",
    "New York Times bestseller", "Conformity", "Choice psychology", "Family life",
    "Young adult fiction", "Fiction"
  ],

  "It Ends With Us (Contemporary Romance)": [
    "Fiction, Romance, Contemporary", "Life change events", "Triangles (Interpersonal relations)",
    "Man-woman relationships", "Neurosurgeons", "First loves", "Businesswomen", "Fiction",
    "Contemporary Women", "New York Times bestseller", "Fiction, romance, contemporary",
    "Man-woman relationships, fiction", "Fiction, women", "Fiction, romance, new adult"
  ],

  "And Then There Were None (Mystery)": [
    "Mystery fiction", "Detective and mystery stories", "Mystery & Detective",
    "Murder", "Crime", "Serial murders, fiction", "Islands", "Islands in fiction",
    "England, fiction", "Fiction, thrillers, suspense", "Traditional",
    "Murder victims", "Fiction", "Whodunit"
  ],

  "Outlander (Historical Romance + Time Travel)": [
    "Historical fiction", "Romance", "Fantasy", "Time travel", "Man-woman relationships in fiction",
    "Scotland in fiction", "Jacobite Rebellion, 1745-1746", "Culloden, Battle of, Scotland, 1746",
    "Love stories", "War stories", "Fantasy fiction", "Fiction"
  ],

  "Fourth Wing (Romantasy)": [
    "Fantasy", "Fiction", "Romance", "Young adult fiction",
    "New York Times bestseller", "Dragons", "Magic", "Academy"
  ],

  "Red Rising (Sci-Fi Dystopian)": [
    "Science fiction", "Fantasy", "Fiction", "Dystopia", "Young Adult",
    "Revolution", "Social classes", "Mars"
  ],

  // ========== NICHE & RECENT TITLES (2019-2023) ==========

  "The Love Hypothesis (Rom-Com)": [
    "American literature", "New York Times bestseller", "Romantic fiction", "rom-com",
    "romance", "College Life", "Women authors", "women in STEM", "Contemporary Romance",
    "Contemporary", "Fiction", "Adult", "New Adult", "Young adults"
  ],

  "Iron Widow (Sci-Fi Fantasy)": [
    "Fiction", "Sci-Fi", "Fantasy", "New York Times bestseller"
  ],

  "House of Salt and Sorrows (Gothic Fantasy)": [
    "Children's fiction", "Death, fiction", "Sisters, fiction", "Islands, fiction",
    "New York Times bestseller", "Gothic", "Mystery", "Fantasy"
  ],

  "A Memory Called Empire (Space Opera)": [
    "American literature", "Fiction, science fiction, action & adventure",
    "LGBTQ science fiction & fantasy", "Hugo Award Winner", "Ambassadors", "Fiction",
    "Murder", "Extraterrestrial beings", "Space opera", "Imperialism"
  ],

  "Tomorrow and Tomorrow and Tomorrow (Literary)": [
    "American literature", "New York Times bestseller", "Modern fiction", "Fiction",
    "Video games", "Friendship", "Love"
  ],

  "Icebreaker (Sports Romance)": [
    "Figure skating", "Hockey", "Young adult", "Romance", "sports",
    "enemies to lovers", "rivals to lovers", "second chance romance",
    "coming-of-age", "friendship", "family", "perseverance", "dreams", "love"
  ],

  "The Atlas Six (Dark Academia Fantasy)": [
    "New York Times bestseller", "Magic", "Fiction", "Magicians", "Secret societies",
    "Scholars", "FICTION / Fantasy / Contemporary", "FICTION / Fantasy / Dark Fantasy",
    "FICTION / Fantasy / Urban", "Teenagers", "Contests", "Academy"
  ],

  "Klara and the Sun (Literary Sci-Fi)": [
    "Fiction, science fiction, general", "Speculative fiction", "New York Times bestseller",
    "Fiction, dystopian", "Fiction", "Artificial intelligence", "Robots",
    "Romance fiction", "Friendship", "Love", "Literary", "FICTION / Literary",
    "FICTION / Science Fiction / General"
  ],

  "The Invisible Life of Addie LaRue (Fantasy Romance)": [
    "New York Times bestseller", "Fiction, fantasy, historical",
    "LGBTQ science fiction & fantasy", "Memory", "Fiction", "Immortalism", "Deals",
    "Man-woman relationships", "FICTION / Fantasy / Historical", "FICTION / Literary"
  ],

  "A Psalm for the Wild-Built (Cozy Sci-Fi)": [
    "American literature", "Robots", "Fiction", "Mythology",
    "Self-consciousness (Awareness)", "Gender-nonconforming people",
    "Stonewall Book Awards", "Solarpunk", "Cozy"
  ],

  "The House in the Pines (Psychological Thriller)": [
    "New York Times bestseller", "Fiction, thrillers, psychological",
    "Fiction, thrillers, suspense", "Mystery", "Suspense"
  ],

  "Babel (Dark Academia Fantasy)": [
    "New York Times bestseller", "Translators", "Fiction", "Chinese", "Imperialism",
    "Magic", "History", "University of Oxford", "Fiction, fantasy, historical",
    "Fiction, alternative history", "Fiction, fantasy, dark fantasy",
    "Fiction, fantasy, epic", "Academy", "Dark"
  ],

  "Things We Never Got Over (Small Town Romance)": [
    "Fiction, romance, general", "Contemporary romance", "Second chance romance",
    "Estranged friends to lovers", "Small town", "Family drama", "Second chance at love",
    "Forgiveness", "Self-discovery", "Healing", "Redemption", "New York Times bestseller",
    "Fiction, romance, contemporary", "Fiction, small town & rural",
    "Fiction, romance, romantic comedy"
  ]
};

console.log("\n=== GENRE CLASSIFICATION TEST RESULTS ===\n");
for (const [title, subjects] of Object.entries(books)) {
  const categories = mapSubjectsToCategories(subjects);
  console.log(`📚 ${title}`);
  console.log(`   Primary: ${categories[0]}`);
  console.log(`   Sub-tags: ${categories.slice(1).join(", ") || "(none)"}`);
  console.log(`   Full: [${categories.map(c => `"${c}"`).join(", ")}]`);
  console.log();
}
