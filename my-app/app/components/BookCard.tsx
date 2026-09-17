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

interface BookData {
  openLibraryId?: string
  title: string
  author: string
  image?: string
  averageRating?: number
  totalRatings?: number
  publishedDate?: string
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
  
  const handleImageClick = (id: string, author?: string) => {
  router.push(
    `/book/${encodeURIComponent(id)}?author=${encodeURIComponent(author ?? '')}`
  );  }

  // Function to get score color based on value
  const getScoreColor = (score: number) => {
    if(score === 0) return 'text-ink-mute'
    if (score >= 4) return 'text-rate-high'
    if (score >= 3.25) return 'text-rate-good'
    if (score >= 2.5) return 'text-rate-mid'
    if (score >= 2) return 'text-rate-low'
    return 'text-rate-bad'
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
      <div className="h-[280px] w-[140px] overflow-hidden rounded-lg border border-line bg-surface sm:h-[388px] sm:w-[190px]">
        <div className="aspect-[3/4] animate-pulse bg-surface-2" />
        <div className="space-y-2 p-3">
          <div className="h-3 animate-pulse rounded bg-surface-2" />
          <div className="h-2.5 w-3/4 animate-pulse rounded bg-surface-2" />
        </div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex h-[280px] w-[140px] items-center justify-center rounded-lg border border-line bg-surface p-4 text-center text-xs text-ink-mute sm:h-[388px] sm:w-[190px]">
        Couldn&apos;t load this book
      </div>
    )
  }

  return (
    <div
      className="group relative h-[280px] w-[140px] cursor-pointer overflow-hidden rounded-lg border border-line bg-surface transition-all duration-300 hover:border-line-strong hover:-translate-y-1 sm:h-[388px] sm:w-[190px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => handleImageClick((book.openLibraryId ?? ''), book.author)}
    >
      {/* Book Cover */}
      <div className="relative aspect-[3/4] max-h-[187px] max-w-[140px] overflow-hidden bg-surface-2 sm:max-h-[253px] sm:max-w-[190px]">
        {book.image ? (
          <Image
            src={book.image}
            alt={`Cover for ${book.title}`}
            fill
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.nextElementSibling) {
                (target.nextElementSibling as HTMLElement).style.display = 'flex';
              }
            }}
          />
        ) : null}

        {/* Fallback cover */}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-surface-2 p-4 text-center font-display text-sm text-ink-soft ${
            book.image ? 'hidden' : 'flex'
          }`}
          style={{ display: book.image ? 'none' : 'flex' }}
        >
          {book.title}
        </div>

        {/* Score chip */}
        {book.averageRating !== null && book.averageRating !== undefined && book.averageRating > 0 && (
          <div className="absolute left-2 top-2 rounded-md bg-canvas/80 px-1.5 py-0.5 font-mono text-[0.7rem] font-semibold backdrop-blur-sm">
            <span className={getScoreColor(book.averageRating)}>
              {book.averageRating.toFixed(1)}
            </span>
          </div>
        )}

        {/* Bottom scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-canvas/70 via-transparent to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95" />

        {/* Quick Actions - Floating on hover */}
        {/* <div className={`absolute top-4 right-4 space-y-2 transition-all duration-300 ${
          isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
        }`}>
          <button
            onClick={handleLike}
            className={`p-2.5 rounded-full backdrop-blur-sm border transition-all duration-200 hover:scale-110 ${
              isLiked 
                ? 'bg-red-500/90 border-red-400/60 text-white shadow-lg shadow-red-500/30' 
                : 'bg-[#2C3440]/80 border-[#3D4451] text-white hover:bg-red-500/80 hover:border-red-400/60'
            }`}
          >
            <Heart className="w-4 h-4" fill={isLiked ? 'currentColor' : 'none'} />
          </button>
          
          
          <button
            onClick={handleShare}
            className="p-2.5 rounded-full backdrop-blur-sm border bg-[#2C3440]/80 border-[#3D4451] text-white hover:bg-stone-600/80 hover:border-stone-500/60 transition-all duration-200 hover:scale-110"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div> */}

        {/* Reading Progress Indicator */}
        {/* <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#2C3440]/80">
          <div 
            className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-700 group-hover:from-amber-300 group-hover:to-amber-500"
            style={{ width: `${Math.abs((book.title || '').length * 7) % 100}%` }}
          ></div>
        </div> */}

        {/* Year on hover */}
        {book.publishedDate && (
          <div
            className={`absolute bottom-2 right-2 rounded bg-canvas/70 px-1.5 py-0.5 font-mono text-[0.65rem] text-ink-soft backdrop-blur-sm transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {book.publishedDate.slice(0, 4)}
          </div>
        )}
      </div>

      {/* Book Information */}
      <div className="space-y-1 p-2.5 sm:p-3.5">
        <h3 className="line-clamp-2 h-[1.75rem] overflow-hidden text-xs font-medium leading-tight text-ink transition-colors duration-200 group-hover:text-gold-soft sm:h-[2.125rem] sm:text-sm">
          {book.title}
        </h3>
        <p className="truncate text-[0.7rem] text-ink-mute">{book.author}</p>
        <div className="flex items-center gap-1 pt-0.5 text-[0.7rem] text-ink-faint">
          <Users className="h-3 w-3" />
          <span>{formatMemberCount(book.totalRatings ?? 0)}</span>
        </div>
      </div>
    </div>
  )
}

export default BookCard