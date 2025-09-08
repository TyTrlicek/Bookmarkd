'use client'

import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { 
  Users, 
  Heart, 
  Bookmark, 
  Share2, 
  Eye,
  Clock,
  Calendar,
  Award,
  TrendingUp,
  Star
} from 'lucide-react'
import Image from 'next/image'

// Mock BookData interface for demo
interface BookData {
  openLibraryId?: string
  title: string
  author: string
  image?: string
  averageRating?: number
  totalRatings?: number
}

interface BookCardProps {
  book?: BookData
  id?: string
}

const BookCard = ({ book, id }: BookCardProps ) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const handleImageClick = (id: string) => {
    router.push(`/book/${encodeURIComponent(id)}`)
  }

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsLiked(!isLiked)
  }

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsBookmarked(!isBookmarked)
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Share functionality would go here
  }

  // Function to get score color based on value
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400'
    if (score >= 6.5) return 'text-blue-400'
    if (score >= 5) return 'text-amber-400'
    if (score >= 4) return 'text-orange-400'
    return 'text-red-400'
  }

  useEffect(() => {
    if (book) {
      setIsLoading(false)
    }
  }, [book])
  
  // Function to format member count
  const formatMemberCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M` || 0
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K` || 0
    return count.toString()
  }

  if (isLoading) {
    return (
      <div className="bg-stone-800/40 backdrop-blur-sm rounded-2xl border border-stone-700/40 overflow-hidden shadow-2xl">
        <div className="aspect-[3/4] bg-gradient-to-br from-stone-700/50 to-stone-800/50 animate-pulse relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="h-4 bg-stone-700/60 rounded animate-pulse"></div>
          <div className="h-3 bg-stone-700/60 rounded animate-pulse w-3/4"></div>
          <div className="h-3 bg-stone-700/60 rounded animate-pulse w-1/2"></div>
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="bg-stone-800/40 backdrop-blur-sm rounded-2xl border border-stone-700/40 overflow-hidden shadow-2xl">
        <div className="aspect-[3/4] bg-gradient-to-br from-stone-700/50 to-stone-800/50 flex items-center justify-center">
          <span className="text-stone-400 text-sm font-medium">Failed to load book data</span>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="group cursor-pointer relative bg-stone-800/40 backdrop-blur-sm rounded-2xl border border-stone-700/40 overflow-hidden hover:border-amber-500/40 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/10 min-h-96 min-w-48 max-w-[190px] max-h-[388px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => handleImageClick(book.openLibraryId ?? '')}
    >
      {/* Book Cover */}
      <div className="aspect-[3/4] max-w-[190] max-h-[253] bg-stone-700/30 relative overflow-hidden">
        {book.image ? (
          <Image
            src={book.image}
            alt={`Cover for ${book.title}`}
            fill
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.nextElementSibling) {
                (target.nextElementSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}
        
        {/* Fallback gradient cover */}
        <div 
          className={`absolute inset-0 bg-gradient-to-br from-amber-600/80 to-stone-700/80 flex items-center justify-center text-white font-bold text-sm p-4 text-center ${
            book.image ? 'hidden' : 'flex'
          }`}
          style={{ display: book.image ? 'none' : 'flex' }}
        >
          {book.title}
        </div>

        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 group-hover:opacity-90 transition-opacity duration-300" />

        {/* Quick Actions - Floating on hover */}
        {/* <div className={`absolute top-4 right-4 space-y-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}>
          <button
            onClick={handleLike}
            className={`p-2.5 rounded-full backdrop-blur-sm border transition-all duration-200 hover:scale-110 ${
              isLiked 
                ? 'bg-red-500/90 border-red-400/60 text-white shadow-lg shadow-red-500/30' 
                : 'bg-black/40 border-white/20 text-white hover:bg-red-500/80 hover:border-red-400/60'
            }`}
          >
            <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          
          
          <button
            onClick={handleShare}
            className="p-2.5 rounded-full backdrop-blur-sm border bg-black/40 border-white/20 text-white hover:bg-stone-600/80 hover:border-stone-500/60 transition-all duration-200 hover:scale-110"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div> */}

        {/* Reading Progress Indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-700 group-hover:from-amber-300 group-hover:to-amber-500"
            style={{ width: `${Math.abs((book.title || '').length * 7) % 100}%` }}
          ></div>
        </div>

        {/* Hover overlay with additional info */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="p-4 text-white w-full">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1 text-xs">
                <Eye className="w-3 h-3" />
                <span>{formatMemberCount(book.totalRatings ?? 0)} views</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Calendar className="w-3 h-3" />
                <span>2024</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Book Information */}
      <div className="p-4 space-y-3 bg-gradient-to-b from-stone-800/20 to-stone-800/40">
        {/* Title */}
        <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 group-hover:text-amber-300 transition-colors duration-200">
          {book.title}
        </h3>

        {/* Author */}
        <p className="text-stone-400 text-xs font-medium">
          by {book.author}
        </p>

        {/* Score & Members */}
        <div className="flex items-center justify-between pt-1">
          {book.averageRating !== null && book.averageRating !== undefined && (
            <div className="flex items-center gap-2">
              <span className={`text-lg font-bold ${getScoreColor(book.averageRating)}`}>
                {book.averageRating.toFixed(2)}
              </span>
              <span className="text-xs text-stone-500 uppercase tracking-wide">
                Score
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-1 text-xs text-stone-400">
            <Users className="w-3 h-3" />
            <span className="font-medium">{formatMemberCount(book.totalRatings ?? 0)}</span>
          </div>
        </div>

        {/* Subtle bottom glow effect */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/20 to-transparent"></div>
      </div>

      {/* Card border glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
    </div>
  )
}

export default BookCard