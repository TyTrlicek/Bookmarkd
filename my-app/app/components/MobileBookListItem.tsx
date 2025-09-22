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
    if(score === 0) return 'text-stone-400'
    if (score >= 8) return 'text-emerald-400'
    if (score >= 6.5) return 'text-blue-400'
    if (score >= 5) return 'text-amber-400'
    if (score >= 4) return 'text-orange-400'
    return 'text-red-400'
  }

  const formatMemberCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count?.toString() || '0'
  }

  const getUserStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'read': return 'text-emerald-400 bg-emerald-400/10'
      case 'reading': return 'text-blue-400 bg-blue-400/10'
      case 'want to read': return 'text-amber-400 bg-amber-400/10'
      default: return 'text-stone-400 bg-stone-400/10'
    }
  }

  return (
    <div 
      className="bg-stone-800/40 backdrop-blur-sm rounded-2xl border border-stone-700/40 p-4 hover:border-amber-500/40 transition-all duration-300 hover:bg-stone-800/60 cursor-pointer group"
      onClick={handleClick}
    >
      <div className="flex gap-4">
        {/* Book Cover */}
        <div className="flex-shrink-0 w-24 h-36 sm:w-30 sm:h-42 relative bg-stone-700/30 rounded-lg overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-br from-amber-600/80 to-stone-700/80 flex items-center justify-center text-white font-bold text-xs p-2 text-center">
              {book.title.substring(0, 20)}...
            </div>
          )}

          {/* {book.averageRating && book.averageRating > 0 && (
            <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-sm rounded px-1.5 py-0.5">
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
            <h3 className="font-bold text-white text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-amber-300 transition-colors duration-200">
              {book.title}
            </h3>
            <p className="text-stone-400 text-xs sm:text-sm font-medium">
              by {book.author}
            </p>
            
            {/* Description Preview */}
            {book.description && (
              <p className="text-stone-500 text-xs line-clamp-2 mt-1">
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
                  className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/20"
                >
                  {category}
                </span>
              ))}
              {book.categories.length > 2 && (
                <span className="text-xs text-stone-500">
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
                  <Star className="w-3 h-3 text-amber-400 fill-current" />
                  <span className={`text-sm font-semibold ${getScoreColor(book.averageRating)}`}>
                    {book.averageRating.toFixed(1)}
                  </span>
                  {/* Show user rating if different */}
                  {book.userRating && book.userRating !== book.averageRating && (
                    <span className="text-xs text-stone-400">
                      (you: {book.userRating})
                    </span>
                  )}
                </div>
              )}
              
              {/* Member count */}
              <div className="flex items-center gap-1 text-xs text-stone-400">
                <User className="w-3 h-3" />
                <span className="font-medium">{formatMemberCount(book.totalRatings ?? 0)}</span>
              </div>

              {/* Page count */}
              {book.pageCount && (
                <div className="flex items-center gap-1 text-xs text-stone-400">
                  <BookOpen className="w-3 h-3" />
                  <span>{book.pageCount}p</span>
                </div>
              )}

              {/* Publication date */}
              {book.publishedDate && (
                <div className="hidden sm:flex items-center gap-1 text-xs text-stone-400">
                  <Calendar className="w-3 h-3" />
                  <span>{book.publishedDate}</span>
                </div>
              )}
            </div>

            <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-200" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default MobileBookListItem