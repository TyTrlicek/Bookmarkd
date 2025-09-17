# Book Seeding Scripts

This directory contains scripts for bulk importing books into the Bookmarkd database.

## Quick Start

```bash
# Install dependencies (if not already installed)
cd backend
npm install

# Make the script executable (Unix/Mac)
chmod +x scripts/seed-books.js

# Run basic seeding with popular books
node scripts/seed-books.js --mode=popular --limit=50

# Run comprehensive genre-based seeding
node scripts/seed-books.js --mode=genres --limit=1000

# Use custom book list
node scripts/seed-books.js --mode=custom --file=scripts/book-lists/bestsellers-2024.json --limit=100
```

## Seeding Modes

### 1. Popular Mode (`--mode=popular`)
Seeds with a curated list of popular, high-quality books including:
- Fantasy classics (Harry Potter, LOTR, Game of Thrones)
- Science fiction essentials (Dune, Foundation, Hitchhiker's Guide)
- Romance favorites (Pride and Prejudice, Outlander)
- Mystery/thriller hits (Gone Girl, Da Vinci Code)
- Classic literature (1984, To Kill a Mockingbird)
- Contemporary bestsellers

**Best for**: Initial database setup, demo data
**Recommended limit**: 50-500 books

### 2. Genres Mode (`--mode=genres`)
Searches OpenLibrary for highly-rated books across all supported genres:
- Fantasy, Romance, Science Fiction, Mystery, Non-Fiction
- Automatically filters for books with rating > 3.5
- Distributes books evenly across genres

**Best for**: Comprehensive database population
**Recommended limit**: 1000-10000 books

### 3. Custom Mode (`--mode=custom`)
Import from a custom JSON file containing OpenLibrary work IDs.

**Best for**: Specific collections, curated lists
**Example file format**:
```json
[
  "OL82563W",
  "OL27479W",
  "OL45804W"
]
```

## Command Line Options

- `--mode=<mode>`: Seeding mode (popular, genres, custom)
- `--limit=<number>`: Maximum number of books to process
- `--file=<path>`: JSON file with book IDs (required for custom mode)

## Features

- **Rate Limiting**: Respects OpenLibrary API limits
- **Duplicate Detection**: Skips books already in database
- **Batch Processing**: Processes books in configurable batches
- **Progress Tracking**: Real-time progress updates
- **Error Recovery**: Saves failed book IDs for retry
- **Data Validation**: Uses existing book creation logic
- **Graceful Interruption**: Can be stopped with Ctrl+C

## Performance

- **Batch Size**: 10 books per batch (configurable)
- **API Delay**: 100ms between OpenLibrary calls
- **Batch Delay**: 2 seconds between batches
- **Estimated Speed**: ~200-300 books per hour

## Examples

```bash
# Quick demo setup (2-3 minutes)
node scripts/seed-books.js --mode=popular --limit=25

# Small production setup (30-45 minutes)
node scripts/seed-books.js --mode=popular --limit=100
node scripts/seed-books.js --mode=genres --limit=500

# Large production setup (several hours)
node scripts/seed-books.js --mode=genres --limit=5000

# Retry failed books
node scripts/seed-books.js --mode=custom --file=failed-books-1234567890.json
```

## Error Handling

If books fail to import:
1. Failed book IDs are saved to `failed-books-<timestamp>.json`
2. Retry using: `node scripts/seed-books.js --mode=custom --file=failed-books-<timestamp>.json`
3. Common failure reasons:
   - Network timeouts
   - Missing book data on OpenLibrary
   - Invalid OpenLibrary work IDs

## Output Example

```
[INFO] Starting book seeding in popular mode with limit 25
[INFO] Generated 25 book IDs to process
[INFO] Processing batch 1/3
[SUCCESS] Created book: The Hobbit by J.R.R. Tolkien
[WARN] Book OL82564W already exists, skipping
[ERROR] Failed to process book OL999999W: Book not found
[PROGRESS] Processed: 10, Success: 8, Failed: 1, Skipped: 1
...
====================================================================
SEEDING COMPLETE
====================================================================
[SUCCESS] Successfully created: 20 books
[ERROR] Failed: 2 books
[WARN] Skipped (already exist): 3 books
[INFO] Total processed: 25 books
[INFO] Time taken: 45s
```

## Best Practices

1. **Start Small**: Begin with `--limit=25` to test
2. **Monitor Progress**: Watch for high failure rates
3. **Retry Failures**: Use the generated failed-books JSON files
4. **Off-Peak Hours**: Run large imports during low traffic
5. **Backup Database**: Before large imports

## Troubleshooting

**High failure rate**: Check internet connection, OpenLibrary status
**Database errors**: Verify Prisma connection, check disk space
**Memory issues**: Reduce batch size in script
**API rate limits**: Increase delays between calls

## Adding Custom Book Lists

Create JSON files in `scripts/book-lists/` directory:

```json
[
  "OL82563W",
  "OL27479W"
]
```

Find OpenLibrary work IDs by:
1. Searching on openlibrary.org
2. Looking at the URL: `/works/OL82563W` → use `OL82563W`
3. Using the OpenLibrary API search