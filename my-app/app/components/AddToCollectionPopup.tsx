'use client'

import React, { useState } from 'react';
import { X, Star, Plus, ChevronDown, BookOpen, Clock, CheckCircle2, ListPlus } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '@/store/authStore';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import LoginModal from './LoginModal';


interface AddToCollectionPopupProps {
  openLibraryId: string
  buttonType?: string
  userStatus?: string | null;
  bookData?: any; // Add book data prop
}

export default function AddToCollectionPopup({ openLibraryId, buttonType, userStatus, bookData }: AddToCollectionPopupProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInCollection, setIsInCollection] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [bookTitle, setBookTitle] = useState<string>('');

  const router = useRouter();

  const ratingOptions = [
    { value: 10, label: 'Masterpiece', description: 'A perfect work of art', color: 'text-purple-600' },
    { value: 9, label: 'Great', description: 'Exceptional quality', color: 'text-indigo-600' },
    { value: 8, label: 'Very Good', description: 'Highly impressive', color: 'text-blue-600' },
    { value: 7, label: 'Good', description: 'Solid and enjoyable', color: 'text-green-600' },
    { value: 6, label: 'Fine', description: 'Worth reading', color: 'text-yellow-600' },
    { value: 5, label: 'Average', description: 'Nothing special', color: 'text-orange-600' },
    { value: 4, label: 'Bad', description: 'Below expectations', color: 'text-red-500' },
    { value: 3, label: 'Very Bad', description: 'Poor quality', color: 'text-red-600' },
    { value: 2, label: 'Horrible', description: 'Terrible experience', color: 'text-red-700' },
    { value: 1, label: 'Appalling', description: 'Absolute worst', color: 'text-red-800' }
  ];

  const statusOptions = [
    { 
      value: 'to-read', 
      label: 'Plan to Read', 
      color: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 border-blue-200',
      icon: BookOpen,
      description: 'Added to reading list'
    },
    { 
      value: 'reading', 
      label: 'Currently Reading', 
      color: 'bg-gradient-to-r from-amber-50 to-amber-100 text-amber-800 border-amber-200',
      icon: Clock,
      description: 'Currently in progress'
    },
    { 
      value: 'completed', 
      label: 'Completed', 
      color: 'bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-800 border-emerald-200',
      icon: CheckCircle2,
      description: 'Finished reading'
    }
  ];

  const selectedRating = ratingOptions.find(option => option.value === rating);

  const handleSubmit = async () => {
    if (!status) return;

    setIsSubmitting(true);

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.error('User not authenticated');

        // Store book addition data in localStorage
        const pendingBookAddition = {
          openLibraryId,
          rating,
          status,
          bookData: bookData || { title: 'Book', author: 'Unknown' },
          timestamp: Date.now()
        };
        localStorage.setItem('pendingBookAddition', JSON.stringify(pendingBookAddition));

        setShowLoginModal(true);
        setIsSubmitting(false);
        setIsOpen(false);

        return;
      }
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/user/booklist`,
        { openLibraryId, rating, status },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Reset form
      setRating(0);
      setStatus('');
      setIsOpen(false);
      setIsInCollection(true);
      setShowRatingDropdown(false);

      alert('Successfully added to collection!');
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }

    // Reset form
    setRating(0);
    setStatus('');
    setIsSubmitting(false);
    setIsOpen(false);
    setIsInCollection(true);
    setShowRatingDropdown(false);

  };

  const handleClose = () => {
    setIsOpen(false);
    setRating(0);
    setStatus('');
    setShowRatingDropdown(false);
  };

  return (
    <div>
      {/* Trigger Button */}
      {buttonType === "book-page" && (
  (userStatus !== null || isInCollection) ? (
    <button
      className="flex w-full cursor-default items-center justify-center gap-2 rounded-full border border-line-strong bg-overlay px-6 py-3 text-sm font-medium text-ink"
    >
      <CheckCircle2 className="h-4 w-4 text-rate-high" />
      In your collection
    </button>
  ) : (
    <button
      className="group flex w-full items-center justify-center gap-2 rounded-full bg-ember px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-ember-strong hover:shadow-[0_12px_40px_-10px_rgba(217,119,6,0.55)]"
      onClick={() => setIsOpen(true)}
    >
      <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
      Add to collection
    </button>
  )
)}

{buttonType === "ranking-laptop" && (
  <div className="flex items-center justify-center col-span-2">         
    {userStatus !== null ? (
      <button           
        className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600 text-white transition mr-12 cursor-default"           
        title="In List"         
      >           
        <ListPlus className="w-5 h-5" />         
      </button>
    ) : (
      <button           
        onClick={() => setIsOpen(true)}           
        className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-600 hover:bg-amber-700 text-white transition mr-12"           
        title="Add to List"         
      >           
        <ListPlus className="w-5 h-5" />         
      </button>
    )}
  </div>
)}

      {/* Popup Overlay */}
       {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Mobile: slide up from bottom, Desktop: centered modal */}
          <div className="bg-canvas backdrop-blur-xl border border-line w-full max-w-lg mx-4 rounded-2xl shadow-2xl transform transition-all animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Header - Fixed */}
            <div className="bg-gradient-to-r from-surface/80 to-surface/80 backdrop-blur-sm p-4 sm:p-6 border-b border-line flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-ink mb-1">Add to Collection</h2>
                  <p className="text-sm text-ink-soft">Rate and organize your reading</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-overlay-hover rounded-full transition-colors duration-200 touch-manipulation"
                >
                  <X size={20} className="text-ink-soft" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
              
              {/* Rating Section */}
              <div className="space-y-3 sm:space-y-4">
                <label className="block text-sm font-semibold text-ink mb-2">
                  Your Rating
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowRatingDropdown(!showRatingDropdown)}
                    className="w-full p-3 sm:p-4 bg-overlay border border-line rounded-xl hover:border-line hover:bg-overlay-hover transition-all duration-200 flex items-center justify-between touch-manipulation active:bg-overlay-hover"
                  >
                    <div className="flex items-center gap-3">
                      {rating > 0 ? (
                        <>
                          <div className="flex items-center gap-1">
                            <Star size={18} className="text-gold fill-gold" />
                            <span className="font-bold text-base sm:text-lg text-ink">{rating}</span>
                          </div>
                          <div className="text-left">
                            <div className={`font-medium text-sm sm:text-base ${selectedRating?.color}`}>
                              {selectedRating?.label}
                            </div>
                            <div className="text-xs sm:text-sm text-ink-mute">
                              {selectedRating?.description}
                            </div>
                          </div>
                        </>
                      ) : (
                        <span className="text-ink-mute text-sm sm:text-base">Select a rating</span>
                      )}
                    </div>
                    <ChevronDown size={20} className={`text-ink-mute transition-transform duration-200 ${showRatingDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Rating Dropdown */}
                  {showRatingDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-canvas/90 backdrop-blur-xl border border-line rounded-xl shadow-xl z-10 max-h-48 sm:max-h-64 overflow-y-auto">
                      {ratingOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setRating(option.value);
                            setShowRatingDropdown(false);
                          }}
                          className={`w-full p-3 sm:p-4 text-left hover:bg-overlay-hover active:bg-overlay-hover transition-colors duration-150 border-b border-line last:border-b-0 touch-manipulation ${
                            rating === option.value ? 'bg-white/10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 min-w-[50px] sm:min-w-[60px]">
                              <Star size={14} className="text-gold fill-gold" />
                              <span className="font-bold text-base sm:text-lg text-ink">{option.value}</span>
                            </div>
                            <div className="flex-1">
                              <div className={`font-medium text-sm sm:text-base ${option.color}`}>
                                {option.label}
                              </div>
                              <div className="text-xs sm:text-sm text-ink-mute">
                                {option.description}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-3 sm:space-y-4">
                <label className="block text-sm font-semibold text-ink mb-2">
                  Reading Status
                </label>
                <div className="space-y-2 sm:space-y-3">
                  {statusOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setStatus(option.value)}
                        className={`w-full p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left touch-manipulation active:scale-[0.98] ${
                          status === option.value
                            ? `${option.color} shadow-lg`
                            : 'border-line hover:border-line bg-overlay hover:bg-overlay-hover active:bg-overlay-hover'
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <Icon size={18} className={status === option.value ? 'text-current' : 'text-ink-mute'} />
                          <div className="flex-1">
                            <div className={`font-semibold text-sm sm:text-base ${status === option.value ? 'text-current' : 'text-ink'}`}>
                              {option.label}
                            </div>
                            <div className={`text-xs sm:text-sm ${status === option.value ? 'text-current opacity-80' : 'text-ink-mute'}`}>
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Fixed Bottom Actions */}
            <div className="flex-shrink-0 p-4 sm:p-6 bg-surface/60 backdrop-blur-sm border-t border-line">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:flex-1 px-6 py-3 sm:py-3 border border-line text-ink-soft rounded-xl hover:bg-overlay-hover hover:border-white/30 hover:text-white active:bg-overlay-hover transition-all duration-200 font-medium touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!status || isSubmitting}
                  className="w-full sm:flex-1 px-6 py-3 sm:py-3 bg-ember text-white rounded-full hover:bg-ember-strong disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl active:scale-[0.98] disabled:transform-none touch-manipulation"
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </div>
                  ) : (
                    'Add to Collection'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setShowLoginModal(false);
          setIsOpen(true); // Reopen the add to collection popup after login
        }}
        bookTitle={bookTitle}
      />
    </div>
  );
}