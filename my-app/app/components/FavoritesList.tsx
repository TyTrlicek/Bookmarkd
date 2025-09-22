import React, { useState, useRef, useEffect } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { BookData } from '../types/types';
import { getSearchData } from '@/utils/util';

interface UserStats {
  booksInCollection: number;
  reviewsWritten: number;
  achievementsUnlocked: number;
}

interface FavoritesListProps {
  books: BookData[];
  loading?: boolean;
  onRemoveBook?: (bookId: string) => Promise<void>;
  onAddBook?: (book: BookData) => Promise<void>;
  showAddSlots?: boolean;
  maxSlots?: number;
  layout?: 'grid' | 'horizontal'; // New prop for layout control
  className?: string;
  showStats?: boolean;
  userStats?: UserStats | null;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBook: (book: BookData) => Promise<void>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: BookData[];
  isSearching: boolean;
  showSearchResults: boolean;
}

// Search Modal Component
const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onAddBook,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  showSearchResults
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const isTouch = event.type === 'touchstart';
      
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        if (isTouch) {
          setTimeout(onClose, 100);
        } else {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside, { passive: true });
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleBookSelect = async (e: React.MouseEvent, book: BookData) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
      
      onClose();
      await onAddBook(book);
    } catch (error) {
      console.error('Failed to add book:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-stone-800 border border-stone-600 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-stone-600 bg-stone-900">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Add Favorite Book</h2>
            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white transition-colors rounded-lg hover:bg-stone-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-4 relative">
            <div className="relative">
              <Search className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search for books to add to favorites..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-stone-700 text-white placeholder-stone-400 rounded-lg border border-stone-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching && (
            <div className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-stone-400 text-sm mt-3">Searching for books...</p>
            </div>
          )}

          {!isSearching && searchQuery && showSearchResults && searchResults.length === 0 && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-400 text-sm">No books found for "{searchQuery}"</p>
            </div>
          )}

          {!isSearching && !searchQuery && (
            <div className="p-8 text-center">
              <Search className="w-12 h-12 text-stone-600 mx-auto mb-3" />
              <p className="text-stone-400 text-sm">Start typing to search for books</p>
            </div>
          )}

          {!isSearching && showSearchResults && searchResults.length > 0 && (
            <div>
              <div className="p-4 bg-stone-900 border-b border-stone-600">
                <p className="text-stone-300 text-sm">
                  Found {searchResults.length} books • Click to add to favorites
                </p>
              </div>
              
              {searchResults.map((book, index) => (
                <div
                  key={book.openLibraryId || index}
                  className="p-4 hover:bg-stone-700 active:bg-stone-600 cursor-pointer border-b border-stone-600 last:border-b-0 transition-colors duration-150 search-result-item"
                  onClick={(e) => handleBookSelect(e, book)}
                  onTouchStart={() => {}}
                  role="button"
                  tabIndex={0}
                >
                  <div className="flex gap-4">
                    <div className="w-20 h-28 bg-stone-600 rounded overflow-hidden flex-shrink-0 shadow-lg">
                      <Image 
                        src={book.image || '/api/placeholder/80/112'} 
                        alt={book.title}
                        width={160}
                        height={224}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-white text-sm mb-1 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-stone-300 text-xs mb-2">
                        by {book.author || 'Unknown Author'}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-amber-400 bg-amber-400/20 rounded-full px-2 py-1">
                          Add to Favorites
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Favorites List Component
const FavoritesList: React.FC<FavoritesListProps> = ({
  books,
  loading = false,
  onRemoveBook,
  onAddBook,
  showAddSlots = true,
  maxSlots = 6,
  layout = 'grid',
  className = '',
  showStats = false,
  userStats = null
}) => {
  const [hoveredBook, setHoveredBook] = useState<number | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Search functionality (you'll need to import your search function)
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
       const response = await getSearchData(query);
       setSearchResults(response ?? []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error fetching books:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Scroll functionality for horizontal layout
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      return () => container.removeEventListener('scroll', updateScrollButtons);
    }
  }, [books]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200; // Adjust as needed
      const newScrollLeft = scrollContainerRef.current.scrollLeft + 
        (direction === 'left' ? -scrollAmount : scrollAmount);
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  const handleAddBookFromSearch = async (book: BookData) => {
    if (onAddBook) {
      await onAddBook(book);
    }
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const closeSearchModal = () => {
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-stone-400 text-lg">Loading favorites...</div>
      </div>
    );
  }

  const displayBooks = [...books];
  const emptySlots = showAddSlots ? Math.max(0, maxSlots - books.length) : 0;
  const isHorizontal = layout === 'horizontal';

  // Grid layout (desktop)
  if (!isHorizontal) {
    return (
      <>
        <div className={`${className}`}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {displayBooks.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                index={index}
                hoveredBook={hoveredBook}
                setHoveredBook={setHoveredBook}
                onRemoveBook={onRemoveBook}
              />
            ))}

            {Array.from({ length: emptySlots }, (_, index) => (
              <AddBookCard
                key={`empty-${index}`}
                index={displayBooks.length + index}
                onClick={() => setShowSearchModal(true)}
              />
            ))}
          </div>

          {showStats && (
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mt-12">
              <StatCard
                value={userStats?.booksInCollection ?? '—'}
                label="Books in Collection"
                color="blue"
              />
              <StatCard
                value={userStats?.reviewsWritten ?? '—'}
                label="Reviews Written"
                color="green"
              />
              <StatCard
                value={userStats?.achievementsUnlocked ?? '—'}
                label="Achievements"
                color="purple"
              />
            </div>
          )}
        </div>

        <SearchModal
          isOpen={showSearchModal}
          onClose={closeSearchModal}
          onAddBook={handleAddBookFromSearch}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          isSearching={isSearching}
          showSearchResults={showSearchResults}
        />
      </>
    );
  }

  // Horizontal layout (mobile)
  return (
    <>
      <div className={`relative ${className}`}>
        {/* Scroll buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all duration-200"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full backdrop-blur-sm transition-all duration-200"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Horizontal scrollable container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {displayBooks.map((book, index) => (
            <div
              key={book.id}
              className="flex-shrink-0 w-32"
              style={{ scrollSnapAlign: 'start' }}
            >
              <BookCard
                book={book}
                index={index}
                hoveredBook={hoveredBook}
                setHoveredBook={setHoveredBook}
                onRemoveBook={onRemoveBook}
                isHorizontal={true}
              />
            </div>
          ))}

          {Array.from({ length: emptySlots }, (_, index) => (
            <div
              key={`empty-${index}`}
              className="flex-shrink-0 w-32"
              style={{ scrollSnapAlign: 'start' }}
            >
              <AddBookCard
                index={displayBooks.length + index}
                onClick={() => setShowSearchModal(true)}
                isHorizontal={true}
              />
            </div>
          ))}
        </div>
      </div>

      <SearchModal
        isOpen={showSearchModal}
        onClose={closeSearchModal}
        onAddBook={handleAddBookFromSearch}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        isSearching={isSearching}
        showSearchResults={showSearchResults}
      />

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .search-result-item {
          min-height: 44px;
        }
        
        .search-result-item * {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        
        .search-result-item:active {
          transform: scale(0.98);
        }
        
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </>
  );
};

// Book Card Component
interface BookCardProps {
  book: BookData;
  index: number;
  hoveredBook: number | null;
  setHoveredBook: (index: number | null) => void;
  onRemoveBook?: (bookId: string) => Promise<void>;
  isHorizontal?: boolean;
}

const BookCard: React.FC<BookCardProps> = ({
  book,
  index,
  hoveredBook,
  setHoveredBook,
  onRemoveBook,
  isHorizontal = false
}) => {
  return (
    <div
      className="group cursor-pointer relative"
      onMouseEnter={() => setHoveredBook(index)}
      onMouseLeave={() => setHoveredBook(null)}
      style={{
        animation: `fadeInUp 0.8s ease-out ${index * 0.15}s both`
      }}
    >
      {onRemoveBook && (
        <button
          onClick={() => onRemoveBook(String(book.id))}
          className={`
            absolute -top-0 -right-0 z-30 bg-stone-500 hover:bg-stone-600 
            text-white rounded-full w-6 h-6 flex items-center justify-center
            transition-all duration-200 text-sm font-bold
            ${hoveredBook === index ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
          `}
        >
          ×
        </button>
      )}

      <div className={`relative ${isHorizontal ? 'aspect-[2/3]' : 'aspect-[2/3]'} overflow-hidden rounded-lg shadow-2xl group-hover:shadow-3xl transition-all duration-500`}>
        <Image
          src={book.image}
          alt={`${book.title} cover`}
          fill
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-stone-700 flex items-center justify-center text-white font-bold text-sm p-4 text-center hidden">
          {book.title}
        </div>

        <div className={`
          absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
          flex items-end transition-opacity duration-300
          ${hoveredBook === index ? 'opacity-100' : 'opacity-0'}
        `}>
          <div className="p-4 text-white w-full">
            <h4 className="font-bold text-sm mb-1 line-clamp-2">{book.title}</h4>
            <p className="text-xs opacity-80 mb-2">{book.author}</p>
            <div className="flex items-center justify-between">
              {book.averageRating && book.averageRating > 0 ? (
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => {
                    const halfStarRating = (book.averageRating ?? 0) / 2; // Convert 1-10 scale to 0.5-5 scale
                    const isFullStar = i < Math.floor(halfStarRating);
                    const isHalfStar = i === Math.floor(halfStarRating) && halfStarRating % 1 >= 0.5;

                    return (
                      <div key={i} className="relative w-3 h-3">
                        {/* Background star */}
                        <svg
                          className="w-3 h-3 text-stone-500 absolute inset-0"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>

                        {/* Full or half star overlay */}
                        {(isFullStar || isHalfStar) && (
                          <svg
                            className="w-3 h-3 text-amber-400 fill-current absolute inset-0"
                            viewBox="0 0 24 24"
                            style={isHalfStar ? { clipPath: 'inset(0 50% 0 0)' } : {}}
                          >
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                        )}
                      </div>
                    );
                  })}
                  <span className="text-xs ml-1 opacity-80">
                    {(book.averageRating / 2).toFixed(1)}
                  </span>
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="text-xs text-stone-500">No rating</span>
                </div>
              )}
              <span className="text-xs bg-white/20 rounded-full px-2 py-1">
                {book.publishedDate?.slice(0,4) || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 border border-white/10 rounded-lg group-hover:border-amber-400/30 transition-colors duration-500" />
      </div>
    </div>
  );
};

// Add Book Card Component
interface AddBookCardProps {
  index: number;
  onClick: () => void;
  isHorizontal?: boolean;
}

const AddBookCard: React.FC<AddBookCardProps> = ({ index, onClick, isHorizontal = false }) => {
  return (
    <div
      className="group cursor-pointer relative"
      onClick={onClick}
      style={{
        animation: `fadeInUp 0.8s ease-out ${index * 0.15}s both`
      }}
    >
      <div className={`relative ${isHorizontal ? 'aspect-[2/3]' : 'aspect-[2/3]'} overflow-hidden rounded-lg border-2 border-dashed border-stone-500 hover:border-amber-400 transition-all duration-500 bg-stone-800/50 hover:bg-stone-700/50`}>
        <div className="flex flex-col items-center justify-center h-full text-stone-400 group-hover:text-amber-400 transition-colors duration-300">
          <Search className="w-8 h-8 mb-2" />
          <span className={`${isHorizontal ? 'text-xs' : 'text-sm'} font-medium text-center px-4`}>
            {isHorizontal ? 'Add' : 'Search & Add Book'}
          </span>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  value: string | number;
  label: string;
  color?: 'blue' | 'green' | 'purple';
}

const StatCard: React.FC<StatCardProps> = ({ value, label, color = 'white' }) => {
  const colorClasses: any = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    white: 'text-white'
  };

  return (
    <div className="text-center">
      <div className={`text-3xl font-bold mb-2 ${colorClasses[color]}`}>
        {value}
      </div>
      <div className="text-sm text-stone-400 uppercase tracking-wider">
        {label}
      </div>
    </div>
  );
};

export default FavoritesList;