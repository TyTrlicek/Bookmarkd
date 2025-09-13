import { supabase } from '@/lib/supabaseClient';
import axios from 'axios';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Plus } from 'lucide-react';
import { debounce } from 'lodash';
import { getSearchData } from '@/utils/util';
import { BookData } from '../types/types';
import Image from 'next/image';

interface FavoriteBooksHeroProps {
  favoriteBooks?: BookData[];
}

export default function FavoriteBooksHero({ favoriteBooks: propFavoriteBooks }: FavoriteBooksHeroProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [hoveredBook, setHoveredBook] = useState<number | null>(null);
  const [favoriteBooks, setFavoriteBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  
  const router = useRouter();
  const searchRef = useRef(null);
  const modalRef = useRef(null);

  // Mock fetch function to simulate API call
const fetchFavoriteBooks = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  if (!accessToken) {
    setFavoriteBooks([]);
    return [];
  }

  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/favorites`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  console.log(response.data)

  return response.data.map((fav: any) => ({
    id: fav.book.id,
    title: fav.book.title,
    author: fav.book.author,
    image: fav.book.image,
    publishedDate: fav.book.publishedDate, 
    rating: 5,
  }));
};


  // Search functionality from Header component
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
  
  const debouncedSearch = useCallback(
    debounce((query) => {
      handleSearch(query);
    }, 500),
    []
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !(modalRef.current as Node).contains(event.target as Node)) {
        setShowSearchModal(false);
        setSearchQuery('');
        setSearchResults([]);
        setShowSearchResults(false);
      }
    };

    if (showSearchModal) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSearchModal]);

  useEffect(() => {
    const loadFavoriteBooks = async () => {
      try {
        setLoading(true);
        const books = propFavoriteBooks || await fetchFavoriteBooks();
        setFavoriteBooks(books);
      } catch (error) {
        console.error('Failed to fetch favorite books:', error);
        setFavoriteBooks([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavoriteBooks();
  }, [propFavoriteBooks]);

  const handleRemoveBook = async (bookId: string) => {

          const {
            data: { session }
          } = await supabase.auth.getSession();
          
          const accessToken = session?.access_token;

          if (!accessToken) {
            throw new Error('No access token available')
          }

          // Make API call to delete book
          await axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/api/favorites/${bookId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          )

    setFavoriteBooks(prev => prev.filter(book => String(book.id) !== bookId));
  };

  const handleAddBookFromSearch = async (selectedBook: BookData) => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    console.log('selectedbookId', selectedBook.id);

    const accessToken = session?.access_token;

    if (!accessToken) {
      router.push('/auth');
      return;
    }    

    try {
      // Add to backend
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/favorites`,
        { bookId: selectedBook.id },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Add to local state
      setFavoriteBooks(prev => [...prev, selectedBook]);
      
      // Close modal and reset search
      setShowSearchModal(false);
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
    } catch (error) {
      console.error('Failed to add book to favorites:', error);
    }
  };

  // Open search modal
  const handleOpenSearch = () => {
    setShowSearchModal(true);
  };

  // Close search modal
  const handleCloseSearch = () => {
    setShowSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  // Search result item component
const SearchResultItem = ({ book }: any) => (
  <div 
    className="p-4 hover:bg-stone-700 cursor-pointer border-b border-stone-600 last:border-b-0"
    onClick={() => handleAddBookFromSearch(book)}
  >
    <div className="flex gap-4">
      <div className="w-20 h-28 bg-stone-600 rounded overflow-hidden flex-shrink-0 shadow-lg">
        <Image 
          src={book.image || '/api/placeholder/80/112'} 
          alt={book.title}
          width={160}
          height={224}
          className="w-full h-full object-cover"
          onError={(e) => {
            const img = e.target as HTMLImageElement;
            img.style.display = 'none';
            if (img.nextElementSibling) {
              (img.nextElementSibling as HTMLElement).style.display = 'flex';
            }
          }}
        />
        <div className="w-full h-full bg-gradient-to-br from-amber-600 to-stone-700 flex items-center justify-center text-white text-xs font-bold text-center p-1 hidden">
          {book.title.substring(0, 10)}...
        </div>
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
);

  // Create empty slots to fill up to 6 books
  const displayBooks = [...favoriteBooks];
  const emptySlots = Math.max(0, 6 - favoriteBooks.length);
  
  if (loading) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-t from-stone-900 via-stone-800 to-amber-900 min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading your favorite books...</div>
      </section>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-t from-stone-900 via-stone-800 to-amber-900 min-h-screen">
        {/* Cinematic Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />
          <div className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 py-20">
          
          {/* Header Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Favorite Books
            </h1>
          </div>

          {/* Book Covers Grid - Letterboxd Style */}
          <div className="max-w-5xl mx-auto mb-16">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
              {displayBooks.map((book, index) => (
                <div
                  key={book.id}
                  className="group cursor-pointer relative"
                  onMouseEnter={() => setHoveredBook(index)}
                  onMouseLeave={() => setHoveredBook(null)}
                  style={{
                    animation: `fadeInUp 0.8s ease-out ${index * 0.15}s both`
                  }}
                >
                  {/* Delete button */}
                  <button
                    onClick={() => handleRemoveBook(String(book.id))}
                    className={`
                      absolute -top-0 -right-0 z-30 bg-stone-500 hover:bg-stone-600 
                      text-white rounded-full w-6 h-6 flex items-center justify-center
                      transition-all duration-200 text-sm font-bold
                      ${hoveredBook === index ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}
                    `}
                  >
                    ×
                  </button>

                  {/* Book Cover Container */}
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-2xl group-hover:shadow-3xl transition-all duration-500">
                    <Image
                      src={book.image}
                      alt={`${book.title} cover`}
                      fill
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        if (img.nextElementSibling) {
                          (img.nextElementSibling as HTMLElement).style.display = 'flex';
                        }
                      }}
                    />
                    
                    {/* Fallback gradient cover */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-stone-700 flex items-center justify-center text-white font-bold text-sm p-4 text-center hidden">
                      {book.title}
                    </div>

                    {/* Overlay on hover */}
                    <div className={`
                      absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent
                      flex items-end transition-opacity duration-300
                      ${hoveredBook === index ? 'opacity-100' : 'opacity-0'}
                    `}>
                      <div className="p-4 text-white w-full">
                        <h4 className="font-bold text-sm mb-1 line-clamp-2">{book.title}</h4>
                        <p className="text-xs opacity-80 mb-2">{book.author}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-3 h-3 ${i < (book.averageRating ?? 0) ? 'text-amber-400 fill-current' : 'text-stone-500'}`}
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                            ))}
                          </div>
                          <span className="text-xs bg-white/20 rounded-full px-2 py-1">
                            {book.publishedDate.slice(0,4) || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Subtle border glow */}
                    <div className="absolute inset-0 border border-white/10 rounded-lg group-hover:border-amber-400/30 transition-colors duration-500" />
                  </div>
                </div>
              ))}

              {/* Add Book Slots */}
              {Array.from({ length: emptySlots }, (_, index) => (
                <div
                  key={`empty-${index}`}
                  className="group cursor-pointer relative"
                  onClick={handleOpenSearch}
                  style={{
                    animation: `fadeInUp 0.8s ease-out ${(displayBooks.length + index) * 0.15}s both`
                  }}
                >
                  <div className="relative aspect-[2/3] overflow-hidden rounded-lg border-2 border-dashed border-stone-500 hover:border-amber-400 transition-all duration-500 bg-stone-800/50 hover:bg-stone-700/50">
                    <div className="flex flex-col items-center justify-center h-full text-stone-400 group-hover:text-amber-400 transition-colors duration-300">
                      <Search className="w-8 h-8 mb-2" />
                      <span className="text-sm font-medium text-center px-4">
                        Search & Add Book
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats and CTA Section */}
          <div className="text-center">
            <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {favoriteBooks.length}
                </div>
                <div className="text-sm text-stone-400 uppercase tracking-wider">
                  Favorites
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {favoriteBooks.length > 0 ? (favoriteBooks.reduce((sum, book) => sum + (book.averageRating ?? 0), 0) / favoriteBooks.length).toFixed(1) : '0'}
                </div>
                <div className="text-sm text-stone-400 uppercase tracking-wider">
                  Avg Rating
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  247
                </div>
                <div className="text-sm text-stone-400 uppercase tracking-wider">
                  Books Read
                </div>
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes fadeInUp {
            0% {
              opacity: 0;
              transform: translateY(40px);
            }
            100% {
              opacity: 1;
              transform: translateY(0px);
            }
          }
          
          .line-clamp-2 {
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          
          .shadow-3xl {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
        `}</style>
      </section>

      {/* Search Modal */}
      {showSearchModal && (
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
                  onClick={handleCloseSearch}
                  className="p-2 text-stone-400 hover:text-white transition-colors rounded-lg hover:bg-stone-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Search Input */}
              <div className="mt-4 relative" ref={searchRef}>
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
                  <p className="text-stone-500 text-xs mt-1">Try searching with different keywords</p>
                </div>
              )}

              {!isSearching && !searchQuery && (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-stone-600 mx-auto mb-3" />
                  <p className="text-stone-400 text-sm">Start typing to search for books</p>
                  <p className="text-stone-500 text-xs mt-1">Search by title, author, or ISBN</p>
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
                    <SearchResultItem key={book.openLibraryId || index} book={book} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}