'use client'

import React, { useState, useEffect } from 'react'
import { 
  BookOpen, 
  Star, 
  Heart, 
  Share2, 
  Download, 
  ShoppingCart,
  TrendingUp,
  Calendar,
  Users,
  Award,
  ChevronRight,
  Play,
  Bookmark,
  MessageCircle,
  Plus,
  ExternalLink,
  Search,
  Bell,
  User,
  Clock,
  Crown,
  Coffee,
  ArrowRight,
  BookMarked,
  Filter,
  SortAsc,
  SortDesc,
  Grid,
  List,
  Eye,
  CheckCircle,
  X,
  BarChart3,
  Target,
  Library,
  Settings,
  ChevronDown,
  Save,
  RotateCcw,
  Check,
  Edit3,
  ArrowUpDown,
  Edit,
  MessageSquare
} from 'lucide-react'

import Header from '../components/Header'
import axios from 'axios'
import { BookInList } from '../types/types'
import Link from 'next/link'
import useAuthStore from '@/store/authStore'
import { supabase } from '@/lib/supabaseClient'
import EditCollectionPopup from '../components/EditCollectionPopup'
import Image from 'next/image'
import Footer from '../components/Footer'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'

const MyCollectionPage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('addedAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [books, setBooks] = useState<BookInList[]>([]);
  const [tempStatus, setTempStatus] = useState<string | undefined>('')
  const [isFavorite, setIsFavorite] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Edit popup state
  const [editingBook, setEditingBook] = useState<BookInList | null>(null)
  const [showEditPopup, setShowEditPopup] = useState(false)
  const [tempRating, setTempRating] = useState(0)

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth?redirect=/collection');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      console.log('books fetched');
      fetchBooks();
    }
  }, [isAuthenticated])

  useEffect(() => {
  const handleClickOutside = (event: any) => {
    if (showSortMenu && !event.target.closest('.sort-dropdown')) {
      setShowSortMenu(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showSortMenu]);

  const fetchBooks = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    
    const accessToken = session?.access_token;
  
    if (!accessToken) {

      router.push('/auth')
      return
    }
  
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/collection`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
  
      response.data && setBooks(response.data)
      
  
      console.log('Books fetched:', response.data)
    } catch (error) {
      console.error('Error fetching books:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckCircle className="w-4 h-4 bg-emerald-500" />
      case 'to-read': return <Eye className="w-4 h-4 bg-blue-500" />
      case 'dropped': return <X className="w-4 h-4 bg-red-500" />
      default: return null
    }
  }

  const getStatusText = (status: string) => {
    switch(status) {
      case 'completed': return 'Completed'
      case 'to-read': return 'To Read'
      case 'dropped': return 'Dropped'
      default: return ''
    }
  }

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'to-read': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'dropped': return 'bg-red-50 text-red-700 border-red-200'
      default: return 'bg-slate-50 text-slate-700 border-slate-200'
    }
  }

  const filteredAndSortedBooks = books
    .filter(book => {
      const matchesSearch = book.book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           book.book.author?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === 'all' || book.status === statusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let aValue, bValue
      switch(sortBy) {
        case 'title':
          aValue = a.book.title.toLowerCase()
          bValue = b.book.title.toLowerCase()
          break
        case 'author':
          aValue = a.book.author?.toLowerCase() || ''
          bValue = b.book.author?.toLowerCase() || ''
          break
        case 'rating':
          aValue = a.rating || 0
          bValue = b.rating || 0
          break
        case 'addedAt':
          aValue = new Date(a.addedAt)
          bValue = new Date(b.addedAt)
          break
        default:
          return 0
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

  const stats = [
    { 
      label: "Total Books", 
      value: books.length.toString(), 
      icon: Library, 
      gradient: "from-amber-500 to-amber-600",
      description: "In your collection"
    },
    {
      label: "Completed",
      value: books.filter(b => b.status === 'completed').length.toString(),
      icon: CheckCircle,
      gradient: "from-emerald-500 to-emerald-600",
      description: "Books finished"
    },
    {
      label: "To Read",
      value: books.filter(b => b.status === 'to-read').length.toString(),
      icon: Target,
      gradient: "from-purple-500 to-purple-600",
      description: "Waiting to start"
    },
    {
      label: "Dropped",
      value: books.filter(b => b.status === 'dropped').length.toString(),
      icon: X,
      gradient: "from-red-500 to-red-600",
      description: "Did not finish"
    }
  ]

  const handleOpenEditPopup = (book: BookInList) => {

    setEditingBook(book)
    setTempRating(book.rating || 0)
    setTempStatus(book.status)
    setShowEditPopup(true)
  }


const BookListItem = ({ book }: {book: BookInList}) => {
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentValue, setCommentValue] = useState(book.comment || '');
  const [originalComment, setOriginalComment] = useState(book.comment || '');

  const handleStartEditComment = () => {
    setOriginalComment(book.comment || '');
    setCommentValue(book.comment || '');
    setIsEditingComment(true);
  };

  const handleSaveComment = async () => {
 if (commentValue === originalComment) {
   setIsEditingComment(false);
   return;
 }

 if (commentValue.trim().length > 100) {
   alert('Comment cannot exceed 1000 characters');
   return;
 }

 try {
   const {
     data: { session }
   } = await supabase.auth.getSession();
   
   const accessToken = session?.access_token;
   if (!accessToken) {
     throw new Error('No access token available');
   }

   await axios.put(
     `${process.env.NEXT_PUBLIC_API_URL}/collection/comment`,
     { 
       comment: commentValue.trim() || null,
       bookId: book.bookId
     },
     {
       headers: {
         Authorization: `Bearer ${accessToken}`,
         'Content-Type': 'application/json'
       }
     }
   );

   // Update the book in the parent component's state
   setBooks(prevBooks => 
     prevBooks.map(b => 
       b.bookId === book.bookId 
         ? { ...b, comment: commentValue.trim() || undefined }
         : b
     )
   );

   setIsEditingComment(false);
   setOriginalComment(commentValue.trim() || '');

 } catch (error) {
   console.error('Error updating comment:', error);
   setCommentValue(originalComment);
 }
};

  const handleCancelComment = () => {
    setCommentValue(originalComment);
    setIsEditingComment(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSaveComment();
    } else if (e.key === 'Escape') {
      handleCancelComment();
    }
  };

  return (
    <div className="group bg-[#2C3440]/60 backdrop-blur-sm rounded-xl border border-[#3D4451] hover:bg-[#2C3440]/80 hover:border-amber-500/30 transition-all duration-300 overflow-hidden">
      <div className="p-2 md:p-6">
        {/* Desktop Layout (md and up) */}
        <div className="hidden md:flex gap-6">
          {/* Book Cover - Fixed dimensions */}
          <div className="relative flex-shrink-0">
            <div className="relative overflow-hidden rounded-lg shadow-lg group-hover:shadow-2xl transition-shadow duration-300 w-48 h-72">
              <Image 
                src={book.book.image || '/placeholder-book-cover.png'}
                alt={book.book.title}
                width={192}
                height={288}
                className="w-full h-full object-cover"
                style={{ objectFit: 'cover' }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14181C]/30 via-transparent to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0 flex flex-col py-6 pr-6">
            {/* Header Section */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <Link href={`/book/${book.book.openLibraryId}`} className="group/link mr-2">
                  <h3 className="font-bold text-xl text-stone-50 mb-2 hover:text-amber-400 transition-colors line-clamp-2">
                    {book.book.title}
                  </h3>
                </Link>
                <p className="text-stone-300 font-medium text-base mb-1">{book.book.author}</p>
                <div className='flex items-center'>
                  <p className="text-stone-400 text-sm">Added {new Date(book.addedAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <button
                onClick={() => handleOpenEditPopup(book)}
                className="ml-4 p-2.5 text-stone-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors flex-shrink-0 backdrop-blur-sm"
                title="Edit book"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>

            {/* Status and Rating Row */}
            <div className="flex items-center gap-4 mb-4">
              {/* Status Badge */}
              <div className={`px-3 py-1.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${getStatusColor(book.status ?? '')}`}>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(book.status ?? '')}
                  {getStatusText(book.status ?? '')}
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                {(book.rating || 0) > 0 ? (
  <>
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        const rating = book.rating || 0;
        const starValue = i + 1; // 5-star scale
        const isFilled = rating >= starValue;
        const isHalfFilled = rating >= starValue - 0.5 && rating < starValue;

        return (
          <div key={i} className="relative">
            <Star className="w-4 h-4 text-stone-500" />
            {isFilled && (
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 absolute inset-0" />
            )}
            {isHalfFilled && (
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
    <span className="text-sm font-semibold text-stone-50">{(book.rating || 0).toFixed(1)}/5</span>
  </>
) : (
  <span className="text-sm text-stone-400">No rating</span>
)}
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2 mb-4 min-h-[26px]">
              {book.book.categories && book.book.categories.length > 0 ? (
                <>
                  {book.book.categories.slice(0, 4).map((category, idx) => (
                    <span
                      key={idx}
                      className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 px-3 py-1 rounded-full text-xs font-medium border border-amber-500/30 hover:from-amber-500/30 hover:to-amber-600/30 transition-colors backdrop-blur-sm"
                    >
                      {category}
                    </span>
                  ))}
                  {book.book.categories.length > 4 && (
                    <span className="text-xs text-stone-400 px-2 py-1">
                      +{book.book.categories.length - 4} more
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-stone-400 italic">No categories</span>
              )}
            </div>
            
            {/* Comment Section */}
            <div className="mt-auto">
              {isEditingComment ? (
                <div className="bg-gradient-to-r from-white/5 to-white/10 border border-amber-500/30 rounded-lg p-4 relative backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-4 h-4 text-amber-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <textarea
                        value={commentValue}
                        onChange={(e) => setCommentValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add your thoughts about this book..."
                        className="w-full bg-transparent text-stone-200 text-sm leading-relaxed resize-none border-none outline-none placeholder-stone-400 min-h-[60px]"
                        autoFocus
                        maxLength={100}
                      />
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#3D4451]">
                        <div className="text-xs text-stone-400">
                          Press Ctrl+Enter to save, Esc to cancel • {commentValue.length}/100
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCancelComment}
                            className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleSaveComment}
                            className="p-1.5 text-stone-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                            title="Save comment"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-white/5 to-white/10 border border-[#3D4451] rounded-lg p-4 relative backdrop-blur-sm group/comment">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {book.comment ? (
                        <div className="flex items-start gap-3">
                          <div className="text-stone-400 mt-0.5">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                            </svg>
                          </div>
                          <p className="text-stone-300 text-sm leading-relaxed italic flex-1">
                            {book.comment}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 text-stone-400">
                          <MessageSquare className="w-4 h-4" />
                          <p className="text-sm italic">No comment</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleStartEditComment}
                      className="ml-3 p-1.5 text-stone-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors opacity-0 group-hover/comment:opacity-100 flex-shrink-0"
                      title="Edit comment"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Layout (below md) - Fixed image dimensions */}
        <div className="md:hidden flex gap-2 h-36 -m-4">
          {/* Book Cover - Fixed dimensions, no spacing on top/left/bottom */}
          <div className="flex-shrink-0">
          <div className="relative overflow-hidden rounded-l-xl rounded-r-xl w-24 h-36">
            <Image 
              src={book.book.image || '/placeholder-book-cover.png'}
              alt={book.book.title}
              width={96}
              height={144}
              className="w-full h-full object-cover"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>

          {/* Content - Compact layout */}
          <div className="flex-1 min-w-0 flex flex-col justify-between py-5 pr-4">
            {/* Top section: Title + Edit button */}
            <div>
              <div className="flex items-start gap-2 mb-1">
                <Link href={`/book/${book.book.openLibraryId}`} className="flex-1 min-w-0">
                  <h3 className="font-bold text-base leading-tight text-stone-50 hover:text-amber-400 transition-colors line-clamp-2">
                    {book.book.title}
                  </h3>
                </Link>
                <button
                  onClick={() => handleOpenEditPopup(book)}
                  className="p-1 text-stone-400 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-colors flex-shrink-0"
                  title="Edit book"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              </div>
              
              {/* Author */}
              <p className="text-stone-300 text-sm mb-2 line-clamp-1">{book.book.author}</p>
            </div>
            
            {/* Bottom section: Status, Rating, Genres all in one compact row */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Badge */}
              <div className={`px-2 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${getStatusColor(book.status ?? '')}`}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(book.status ?? '')}
                  <span className="sr-only sm:not-sr-only sm:inline">{getStatusText(book.status ?? '')}</span>
                </div>
              </div>

              {/* Rating */}
              {(book.rating || 0) > 0 ? (
  <>
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => {
        const rating = book.rating || 0;
        const starValue = i + 1; // 5-star scale
        const isFilled = rating >= starValue;
        const isHalfFilled = rating >= starValue - 0.5 && rating < starValue;

        return (
          <div key={i} className="relative">
            <Star className="w-4 h-4 text-stone-500" />
            {isFilled && (
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 absolute inset-0" />
            )}
            {isHalfFilled && (
              <div className="absolute inset-0 overflow-hidden w-1/2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </div>
            )}
          </div>
        );
      })}
    </div>
    <span className="text-sm font-semibold text-stone-50">{(book.rating || 0).toFixed(1)}/5</span>
  </>
) : (
  <span className="text-sm text-stone-400">No rating</span>
)}

              {/* First genre only with proper +X handling */}
              {/* {book.book.categories && book.book.categories.length > 0 && (
                <>
                  <span className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 px-2 py-0.5 rounded-full text-xs font-medium border border-amber-500/30 backdrop-blur-sm truncate max-w-20" title={book.book.categories[0]}>
                    {book.book.categories[0]}
                  </span>
                  {book.book.categories.length > 1 && (
                    <span className="text-xs text-stone-400 whitespace-nowrap">
                      +{book.book.categories.length - 1}
                    </span>
                  )}
                </>
              )} */}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

// Grid view component - Letterboxd style
const BookGridItem = ({ book }: {book: BookInList}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/book/${book.book.openLibraryId}?author=${encodeURIComponent(book.book.author || 'Unknown Author')}`)}
    >
      {/* Book Cover */}
      <div className="aspect-[2/3] relative overflow-hidden rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
        <Image
          src={book.book.image || '/placeholder-book.png'}
          alt={book.book.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Hover Overlay with Additional Info */}
        <div className={`absolute inset-0 bg-gradient-to-t from-[#14181C] via-black/60 to-transparent transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
            <h3 className="text-stone-50 font-semibold text-sm line-clamp-2">{book.book.title}</h3>
            <p className="text-stone-300 text-xs">{book.book.author || 'Unknown Author'}</p>

            {/* Status Badge */}
            {book.status && (
              <div className="flex items-center gap-1">
                {getStatusIcon(book.status)}
                <span className="text-xs text-stone-50">{getStatusText(book.status)}</span>
              </div>
            )}

            {/* Categories */}
            {/* {book.book.categories && book.book.categories.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {book.book.categories.slice(0, 2).map((cat) => (
                  <span key={cat} className="text-xs bg-white/20 text-stone-50 px-2 py-0.5 rounded">
                    {cat}
                  </span>
                ))}
              </div>
            )} */}

            {/* Edit Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditPopup(book);
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 text-stone-50 text-xs font-medium py-2 px-3 rounded transition-colors"
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Rating Below Cover */}
      <div className="mt-2 text-center">
        {book.rating && book.rating > 0 ? (
          <div className="flex items-center justify-center gap-1">
            {[...Array(5)].map((_, i) => {
              const starValue = i + 1; // 5-star scale (0.5-5.0)
              const isFilled = book.rating ? book.rating >= starValue : false;
              const isHalf = book.rating ? (!isFilled && book.rating >= starValue - 0.5) : false;

              return (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    isFilled ? 'fill-amber-400 text-amber-400' :
                    isHalf ? 'fill-amber-400/50 text-amber-400' :
                    'text-stone-600'
                  }`}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-xs text-stone-500">No rating</div>
        )}
      </div>
    </div>
  );
};

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#14181C] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-stone-50">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Stats Dashboard */}
      {/* <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-[#14181C] via-[#14181C] to-[#14181C]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181C]/60 via-transparent to-[#14181C]/40" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 hidden md:block">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-stone-50 mb-2">Reading Overview</h2>
            <p className="text-stone-300">Track Your Reading Status</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-[#2C3440]/60 backdrop-blur-sm rounded-xl p-6 border border-[#3D4451] hover:bg-[#2C3440]/80 transition-all group">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-lg flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-stone-50" />
                  </div>
                  <BarChart3 className="w-4 h-4 text-stone-400 group-hover:text-amber-400 transition-colors" />
                </div>
                <div className="text-3xl font-bold text-stone-50 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-stone-200 mb-1">{stat.label}</div>
                <div className="text-xs text-stone-400">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      {/* Collection Section */}
      <div className="relative">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181C] via-[#14181C] to-[#14181C]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181C]/60 via-transparent to-[#14181C]/40 z-10" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          {/* Controls */}
          <div className="bg-[#2C3440]/60 backdrop-blur-sm rounded-xl border border-[#3D4451] p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-5 h-5 text-stone-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search your library..."
                    className="w-full pl-10 pr-4 py-3 border border-[#3D4451] rounded-lg bg-white/5 text-stone-50 placeholder-stone-400 focus:bg-white/10 focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/30 transition-all backdrop-blur-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                
                <div className="relative sort-dropdown">
                  <button
                    type="button"
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="flex items-center gap-2 px-4 py-3 border border-[#3D4451] bg-white/5 text-stone-50 hover:bg-white/10 rounded-lg transition-all font-medium backdrop-blur-sm"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                    Sort
                    <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showSortMenu && (
                    <div className="absolute top-full mt-2 right-0 bg-[#14181C] backdrop-blur-sm border border-[#3D4451] rounded-lg shadow-xl p-2 min-w-[180px] z-20">
                      <button
                        type="button"
                        onClick={() => { setSortBy('addedAt'); setSortOrder('desc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/10 transition-colors ${
                          sortBy === 'addedAt' && sortOrder === 'desc' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-200'
                        }`}
                      >
                        Newest First
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSortBy('addedAt'); setSortOrder('asc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/10 transition-colors ${
                          sortBy === 'addedAt' && sortOrder === 'asc' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-200'
                        }`}
                      >
                        Oldest First
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSortBy('title'); setSortOrder('asc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/10 transition-colors ${
                          sortBy === 'title' && sortOrder === 'asc' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-200'
                        }`}
                      >
                        Title A-Z
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSortBy('title'); setSortOrder('desc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/10 transition-colors ${
                          sortBy === 'title' && sortOrder === 'desc' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-200'
                        }`}
                      >
                        Title Z-A
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSortBy('author'); setSortOrder('asc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/10 transition-colors ${
                          sortBy === 'author' && sortOrder === 'asc' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-200'
                        }`}
                      >
                        Author A-Z
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSortBy('author'); setSortOrder('desc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/10 transition-colors ${
                          sortBy === 'author' && sortOrder === 'desc' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-200'
                        }`}
                      >
                        Author Z-A
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSortBy('rating'); setSortOrder('desc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/10 transition-colors ${
                          sortBy === 'rating' && sortOrder === 'desc' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-200'
                        }`}
                      >
                        Highest Rated
                      </button>
                      <button
                        type="button"
                        onClick={() => { setSortBy('rating'); setSortOrder('asc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-3 py-2 rounded-md hover:bg-white/10 transition-colors ${
                          sortBy === 'rating' && sortOrder === 'asc' ? 'bg-amber-500/20 text-amber-300' : 'text-stone-200'
                        }`}
                      >
                        Lowest Rated
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-[#2C3440]/80 rounded-lg p-1 backdrop-blur-sm border border-[#3D4451]">
                  <button
                    type="button"
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid'
                        ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                        : 'text-stone-400 hover:text-stone-50'
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    type='button'
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'list'
                        ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                        : 'text-stone-400 hover:text-stone-50'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Status Filter Tabs */}
            <div className="border-b border-[#3D4451]">
              <nav className="flex space-x-2 lg:space-x-8 justify-center">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    statusFilter === 'all'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-[#3D4451]'
                  }`}
                >
                  All Books
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('completed')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    statusFilter === 'completed'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-[#3D4451]'
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('to-read')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    statusFilter === 'to-read'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-[#3D4451]'
                  }`}
                >
                  To Read
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('dropped')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    statusFilter === 'dropped'
                      ? 'border-amber-500 text-amber-400'
                      : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-[#3D4451]'
                  }`}
                >
                  Dropped
                </button>
              </nav>
            </div>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-stone-50">Your Books</h3>
              <p className="text-stone-300">
                Showing {filteredAndSortedBooks.length} of {books.length} books
              </p>
            </div>
          </div>

          {/* Books Display */}
          <div className="bg-[#2C3440]/60 backdrop-blur-sm rounded-xl border border-[#3D4451] overflow-hidden">
            <div className="bg-gradient-to-r from-[#14181C]/40 to-amber-500/10 border-b border-[#3D4451] px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Library className="w-5 h-5 text-amber-400" />
                  <span className="font-medium text-stone-50">Book Collection</span>
                </div>
                <span className="text-sm text-stone-300 bg-white/10 px-3 py-1 rounded-full border border-[#3D4451] backdrop-blur-sm">
                  {filteredAndSortedBooks.length} items
                </span>
              </div>
            </div>

            <div className="p-6">
              {viewMode === 'list' ? (
                // List View
                <div className="space-y-4">
                  {filteredAndSortedBooks.map((book) => (
                    <BookListItem key={book.bookId} book={book} />
                  ))}
                </div>
              ) : (
                // Grid View - Letterboxd Style
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {filteredAndSortedBooks.map((book) => (
                    <BookGridItem key={book.bookId} book={book} />
                  ))}
                </div>
              )}

              {filteredAndSortedBooks.length === 0 && statusFilter !== "all" &&  (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-[#3D4451]">
                    <BookOpen className="w-8 h-8 text-stone-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-50 mb-2">No books found</h3>
                  <p className="text-stone-300 mb-4">Try adjusting your search criteria or filters</p>
                  <button 
                    type='button' 
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg font-medium"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
              {filteredAndSortedBooks.length === 0 && statusFilter === "all" &&  (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-[#3D4451]">
                    <BookOpen className="w-8 h-8 text-stone-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-stone-50 mb-2">No books found</h3>
                  <p className="text-stone-300 mb-4">Try adding some books to your collection!</p>
                  <button 
                    type='button' 
                    onClick={() => router.push('/browse')}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg font-medium"
                  >
                    Browse
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
         <Footer />
      </div>

      {/* Edit Popup */}
      <EditCollectionPopup
        showEditPopup={showEditPopup}
        editingBook={editingBook}
        setBooks={setBooks}
        books={books}
        tempRating={tempRating}
        tempStatus={tempStatus}
        setEditingBook={setEditingBook}
        setShowEditPopup={setShowEditPopup}
        setTempStatus={setTempStatus}
        setTempRating={setTempRating}
      />
     

    </div>
  )
}

export default MyCollectionPage