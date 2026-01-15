"use client"
import React from 'react';
import { Bookmark, Eye, XCircle } from 'lucide-react';

interface BookStatusProps {
  status: 'to-read' | 'completed' | 'dropped' | null;
  onStatusChange: (status: 'to-read' | 'completed' | 'dropped' | null) => void;
  disabled?: boolean;
  isRated?: boolean;
}

const BookStatus: React.FC<BookStatusProps> = ({
  status,
  onStatusChange,
  disabled = false,
  isRated = false
}) => {
  const handleToReadClick = () => {
    if (disabled) return;
    // Toggle to-read: if already to-read, set to null, otherwise set to to-read
    onStatusChange(status === 'to-read' ? null : 'to-read');
  };

  const handleCompletedClick = () => {
    if (disabled && !isRated) return;
    // Toggle completed: if already completed, set to null, otherwise set to completed
    onStatusChange(status === 'completed' ? null : 'completed');
  };

  return (
    <div className="flex gap-2 sm:gap-3">
      {/* To Read Button */}
      <button
        onClick={handleToReadClick}
        disabled={disabled}
        className={`
          flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all
          ${
            status === 'to-read'
              ? 'bg-blue-500/20 text-blue-400 border-2 border-blue-400/50 hover:bg-blue-500/30'
              : 'bg-white/5 text-stone-300 border-2 border-[#3D4451] hover:bg-white/10 hover:text-white hover:border-[#3D4451]'
          }
          ${
            disabled
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          }
        `}
      >
        <Bookmark
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
            status === 'to-read' ? 'fill-current' : ''
          }`}
        />
        <span>To Read</span>
      </button>

      {/* Completed Button */}
      <button
        onClick={handleCompletedClick}
        disabled={disabled && !isRated}
        className={`
          flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all
          ${
            status === 'completed'
              ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400/50 hover:bg-emerald-500/30'
              : 'bg-white/5 text-stone-300 border-2 border-[#3D4451] hover:bg-white/10 hover:text-white hover:border-[#3D4451]'
          }
          ${
            disabled && !isRated
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer'
          }
        `}
      >
        <Eye
          className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
            status === 'completed' ? 'fill-current' : ''
          }`}
        />
        <span>Completed</span>
      </button>
    </div>
  );
};

export default BookStatus;
