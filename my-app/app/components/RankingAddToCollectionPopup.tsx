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
      color: 'bg-rate-good/15 text-rate-good border-rate-good/40',
      icon: BookOpen,
      description: 'Added to reading list'
    },
    {
      value: 'completed',
      label: 'Completed',
      color: 'bg-rate-high/15 text-rate-high border-rate-high/40',
      icon: CheckCircle2,
      description: 'Finished reading'
    },
    {
      value: 'dropped',
      label: 'Dropped',
      color: 'bg-rate-bad/15 text-rate-bad border-rate-bad/40',
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
          className="flex w-full items-center justify-center gap-2 rounded-full border border-line-strong bg-overlay px-4 py-3 text-sm font-medium text-ink"
        >
          <CheckCircle2 className="h-4 w-4 text-rate-high" />
          In your collection
        </button>
      ) : (
        <button
          className="flex w-full items-center justify-center gap-2 rounded-full bg-ember px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-ember-strong"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add to collection
        </button>
      );
    }

    if (buttonType === "ranking-laptop") {
      return (
        <div className="col-span-2 flex items-center justify-center">
          {userStatus !== null ? (
            <button
              className="flex h-9 w-9 items-center justify-center rounded-full border border-rate-high/40 bg-rate-high/15 text-rate-high"
              title="In your collection"
            >
              <Check className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => setIsOpen(true)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-ember text-white transition-colors hover:bg-ember-strong"
              title="Add to collection"
            >
              <ListPlus className="h-4 w-4" />
            </button>
          )}
        </div>
      );
    }

    // Default mobile ranking button
    return userStatus !== null ? (
      <button
        className="rounded-full border border-rate-high/40 bg-rate-high/15 p-1.5 text-rate-high"
        title="In your collection"
      >
        <Check className="h-3 w-3" />
      </button>
    ) : (
      <button
        onClick={() => { setIsOpen(true) }}
        className="rounded-full bg-ember p-1.5 text-white transition-colors hover:bg-ember-strong"
        title="Add to collection"
      >
        <Plus className="h-3 w-3" />
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
          className="grain relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-canvas-raised shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] duration-200 animate-in zoom-in-95"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-start justify-between border-b border-line bg-canvas-raised/95 p-6 backdrop-blur-md">
            <div>
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink">
                Add to collection
              </h2>
              <p className="mt-1 text-sm text-ink-mute">Rate it and set a reading status.</p>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-ink-faint transition-colors hover:bg-overlay hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="space-y-6 p-6">
            {/* Rating Section */}
            <div>
              <label className="mb-2 block font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute">
                Your rating
              </label>
              <div className="flex items-center justify-between rounded-xl border border-line bg-overlay p-4">
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
                    className="text-xs text-ink-mute underline transition-colors hover:text-ink"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Status Section */}
            <div>
              <label className="mb-2 flex items-center gap-2 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute">
                <BookOpen className="h-3.5 w-3.5" />
                Reading status
              </label>
              <div className="space-y-2">
                {statusOptions.map((option) => {
                  const Icon = option.icon;
                  const active = status === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setStatus(option.value)}
                      className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
                        active
                          ? `${option.color} border-current`
                          : 'border-line bg-overlay hover:bg-overlay-hover'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${active ? 'bg-current/15' : 'bg-overlay'}`}>
                          <Icon size={16} className={active ? 'text-current' : 'text-ink-mute'} />
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-semibold ${active ? 'text-current' : 'text-ink'}`}>
                            {option.label}
                          </div>
                          <div className={`text-xs ${active ? 'text-current opacity-80' : 'text-ink-mute'}`}>
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
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-full border border-line px-6 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-overlay"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!status || isSubmitting}
                className="flex-1 rounded-full bg-ember px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ember-strong disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Adding…
                  </div>
                ) : (
                  'Add to collection'
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