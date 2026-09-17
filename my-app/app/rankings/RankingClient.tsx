"use client"
import React, { useEffect, useState } from 'react'
import {
  Search,
  Filter,
  Star,
  BookOpen,
  ChevronDown,
  X,
  Trophy,
  Calendar,
  Users,
  Award,
  Medal,
  Heart,
  Eye,
  BookMarked,
} from 'lucide-react'
import Header from '../components/Header'
import { BookData } from '../types/types'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import axios from 'axios'
import RankingAddToCollectionPopup from '../components/RankingAddToCollectionPopup'
import Image from 'next/image'
import Footer from '../components/Footer'
import { toAmericanDate } from '@/utils/util'

const RankingClient = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [rankingType, setRankingType] = useState<'rating' | 'popularity'>('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [books, setBooks] = useState<BookData[]>([])
  const [loading, setLoading] = useState(false)

  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBooks: 0,
    booksPerPage: 100,
    hasNextPage: false,
    hasPreviousPage: false,
    startIndex: 1,
    endIndex: 100,
  })

  const genres = [
    { value: 'all', label: 'All Genres' },
    { value: 'Fantasy', label: 'Fantasy' },
    { value: 'Romance', label: 'Romance' },
    { value: 'Science Fiction', label: 'Science Fiction' },
    { value: 'Magic', label: 'Magic' },
    { value: 'Mystery', label: 'Mystery' },
    { value: 'Thriller', label: 'Thriller' },
    { value: 'Supernatural', label: 'Supernatural' },
    { value: 'Non-Fiction', label: 'Non-Fiction' },
    { value: 'Adventure', label: 'Adventure' },
  ]

  const yearOptions = [
    { value: 'all', label: 'All Years' },
    { value: '2020s', label: '2020s' },
    { value: '2010s', label: '2010s' },
    { value: '2000s', label: '2000s' },
    { value: '1990s', label: '1990s' },
    { value: '1980s', label: '1980s' },
    { value: 'older', label: 'Before 1980' },
  ]

  const fetchRankings = async () => {
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const accessToken = session?.access_token

      const params = new URLSearchParams({
        sort: rankingType,
        page: currentPage.toString(),
        limit: '100',
        ...(selectedGenre !== 'all' && { genre: selectedGenre }),
        ...(selectedYear !== 'all' && { year: selectedYear }),
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/rankings?${params}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.data?.books) {
        setBooks(response.data.books)
        setPagination(response.data.pagination)
      } else {
        console.warn('No books returned')
      }
    } catch (error) {
      console.error('Error fetching books:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setCurrentPage(1)
    fetchRankings()
  }, [rankingType, selectedGenre, selectedYear, searchQuery])

  useEffect(() => {
    fetchRankings()
  }, [currentPage])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePreviousPage = () => {
    if (pagination.hasPreviousPage) {
      handlePageChange(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      handlePageChange(currentPage + 1)
    }
  }

  const handleBookAdded = (openLibraryId: string, rating: number, status: string) => {
    setBooks((prevBooks) =>
      prevBooks.map((book) =>
        book.openLibraryId === openLibraryId
          ? { ...book, userRating: rating, userStatus: status }
          : book
      )
    )
  }

  const getRankIcon = (rank: any) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-gold" />
    if (rank === 2) return <Medal className="h-4 w-4 text-ink-soft" />
    if (rank === 3) return <Award className="h-4 w-4 text-ember" />
    return <span className="text-sm font-semibold text-ink-mute">{rank}</span>
  }

  const accent = rankingType === 'rating' ? 'gold' : 'rate-good'

  const getRankingTypeTitle = () => {
    const baseTitle = rankingType === 'rating' ? 'Top Rated Books' : 'Most Popular Books'
    if (selectedGenre !== 'all') {
      const genreLabel = genres.find((g) => g.value === selectedGenre)?.label
      return `${baseTitle} — ${genreLabel}`
    }
    return baseTitle
  }

  const getRankingTypeDescription = () => {
    if (rankingType === 'rating') {
      return selectedGenre === 'all'
        ? 'The highest-rated books, by community reviews.'
        : `Highest-rated ${genres.find((g) => g.value === selectedGenre)?.label.toLowerCase()} books.`
    }
    return selectedGenre === 'all'
      ? 'The most-read books, by reader engagement.'
      : `Most popular ${genres.find((g) => g.value === selectedGenre)?.label.toLowerCase()} books.`
  }

  const hasActiveFilters = selectedGenre !== 'all' || selectedYear !== 'all' || Boolean(searchQuery)

  const clearAll = () => {
    setSelectedGenre('all')
    setSelectedYear('all')
    setSearchQuery('')
  }

  const PaginationComponent = () => {
    if (pagination.totalPages <= 1) return null

    const getPageNumbers = () => {
      const pages = []
      const maxPagesToShow = 5
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2))
      let endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1)

      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1)
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }
      return pages
    }

    const pageBtn =
      'h-9 min-w-9 rounded-full border border-line bg-overlay px-3 text-sm font-medium text-ink-soft transition-colors hover:bg-overlay-hover'

    return (
      <div className="mx-auto mt-8 max-w-7xl px-3 md:px-6">
        <div className="border-t border-line pt-6">
          <p className="mb-4 text-center text-sm text-ink-mute">
            Showing <span className="text-ink-soft">{pagination.startIndex}</span>–
            <span className="text-ink-soft">{pagination.endIndex}</span> of{' '}
            <span className="text-ink-soft">{pagination.totalBooks.toLocaleString()}</span> books
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={!pagination.hasPreviousPage}
              className={`${pageBtn} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Previous
            </button>

            {getPageNumbers()[0] > 1 && (
              <>
                <button onClick={() => handlePageChange(1)} className={pageBtn}>
                  1
                </button>
                {getPageNumbers()[0] > 2 && <span className="px-1 text-ink-faint">…</span>}
              </>
            )}

            {getPageNumbers().map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={
                  pageNum === currentPage
                    ? 'h-9 min-w-9 rounded-full border border-gold/40 bg-gold-dim px-3 text-sm font-semibold text-gold'
                    : pageBtn
                }
              >
                {pageNum}
              </button>
            ))}

            {getPageNumbers()[getPageNumbers().length - 1] < pagination.totalPages && (
              <>
                {getPageNumbers()[getPageNumbers().length - 1] < pagination.totalPages - 1 && (
                  <span className="px-1 text-ink-faint">…</span>
                )}
                <button onClick={() => handlePageChange(pagination.totalPages)} className={pageBtn}>
                  {pagination.totalPages}
                </button>
              </>
            )}

            <button
              onClick={handleNextPage}
              disabled={!pagination.hasNextPage}
              className={`${pageBtn} disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    )
  }

  const selectClass =
    'w-full appearance-none rounded-lg border border-line bg-overlay px-4 py-2.5 pr-9 text-sm text-ink transition-colors focus:border-gold/40 focus:outline-none'

  return (
    <div className="min-h-screen bg-canvas">
      <Header />

      <div className="relative z-10 mx-auto max-w-7xl px-3 py-6 md:px-6 md:py-10">
        {/* Page header */}
        <div className="mb-8">
          <p className="kicker">Rankings</p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
            {getRankingTypeTitle()}
          </h1>
          <p className="mt-2 text-sm text-ink-mute">{getRankingTypeDescription()}</p>

          {/* Ranking type toggle */}
          <div className="mt-6 inline-flex rounded-full border border-line bg-overlay p-1">
            <button
              onClick={() => setRankingType('rating')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                rankingType === 'rating' ? 'bg-gold-dim text-gold' : 'text-ink-mute hover:text-ink'
              }`}
            >
              <Star className="h-3.5 w-3.5" />
              Top rated
            </button>
            <button
              onClick={() => setRankingType('popularity')}
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                rankingType === 'popularity'
                  ? 'bg-rate-good/15 text-rate-good'
                  : 'text-ink-mute hover:text-ink'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Most popular
            </button>
          </div>
        </div>

        {/* Desktop filters */}
        <div className="mb-6 hidden md:block">
          <div className="flex items-center gap-3 border-y border-line py-4">
            <div className="relative w-56">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className={selectClass}
              >
                {genres.map((genre) => (
                  <option key={genre.value} value={genre.value} className="bg-surface">
                    {genre.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            </div>

            <div className="relative w-44">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={selectClass}
              >
                {yearOptions.map((year) => (
                  <option key={year.value} value={year.value} className="bg-surface">
                    {year.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearAll}
                className="flex items-center gap-2 rounded-full border border-line bg-overlay px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-overlay-hover"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile filters */}
        <div className="mb-4 md:hidden">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 rounded-full border border-line bg-overlay px-4 py-2 text-sm font-medium text-ink-soft"
          >
            <Filter className="h-3.5 w-3.5" />
            Filters
          </button>

          {showFilters && (
            <div className="mt-3 space-y-3 rounded-2xl border border-line bg-surface/50 p-4">
              <div>
                <label className="mb-1 block font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute">
                  Genre
                </label>
                <div className="relative">
                  <select
                    value={selectedGenre}
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    className={selectClass}
                  >
                    {genres.map((genre) => (
                      <option key={genre.value} value={genre.value} className="bg-surface">
                        {genre.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                </div>
              </div>

              <div>
                <label className="mb-1 block font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute">
                  Publication year
                </label>
                <div className="relative">
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className={selectClass}
                  >
                    {yearOptions.map((year) => (
                      <option key={year.value} value={year.value} className="bg-surface">
                        {year.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={() => {
                    clearAll()
                    setShowFilters(false)
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-line bg-overlay px-4 py-2 text-sm font-medium text-ink-soft"
                >
                  <X className="h-3.5 w-3.5" />
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-24 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-line bg-overlay">
              <Star className={`h-6 w-6 animate-pulse text-${accent}`} />
            </div>
            <h3 className="font-display mt-6 text-xl font-semibold text-ink">Loading rankings…</h3>
            <p className="mt-2 text-sm text-ink-mute">Tallying the community&apos;s scores.</p>
          </div>
        )}

        {/* Rankings list */}
        {!loading && (
          <div className="overflow-hidden rounded-2xl border border-line bg-surface/40">
            {/* Desktop column header */}
            <div className="hidden border-b border-line px-6 py-3 md:block">
              <div className="grid grid-cols-12 items-center gap-4 font-mono text-[0.65rem] uppercase tracking-[0.16em] text-ink-mute">
                <div className="col-span-1">Rank</div>
                <div className="col-span-6">Book</div>
                <div className="col-span-2">
                  {rankingType === 'rating' ? 'Community score' : 'Total readers'}
                </div>
                <div className="col-span-2">
                  {rankingType === 'rating' ? 'Your score' : 'Community score'}
                </div>
                <div className="col-span-1">Action</div>
              </div>
            </div>

            <div className="divide-y divide-line">
              {books.map((book, index) => {
                const bookRank = (currentPage - 1) * pagination.booksPerPage + index + 1
                const isTopThree = bookRank <= 3

                return (
                  <div key={book.openLibraryId} className="transition-colors hover:bg-overlay">
                    {/* Mobile layout */}
                    <div className="px-4 py-4 md:hidden">
                      <div className="flex gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-line bg-overlay">
                          {bookRank <= 3 ? (
                            getRankIcon(bookRank)
                          ) : (
                            <span className="text-xs font-bold text-ink-mute">{bookRank}</span>
                          )}
                        </div>

                        <div className="h-28 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
                          <Image
                            width={80}
                            height={112}
                            src={book.image}
                            alt={book.title}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <Link href={`book/${book.openLibraryId ?? ''}`}>
                            <h3 className="text-sm font-semibold leading-tight text-ink transition-colors hover:text-gold">
                              {book.title.length > 45 ? `${book.title.slice(0, 45)}…` : book.title}
                            </h3>
                          </Link>
                          <p className="mt-0.5 line-clamp-1 text-xs text-ink-mute">by {book.author}</p>

                          <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center gap-1 rounded-full border border-line bg-overlay px-2 py-0.5 text-xs font-medium text-ink-soft">
                                <Star className="h-3 w-3 fill-gold text-gold" />
                                {book.averageRating?.toFixed(2)}
                              </span>
                              <span className="flex items-center gap-1 rounded-full border border-line bg-overlay px-2 py-0.5 text-xs font-medium text-ink-soft">
                                <Users className="h-3 w-3 text-rate-good" />
                                {book.totalRatings}
                              </span>
                            </div>

                            <RankingAddToCollectionPopup
                              openLibraryId={book.openLibraryId ?? ''}
                              buttonType={'ranking-mobile'}
                              userStatus={book.userRating !== null ? 'completed' : null}
                              onBookAdded={handleBookAdded}
                            />
                          </div>

                          <div className="mt-2 flex items-center gap-1.5 text-xs text-ink-faint">
                            <Calendar className="h-3 w-3" />
                            <span>{toAmericanDate(book.publishedDate)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop layout */}
                    <div className="hidden px-6 py-4 md:block">
                      <div className="grid grid-cols-12 items-center gap-4">
                        <div className="col-span-1 flex justify-center">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                              isTopThree ? 'border-gold/30 bg-gold-dim' : 'border-line bg-overlay'
                            }`}
                          >
                            {getRankIcon(bookRank)}
                          </div>
                        </div>

                        <div className="col-span-6 flex gap-4">
                          <div className="h-36 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-line bg-surface-2">
                            <Image
                              width={120}
                              height={180}
                              src={book.image}
                              alt={book.title}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <Link href={`book/${book.openLibraryId}`}>
                              <h3 className="line-clamp-1 font-semibold text-ink transition-colors hover:text-gold">
                                {book.title}
                              </h3>
                            </Link>
                            <p className="mt-1 text-sm text-ink-mute">by {book.author}</p>
                            <div className="mt-2 flex items-center gap-4 text-xs text-ink-faint">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {book.publishedDate}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {book.totalRatings?.toLocaleString()} readers
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Community / popularity score */}
                        <div className="col-span-2">
                          {rankingType === 'rating' ? (
                            <>
                              <div className="flex items-center gap-1.5">
                                <Star className="h-4 w-4 fill-gold text-gold" />
                                <span className="font-display text-lg font-semibold text-gold">
                                  {book.averageRating?.toFixed(2)}
                                </span>
                              </div>
                              <div className="mt-0.5 text-xs text-ink-faint">
                                {book.totalRatings?.toLocaleString()} votes
                              </div>
                            </>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Users className="h-4 w-4 text-rate-good" />
                              <span className="font-display text-lg font-semibold text-rate-good">
                                {book.totalRatings?.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Second metric column */}
                        {rankingType === 'rating' ? (
                          <div className="col-span-2">
                            {book.userRating !== null ? (
                              <>
                                <div className="flex items-center gap-1.5">
                                  <Heart className="h-4 w-4 fill-rate-good text-rate-good" />
                                  <span className="font-display text-lg font-semibold text-rate-good">
                                    {book.userRating}
                                  </span>
                                </div>
                                <div className="mt-0.5 text-xs text-ink-faint">Your rating</div>
                              </>
                            ) : (
                              <span className="inline-block rounded-full border border-line bg-overlay px-2.5 py-1 text-xs text-ink-faint">
                                Not rated
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="col-span-2">
                            <div className="flex items-center gap-1.5">
                              <Star className="h-4 w-4 fill-gold text-gold" />
                              <span className="font-display text-lg font-semibold text-gold">
                                {book.averageRating?.toFixed(2)}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs text-ink-faint">
                              {book.totalRatings?.toLocaleString()} votes
                            </div>
                          </div>
                        )}

                        <div className="col-span-1">
                          <RankingAddToCollectionPopup
                            openLibraryId={book.openLibraryId ?? ''}
                            buttonType={'ranking-laptop'}
                            userStatus={book.userRating !== null ? 'completed' : null}
                            onBookAdded={handleBookAdded}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Empty state */}
            {books.length === 0 && (
              <div className="py-24 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-line bg-overlay">
                  <BookOpen className="h-6 w-6 text-ink-mute" />
                </div>
                <h3 className="font-display mt-6 text-xl font-semibold text-ink">No books found</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-ink-mute">
                  {hasActiveFilters
                    ? 'Try adjusting your search or filters.'
                    : 'No books available for this ranking type.'}
                </p>
                {hasActiveFilters && (
                  <button
                    onClick={clearAll}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ember-strong"
                  >
                    <X className="h-4 w-4" />
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Active filters */}
        {hasActiveFilters && !loading && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute">Active</span>
            {selectedGenre !== 'all' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold-dim px-3 py-1 text-xs font-medium text-gold">
                <BookMarked className="h-3 w-3" />
                {genres.find((g) => g.value === selectedGenre)?.label}
                <button onClick={() => setSelectedGenre('all')} className="ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {selectedYear !== 'all' && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-rate-good/30 bg-rate-good/15 px-3 py-1 text-xs font-medium text-rate-good">
                <Calendar className="h-3 w-3" />
                {yearOptions.find((y) => y.value === selectedYear)?.label}
                <button onClick={() => setSelectedYear('all')} className="ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-overlay px-3 py-1 text-xs font-medium text-ink-soft">
                <Search className="h-3 w-3" />
                &ldquo;{searchQuery}&rdquo;
                <button onClick={() => setSearchQuery('')} className="ml-0.5">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      <PaginationComponent />
      <Footer />
    </div>
  )
}

export default RankingClient
