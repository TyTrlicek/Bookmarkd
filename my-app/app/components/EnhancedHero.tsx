import { supabase } from '@/lib/supabaseClient';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Star, Heart, Users, TrendingUp, Search } from 'lucide-react';
import { BookData } from '../types/types';
import useAuthStore from '@/store/authStore';
import FavoritesList from './FavoritesList';
import OnboardingModal from './OnboardingModal';
import LibraryBuildingPrompt from './LibraryBuildingPrompt';

interface UserStats {
  booksInCollection: number;
  reviewsWritten: number;
  achievementsUnlocked: number;
}

interface FavoriteBooksHeroProps {
  favoriteBooks?: BookData[];
  userStats?: UserStats | null;
}

export default function FavoriteBooksHero({ favoriteBooks: propFavoriteBooks, userStats: propUserStats }: FavoriteBooksHeroProps) {
  const [favoriteBooks, setFavoriteBooks] = useState<BookData[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(propUserStats || null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const router = useRouter();
  const { session } = useAuthStore();

  // Fetch favorite books from API
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

    return response.data.map((fav: any) => ({
      id: fav.book.id,
      title: fav.book.title,
      author: fav.book.author,
      image: fav.book.image,
      publishedDate: fav.book.publishedDate,
      rating: 5,
      averageRating: fav.book.averageRating || 0,
    }));
  };

  // Update userStats when prop changes
  useEffect(() => {
    if (propUserStats !== undefined) {
      setUserStats(propUserStats);
    }
  }, [propUserStats]);

  // Load favorite books and stats on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const books = propFavoriteBooks || await fetchFavoriteBooks();
        setFavoriteBooks(books);

        // Show onboarding modal for new users with 0 books
        if (session && books.length === 0) {
          setShowOnboardingModal(true);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setFavoriteBooks([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [propFavoriteBooks, session]);

  // Handle removing a book from favorites
  const handleRemoveBook = async (bookId: string) => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    
    const accessToken = session?.access_token;

    if (!accessToken) {
      throw new Error('No access token available')
    }

    try {
      // Make API call to delete book
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/favorites/${bookId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update local state
      setFavoriteBooks(prev => prev.filter(book => String(book.id) !== bookId));
    } catch (error) {
      console.error('Failed to remove book from favorites:', error);
      throw error;
    }
  };

  // Handle adding a book to favorites
  const handleAddBook = async (selectedBook: BookData) => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

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
    } catch (error) {
      console.error('Failed to add book to favorites:', error);
      throw error;
    }
  };

  // Unauthenticated User Experience
  if (!session) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-t from-stone-900 via-stone-800 to-amber-900 min-h-screen">
        {/* Enhanced Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/50 z-10" />
          <div className="absolute inset-0 opacity-30 mix-blend-overlay" />
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-6 py-20 flex items-center min-h-screen">
          <div className="w-full">
            {/* Hero Content */}
            <div className="text-center mb-16 max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                  Discover Your Next
                  <span className="block bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                    Favorite Book
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-stone-300 mb-8 leading-relaxed max-w-3xl mx-auto">
                  Join a community of readers where you can collect, rate, and discover amazing books. 
                  Build your personal library and never forget a great read again.
                </p>
              </div>

              {/* Enhanced CTA Section */}
              <div className="bg-black/30 backdrop-blur-xl rounded-3xl border border-amber-500/20 p-8 md:p-12 max-w-2xl mx-auto relative overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-x-16 -translate-y-16" />
                <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-orange-500/10 to-transparent rounded-full translate-x-12 translate-y-12" />
                
                <div className="relative z-10">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                    <BookOpen className="w-10 h-10 text-white" />
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Sign Up Now!
                  </h3>
                  
                  <p className="text-lg text-stone-300 mb-8 leading-relaxed">
                    Create your personal library, rate and review your favorites, and discover books 
                    you'll love based on your taste.
                  </p>

                  {/* Feature List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
                    {[
                      { icon: Search, text: "Search millions of books" },
                      { icon: Heart, text: "Build your book collection" },
                      { icon: Star, text: "Rate and review books" },
                      { icon: TrendingUp, text: "Get personalized recommendations" }
                    ].map((feature, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <feature.icon className="w-4 h-4 text-amber-400" />
                        </div>
                        <span className="text-stone-300 text-sm">{feature.text}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-4">
                    <button
                      onClick={() => router.push('/auth')}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-1 transform text-lg"
                    >
                      Get Started!
                    </button>
                    
                    <button
                      onClick={() => router.push('/auth')}
                      className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 px-8 rounded-xl transition-all duration-300 border border-white/20 hover:border-white/30 backdrop-blur-sm"
                    >
                      Sign In
                    </button>
                  </div>

                  <p className="text-xs text-stone-500 mt-6">
                    Free forever • No credit card required • Join in 30 seconds
                  </p>
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
          
          @keyframes float {
            0% {
              transform: translateY(0px) rotate(12deg);
            }
            100% {
              transform: translateY(-20px) rotate(12deg);
            }
          }
        `}</style>
      </section>
    );
  }

  // Authenticated User Experience
  return (
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

      {/* Onboarding Modal for new users */}
      {/* <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={() => setShowOnboardingModal(false)}
      /> */}

      <div className="relative z-20 max-w-7xl mx-auto px-6 py-20">
        {loading ? (
          // Loading state
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-white text-lg">Loading your library...</p>
            </div>
          </div>
        ) : favoriteBooks.length === 0 ? (
          // New user state (0 books) - handled by modal
          <div className="text-center min-h-[60vh] flex items-center justify-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <BookOpen className="w-12 h-12 text-white" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">Welcome to Bookmarkd!</h1>
              <p className="text-xl text-stone-300 mb-8">
                Start building your personal library by adding your first book.
              </p>
              <button
                onClick={() => router.push('/browse')}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-1 transform text-lg"
              >
                Browse Books
              </button>
            </div>
          </div>
        ) : (userStats?.booksInCollection ?? 0) >= 1 && userStats?.booksInCollection || 0 <= 5 ? (
          // Library building state (1-5 books)
          <div>
            <LibraryBuildingPrompt bookCount={favoriteBooks.length} />
          </div>
        ) : (
          // Full favorites experience (6+ books)
          <div>
            {/* Header Section */}
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Favorite Books
              </h1>
              <p className="text-xl md:text-2xl text-stone-300 mb-4 leading-relaxed max-w-3xl mx-auto">
                Your All Time Favorites
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full mx-auto"></div>
            </div>

            {/* Responsive Favorites List */}
            <div className="mb-16">
              {/* Desktop: Grid Layout */}
              <div className="hidden md:block">
                <FavoritesList
                  books={favoriteBooks}
                  loading={loading}
                  onRemoveBook={handleRemoveBook}
                  onAddBook={handleAddBook}
                  showAddSlots={true}
                  maxSlots={6}
                  layout="grid"
                  showStats={true}
                  userStats={userStats}
                  className="max-w-5xl mx-auto"
                />
              </div>

              {/* Mobile: Horizontal Scroll */}
              <div className="md:hidden">
                <FavoritesList
                  books={favoriteBooks}
                  loading={loading}
                  onRemoveBook={handleRemoveBook}
                  onAddBook={handleAddBook}
                  showAddSlots={true}
                  maxSlots={6}
                  layout="horizontal"
                  showStats={false}
                  className="px-4"
                />

                {/* Mobile Stats Section */}
                <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-8 px-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      {userStats?.booksInCollection ?? '—'}
                    </div>
                    <div className="text-xs text-stone-400 uppercase tracking-wider">
                      Books in Collection
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {userStats?.reviewsWritten ?? '—'}
                    </div>
                    <div className="text-xs text-stone-400 uppercase tracking-wider">
                      Reviews Written
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400 mb-1">
                      {userStats?.achievementsUnlocked ?? '—'}
                    </div>
                    <div className="text-xs text-stone-400 uppercase tracking-wider">
                      Achievements
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
      `}</style>
    </section>
  );
}