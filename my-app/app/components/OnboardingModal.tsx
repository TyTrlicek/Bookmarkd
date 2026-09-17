"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Search, Star, ChevronRight, X, Sparkles, Plus, Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import Image from 'next/image';
import { debounce } from 'lodash';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  username?: string;
}

interface BookResult {
  id: string;
  openLibraryId: string;
  title: string;
  author: string;
  image: string;
  categories?: string[];
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose, username }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BookResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addedBooks, setAddedBooks] = useState<Set<string>>(new Set());
  const [addingBook, setAddingBook] = useState<string | null>(null);
  const router = useRouter();

  const steps = [
    {
      title: username ? `Welcome to Bookmarkd, ${username}!` : "Welcome to Bookmarkd!",
      description: "Your personal library for tracking, rating, and discovering amazing books. Let's get you started!",
      icon: BookOpen,
      action: "Let's Go!"
    },
    {
      title: "Add Your First Books",
      description: "Search for books you've read or want to read. Add at least 5 to unlock personalized recommendations!",
      icon: Search,
      action: addedBooks.size >= 1 ? "Continue" : "Skip for Now"
    },
    {
      title: "You're All Set!",
      description: addedBooks.size >= 5
        ? "Great job! You've unlocked personalized recommendations. Explore and discover your next favorite read!"
        : `You've added ${addedBooks.size} book${addedBooks.size !== 1 ? 's' : ''}. Add ${5 - addedBooks.size} more to unlock personalized recommendations.`,
      icon: Star,
      action: "Start Exploring"
    }
  ];

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${encodeURIComponent(query)}&limit=5`
        );
        setSearchResults(response.data || []);
      } catch (error) {
        console.error('Search failed:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, debouncedSearch]);

  const handleAddBook = async (book: BookResult) => {
    if (addedBooks.has(book.openLibraryId) || addingBook) return;

    setAddingBook(book.openLibraryId);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) {
        console.error('No access token');
        return;
      }

      // First, ensure the book exists in the database by fetching its data
      // This will create the book record if it doesn't exist
      await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/bookdata?id=${book.openLibraryId}&searchAuthor=${encodeURIComponent(book.author)}`
      );

      // Now add it to the user's collection
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/booklist`,
        {
          openLibraryId: book.openLibraryId,
          status: 'to-read'
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setAddedBooks(prev => new Set([...prev, book.openLibraryId]));
    } catch (error) {
      console.error('Failed to add book:', error);
    } finally {
      setAddingBook(null);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - go to browse or collection
      if (addedBooks.size > 0) {
        router.push('/collection');
      } else {
        router.push('/browse');
      }
      onClose();
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#14181C] to-[#14181C] rounded-2xl shadow-2xl w-full max-w-lg mx-4 transform transition-all duration-300 border border-amber-500/20 max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-600 to-orange-600 p-6 rounded-t-2xl text-white overflow-hidden flex-shrink-0">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <div className="w-full h-full rounded-full border-4 border-white transform translate-x-8 -translate-y-8"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
            <Sparkles className="w-full h-full transform -translate-x-4 translate-y-4" />
          </div>

          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors duration-200"
          >
            <X size={20} />
          </button>

          {/* Step content */}
          <div className="relative z-10 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm border-2 border-white/30">
                <Icon size={32} className="text-stone-50" />
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-2">{currentStepData.title}</h2>
            <p className="text-stone-50/90 leading-relaxed">{currentStepData.description}</p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">

          {/* Progress indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                    index === currentStep ? 'bg-amber-500' :
                    index < currentStep ? 'bg-amber-300' : 'bg-stone-600'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-stone-400 text-center">
              Step {currentStep + 1} of {steps.length}
            </p>
          </div>

          {/* Step 0: Quick features preview */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 gap-3 mb-6">
              {[
                { icon: Search, text: "Search millions of books" },
                { icon: BookOpen, text: "Build your personal library" },
                { icon: Star, text: "Rate and review books" }
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-stone-700/30 rounded-lg">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-stone-300 text-sm">{feature.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Step 1: Book Search */}
          {currentStep === 1 && (
            <div className="mb-6">
              {/* Progress bar for books added */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-stone-400">Books added</span>
                  <span className="text-amber-400 font-medium">{addedBooks.size}/5</span>
                </div>
                <div className="h-2 bg-stone-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                    style={{ width: `${Math.min((addedBooks.size / 5) * 100, 100)}%` }}
                  />
                </div>
                {addedBooks.size >= 5 && (
                  <p className="text-emerald-400 text-sm mt-2 flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Recommendations unlocked!
                  </p>
                )}
              </div>

              {/* Search input */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search for a book..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-700/50 border border-stone-600 rounded-lg text-stone-50 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-400 animate-spin" />
                )}
              </div>

              {/* Search results */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((book) => {
                  const isAdded = addedBooks.has(book.openLibraryId);
                  const isAdding = addingBook === book.openLibraryId;

                  return (
                    <div
                      key={book.openLibraryId}
                      className="flex items-center gap-3 p-2 bg-stone-700/30 rounded-lg hover:bg-stone-700/50 transition-colors"
                    >
                      {/* Book cover */}
                      <div className="w-12 h-16 bg-stone-600 rounded overflow-hidden flex-shrink-0">
                        {book.image && (
                          <Image
                            src={book.image}
                            alt={book.title}
                            width={48}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Book info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-stone-50 text-sm font-medium truncate">{book.title}</h4>
                        <p className="text-stone-400 text-xs truncate">{book.author}</p>
                      </div>

                      {/* Add button */}
                      <button
                        onClick={() => handleAddBook(book)}
                        disabled={isAdded || isAdding}
                        className={`flex-shrink-0 p-2 rounded-lg transition-all ${
                          isAdded
                            ? 'bg-emerald-500/20 text-emerald-400 cursor-default'
                            : isAdding
                            ? 'bg-amber-500/20 text-amber-400 cursor-wait'
                            : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                        }`}
                      >
                        {isAdded ? (
                          <Check className="w-5 h-5" />
                        ) : isAdding ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Plus className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  );
                })}

                {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                  <p className="text-stone-400 text-sm text-center py-4">
                    No books found. Try a different search.
                  </p>
                )}

                {searchQuery.length < 2 && (
                  <p className="text-stone-400 text-sm text-center py-4">
                    Type at least 2 characters to search
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Completion */}
          {currentStep === 2 && (
            <div className="text-center mb-6">
              {addedBooks.size >= 5 ? (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                  <Check className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-emerald-300 font-medium">
                    Personalized recommendations are ready!
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <BookOpen className="w-10 h-10 text-amber-400 mx-auto mb-2" />
                  <p className="text-amber-300 font-medium mb-1">
                    {addedBooks.size > 0
                      ? `You've added ${addedBooks.size} book${addedBooks.size !== 1 ? 's' : ''}!`
                      : "You haven't added any books yet."}
                  </p>
                  <p className="text-stone-400 text-sm">
                    {addedBooks.size > 0
                      ? `Add ${5 - addedBooks.size} more from your collection to get recommendations.`
                      : "Browse our library and add books anytime to unlock recommendations."}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 px-4 py-3 border border-stone-600 text-stone-300 rounded-lg hover:bg-stone-700/50 transition-colors duration-200"
            >
              Skip
            </button>
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              {currentStepData.action}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
