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

      <div className="relative overflow-hidden bg-gradient-to-br from-stone-900 via-stone-800 to-blackrounded-lg shadow-2xl">
        {/* Cinematic Background Effects */}
        <div className="absolute inset-0">
          {/* Dark overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />

          {/* Subtle grain texture */}
          <div 
            className="absolute inset-0 opacity-20 mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='1' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Carousel Navigation Buttons */}
        <button
          onClick={() => scroll('left')}
          className="absolute hidden lg:flex left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-stone-800/80 backdrop-blur-sm hover:bg-stone-700/90 border border-stone-600/50 hover:border-amber-500/30 rounded-full items-center justify-center text-stone-300 hover:text-amber-200 shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 group hover:scale-110"
        >
          <svg className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute hidden right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 bg-stone-800/80 backdrop-blur-sm hover:bg-stone-700/90 border border-stone-600/50 hover:border-amber-500/30 rounded-full lg:flex items-center justify-center text-stone-300 hover:text-amber-200 shadow-2xl hover:shadow-amber-500/10 transition-all duration-300 group hover:scale-110"
        >
          <svg className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Scrollable Content Area */}
        <div className="relative z-20">
          <div
            ref={scrollRef}
            className="overflow-x-scroll scrollbar-hide flex gap-6 px-4 py-8 h-108"
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
          <div className="absolute left-0 top-0 w-20 h-full hidden lg:block bg-gradient-to-r from-stone-900 via-stone-900/80 to-transparent z-25 pointer-events-none" />
          <div className="absolute right-0 top-0 w-20 h-full hidden lg:block bg-gradient-to-l from-stone-900 via-stone-900/80 to-transparent z-25 pointer-events-none" />
        </div>

        {/* Bottom subtle glow line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
      </div>
    </>
  )
}

export default BookList