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
  TrendingUp,
  Calendar,
  Users,
  Award,
  Sliders,
  Medal,
  Plus,
  ListPlus,
  Heart,
  MessageSquare,
  Crown,
  Sparkles,
  Flame,
  Eye,
  BookMarked
} from 'lucide-react'
import Header from '../components/Header'
// import axios from 'axios'
import { BookData } from '../types/types'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import useAuthStore from '@/store/authStore'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import RankingAddToCollectionPopup from '../components/RankingAddToCollectionPopup'
import Image from 'next/image'
import Footer from '../components/Footer'



const RankingClient = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('all')
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [rankingType, setRankingType] = useState<'rating' | 'popularity'>('rating')
  const [showFilters, setShowFilters] = useState(false)
  const [userScores, setUserScores] = useState({})
  const [isFavorite, setIsFavorite] = useState(false);
  const [userStatuses, setUserStatuses] = useState({})
  const [books, setBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(false)
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1)
const [pagination, setPagination] = useState({
  currentPage: 1,
  totalPages: 1,
  totalBooks: 0,
  booksPerPage: 100,
  hasNextPage: false,
  hasPreviousPage: false,
  startIndex: 1,
  endIndex: 100
})

  // Available genres - you can expand this list
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
    // { value: 'young-adult', label: 'Young Adult' },
    // { value: 'children', label: 'Children' }
  ];
  

  const yearOptions = [
    { value: 'all', label: 'All Years' },
    { value: '2020s', label: '2020s' },
    { value: '2010s', label: '2010s' },
    { value: '2000s', label: '2000s' },
    { value: '1990s', label: '1990s' },
    { value: '1980s', label: '1980s' },
    { value: 'older', label: 'Before 1980' }
  ]
  const fetchRankings = async () => {
    setLoading(true)
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      
      const accessToken = session?.access_token;

      if (!accessToken) {
        router.push('auth');
        return;
      }

      console.log('selected genre', selectedGenre);

      // Build query parameters including pagination
      const params = new URLSearchParams({
        sort: rankingType,
        page: currentPage.toString(),
        limit: '100',
        ...(selectedGenre !== 'all' && { genre: selectedGenre }),
        ...(selectedYear !== 'all' && { year: selectedYear }),
        ...(searchQuery && { search: searchQuery })
      })

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/rankings?${params}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data?.books) {
        setBooks(response.data.books);
        setPagination(response.data.pagination);
        console.log('Books fetched:', response.data.books);
        console.log('Pagination:', response.data.pagination);
      } else {
        console.warn('No books returned');
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false)
    }
  };
  useEffect(() => {
    setCurrentPage(1);
    fetchRankings();
  }, [rankingType, selectedGenre, selectedYear, searchQuery]);

  useEffect(() => {
    fetchRankings();
  }, [currentPage])

  const statusOptions = [
    { value: 'add', label: 'Add to List', color: 'bg-stone-100 text-stone-700' },
    { value: 'reading', label: 'Reading', color: 'bg-blue-100 text-blue-700' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700' },
    { value: 'to-read', label: 'To Read', color: 'bg-amber-100 text-amber-700' }
  ]

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setCurrentPage(newPage);
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFilterChange = (filterType: any, value: any) => {
    setCurrentPage(1); // Reset to first page
    switch (filterType) {
      case 'genre':
        setSelectedGenre(value);
        break;
      case 'year':
        setSelectedYear(value);
        break;
      case 'search':
        setSearchQuery(value);
        break;
      case 'rankingType':
        setRankingType(value);
        break;
    }
  };
  
  const handlePreviousPage = () => {
    if (pagination.hasPreviousPage) {
      handlePageChange(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      handlePageChange(currentPage + 1);
    }
  };

  const handleStatusChange = (bookId: string, status: string) => {
    setUserStatuses(prev => ({
      ...prev,
      [bookId]: status
    }))
  }

  const handleBookAdded = (openLibraryId: string, rating: number, status: string) => {
  setBooks(prevBooks => 
    prevBooks.map(book => 
      book.openLibraryId === openLibraryId 
        ? { ...book, userRating: rating, userStatus: status }
        : book
    )
  );
};

  const getRankIcon = (rank: any) => {
    console.log('rank', rank);
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
    return <span className="text-stone-400 font-semibold">{rank}</span>
  }

  const getRankingTypeIcon = () => {
    return rankingType === 'rating' ? 
      <Star className="w-6 h-6 sm:w-8 sm:h-8 text-white" /> : 
      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
  }

  const getRankingTypeColor = () => {
    return rankingType === 'rating' ? 
      'from-amber-400 to-amber-500' : 
      'from-blue-500 to-blue-600'
  }

  const getRankingTypeTitle = () => {
    const baseTitle = rankingType === 'rating' ? 'Top Rated Books' : 'Most Popular Books'
    if (selectedGenre !== 'all') {
      const genreLabel = genres.find(g => g.value === selectedGenre)?.label
      return `${baseTitle} - ${genreLabel}`
    }
    return baseTitle
  }

  const getRankingTypeDescription = () => {
    if (rankingType === 'rating') {
      return selectedGenre === 'all' 
        ? 'Discover the highest-rated books based on community reviews'
        : `Highest-rated ${genres.find(g => g.value === selectedGenre)?.label.toLowerCase()} books`
    } else {
      return selectedGenre === 'all'
        ? 'Discover the most popular books based on reader engagement'
        : `Most popular ${genres.find(g => g.value === selectedGenre)?.label.toLowerCase()} books`
    }
  }

  const PaginationComponent = () => {
    if (pagination.totalPages <= 1) return null;
  
    const getPageNumbers = () => {
      const pages = [];
      const maxPagesToShow = 5;
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(pagination.totalPages, startPage + maxPagesToShow - 1);
      
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
  
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    };
  
    return (
      <div className="bg-gradient-to-t from-stone-900 via-stone-800 to-stone-800 backdrop-blur-md rounded-2xl shadow-lg shadow-amber-100/20 border p-6 mt-6">
  {/* Pagination Info */}
  <div className="text-center mb-4">
    <p className="text-stone-200">
      Showing <span className="font-semibold text-stone-400">{pagination.startIndex}</span> to{' '}
      <span className="font-semibold text-stone-400">{pagination.endIndex}</span> of{' '}
      <span className="font-semibold text-stone-400">{pagination.totalBooks.toLocaleString()}</span> books
    </p>
  </div>

  {/* Pagination Controls */}
  <div className="flex items-center justify-center gap-2">
    {/* Previous Button */}
    <button
      onClick={handlePreviousPage}
      disabled={!pagination.hasPreviousPage}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        pagination.hasPreviousPage
          ? 'bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600/50'
          : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
      }`}
    >
      Previous
    </button>

    {/* First Page */}
    {getPageNumbers()[0] > 1 && (
      <>
        <button
          onClick={() => handlePageChange(1)}
          className="px-4 py-2 rounded-lg font-medium bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600/50 transition-all duration-200"
        >
          1
        </button>
        {getPageNumbers()[0] > 2 && <span className="px-2 text-stone-500">...</span>}
      </>
    )}

    {/* Page Numbers */}
    {getPageNumbers().map(pageNum => (
      <button
        key={pageNum}
        onClick={() => handlePageChange(pageNum)}
        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
          pageNum === currentPage
            ? 'bg-amber-600 text-white shadow-md'
            : 'bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600/50'
        }`}
      >
        {pageNum}
      </button>
    ))}

    {/* Last Page */}
    {getPageNumbers()[getPageNumbers().length - 1] < pagination.totalPages && (
      <>
        {getPageNumbers()[getPageNumbers().length - 1] < pagination.totalPages - 1 && (
          <span className="px-2 text-stone-500">...</span>
        )}
        <button
          onClick={() => handlePageChange(pagination.totalPages)}
          className="px-4 py-2 rounded-lg font-medium bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600/50 transition-all duration-200"
        >
          {pagination.totalPages}
        </button>
      </>
    )}

    {/* Next Button */}
    <button
      onClick={handleNextPage}
      disabled={!pagination.hasNextPage}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
        pagination.hasNextPage
          ? 'bg-stone-700 hover:bg-stone-600 text-stone-200 border border-stone-600/50'
          : 'bg-stone-800 text-stone-500 cursor-not-allowed border border-stone-700'
      }`}
    >
      Next
    </button>
  </div>
</div>

    );
  };

return (
  <div className="min-h-screen bg-gradient-to-t from-stone-900 via-stone-800 to-stone-800">
    {/* Header */}
    <Header />
    
    {/* Background gradient overlay */}
    
    <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
      {/* Enhanced Page Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <div className={`absolute inset-0 bg-gradient-to-r ${getRankingTypeColor().replace('to-', 'to-').replace('from-', 'from-')}/20 rounded-xl blur-lg`} />
            <div className={`relative p-3 bg-gradient-to-r ${getRankingTypeColor()} rounded-xl shadow-lg ${rankingType === 'rating' ? 'shadow-amber-500/40' : 'shadow-blue-500/40'}`}>
              {getRankingTypeIcon()}
            </div>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{getRankingTypeTitle()}</h1>
            <p className="text-sm sm:text-base text-stone-300 mt-1">{getRankingTypeDescription()}</p>
          </div>
        </div>

        {/* Ranking Type Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setRankingType('rating')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm ${
              rankingType === 'rating'
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/40'
                : 'bg-black/20 text-stone-300 hover:bg-amber-500/10 border border-amber-500/30 hover:text-amber-300'
            }`}
          >
            <Star className="w-4 h-4" />
            Top Rated
          </button>
          <button
            onClick={() => setRankingType('popularity')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 backdrop-blur-sm ${
              rankingType === 'popularity'
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40'
                : 'bg-black/20 text-stone-300 hover:bg-blue-500/10 border border-blue-500/30 hover:text-blue-300'
            }`}
          >
            <Users className="w-4 h-4" />
            Most Popular
          </button>
        </div>
      </div>

      {/* Enhanced Desktop Filters */}
      <div className="hidden sm:block mb-6">
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-1">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-400/10 rounded-lg blur-sm" />
                <div className="relative bg-black/30 backdrop-blur-sm rounded-lg border border-white/20">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search books..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-transparent rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-transparent text-sm text-white placeholder-stone-400"
                  />
                </div>
              </div>
            </div>

            {/* Genre Filter */}
            <div className="relative">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 backdrop-blur-sm rounded-lg border border-white/20 focus:ring-2 focus:ring-amber-500/50 focus:border-transparent text-sm appearance-none cursor-pointer text-white"
              >
                {genres.map(genre => (
                  <option key={genre.value} value={genre.value} className="bg-stone-900 text-white">
                    {genre.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Year Filter */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 bg-black/30 backdrop-blur-sm rounded-lg border border-white/20 focus:ring-2 focus:ring-amber-500/50 focus:border-transparent text-sm appearance-none cursor-pointer text-white"
              >
                {yearOptions.map(year => (
                  <option key={year.value} value={year.value} className="bg-stone-900 text-white">
                    {year.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4 pointer-events-none" />
            </div>

            {/* Clear Filters */}
            {(selectedGenre !== 'all' || selectedYear !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSelectedGenre('all')
                  setSelectedYear('all')
                  setSearchQuery('')
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-stone-300 text-sm font-medium transition-all duration-200 backdrop-blur-sm border border-white/10"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Mobile Search & Filters */}
      <div className="mb-4 sm:hidden">
        <div className="flex gap-2 mb-3">
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-400/10 rounded-lg blur-sm" />
            <div className="relative bg-black/30 backdrop-blur-sm rounded-lg border border-white/20">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-transparent rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-transparent text-sm text-white placeholder-stone-400"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-amber-500/10 transition-all duration-200"
          >
            <Filter className="w-4 h-4 text-amber-400" />
          </button>
        </div>

        {/* Mobile Filters Dropdown */}
        {showFilters && (
          <div className="bg-black/30 backdrop-blur-sm rounded-xl border border-white/20 p-4 mb-4">
            <div className="space-y-3">
              <div className="relative">
                <label className="block text-sm font-medium text-stone-300 mb-1">Genre</label>
                <select
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                  className="w-full px-3 py-2 bg-black/20 rounded-lg border border-white/20 focus:ring-2 focus:ring-amber-500/50 text-sm text-white backdrop-blur-sm"
                >
                  {genres.map(genre => (
                    <option key={genre.value} value={genre.value} className="bg-stone-900 text-white">
                      {genre.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-stone-300 mb-1">Publication Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 bg-black/20 rounded-lg border border-white/20 focus:ring-2 focus:ring-amber-500/50 text-sm text-white backdrop-blur-sm"
                >
                  {yearOptions.map(year => (
                    <option key={year.value} value={year.value} className="bg-stone-900 text-white">
                      {year.label}
                    </option>
                  ))}
                </select>
              </div>

              {(selectedGenre !== 'all' || selectedYear !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedGenre('all')
                    setSelectedYear('all')
                    setSearchQuery('')
                    setShowFilters(false)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-stone-300 text-sm font-medium transition-all duration-200 backdrop-blur-sm border border-white/10"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          <div className="text-center py-20">
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-amber-400/30 rounded-full blur-3xl opacity-60 animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-r from-amber-500/90 to-amber-400/80 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30 border border-amber-500/50">
                <Sparkles className="w-12 h-12 text-white animate-spin" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Loading Rankings...
            </h3>
            <p className="text-stone-300 text-lg">
              Fetching the best books for you
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Rankings List */}
      {!loading && (
        <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          {/* Enhanced Desktop Header */}
          <div className="hidden sm:block bg-gradient-to-r from-black/40 to-stone-500/10 border-b border-white/10 px-6 py-4">
            <div className="grid grid-cols-12 gap-4 items-center text-sm font-bold text-stone-300">
              <div className="col-span-1 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-400" />
                Rank
              </div>
              <div className="col-span-6">Book</div>
              <div className="col-span-2 flex items-center gap-2">
                {rankingType === 'rating' ? (
                  <>
                    <Star className="w-4 h-4 text-amber-400" />
                    Community Score
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 text-blue-400" />
                    Total Readers
                  </>
                )}
              </div>
              <div className="col-span-2 flex items-center gap-2">
                {rankingType === "rating" && <><Heart className="w-4 h-4 text-blue-400" />
                Your Score
                </>}
                {rankingType === "popularity" && <>
                    <Star className="w-4 h-4 text-amber-400" />
                    Community Score
                  </>}
              </div>
              <div className="col-span-1">Action</div>
            </div>
          </div>

          {/* Enhanced Book List */}
          <div className="divide-y divide-white/10">
            {books.map((book, index) => {
              const bookRank = (currentPage - 1) * pagination.booksPerPage + index + 1;
              const userScore = book.userRating ?? 0;
              const isTopThree = bookRank + 1 <= 3;

              return (
                <div key={book.openLibraryId} className={`hover:bg-gradient-to-r hover:from-stone-500/10 hover:to-stone-400/5 transition-all duration-200`}>
                  
                  {/* Enhanced Mobile Layout */}
                  <div className="sm:hidden px-4 py-4">
                    <div className="flex gap-3">
                      {/* Enhanced Rank Badge */}
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm border 'bg-amber-500/20 border-amber-400/30`}>
                        {bookRank <= 3 ? getRankIcon(bookRank) : (
                          <span className="text-xs font-bold text-amber-200">#{bookRank}</span>
                        )}
                      </div>
                      
                      {/* Enhanced Book Cover */}
                      <div className="w-18 h-24 bg-gradient-to-br from-stone-700 to-stone-800 rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-white/20">
                        <Image 
                        width={72}
                        height={96}
                          src={book.image} 
                          alt={book.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Book Info */}
                      <div className="flex-1 min-w-0">
                        <Link href={`book/${book.openLibraryId ?? ''}`}>
                          <h3 className="font-semibold text-white mb-1 text-sm line-clamp-2 leading-tight hover:text-amber-400 transition-colors">
                            {book.title}
                          </h3>
                        </Link>
                        <p className="text-stone-400 text-xs mb-2 line-clamp-1">
                          by {book.author}
                        </p>
                        
                        {/* Enhanced Rating & Stats Row */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-sm border ${rankingType === 'rating' ? 'bg-amber-500/20 border-amber-400/30' : 'bg-blue-500/20 border-blue-400/30'}`}>
                              {rankingType === 'rating' ? (
                                <>
                                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                                  <span className="text-xs font-semibold text-amber-200">{book.averageRating?.toFixed(2)}</span>
                                </>
                              ) : (
                                <>
                                  <Users className="w-3 h-3 text-blue-400" />
                                  <span className="text-xs font-semibold text-blue-200">{book.totalRatings}</span>
                                </>
                              )}
                            </div>
                            <span className="text-xs text-stone-500">
                              {rankingType === 'rating' ? `${book.totalRatings?.toLocaleString()} votes` : 'reads'}
                            </span>
                          </div>
                          
                          {/* User Rating & Action */}
                          <div className="flex items-center gap-2">
                            {book.userRating !== null ? (
                              <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full backdrop-blur-sm">
                                <Star className="w-3 h-3 text-blue-400 fill-current" />
                                <span className="text-xs font-semibold text-blue-200">{book.userRating}</span>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => ""}
                                className="p-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all text-white shadow-lg hover:shadow-xl"
                                title="Add to List"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            )}
                            
                            {/* Quick Actions */}
                            {/* <button className="p-1.5 rounded-full hover:bg-amber-500/20 text-stone-400 transition-all duration-200 backdrop-blur-sm"
                              type="button">
                              <Heart className="w-3 h-3" />
                            </button> */}
                          </div>
                        </div>
                        
                        {/* Published Date */}
                        <div className="flex items-center gap-2 mt-2 text-xs text-stone-500">
                          <Calendar className="w-3 h-3" />
                          <span>{book.publishedDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Desktop Layout */}
                  <div className="hidden sm:block px-6 py-4">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Enhanced Rank */}
                      <div className="col-span-1 flex items-center justify-center">
                        <div className={`p-2 rounded-xl backdrop-blur-sm border ${isTopThree ? 'bg-gradient-to-r from-amber-500/80 to-amber-600/60 shadow-lg border-amber-400/30' : 'bg-amber-500/20 border-amber-400/30'}`}>
                          {getRankIcon(bookRank)}
                        </div>
                      </div>

                      {/* Enhanced Book Info */}
                      <div className="col-span-6 flex gap-4">
                        <div className="w-26 h-36 bg-gradient-to-br from-stone-700 to-stone-800 rounded-xl overflow-hidden flex-shrink-0 shadow-sm border border-white/20">
                          <Image 
                          width={120}
                          height={180}
                            src={book.image} 
                            alt={book.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`book/${book.openLibraryId}`}>
                            <h3 className="font-semibold text-white mb-1 hover:text-amber-400 cursor-pointer line-clamp-1 transition-colors">
                              {book.title}
                            </h3>
                          </Link>
                          <p className="text-stone-400 text-sm mb-2">
                            by {book.author}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-stone-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>{book.publishedDate}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              <span>{book.totalRatings?.toLocaleString()} readers</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Community/Popularity Score */}
                      <div className="col-span-2">
                        {rankingType === 'rating' ? (
                          <div>
                            <div className="flex items-center gap-2 mb-1 px-3 py-2 rounded-xl">
                              <Star className="w-4 h-4 text-amber-400 fill-current" />
                              <span className="font-bold text-amber-200">{book.averageRating?.toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-stone-500 px-3">
                              {book.totalRatings?.toLocaleString()} votes
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-xl">
                              <Users className="w-4 h-4 text-blue-400" />
                              <span className="font-bold text-blue-200">{book.totalRatings?.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {rankingType === "rating" && <div className="col-span-2">
                        {book.userRating !== null ? (
                          <div>
                            <div className="flex items-center gap-2 mb-1 px-3 py-2 rounded-xl">
                              <Star className="w-4 h-4 text-blue-400 fill-current" />
                              <span className="font-bold text-blue-200">{book.userRating}</span>
                            </div>
                            <div className="text-xs text-blue-400 px-3">Your rating</div>
                          </div>
                        ) : (
                          <div className="text-xs text-stone-500 px-3 py-2 bg-white/5 rounded-xl text-center backdrop-blur-sm border border-white/10 max-w-[64px]">Not rated</div>
                        )}
                      </div>}
                      {rankingType === "popularity" && <div className='col-span-2'>
                        <div className="flex items-center gap-2 mb-1 px-3 py-2 rounded-xl">
                          <Star className="w-4 h-4 text-amber-400 fill-current" />
                          <span className="font-bold text-amber-200">{book.averageRating?.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-stone-500 px-3">
                          {book.totalRatings?.toLocaleString()} votes
                        </div>
                      </div>}
                      
                      <div className="col-span-1">
                          <RankingAddToCollectionPopup 
                            openLibraryId={book.openLibraryId ?? ""} 
                            buttonType={"ranking-laptop"} 
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

          {/* Enhanced Empty State */}
          {books.length === 0 && (
            <div className="text-center py-20">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 to-amber-400/30 rounded-full blur-3xl opacity-60" />
                <div className="relative w-24 h-24 bg-gradient-to-r from-amber-500/90 to-amber-400/80 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30 border border-amber-500/50">
                  <BookOpen className="w-12 h-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No books found
              </h3>
              <p className="text-stone-300 text-lg mb-4">
                {selectedGenre !== 'all' || selectedYear !== 'all' || searchQuery
                  ? 'Try adjusting your search or filters'
                  : 'No books available for this ranking type'
                }
              </p>
              {(selectedGenre !== 'all' || selectedYear !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedGenre('all')
                    setSelectedYear('all')
                    setSearchQuery('')
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg shadow-amber-500/40"
                >
                  <X className="w-4 h-4" />
                  Clear All Filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {(selectedGenre !== 'all' || selectedYear !== 'all' || searchQuery) && !loading && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-stone-400 font-medium">Active filters:</span>
          {selectedGenre !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm backdrop-blur-sm border border-amber-400/30">
              <BookMarked className="w-3 h-3" />
              {genres.find(g => g.value === selectedGenre)?.label}
              <button
                onClick={() => setSelectedGenre('all')}
                className="ml-1 hover:bg-amber-500/30 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {selectedYear !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm backdrop-blur-sm border border-blue-400/30">
              <Calendar className="w-3 h-3" />
              {yearOptions.find(y => y.value === selectedYear)?.label}
              <button
                onClick={() => setSelectedYear('all')}
                className="ml-1 hover:bg-blue-500/30 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-sm backdrop-blur-sm border border-emerald-400/30">
              <Search className="w-3 h-3" />
              "{searchQuery}"
              <button
                onClick={() => setSearchQuery('')}
                className="ml-1 hover:bg-emerald-500/30 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
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