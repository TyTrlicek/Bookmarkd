'use client'
import React, { useRef, useState, useEffect } from 'react'
import BookCard from './BookCard'

interface BookListProps {
  trendingData: any
}

const BookList = ({ trendingData }: BookListProps): React.JSX.Element => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollRef.current
    if (container) {
      const scrollAmount = 750
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <>
      {/* Global styles */}
      <style jsx global>{`
        @keyframes fadeInUp {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0px);
          }
        }

        .fade-in-up {
          animation: fadeInUp 0.6s ease-out both;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .animated-orb-1 {
          animation: pulse 4s ease-in-out infinite;
        }

        .animated-orb-2 {
          animation: pulse 6s ease-in-out infinite reverse;
        }
      `}</style>

      <div className="relative overflow-hidden rounded-lg">
        {/* Carousel Navigation Buttons */}
        <button
          onClick={() => scroll('left')}
          aria-label="Scroll left"
          className="group absolute left-2 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-surface/90 text-ink-soft backdrop-blur-sm transition-colors duration-300 hover:border-ink-mute hover:text-ink lg:flex"
        >
          <svg className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => scroll('right')}
          aria-label="Scroll right"
          className="group absolute right-2 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-surface/90 text-ink-soft backdrop-blur-sm transition-colors duration-300 hover:border-ink-mute hover:text-ink lg:flex"
        >
          <svg className="h-5 w-5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Scrollable Content Area */}
        <div className="relative z-20">
          <div
            ref={scrollRef}
            className="overflow-x-scroll scrollbar-hide flex gap-4 sm:gap-6 px-4 py-4 sm:py-8 h-72 sm:h-108"
          >
            {(trendingData ?? []).map((data: any, index: number) => (
              <div
                key={data.openLibraryId}
                className="flex-shrink-0 fade-in-up"
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <BookCard book={data} />
              </div>
            ))}
          </div>

          {/* Gradient overlays for smooth edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-20 hidden h-full w-16 bg-gradient-to-r from-surface to-transparent lg:block" />
          <div className="pointer-events-none absolute right-0 top-0 z-20 hidden h-full w-16 bg-gradient-to-l from-surface to-transparent lg:block" />
        </div>
      </div>
    </>
  )
}

export default BookList