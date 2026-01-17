import React, { useState, useEffect } from 'react';
import { X, Plus, BookOpen, CheckCircle2, XCircle, Check, ListPlus } from 'lucide-react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation'
import StarRating from './StarRating';


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

  const statusOptions = [
    {
      value: 'to-read',
      label: 'To Read',
      color: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
      icon: BookOpen,
      description: 'Added to reading list'
    },
    {
      value: 'completed',
      label: 'Completed',
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
      icon: CheckCircle2,
      description: 'Finished reading'
    },
    {
      value: 'dropped',
      label: 'Dropped',
      color: 'bg-red-500/20 text-red-300 border-red-400/30',
      icon: XCircle,
      description: 'Stopped reading'
    }
  ];

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
          className="w-full font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 transform bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shadow-lg cursor-default backdrop-blur-sm"
        >         
          <Plus className="w-4 h-4" />         
          In Collection       
        </button>
      ) : (
        <button          
          className="w-full font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 transform hover:scale-[1.02] bg-[#2C3440]/80 hover:bg-stone-500/20 text-stone-300 border border-[#3D4451] shadow-md hover:shadow-lg backdrop-blur-sm"         
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
              className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/80 text-white transition mr-12 cursor-default backdrop-blur-sm shadow-md border border-emerald-400/30"           
              title="In List"         
            >           
              <Check className="w-5 h-5" />         
            </button>
          ) : (
            <button           
              onClick={() => setIsOpen(true)}           
              className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white transition mr-12 backdrop-blur-sm shadow-md border border-amber-400/30"           
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
        className="p-1.5 rounded-full bg-emerald-500/80 text-white shadow-md cursor-default backdrop-blur-sm border border-emerald-400/30"
        title="In Collection"
      >
        <Check className="w-3 h-3" />
      </button>
    ) : (
      <button
        onClick={() => {setIsOpen(true)}}
        className="p-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all text-white shadow-md hover:shadow-lg backdrop-blur-sm"
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
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)'
        }}
        onClick={handleBackdropClick}
      >
        <div 
          className="bg-gradient-to-t from-[#14181C] via-[#14181C] to-[#14181C] rounded-2xl shadow-2xl w-full max-w-lg mx-4 transform transition-all animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto border border-[#3D4451] backdrop-blur-md"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#14181C]/40 to-stone-500/10 p-6 rounded-t-2xl border-b border-[#3D4451] top-0 z-10 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-stone-50 mb-1 flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500/20 to-amber-400/20 border border-amber-400/30">
                    <Plus className="w-5 h-5 text-amber-400" />
                  </div>
                  Add to Collection
                </h2>
                <p className="text-sm text-stone-300">Rate and organize your reading</p>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200 flex-shrink-0 backdrop-blur-sm"
              >
                <X size={20} className="text-stone-400" />
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="sm:p-6 sm:space-y-8 p-3 space-y-4">
            {/* Rating Section */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-stone-200 mb-2 block">
                Your Rating
              </label>
              <div className="flex items-center justify-between p-4 bg-[#2C3440]/80 border border-[#3D4451] rounded-xl backdrop-blur-sm">
                <StarRating
                  rating={rating}
                  onRatingChange={setRating}
                  size="large"
                  showValue={true}
                />
                {rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setRating(0)}
                    className="text-xs text-stone-400 hover:text-stone-200 underline transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Status Section */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-stone-200 mb-2 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
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
                      className={`w-full p-4 rounded-xl border transition-all duration-200 text-left transform hover:scale-[1.02] backdrop-blur-sm ${
                        status === option.value
                          ? `${option.color} border-current shadow-lg`
                          : 'border-[#3D4451] hover:border-white/30 bg-[#2C3440]/60 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${status === option.value ? 'bg-current/20' : 'bg-white/10'}`}>
                          <Icon size={18} className={status === option.value ? 'text-current' : 'text-stone-400'} />
                        </div>
                        <div className="flex-1">
                          <div className={`font-semibold ${status === option.value ? 'text-current' : 'text-stone-200'}`}>
                            {option.label}
                          </div>
                          <div className={`text-sm ${status === option.value ? 'text-current opacity-80' : 'text-stone-400'}`}>
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
            <div className="flex gap-4 pt-0 sm:pt-6">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 border border-[#3D4451] text-stone-300 rounded-xl hover:bg-white/10 hover:border-white/30 transition-all duration-200 font-medium backdrop-blur-sm"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!status || isSubmitting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none border border-amber-400/30"
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