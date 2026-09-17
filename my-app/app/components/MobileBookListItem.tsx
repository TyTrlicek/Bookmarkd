"use client"
import { Calendar, ChevronRight, Star, User, BookOpen, Globe, Award } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { BookData } from "../types/types"

const MobileBookListItem = ({ book }: { book: BookData }) => {
  const router = useRouter()
  const [imageLoaded, setImageLoaded] = useState(false)
  
  const handleClick = () => {
  router.push(
    `/book/${encodeURIComponent(book.openLibraryId ?? '')}?author=${encodeURIComponent(book.author ?? '')}`
  );
};


  const getScoreColor = (score: number) => {
    if(score === 0) return 'text-ink-mute'
    if (score >= 4.5) return 'text-rate-high'
    if (score >= 3.5) return 'text-rate-good'
    if (score >= 2.5) return 'text-rate-mid'
    if (score >= 2) return 'text-rate-low'
    return 'text-rate-bad'
  }

  const formatMemberCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count?.toString() || '0'
  }

  const getUserStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'read': return 'text-rate-high bg-rate-high/10'
      case 'reading': return 'text-rate-good bg-rate-good/10'
      case 'want to read': return 'text-gold bg-gold-dim'
      default: return 'text-ink-mute bg-overlay'
    }
  }

  return (
    <div 
      className="rounded-2xl border border-line bg-surface/60 p-4 transition-colors duration-300 hover:border-line-strong hover:bg-surface cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex gap-4">
        {/* Book Cover */}
        <div className="flex-shrink-0 w-24 h-36 sm:w-30 sm:h-42 relative bg-surface-2 rounded-lg overflow-hidden">
          {book.image ? (
            <img
              src={book.image}
              alt={`Cover for ${book.title}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onLoad={() => setImageLoaded(true)}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : null}
          
          {!book.image && (
            <div className="absolute inset-0 bg-surface-2 flex items-center justify-center text-white font-bold text-xs p-2 text-center">
              {book.title.substring(0, 20)}...
            </div>
          )}

          {/* {book.averageRating && book.averageRating > 0 && (
            <div className="absolute top-1 right-1 bg-[#14181C]/70 backdrop-blur-sm rounded px-1.5 py-0.5">
              <span className={`text-xs font-bold ${getScoreColor(book.averageRating)}`}>
                {book.averageRating.toFixed(1)}
              </span>
            </div>
          )} */}

          {/* User Status Badge */}
          {book.userStatus && (
            <div className="absolute bottom-1 left-1 right-1">
              <div className={`text-xs px-1.5 py-0.5 rounded text-center font-medium ${getUserStatusColor(book.userStatus)}`}>
                {book.userStatus}
              </div>
            </div>
          )}
        </div>

        {/* Book Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="space-y-1">
            <h3 className="font-semibold text-ink text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-gold transition-colors duration-200">
              {book.title}
            </h3>
            <p className="text-ink-mute text-xs sm:text-sm font-medium">
              by {book.author}
            </p>
            
            {/* Description Preview */}
            {book.description && (
              <p className="text-ink-faint text-xs line-clamp-2 mt-1">
                {book.description}
              </p>
            )}
          </div>

          {/* Categories/Genres */}
          {book.categories && book.categories.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {book.categories.slice(0, 2).map((category, index) => (
                <span
                  key={index}
                  className="text-xs bg-gold-dim text-gold px-2 py-0.5 rounded-full border border-gold/20"
                >
                  {category}
                </span>
              ))}
              {book.categories.length > 2 && (
                <span className="text-xs text-ink-faint">
                  +{book.categories.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Rating */}
              {book.averageRating && book.averageRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-gold fill-gold" />
                  <span className={`text-sm font-semibold ${getScoreColor(book.averageRating)}`}>
                    {book.averageRating.toFixed(1)}
                  </span>
                  {/* Show user rating if different */}
                  {book.userRating && book.userRating !== book.averageRating && (
                    <span className="text-xs text-ink-mute">
                      (you: {book.userRating})
                    </span>
                  )}
                </div>
              )}
              
              {/* Member count */}
              <div className="flex items-center gap-1 text-xs text-ink-mute">
                <User className="w-3 h-3" />
                <span className="font-medium">{formatMemberCount(book.totalRatings ?? 0)}</span>
              </div>

              {/* Page count */}
              {book.pageCount && (
                <div className="flex items-center gap-1 text-xs text-ink-mute">
                  <BookOpen className="w-3 h-3" />
                  <span>{book.pageCount}p</span>
                </div>
              )}

              {/* Publication date */}
              {book.publishedDate && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-ink-mute">
                  <Calendar className="w-3 h-3" />
                  <span>{book.publishedDate}</span>
                </div>
              )}
            </div>

            <ChevronRight className="w-4 h-4 text-ink-mute group-hover:text-gold group-hover:translate-x-1 transition-all duration-200" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileBookListItem