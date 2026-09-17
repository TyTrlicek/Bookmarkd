'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  BookOpen,
  Calendar,
  Tag,
  X,
  Sliders,
  Globe,
  Loader2,
} from 'lucide-react'
import Header from '../components/Header'
import BookCard from '../components/BookCard'
import { getSearchData } from '@/utils/util'
import { BookData } from '../types/types'
import debounce from 'lodash/debounce'
import Footer from '../components/Footer'
import MobileBookListItem from '../components/MobileBookListItem'

const BrowseClient = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('relevance')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedYears, setSelectedYears] = useState<string[]>([])
  const [selectedRating, setSelectedRating] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [booksPerPage] = useState(24)
  const [books, setBooks] = useState<BookData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setBooks([])
      setIsLoading(false)
      setHasSearched(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await getSearchData(query)
      setBooks(response ?? [])
      setHasSearched(true)
    } catch (error) {
      console.error('Error fetching books:', error)
      setBooks([])
      setHasSearched(true)
    } finally {
      setIsLoading(false)
    }
  }

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      handleSearch(query)
    }, 500),
    []
  )

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery)
    } else {
      setBooks([])
      setIsLoading(false)
      setHasSearched(false)
    }

    return () => {
      debouncedSearch.cancel()
    }
  }, [searchQuery])

  // Check for URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const searchParam = urlParams.get('search')
    if (searchParam) {
      setSearchQuery(searchParam)
    } else {
      setSearchQuery('')
    }
  }, [])

  const genres = [
    'Contemporary Fiction', 'Science Fiction', 'Fantasy', 'Thriller', 'Mystery',
    'Romance', 'Literary Fiction', 'Historical Fiction', 'Self-Help', 'Biography',
    'Memoir', 'Business', 'Psychology', 'Philosophy', 'Health & Fitness',
  ]

  const years = ['2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', 'Before 2015']

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'title', label: 'Title' },
    { value: 'authors', label: 'Author' },
    { value: 'publishedDate', label: 'Publication Year' },
  ]

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    )
  }

  const handleYearToggle = (year: string) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    )
  }

  const clearFilters = () => {
    setSelectedGenres([])
    setSelectedYears([])
    setSelectedRating('')
  }

  const handleSecondarySearch = (term: string) => {
    handleSearch(`${term}.`)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const sortedBooks = [...books].sort((a, b) => {
    let aValue: any = a[sortBy as keyof BookData]
    let bValue: any = b[sortBy as keyof BookData]

    if (sortBy === 'authors') {
      aValue = a.author
      bValue = b.author
    }

    if (sortBy === 'publishedDate') {
      aValue = a.publishedDate || '0'
      bValue = b.publishedDate || '0'
    }

    if (typeof aValue === 'string') {
      return sortOrder === 'asc'
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue))
    }

    return sortOrder === 'asc' ? Number(aValue) - Number(bValue) : Number(bValue) - Number(aValue)
  })

  const totalPages = Math.ceil(sortedBooks.length / booksPerPage)
  const startIndex = (currentPage - 1) * booksPerPage
  const displayedBooks = sortedBooks.slice(startIndex, startIndex + booksPerPage)

  const activeFilterCount = selectedGenres.length + selectedYears.length + (selectedRating ? 1 : 0)

  const LoadingSpinner = () => (
    <div className="py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-line bg-overlay">
        <Loader2 className="h-6 w-6 animate-spin text-gold" />
      </div>
      <h3 className="font-display mt-6 text-xl font-semibold text-ink">Searching…</h3>
      <p className="mt-2 text-sm text-ink-mute">Pulling the best matches from the shelf.</p>
    </div>
  )

  const EmptyState = () => (
    <div className="py-24 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-line bg-overlay">
        <BookOpen className="h-6 w-6 text-ink-mute" />
      </div>
      <h3 className="font-display mt-6 text-xl font-semibold text-ink">
        {hasSearched ? 'No books found' : 'Search the collection'}
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-mute">
        {hasSearched
          ? "Try different terms or loosen your filters."
          : 'Search by title, author, or ISBN to start building your shelf.'}
      </p>
      {hasSearched && (
        <button
          onClick={() => {
            setSearchQuery('')
            setHasSearched(false)
            clearFilters()
          }}
          className="mt-6 rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ember-strong"
        >
          Clear and start over
        </button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-canvas">
      <Header />

      <div className="relative mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="kicker">Discover</p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
            Browse books
          </h1>

          <div className="relative mt-6">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Search books, authors, ISBN…"
              className="w-full rounded-full border border-line bg-overlay py-3.5 pl-11 pr-11 text-sm text-ink placeholder-ink-faint transition-colors focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {isLoading && (
              <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gold" />
            )}
          </div>
        </div>

        {/* Controls bar */}
        {!isLoading && books.length > 0 && (
          <div className="mb-6 hidden items-center justify-between gap-4 border-y border-line py-4 md:flex">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  showFilters || activeFilterCount > 0
                    ? 'border-gold/40 bg-gold-dim text-gold'
                    : 'border-line bg-overlay text-ink-soft hover:bg-overlay-hover'
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-gold/20 px-1.5 text-xs font-semibold text-gold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute">
                  Sort
                </span>
                <select
                  className="rounded-lg border border-line bg-overlay px-3 py-2 text-sm text-ink focus:border-gold/40 focus:outline-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value} className="bg-surface">
                      {option.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="rounded-lg border border-line bg-overlay p-2 text-ink-soft transition-colors hover:bg-overlay-hover"
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute">
              {books.length} results
            </span>
          </div>
        )}

        {/* Filters panel */}
        {!isLoading && books.length > 0 && showFilters && (
          <div className="mb-8 rounded-2xl border border-line bg-surface/50 p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Filter className="h-4 w-4 text-gold" />
                <h3 className="font-display text-lg font-semibold text-ink">Filters</h3>
              </div>
              <button
                onClick={clearFilters}
                className="text-xs font-medium text-gold transition-colors hover:text-gold-soft"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Genre */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-ink-mute" />
                  <h4 className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute">Genre</h4>
                </div>
                <div className="custom-scrollbar max-h-64 space-y-1 overflow-y-auto pr-2">
                  {genres.map((genre) => (
                    <label
                      key={genre}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 text-sm text-ink-soft transition-colors hover:bg-overlay"
                    >
                      <input
                        type="checkbox"
                        checked={selectedGenres.includes(genre)}
                        onChange={() => handleGenreToggle(genre)}
                        className="h-3.5 w-3.5 rounded border-line bg-overlay accent-gold"
                      />
                      {genre}
                    </label>
                  ))}
                </div>
              </div>

              {/* Year */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-ink-mute" />
                  <h4 className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute">
                    Publication year
                  </h4>
                </div>
                <div className="custom-scrollbar max-h-64 space-y-1 overflow-y-auto pr-2">
                  {years.map((year) => (
                    <label
                      key={year}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 text-sm text-ink-soft transition-colors hover:bg-overlay"
                    >
                      <input
                        type="checkbox"
                        checked={selectedYears.includes(year)}
                        onChange={() => handleYearToggle(year)}
                        className="h-3.5 w-3.5 rounded border-line bg-overlay accent-gold"
                      />
                      {year}
                    </label>
                  ))}
                </div>
              </div>

              {/* Language */}
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Globe className="h-3.5 w-3.5 text-ink-mute" />
                  <h4 className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute">Language</h4>
                </div>
                <div className="custom-scrollbar max-h-64 space-y-1 overflow-y-auto pr-2">
                  {Array.from(new Set(books.map((book) => book.language))).map((language) => (
                    <label
                      key={language}
                      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 text-sm text-ink-soft transition-colors hover:bg-overlay"
                    >
                      <input
                        type="checkbox"
                        className="h-3.5 w-3.5 rounded border-line bg-overlay accent-gold"
                      />
                      {language?.toUpperCase()}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active filters */}
        {!isLoading && books.length > 0 && activeFilterCount > 0 && (
          <div className="mb-8 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute">Active</span>
            {selectedGenres.map((genre) => (
              <button
                key={genre}
                onClick={() => handleGenreToggle(genre)}
                className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold-dim px-3 py-1 text-xs font-medium text-gold transition-colors hover:bg-gold/20"
              >
                {genre}
                <X className="h-3 w-3" />
              </button>
            ))}
            {selectedYears.map((year) => (
              <button
                key={year}
                onClick={() => handleYearToggle(year)}
                className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold-dim px-3 py-1 text-xs font-medium text-gold transition-colors hover:bg-gold/20"
              >
                {year}
                <X className="h-3 w-3" />
              </button>
            ))}
            {selectedRating && (
              <button
                onClick={() => setSelectedRating('')}
                className="flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold-dim px-3 py-1 text-xs font-medium text-gold transition-colors hover:bg-gold/20"
              >
                {selectedRating}+ stars
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <LoadingSpinner />
        ) : displayedBooks.length > 0 ? (
          <>
            {isMobile ? (
              <div className="mb-12 space-y-3">
                {displayedBooks.map((book, index) => (
                  <MobileBookListItem key={book.openLibraryId || String(index)} book={book} />
                ))}

                {hasSearched && (
                  <div className="rounded-2xl border border-line bg-surface/50 p-6 text-center">
                    <p className="mb-4 text-sm text-ink-mute">Can&apos;t find the book you&apos;re looking for?</p>
                    <button
                      className="rounded-full border border-line-strong bg-overlay px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-overlay-hover"
                      onClick={() => handleSecondarySearch(searchQuery)}
                    >
                      Try a broader search
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {displayedBooks.map((book, index) => (
                  <BookCard key={book.openLibraryId || String(index)} book={book} />
                ))}

                {hasSearched && (
                  <div className="flex flex-col justify-center rounded-2xl border border-line bg-surface/50 p-6 text-center">
                    <p className="mb-3 text-xs text-ink-mute">Can&apos;t find the book you&apos;re looking for?</p>
                    <button
                      className="rounded-full border border-line-strong bg-overlay px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-overlay-hover"
                      onClick={() => handleSecondarySearch(searchQuery)}
                    >
                      Try a broader search
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-2 border-t border-line pt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full border border-line bg-overlay px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-overlay-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`h-9 w-9 rounded-full border text-sm font-medium transition-colors ${
                      currentPage === index + 1
                        ? 'border-gold/40 bg-gold-dim text-gold'
                        : 'border-line bg-overlay text-ink-soft hover:bg-overlay-hover'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-full border border-line bg-overlay px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-overlay-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <EmptyState />
        )}
      </div>

      <Footer />

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(224, 168, 93, 0.35);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(224, 168, 93, 0.55);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}

export default BrowseClient
