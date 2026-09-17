"use client"
import React, { useState, useEffect } from 'react';
import { BookOpen, ChevronRight, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface OnboardingProgressProps {
  booksInCollection: number;
  targetBooks: number;
}

const OnboardingProgress: React.FC<OnboardingProgressProps> = ({
  booksInCollection,
  targetBooks
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const router = useRouter();

  // Check if user has dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('onboarding_progress_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    sessionStorage.setItem('onboarding_progress_dismissed', 'true');
  };

  const handleClick = () => {
    router.push('/browse');
  };

  // Don't show if dismissed or target reached
  if (isDismissed || booksInCollection >= targetBooks) {
    return null;
  }

  const progress = Math.min((booksInCollection / targetBooks) * 100, 100);
  const booksNeeded = targetBooks - booksInCollection;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 transition-all duration-300 ease-out"
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Collapsed pill */}
      <button
        onClick={handleClick}
        className={`
          flex items-center gap-3
          bg-gradient-to-r from-amber-500 to-orange-600
          text-white font-medium
          rounded-full shadow-lg shadow-amber-500/30
          transition-all duration-300 ease-out
          hover:shadow-xl hover:shadow-amber-500/40
          hover:scale-105
          ${isExpanded ? 'px-5 py-3' : 'px-4 py-3'}
        `}
      >
        {/* Book icon with progress ring */}
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          {/* Progress ring */}
          <svg className="absolute inset-0 w-8 h-8 -rotate-90">
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
            />
            <circle
              cx="16"
              cy="16"
              r="14"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeDasharray={`${progress * 0.88} 88`}
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Count */}
        <span className="text-sm font-semibold whitespace-nowrap">
          {booksInCollection}/{targetBooks} books
        </span>

        {/* Expanded content */}
        <div className={`
          overflow-hidden transition-all duration-300
          ${isExpanded ? 'max-w-48 opacity-100 ml-1' : 'max-w-0 opacity-0'}
        `}>
          <span className="text-sm whitespace-nowrap">
            Add {booksNeeded} more for recommendations
          </span>
          <ChevronRight className="w-4 h-4 inline ml-1" />
        </div>

        {/* Dismiss button (only visible on hover) */}
        <button
          onClick={handleDismiss}
          className={`
            ml-1 p-1 rounded-full hover:bg-white/20 transition-all duration-200
            ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}
          `}
          title="Dismiss for this session"
        >
          <X className="w-4 h-4" />
        </button>
      </button>

      {/* Tooltip on hover (mobile-friendly alternative) */}
      {!isExpanded && (
        <div className="absolute bottom-full right-0 mb-2 pointer-events-none">
          <div className="bg-[#14181C] text-stone-200 text-xs px-3 py-2 rounded-lg shadow-lg border border-[#3D4451] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Click to browse books
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingProgress;
