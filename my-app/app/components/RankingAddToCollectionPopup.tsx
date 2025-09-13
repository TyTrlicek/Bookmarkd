import React, { useState, useEffect } from 'react';
import { X, Star, Plus, ChevronDown, BookOpen, Clock, CheckCircle2, ListPlus, CheckCheck, Check } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation'


interface RankingAddToCollectionPopupProps {
  openLibraryId: string;
  buttonType?: string;
  userStatus?: string | null;
  onBookAdded?: (openLibraryId: string, rating: number, status: string) => void;

}

export default function RankingAddToCollectionPopup({ 
  openLibraryId, 
  buttonType, 
  userStatus,
  onBookAdded,
}: RankingAddToCollectionPopupProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  
  const [mounted, setMounted] = useState(false);

  const router = useRouter();

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Lock body scroll when popup is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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
        router.push('auth');
        setIsSubmitting(false);
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
    
      console.log('Book added response:', res.data);
      
      // Reset form and close
      setRating(0);
      setStatus('');
      setIsOpen(false);
      setShowRatingDropdown(false);

      onBookAdded?.(openLibraryId, rating, status);

      // Show success message
      // alert('Successfully added to collection!');
      
      
      
    } catch (error) {
      console.error('Error adding book to user list:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setRating(0);
    setStatus('');
    setShowRatingDropdown(false);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Trigger Button Component
  const TriggerButton = () => {
    if (buttonType === "book-page") {
      return userStatus !== null ? (
        <button          
          className="w-full font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 transform bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 border-2 border-emerald-300 shadow-lg cursor-default"
        >         
          <Plus className="w-4 h-4" />         
          In Collection       
        </button>
      ) : (
        <button          
          className="w-full font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.02] bg-gradient-to-r from-stone-100 to-stone-200 hover:from-stone-200 hover:to-stone-300 text-stone-800 border-2 border-stone-300 shadow-md hover:shadow-lg"         
          onClick={() => setIsOpen(true)}       
        >         
          <Plus className="w-4 h-4" />         
          Add to Collection       
        </button>
      );
    }

    if (buttonType === "ranking-laptop") {
      return (
        <div className="flex items-center justify-center col-span-2">         
          {userStatus !== null ? (
            <button           
              className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-600 text-white transition mr-12 cursor-default"           
              title="In List"         
            >           
              <Check className="w-5 h-5" />         
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
      );
    }

    // Default mobile ranking button
    return userStatus !== null ? (
      <button
        className="p-1.5 rounded-full bg-emerald-500 text-white shadow-md cursor-default"
        title="In Collection"
      >
        <Plus className="w-3 h-3" />
      </button>
    ) : (
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all text-white shadow-md hover:shadow-lg"
        title="Add to List"
      >
        <Plus className="w-3 h-3" />
      </button>
    );
  };

  // Modal Component
  const Modal = () => {
    if (!mounted || !isOpen) return null;

    return createPortal(
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style={{ 
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)'
        }}
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 transform transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-stone-50 to-stone-100 p-6 rounded-t-2xl border-b border-stone-200 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-stone-900 mb-1">Add to Collection</h2>
                <p className="text-sm text-stone-600">Rate and organize your reading</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-stone-200 rounded-full transition-colors duration-200 flex-shrink-0"
              >
                <X size={20} className="text-stone-500" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="p-6 space-y-8">
            {/* Rating Section */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Your Rating
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRatingDropdown(!showRatingDropdown)}
                  className="w-full p-4 bg-stone-50 border-2 border-stone-200 rounded-xl hover:border-stone-300 transition-all duration-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {rating > 0 ? (
                      <>
                        <div className="flex items-center gap-1">
                          <Star size={20} className="text-yellow-400 fill-yellow-400" />
                          <span className="font-bold text-lg">{rating}</span>
                        </div>
                        <div className="text-left">
                          <div className={`font-medium ${selectedRating?.color}`}>
                            {selectedRating?.label}
                          </div>
                          <div className="text-sm text-stone-600">
                            {selectedRating?.description}
                          </div>
                        </div>
                      </>
                    ) : (
                      <span className="text-stone-500">Select a rating</span>
                    )}
                  </div>
                  <ChevronDown size={20} className={`text-stone-400 transition-transform duration-200 ${showRatingDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Rating Dropdown */}
                {showRatingDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-stone-200 rounded-xl shadow-xl z-20 max-h-64 overflow-y-auto">
                    {ratingOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setRating(option.value);
                          setShowRatingDropdown(false);
                        }}
                        className={`w-full p-4 text-left hover:bg-stone-50 transition-colors duration-150 border-b border-stone-100 last:border-b-0 ${
                          rating === option.value ? 'bg-stone-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2 min-w-[60px]">
                            <Star size={16} className="text-yellow-400 fill-yellow-400" />
                            <span className="font-bold text-lg">{option.value}</span>
                          </div>
                          <div className="flex-1">
                            <div className={`font-medium ${option.color}`}>
                              {option.label}
                            </div>
                            <div className="text-sm text-stone-600">
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
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-stone-700 mb-2">
                Reading Status
              </label>
              <div className="space-y-3">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left transform hover:scale-[1.02] ${
                        status === option.value
                          ? `${option.color} border-current shadow-lg`
                          : 'border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <Icon size={20} className={status === option.value ? 'text-current' : 'text-stone-500'} />
                        <div className="flex-1">
                          <div className={`font-semibold ${status === option.value ? 'text-current' : 'text-stone-900'}`}>
                            {option.label}
                          </div>
                          <div className={`text-sm ${status === option.value ? 'text-current opacity-80' : 'text-stone-600'}`}>
                            {option.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 border-2 border-stone-300 text-stone-700 rounded-xl hover:bg-stone-50 hover:border-stone-400 transition-all duration-200 font-medium"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!status || isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-stone-800 to-stone-900 text-white rounded-xl hover:from-stone-700 hover:to-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
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
      </div>,
      document.body
    );
  };

  return (
    <>
      <TriggerButton />
      <Modal />
    </>
  );
}