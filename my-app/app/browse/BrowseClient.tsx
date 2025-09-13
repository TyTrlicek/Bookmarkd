'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { 
  Search, 
  Filter, 
  SortAsc, 
  SortDesc, 
  Grid, 
  List, 
  Star, 
  Heart, 
  BookOpen, 
  User, 
  Calendar, 
  Tag, 
  ChevronDown, 
  X, 
  Coffee, 
  Bell, 
  Sliders,
  Eye,
  Download,
  Share2,
  Bookmark,
  Clock,
  Award,
  TrendingUp,
  Sparkles,
  Globe
} from 'lucide-react'
import Header from '../components/Header'
import BookCard from '../components/BookCard'
import { getSearchData } from '@/utils/util'
import { BookData } from '../types/types'
import debounce from 'lodash/debounce';
import Footer from '../components/Footer'



const BrowseClient = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState('all')
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('relevance')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [selectedYears, setSelectedYears] = useState<string[]>([])
  const [selectedRating, setSelectedRating] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [booksPerPage] = useState(24)
  const [books, setBooks] = useState<BookData[]>([])

  const handleSearch = async (query: string) => {
    try {
      const response = await getSearchData(query);
      setBooks(response ?? []);
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks([]);
    }
  };
  

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      handleSearch(query);
    }, 500),
    []
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setBooks([]);
    }

    return () => {
      debouncedSearch.cancel(); // Cancel debounce on unmount or query change
    };
  }, [searchQuery]);

  const genres = [
    "Contemporary Fiction", "Science Fiction", "Fantasy", "Thriller", "Mystery",
    "Romance", "Literary Fiction", "Historical Fiction", "Self-Help", "Biography",
    "Memoir", "Business", "Psychology", "Philosophy", "Health & Fitness"
  ]

  const years = ["2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017", "2016", "2015", "Before 2015"]

  const sortOptions = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'title', label: 'Title' },
    { value: 'authors', label: 'Author' },
    { value: 'publishedDate', label: 'Publication Year' },
    { value: 'pageCount', label: 'Page Count' }
  ]

  const searchTypes = [
    { value: 'all', label: 'All Fields' },
    { value: 'title', label: 'Title' },
    { value: 'authors', label: 'Author' },
    { value: 'isbn', label: 'ISBN' }
  ]

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    )
  }

  const handleYearToggle = (year: string) => {
    setSelectedYears(prev => 
      prev.includes(year) 
        ? prev.filter(y => y !== year)
        : [...prev, year]
    )
  }

  const clearFilters = () => {
    setSelectedGenres([])
    setSelectedYears([])
    setSelectedRating('')
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

  

  return (
    <div className="min-h-screen">
      <Header />

      {/* Main Content with Dark Theme */}
      <div className="relative">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-800 to-stone-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          {/* Search and Filters Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-6">Browse Books</h1>
            
            {/* Search Bar */}
            <div className="flex gap-4 mb-6">
              <div className="flex-1 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-2xl blur-xl group-hover:opacity-100 opacity-0 transition-all duration-300" />
                <div className="relative bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg group-hover:shadow-xl group-hover:border-amber-500/30 transition-all duration-300">
                  <Search className="w-5 h-5 text-amber-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search books, authors, ISBN..."
                    className="w-full pl-12 pr-4 py-3 bg-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white placeholder-stone-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <select
                className="px-4 py-3 bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white font-medium"
                value={searchType}
                onChange={(e) => setSearchType(e.target.value)}
              >
                {searchTypes.map(type => (
                  <option key={type.value} value={type.value} className="bg-stone-800">{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Enhanced Controls Bar */}
          <div className="bg-black/30 backdrop-blur-sm rounded-3xl border border-white/10 shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl hover:from-amber-700 hover:to-amber-800 transition-all duration-200 shadow-lg font-medium"
                >
                  <Sliders className="w-4 h-4" />
                  Filters
                  {(selectedGenres.length > 0 || selectedYears.length > 0 || selectedRating) && (
                    <span className="bg-white/25 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                      {selectedGenres.length + selectedYears.length + (selectedRating ? 1 : 0)}
                    </span>
                  )}
                </button>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-stone-300">Sort by:</span>
                  <select
                    className="px-4 py-2.5 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/50 text-white font-medium"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {sortOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-stone-800">{option.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2.5 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-all duration-200"
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 text-stone-300" /> : <SortDesc className="w-4 h-4 text-stone-300" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-500/20 backdrop-blur-sm rounded-xl border border-amber-400/20">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-semibold text-amber-300">{books.length} results</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg' 
                        : 'bg-black/20 backdrop-blur-sm border border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-3 rounded-xl transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white shadow-lg' 
                        : 'bg-black/20 backdrop-blur-sm border border-white/10 text-stone-300 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Filters Panel */}
          {showFilters && (
            <div className="bg-black/30 backdrop-blur-sm rounded-3xl border border-white/10 shadow-xl p-8 mb-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-amber-600 to-amber-700 rounded-2xl shadow-lg">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Filters</h3>
                </div>
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 text-sm text-amber-300 hover:text-amber-200 font-semibold bg-amber-500/20 hover:bg-amber-500/30 rounded-xl transition-all duration-200 border border-amber-400/20"
                >
                  Clear All
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* Genre Filter */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-400/20">
                      <Tag className="w-4 h-4 text-amber-400" />
                    </div>
                    <h4 className="font-bold text-white text-lg">Genre</h4>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-2">
                    {genres.map(genre => (
                      <label key={genre} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedGenres.includes(genre)}
                          onChange={() => handleGenreToggle(genre)}
                          className="w-4 h-4 rounded border-white/20 bg-black/20 text-amber-600 focus:ring-amber-500/50"
                        />
                        <span className="text-sm text-stone-300 group-hover:text-amber-300 transition-colors font-medium">{genre}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Year Filter */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-400/20">
                      <Calendar className="w-4 h-4 text-amber-400" />
                    </div>
                    <h4 className="font-bold text-white text-lg">Publication Year</h4>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-2">
                    {years.map(year => (
                      <label key={year} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedYears.includes(year)}
                          onChange={() => handleYearToggle(year)}
                          className="w-4 h-4 rounded border-white/20 bg-black/20 text-amber-600 focus:ring-amber-500/50"
                        />
                        <span className="text-sm text-stone-300 group-hover:text-amber-300 transition-colors font-medium">{year}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Language Filter */}
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg border border-amber-400/20">
                      <Globe className="w-4 h-4 text-amber-400" />
                    </div>
                    <h4 className="font-bold text-white text-lg">Language</h4>
                  </div>
                  <div className="space-y-3 max-h-72 overflow-y-auto custom-scrollbar pr-2">
                    {Array.from(new Set(books.map(book => book.language))).map(language => (
                      <label key={language} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-white/20 bg-black/20 text-amber-600 focus:ring-amber-500/50"
                        />
                        <span className="text-sm text-stone-300 group-hover:text-amber-300 transition-colors font-medium">{language?.toUpperCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Active Filters */}
          {(selectedGenres.length > 0 || selectedYears.length > 0 || selectedRating) && (
            <div className="flex items-center gap-4 mb-8 p-5 bg-amber-500/10 backdrop-blur-sm rounded-2xl border border-amber-400/20 shadow-sm">
              <span className="text-sm font-bold text-amber-300">Active filters:</span>
              <div className="flex flex-wrap gap-2">
                {selectedGenres.map(genre => (
                  <button
                    key={genre}
                    onClick={() => handleGenreToggle(genre)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 rounded-xl text-sm hover:bg-amber-500/30 transition-all duration-200 font-semibold shadow-sm hover:shadow-md border border-amber-400/20"
                  >
                    {genre}
                    <X className="w-3.5 h-3.5" />
                  </button>
                ))}
                {selectedYears.map(year => (
                  <button
                    key={year}
                    onClick={() => handleYearToggle(year)}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 rounded-xl text-sm hover:bg-amber-500/30 transition-all duration-200 font-semibold shadow-sm hover:shadow-md border border-amber-400/20"
                  >
                    {year}
                    <X className="w-3.5 h-3.5" />
                  </button>
                ))}
                {selectedRating && (
                  <button
                    onClick={() => setSelectedRating('')}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 text-amber-300 rounded-xl text-sm hover:bg-amber-500/30 transition-all duration-200 font-semibold shadow-sm hover:shadow-md border border-amber-400/20"
                  >
                    {selectedRating}+ stars
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Results */}
          {displayedBooks.length > 0 ? (
            <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 mb-12">
                  {displayedBooks.map((book, index) => (
                    <BookCard key={book.openLibraryId || String(index)} book={book}/>
                  ))}
                </div>
              {/* Enhanced Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 p-6 bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 shadow-lg">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-6 py-3 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-stone-300 hover:text-white transition-all duration-200"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index + 1}
                      onClick={() => setCurrentPage(index + 1)}
                      className={`px-4 py-3 rounded-xl border font-semibold transition-all duration-200 ${
                        currentPage === index + 1
                          ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-500 shadow-lg'
                          : 'bg-black/20 backdrop-blur-sm border-white/10 hover:bg-white/10 text-stone-300 hover:text-white'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-6 py-3 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-stone-300 hover:text-white transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-amber-600/10 rounded-full blur-3xl opacity-60" />
                <div className="relative w-24 h-24 bg-gradient-to-r from-amber-500/20 to-amber-600/20 rounded-full flex items-center justify-center mx-auto shadow-lg border border-amber-400/20 backdrop-blur-sm">
                  <BookOpen className="w-12 h-12 text-amber-400" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">
                {searchQuery ? 'No books found' : 'Start searching for books'}
              </h3>
              <p className="text-stone-300 text-lg max-w-md mx-auto leading-relaxed">
                {searchQuery ? 'Try adjusting your search terms or filters to find what you\'re looking for' : 'Enter a search term above to discover amazing books from our collection'}
              </p>
            </div>
          )}
        </div>
        <Footer />
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(251, 191, 36, 0.4);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(251, 191, 36, 0.6);
        }
      `}</style>
    </div>
  )
}

export default BrowseClient