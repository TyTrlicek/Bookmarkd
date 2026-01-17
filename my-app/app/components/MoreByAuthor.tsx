'use client'

import { useEffect, useState, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import axios from 'axios'

interface Book {
  id: string
  title: string
  author: string
  image: string | null
  averageRating: number
  totalRatings: number
  openLibraryId: string
}

interface MoreByAuthorProps {
  author: string
  currentBookId: string
}

export default function MoreByAuthor({ author, currentBookId }: MoreByAuthorProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchAuthorBooks = async () => {
      try {
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/books/by-author`,
          {
            params: {
              author,
              excludeBookId: currentBookId,
              limit: 10
            }
          }
        )
        setBooks(response.data)
      } catch (error) {
        console.error('Error fetching books by author:', error)
      } finally {
        setLoading(false)
      }
    }

    if (author && author !== 'Unknown Author') {
      fetchAuthorBooks()
    } else {
      setLoading(false)
    }
  }, [author, currentBookId])

  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  useEffect(() => {
    updateScrollButtons()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', updateScrollButtons)
      return () => container.removeEventListener('scroll', updateScrollButtons)
    }
  }, [books])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300
      const newScrollLeft =
        scrollContainerRef.current.scrollLeft +
        (direction === 'left' ? -scrollAmount : scrollAmount)

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      })
    }
  }

  const handleBookClick = (book: Book) => {
    router.push(`/book/${book.openLibraryId}?author=${encodeURIComponent(book.author)}`)
  }

  if (loading) {
    return (
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-stone-50 mb-4">More by {author}</h2>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-32 h-48 bg-stone-700/50 animate-pulse rounded-lg flex-shrink-0"
            />
          ))}
        </div>
      </div>
    )
  }

  if (books.length === 0) {
    return null
  }

  return (
    <div className="w-full overflow-hidden">
      <h2 className="text-lg sm:text-2xl font-bold text-stone-50 mb-4">
        More by {author}
      </h2>

      <div className="relative w-full">
        {/* Scroll buttons */}
        {canScrollLeft && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-[#14181C]/70 hover:bg-black/90 text-stone-50 p-2 rounded-full backdrop-blur-sm transition-all duration-200 shadow-lg"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {canScrollRight && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-[#14181C]/70 hover:bg-black/90 text-stone-50 p-2 rounded-full backdrop-blur-sm transition-all duration-200 shadow-lg"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* Books container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4 w-full"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {books.map((book) => (
            <div
              key={book.id}
              className="flex-shrink-0 w-28 sm:w-32 cursor-pointer group"
              style={{ scrollSnapAlign: 'start' }}
              onClick={() => handleBookClick(book)}
            >
              <div className="relative aspect-[2/3] overflow-hidden rounded-lg shadow-lg group-hover:shadow-xl transition-all duration-300">
                {book.image ? (
                  <Image
                    src={book.image}
                    alt={book.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-stone-700 to-[#14181C] flex items-center justify-center p-4">
                    <p className="text-stone-50 text-xs text-center font-medium line-clamp-4">
                      {book.title}
                    </p>
                  </div>
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#14181C]/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                  <div className="p-2 sm:p-3 w-full">
                    <h3 className="text-stone-50 text-xs font-semibold line-clamp-2 mb-1">
                      {book.title}
                    </h3>
                    {book.averageRating > 0 && (
                      <div className="flex items-center gap-1">
                        <span className="text-amber-400 text-xs">★</span>
                        <span className="text-stone-50 text-xs">
                          {book.averageRating.toFixed(1)}
                        </span>
                        <span className="text-stone-400 text-xs">
                          ({book.totalRatings})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .line-clamp-4 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  )
}
