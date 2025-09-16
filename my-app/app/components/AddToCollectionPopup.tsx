import React, { useState } from 'react';
import { X, Star, Plus, ChevronDown, BookOpen, Clock, CheckCircle2, ListPlus } from 'lucide-react';
import axios from 'axios';
import useAuthStore from '@/store/authStore';
import { supabase } from '@/lib/supabaseClient';
import AchievementNotification from './AchievementNotification';
import { useRouter } from 'next/navigation';


interface AddToCollectionPopupProps {
  openLibraryId: string
  buttonType?: string
  userStatus?: string | null;
}

export default function AddToCollectionPopup({ openLibraryId, buttonType, userStatus }: AddToCollectionPopupProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [showAchievements, setShowAchievements] = useState(false);
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInCollection, setIsInCollection] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);

  const router = useRouter();

  console.log('userStatus', userStatus);

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

    console.log(openLibraryId); 
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      
      const accessToken = session?.access_token;

      if (!accessToken) {
        console.error('User not authenticated');
        router.push('/auth');
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

      // Handle achievements
      if (res.data.unlockedAchievements?.length > 0) {
        console.log('Newly unlocked achievements:', res.data.unlockedAchievements);
        setAchievements(res.data.unlockedAchievements);
        setShowAchievements(true);
      }
    
      console.log('Book added response:', res.data);
      
      // Reset form
      setRating(0);
      setStatus('');
      setIsOpen(false);
      setIsInCollection(true);
      setShowRatingDropdown(false);

      // Only show success alert if no achievements (achievements will show their own notification)
      if (!res.data.unlockedAchievements?.length) {
        alert('Successfully added to collection!');
      }
    } catch (error) {
      console.error('Error adding book to user list:', error);
    } finally {
      setIsSubmitting(false);
    }
    
    console.log('Adding to collection:', { rating, status });
    
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          {/* Mobile: slide up from bottom, Desktop: centered modal */}
          <div className="bg-black backdrop-blur-xl border border-white/20 w-full max-w-lg mx-4 rounded-2xl shadow-2xl transform transition-all animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-hidden flex flex-col">
            
            {/* Header - Fixed */}
            <div className="bg-gradient-to-r from-stone-800/80 to-stone-700/80 backdrop-blur-sm p-4 sm:p-6 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-1">Add to Collection</h2>
                  <p className="text-sm text-stone-300">Rate and organize your reading</p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors duration-200 touch-manipulation"
                >
                  <X size={20} className="text-stone-300" />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
              
              {/* Rating Section */}
              <div className="space-y-3 sm:space-y-4">
                <label className="block text-sm font-semibold text-white mb-2">
                  Your Rating
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowRatingDropdown(!showRatingDropdown)}
                    className="w-full p-3 sm:p-4 bg-white/5 border-2 border-white/10 rounded-xl hover:border-white/20 hover:bg-white/10 transition-all duration-200 flex items-center justify-between touch-manipulation active:bg-white/15"
                  >
                    <div className="flex items-center gap-3">
                      {rating > 0 ? (
                        <>
                          <div className="flex items-center gap-1">
                            <Star size={18} className="text-amber-400 fill-amber-400" />
                            <span className="font-bold text-base sm:text-lg text-white">{rating}</span>
                          </div>
                          <div className="text-left">
                            <div className={`font-medium text-sm sm:text-base ${selectedRating?.color}`}>
                              {selectedRating?.label}
                            </div>
                            <div className="text-xs sm:text-sm text-stone-400">
                              {selectedRating?.description}
                            </div>
                          </div>
                        </>
                      ) : (
                        <span className="text-stone-400 text-sm sm:text-base">Select a rating</span>
                      )}
                    </div>
                    <ChevronDown size={20} className={`text-stone-400 transition-transform duration-200 ${showRatingDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Rating Dropdown */}
                  {showRatingDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-black/60 backdrop-blur-xl border-2 border-white/20 rounded-xl shadow-xl z-10 max-h-48 sm:max-h-64 overflow-y-auto">
                      {ratingOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setRating(option.value);
                            setShowRatingDropdown(false);
                          }}
                          className={`w-full p-3 sm:p-4 text-left hover:bg-white/10 active:bg-white/15 transition-colors duration-150 border-b border-white/10 last:border-b-0 touch-manipulation ${
                            rating === option.value ? 'bg-white/10' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 min-w-[50px] sm:min-w-[60px]">
                              <Star size={14} className="text-amber-400 fill-amber-400" />
                              <span className="font-bold text-base sm:text-lg text-white">{option.value}</span>
                            </div>
                            <div className="flex-1">
                              <div className={`font-medium text-sm sm:text-base ${option.color}`}>
                                {option.label}
                              </div>
                              <div className="text-xs sm:text-sm text-stone-400">
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
                <label className="block text-sm font-semibold text-white mb-2">
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
                            : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 active:bg-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <Icon size={18} className={status === option.value ? 'text-current' : 'text-stone-400'} />
                          <div className="flex-1">
                            <div className={`font-semibold text-sm sm:text-base ${status === option.value ? 'text-current' : 'text-white'}`}>
                              {option.label}
                            </div>
                            <div className={`text-xs sm:text-sm ${status === option.value ? 'text-current opacity-80' : 'text-stone-400'}`}>
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
            <div className="flex-shrink-0 p-4 sm:p-6 bg-black/20 backdrop-blur-sm border-t border-white/10">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full sm:flex-1 px-6 py-3 sm:py-3 border-2 border-white/20 text-stone-300 rounded-xl hover:bg-white/10 hover:border-white/30 hover:text-white active:bg-white/15 transition-all duration-200 font-medium touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!status || isSubmitting}
                  className="w-full sm:flex-1 px-6 py-3 sm:py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover:shadow-xl active:scale-[0.98] disabled:transform-none touch-manipulation"
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

      {showAchievements && (
          <AchievementNotification
          achievements={achievements}
          onClose={() => setShowAchievements(false)}
          />
            )}
    </div>
  );
}