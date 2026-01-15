"use client"
import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;           // 0-5 in 0.5 increments
  onRatingChange: (rating: number) => void;
  readonly?: boolean;
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  onRatingChange,
  readonly = false,
  size = 'medium',
  showValue = false
}) => {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  };

  const containerSizeClasses = {
    small: 'gap-0.5',
    medium: 'gap-1',
    large: 'gap-1.5'
  };

  const starSize = sizeClasses[size];
  const containerGap = containerSizeClasses[size];

  const displayRating = hoveredRating ?? rating;

  const handleStarClick = (starIndex: number, isHalf: boolean) => {
    if (readonly) return;
    const newRating = starIndex + (isHalf ? 0.5 : 1);
    onRatingChange(newRating);
  };

  const handleStarHover = (starIndex: number, isHalf: boolean) => {
    if (readonly) return;
    const newRating = starIndex + (isHalf ? 0.5 : 1);
    setHoveredRating(newRating);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoveredRating(null);
  };

  const renderStar = (starIndex: number) => {
    const fillPercentage = Math.max(0, Math.min(1, displayRating - starIndex));
    const isFull = fillPercentage === 1;
    const isHalf = fillPercentage === 0.5;
    const isEmpty = fillPercentage === 0;

    return (
      <div
        key={starIndex}
        className={`relative ${starSize} ${readonly ? '' : 'cursor-pointer'}`}
        onMouseLeave={handleMouseLeave}
      >
        {/* Left half clickable area */}
        <div
          className="absolute left-0 top-0 w-1/2 h-full z-10"
          onClick={() => handleStarClick(starIndex, true)}
          onMouseEnter={() => handleStarHover(starIndex, true)}
        />

        {/* Right half clickable area */}
        <div
          className="absolute right-0 top-0 w-1/2 h-full z-10"
          onClick={() => handleStarClick(starIndex, false)}
          onMouseEnter={() => handleStarHover(starIndex, false)}
        />

        {/* Empty star (background) */}
        <Star
          className={`absolute inset-0 ${starSize} ${
            hoveredRating !== null && !readonly
              ? 'text-amber-400/30'
              : 'text-stone-600'
          } transition-colors`}
          strokeWidth={1.5}
        />

        {/* Filled star */}
        {fillPercentage > 0 && (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              clipPath: isHalf
                ? 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
            }}
          >
            <Star
              className={`${starSize} ${
                hoveredRating !== null && !readonly
                  ? 'text-amber-300'
                  : 'text-amber-400'
              } fill-current transition-colors`}
              strokeWidth={1.5}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`flex ${containerGap}`}>
        {[0, 1, 2, 3, 4].map((starIndex) => renderStar(starIndex))}
      </div>

      {showValue && (
        <span className="text-sm font-medium text-stone-300">
          {displayRating > 0 ? displayRating.toFixed(1) : '—'}
        </span>
      )}
    </div>
  );
};

export default StarRating;
