"use client"
import { supabase } from '@/lib/supabaseClient';
import axios from 'axios';
import { Heart, MessageCircle, Plus, ChevronDown, ChevronUp, Send, MoreHorizontal, Edit3, Trash2, Check, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ReplyData, ReviewData, User } from '../types/types';
import { formatDate } from '@/utils/util';

interface BookCardProps {
  totalRatings: number | null;
  setShowWriteReview: React.Dispatch<React.SetStateAction<boolean>>
  showWriteReview: boolean;
  userRecommendation: string
  setUserRecommendation: React.Dispatch<React.SetStateAction<string>>
  reviewContent: string;
  containsSpoilers: boolean;
  setContainsSpoilers: React.Dispatch<React.SetStateAction<boolean>>
  reviewFilter: string
  setReviewFilter: React.Dispatch<React.SetStateAction<string>>;
  id: string;
  setReviewContent: React.Dispatch<React.SetStateAction<string>>;
}

const Review = ({ totalRatings, setShowWriteReview, showWriteReview, setUserRecommendation, userRecommendation, containsSpoilers, reviewContent, setContainsSpoilers, reviewFilter, setReviewFilter, id, setReviewContent }: BookCardProps) => {

    const router = useRouter();
    const [reviews, setReviews] = useState<ReviewData[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Existing states
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [showReplyForm, setShowReplyForm] = useState<Set<string>>(new Set());
    const [replyTexts, setReplyTexts] = useState<{[key: string]: string}>({});
    const [user, setUser] = useState<User | null>(null);
    const [votedReviews, setVotedReviews] = useState<Set<string>>(new Set());
    const [votedReplies, setVotedReplies] = useState<Set<string>>(new Set());
    const [votingInProgress, setVotingInProgress] = useState<Set<string>>(new Set());

    // New states for edit/delete functionality
    const [editingReview, setEditingReview] = useState<string | null>(null);
    const [editingReply, setEditingReply] = useState<string | null>(null);
    const [editReviewContent, setEditReviewContent] = useState('');
    const [editReviewRecommendation, setEditReviewRecommendation] = useState('');
    const [editReplyContent, setEditReplyContent] = useState('');
    const [showDropdowns, setShowDropdowns] = useState<Set<string>>(new Set());
    const [deletingItems, setDeletingItems] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchReview = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${id}`, {params: { id: id }});
                setReviews(response.data || null);

                // Fetch vote status for reviews and replies
                const { data: { session } } = await supabase.auth.getSession();
                const accessToken = session?.access_token;
                
                if (accessToken && response.data.length > 0) {
                    const reviewVotePromises = response.data.map((review: ReviewData) => 
                        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${review.id}/vote-status`, {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        }).catch(() => null)
                    );

                    const allReplies = response.data.flatMap((review: ReviewData) => 
                        review.replies || []
                    );

                    const replyVotePromises = allReplies.map((reply: ReplyData) => 
                        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/replies/${reply.id}/vote-status`, {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        }).catch(() => null)
                    );

                    const [reviewVoteResults, replyVoteResults] = await Promise.all([
                        Promise.all(reviewVotePromises),
                        Promise.all(replyVotePromises)
                    ]);

                    const votedReviewsSet = new Set<string>();
                    reviewVoteResults.forEach((result, index) => {
                        if (result?.data?.hasVoted) {
                            votedReviewsSet.add(response.data[index].id);
                        }
                    });
                    setVotedReviews(votedReviewsSet);

                    const votedRepliesSet = new Set<string>();
                    replyVoteResults.forEach((result, index) => {
                        if (result?.data?.hasVoted) {
                            votedRepliesSet.add(allReplies[index].id);
                        }
                    });
                    setVotedReplies(votedRepliesSet);
                }
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoading(false);
            }
        }
        setReviewFilter('all')
        fetchReview();
    }, [id]);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;
        
            if (!accessToken) {
                setUser(null);
                return;
            }
        
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                });
        
                setUser(response.data);
            } catch (error) {
                console.error('Failed to fetch user:', error);
                setUser(null);
            }
        };

        fetchUser();
    }, [router]);

    // Filter reviews based on selected filter
    const filteredReviews = reviews.filter(review => {
        if (reviewFilter === 'all') return true;
        return review.recommendation === reviewFilter;
    });

    // Function to get recommendation badge styling
    const getRecommendationBadge = (recommendation: string) => {
        switch (recommendation) {
            case 'recommended':
                return {
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-700',
                    dotColor: 'bg-green-500',
                    label: 'Recommended'
                };
            case 'mixed':
                return {
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-700',
                    dotColor: 'bg-yellow-500',
                    label: 'Mixed Feelings'
                };
            case 'not-recommended':
                return {
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-700',
                    dotColor: 'bg-red-500',
                    label: 'Not Recommended'
                };
            default:
                return {
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-700',
                    dotColor: 'bg-gray-500',
                    label: 'Unknown'
                };
        }
    };

    // Toggle dropdown menus
    const toggleDropdown = (itemId: string) => {
        const newDropdowns = new Set(showDropdowns);
        if (newDropdowns.has(itemId)) {
            newDropdowns.delete(itemId);
        } else {
            newDropdowns.add(itemId);
        }
        setShowDropdowns(newDropdowns);
    };

    // Start editing review
    const startEditingReview = (review: ReviewData) => {
        setEditingReview(review.id);
        setEditReviewContent(review.content);
        setEditReviewRecommendation(review.recommendation);
        setShowDropdowns(new Set()); // Close dropdown
    };

    // Start editing reply
    const startEditingReply = (reply: ReplyData) => {
        setEditingReply(reply.id);
        setEditReplyContent(reply.content);
        setShowDropdowns(new Set()); // Close dropdown
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditingReview(null);
        setEditingReply(null);
        setEditReviewContent('');
        setEditReviewRecommendation('');
        setEditReplyContent('');
    };

    // Save review edit
    const saveReviewEdit = async (reviewId: string) => {
        if (!editReviewContent.trim() || !editReviewRecommendation) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            if (!accessToken) {
                router.push('/auth');
                return;
            }

            const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}`, {
                content: editReviewContent,
                recommendation: editReviewRecommendation,
                containsSpoilers: false
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                // Update the review in state
                setReviews(prev => prev.map(review => 
                    review.id === reviewId 
                        ? { ...review, content: editReviewContent, recommendation: editReviewRecommendation, updatedAt: new Date().toISOString() }
                        : review
                ));
                cancelEditing();
            }
        } catch (error) {
            console.error('Failed to update review:', error);
            alert('Failed to update review. Please try again.');
        }
    };

    // Save reply edit
    const saveReplyEdit = async (replyId: string) => {
        if (!editReplyContent.trim()) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            if (!accessToken) {
                router.push('/auth');
                return;
            }

            const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/replies/${replyId}`, {
                content: editReplyContent
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 200) {
                // Update the reply in state
                setReviews(prev => prev.map(review => ({
                    ...review,
                    replies: review.replies?.map(reply => 
                        reply.id === replyId 
                            ? { ...reply, content: editReplyContent, updatedAt: new Date().toISOString() }
                            : reply
                    ) || []
                })));
                cancelEditing();
            }
        } catch (error) {
            console.error('Failed to update reply:', error);
            alert('Failed to update reply. Please try again.');
        }
    };

    // Delete review
    const deleteReview = async (reviewId: string) => {
        if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;

        try {
            setDeletingItems(prev => new Set(prev).add(reviewId));
            
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            if (!accessToken) {
                router.push('/auth');
                return;
            }

            const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.status === 200) {
                // Remove the review from state
                setReviews(prev => prev.filter(review => review.id !== reviewId));
                setShowDropdowns(new Set());
            }
        } catch (error) {
            console.error('Failed to delete review:', error);
            alert('Failed to delete review. Please try again.');
        } finally {
            setDeletingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(reviewId);
                return newSet;
            });
        }
    };

    // Delete reply
    const deleteReply = async (replyId: string) => {
        if (!confirm('Are you sure you want to delete this reply? This action cannot be undone.')) return;

        try {
            setDeletingItems(prev => new Set(prev).add(replyId));
            
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            if (!accessToken) {
                router.push('/auth');
                return;
            }

            const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/replies/${replyId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (response.status === 200) {
                // Remove the reply from state
                setReviews(prev => prev.map(review => ({
                    ...review,
                    replies: review.replies?.filter(reply => reply.id !== replyId) || []
                })));
                setShowDropdowns(new Set());
            }
        } catch (error) {
            console.error('Failed to delete reply:', error);
            alert('Failed to delete reply. Please try again.');
        } finally {
            setDeletingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(replyId);
                return newSet;
            });
        }
    };

    // Check if user owns the review/reply
    const userOwnsReview = (review: ReviewData) => user && user.id === review.userId;
    const userOwnsReply = (reply: ReplyData) => user && user.id === reply.userId;

    // Existing functions (unchanged)
    const toggleReplies = (reviewId: string) => {
        const newExpanded = new Set(expandedReplies);
        if (newExpanded.has(reviewId)) {
            newExpanded.delete(reviewId);
        } else {
            newExpanded.add(reviewId);
        }
        setExpandedReplies(newExpanded);
    };

    const toggleReplyForm = (reviewId: string) => {
        const newShowReplyForm = new Set(showReplyForm);
        if (newShowReplyForm.has(reviewId)) {
            newShowReplyForm.delete(reviewId);
        } else {
            newShowReplyForm.add(reviewId);
        }
        setShowReplyForm(newShowReplyForm);
    };

    const handleReplyTextChange = (reviewId: string, text: string) => {
        setReplyTexts(prev => ({
            ...prev,
            [reviewId]: text
        }));
    };

    const handleReplySubmit = async (reviewId: string) => {
        const replyText = replyTexts[reviewId];
        if (!replyText?.trim()) return;
      
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;
      
            if (!accessToken) {
                router.push('/auth');
                return;
            }
      
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/create-reply`, {
                reviewId: reviewId,
                parentId: null, 
                content: replyText,
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
      
            if (response.status === 201) {
                setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
                setShowReplyForm(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(reviewId);
                    return newSet;
                });
      
                const updatedReviews = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${id}`, {
                    params: { id: id }
                });
                if (updatedReviews.data) {
                    setReviews(updatedReviews.data);
                }
            }
        } catch (error) {
            console.error('Failed to submit reply:', error);
            alert('Failed to submit reply. Please try again.');
        }
    };

    const postReview = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;
        
            if (!accessToken) {
                router.push('auth');
                return;
            }

            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/create-review`, {
                bookId: id,            
                content: reviewContent,
                recommendation: userRecommendation,
                containsSpoilers: containsSpoilers,
                isPrivate: false,
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
        
            if (response.status === 201) {
                console.log('Review posted successfully!');
                setShowWriteReview(false);
                setReviewContent('');
                setUserRecommendation('');
                setContainsSpoilers(false);
                
                const updatedReviews = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${id}`, {params: { id: id }});
                if (updatedReviews.data) {
                    setReviews(updatedReviews.data);
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                const axiosError = error as any;
                
                if (axiosError.response?.status === 400 && 
                    axiosError.response?.data?.error === 'You have already submitted a review for this book.') {
                    alert('You have already submitted a review for this book. You can only write one review per book.');
                    setShowWriteReview(false);
                } else {
                    const errorMessage = axiosError.response?.data?.error || error.message || 'Failed to post review';
                    console.error('Failed to post review:', errorMessage);
                    alert(`Failed to post review: ${errorMessage}`);
                }
            } else {
                console.error('Failed to post review:', error);
                alert('Failed to post review. Please try again.');
            }
        }
    };

    const handleHelpfulVote = async (itemId: string, itemType: 'review' | 'reply') => {
        if (votingInProgress.has(itemId)) return;

        try {
            setVotingInProgress(prev => new Set(prev).add(itemId));
            
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;
            
            if (!accessToken) {
                router.push('/auth');
                return;
            }

            const endpoint = itemType === 'review' 
                ? `${process.env.NEXT_PUBLIC_API_URL}/reviews/${itemId}/vote`
                : `${process.env.NEXT_PUBLIC_API_URL}/replies/${itemId}/vote`;

            const response = await axios.post(endpoint, {}, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.success) {
                if (itemType === 'review') {
                    setVotedReviews(prev => {
                        const newSet = new Set(prev);
                        if (response.data.isHelpful) {
                            newSet.add(itemId);
                        } else {
                            newSet.delete(itemId);
                        }
                        return newSet;
                    });

                    setReviews(prev => prev.map(review => 
                        review.id === itemId 
                            ? { ...review, helpfulCount: response.data.helpfulCount }
                            : review
                    ));
                } else {
                    setVotedReplies(prev => {
                        const newSet = new Set(prev);
                        if (response.data.isHelpful) {
                            newSet.add(itemId);
                        } else {
                            newSet.delete(itemId);
                        }
                        return newSet;
                    });

                    setReviews(prev => prev.map(review => ({
                        ...review,
                        replies: review.replies?.map(reply => 
                            reply.id === itemId 
                                ? { ...reply, helpfulCount: response.data.helpfulCount }
                                : reply
                        ) || []
                    })));
                }
            }
        } catch (error) {
            console.error('Failed to vote:', error);
        } finally {
            setVotingInProgress(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
            });
        }
    };

    return (
    <div className="mt-8 border-t border-white/10 pt-6">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Reviews</h2>
            <div className="text-sm text-stone-400">
                {reviews.length} reviews
            </div>
        </div>

        {/* Write Review Button */}
        <div className="mb-6">
            <button 
                onClick={() => setShowWriteReview(!showWriteReview)}
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg"
            >
                {showWriteReview ? (
                    <>
                        <MessageCircle className="w-4 h-4" />
                        Cancel Review
                    </>
                ) : (
                    <>
                        <Plus className="w-4 h-4" />
                        Write Review
                    </>
                )}
            </button>
        </div>

        {/* Write Review Section */}
        {showWriteReview && (
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 mb-6 border border-white/10 animate-in slide-in-from-top-2 duration-200">
                <h3 className="font-medium text-white mb-4">Write Your Review</h3>
                
                {/* Recommendation Selection */}
                <div className="mb-4">
    <span className="text-sm text-stone-300 block mb-3">Your recommendation:</span>
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <button
            onClick={() => setUserRecommendation('recommended')}
            className={`px-3 py-2 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 backdrop-blur-sm text-sm font-medium min-h-[44px] ${
                userRecommendation === 'recommended'
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-white/10 bg-black/20 text-stone-300 hover:border-green-400/50'
            }`}
        >
            <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0"></div>
            <span className="truncate">Recommended</span>
        </button>
        <button
            onClick={() => setUserRecommendation('mixed')}
            className={`px-3 py-2 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 backdrop-blur-sm text-sm font-medium min-h-[44px] ${
                userRecommendation === 'mixed'
                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                    : 'border-white/10 bg-black/20 text-stone-300 hover:border-yellow-400/50'
            }`}
        >
            <div className="w-3 h-3 rounded-full bg-yellow-500 flex-shrink-0"></div>
            <span className="truncate">Mixed Feelings</span>
        </button>
        <button
            onClick={() => setUserRecommendation('not-recommended')}
            className={`px-3 py-2 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 backdrop-blur-sm text-sm font-medium min-h-[44px] ${
                userRecommendation === 'not-recommended'
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-white/10 bg-black/20 text-stone-300 hover:border-red-400/50'
            }`}
        >
            <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0"></div>
            <span className="truncate">Not Recommended</span>
        </button>
    </div>
</div>

                {/* Review Text Area */}
                <textarea
                    placeholder="Share your thoughts about this book"
                    className="w-full p-3 bg-black/20 border border-white/10 rounded-lg resize-none text-white placeholder-stone-400 backdrop-blur-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 mb-4"
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    rows={4}
                />
                
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {/* <label className="flex items-center gap-2 text-sm text-stone-300">
                            <input 
                                type="checkbox" 
                                className="rounded border-white/20 bg-black/20 text-amber-600 focus:ring-amber-500/50" 
                                checked={containsSpoilers} 
                                onChange={(e) => setContainsSpoilers(e.target.checked)}
                            />
                            Contains spoilers
                        </label> */}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowWriteReview(false)}
                            className="bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all backdrop-blur-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg" 
                            onClick={postReview}
                        >
                            Post Review
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-6">
            <div className="flex gap-1 bg-black/20 backdrop-blur-sm p-1 rounded-lg w-full sm:w-fit border border-white/10 overflow-x-auto">
                <button
                    onClick={() => setReviewFilter('all')}
                    className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                        reviewFilter === 'all'
                            ? 'bg-amber-600 text-white shadow-lg'
                            : 'text-stone-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <span className="hidden sm:inline">All Reviews</span>
                    <span className="sm:hidden">All</span>
                    <span className="ml-1">({reviews.length})</span>
                </button>
                <button
                    onClick={() => setReviewFilter('recommended')}
                    className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
                        reviewFilter === 'recommended'
                            ? 'bg-amber-600 text-white shadow-lg'
                            : 'text-stone-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="hidden sm:inline">Recommended</span>
                    <span className="sm:hidden truncate">Rec.</span>
                    <span className="ml-1">({reviews.filter(r => r.recommendation === 'recommended').length})</span>
                </button>
                <button
                    onClick={() => setReviewFilter('mixed')}
                    className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
                        reviewFilter === 'mixed'
                            ? 'bg-amber-600 text-white shadow-lg'
                            : 'text-stone-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    <span>Mixed</span>
                    <span className="ml-1">({reviews.filter(r => r.recommendation === 'mixed').length})</span>
                </button>
                <button
                    onClick={() => setReviewFilter('not-recommended')}
                    className={`px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap flex-shrink-0 ${
                        reviewFilter === 'not-recommended'
                            ? 'bg-amber-600 text-white shadow-lg'
                            : 'text-stone-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span className="hidden sm:inline">Not Recommended</span>
                    <span className="sm:hidden">Not Rec.</span>
                    <span className="ml-1">({reviews.filter(r => r.recommendation === 'not-recommended').length})</span>
                </button>
            </div>
        </div>

        {/* Sort Options */}
        <div className="flex items-center gap-4 mb-4">
            <select className="bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white backdrop-blur-sm focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50">
                <option className="bg-stone-800">Most Recent</option>
                <option className="bg-stone-800">Most Helpful</option>
                <option className="bg-stone-800">Oldest First</option>
            </select>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
            {loading ? (
                <div className="text-center py-8">
                    <div className="text-stone-400">Loading reviews...</div>
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="text-center py-8">
                    <div className="text-stone-400">
                        {reviewFilter === 'all' 
                            ? 'No reviews yet. Be the first to write one!' 
                            : `No ${reviewFilter} reviews found.`
                        }
                    </div>
                </div>
            ) : (
                filteredReviews.map((review, index) => {
                    const badge = getRecommendationBadge(review.recommendation);
                    const reviewId = review.id || `review-${index}`;
                    const hasReplies = review.replies && review.replies.length > 0;
                    const repliesExpanded = expandedReplies.has(reviewId);
                    const replyFormVisible = showReplyForm.has(reviewId);
                    const isEditing = editingReview === reviewId;
                    const showDropdown = showDropdowns.has(reviewId);
                    const isDeleting = deletingItems.has(reviewId);
                    
                    return (
                        <div key={index} className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-3 sm:p-4">
                            <div className="flex items-start gap-2 sm:gap-3">
                                {/* Avatar */}
                                {review.avatar_url ? (
                                    <Image
                                        width={48}
                                        height={48}
                                        src={review.avatar_url}
                                        alt={`${review.username}'s profile`}
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 object-cover border border-white/20"
                                    />
                                ) : (
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex-shrink-0 border border-amber-400/20" />
                                )}

                                <div className="flex-1 min-w-0">
                                    {/* Header with username and dropdown */}
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="font-medium text-white truncate">
                                                    {review.username}
                                                </span>
                                                
                                                {!isEditing && (
                                                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border flex-shrink-0 ${
                                                        review.recommendation === 'recommended' ? 'bg-green-500/20 text-green-400 border-green-400/20' :
                                                        review.recommendation === 'mixed' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/20' :
                                                        'bg-red-500/20 text-red-400 border-red-400/20'
                                                    }`}>
                                                        <div className={`w-2 h-2 rounded-full ${
                                                            review.recommendation === 'recommended' ? 'bg-green-500' :
                                                            review.recommendation === 'mixed' ? 'bg-yellow-500' :
                                                            'bg-red-500'
                                                        }`}></div>
                                                        <span className='hidden sm:block'>{badge.label}</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Date on separate line on mobile */}
                                            <div className="text-xs sm:text-sm text-stone-400">
                                                {formatDate(review.createdAt)}
                                                {review.updatedAt && review.updatedAt !== review.createdAt && (
                                                    <span className="ml-1">(edited)</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dropdown Menu for Review Owner */}
                                        {userOwnsReview(review) && !isEditing && (
                                            <div className="relative flex-shrink-0">
                                                <button
                                                    onClick={() => toggleDropdown(reviewId)}
                                                    className="text-stone-400 hover:text-white p-1 rounded transition-colors"
                                                    disabled={isDeleting}
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                                {showDropdown && (
                                                    <div className="absolute right-0 top-full mt-1 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg z-10 min-w-[120px]">
                                                        <button
                                                            onClick={() => startEditingReview(review)}
                                                            className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                                                        >
                                                            <Edit3 className="w-3 h-3" />
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deleteReview(reviewId)}
                                                            disabled={isDeleting}
                                                            className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors disabled:opacity-50"
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                            {isDeleting ? 'Deleting...' : 'Delete'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Review Content or Edit Form */}
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            {/* Edit Recommendation */}
                                            <div>
                                                <span className="text-sm text-stone-300 block mb-2">Recommendation:</span>
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        onClick={() => setEditReviewRecommendation('recommended')}
                                                        className={`px-3 py-1 rounded-lg border transition-colors flex items-center gap-1 text-sm ${
                                                            editReviewRecommendation === 'recommended'
                                                                ? 'border-green-500 bg-green-500/20 text-green-400'
                                                                : 'border-white/10 bg-black/20 text-stone-300 hover:border-green-400/50'
                                                        }`}
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                        <span className="hidden sm:inline">Recommended</span>
                                                        <span className="sm:hidden">👍</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setEditReviewRecommendation('mixed')}
                                                        className={`px-3 py-1 rounded-lg border transition-colors flex items-center gap-1 text-sm ${
                                                            editReviewRecommendation === 'mixed'
                                                                ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                                                                : 'border-white/10 bg-black/20 text-stone-300 hover:border-yellow-400/50'
                                                        }`}
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                                                        <span className="hidden sm:inline">Mixed</span>
                                                        <span className="sm:hidden">👌</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setEditReviewRecommendation('not-recommended')}
                                                        className={`px-3 py-1 rounded-lg border transition-colors flex items-center gap-1 text-sm ${
                                                            editReviewRecommendation === 'not-recommended'
                                                                ? 'border-red-500 bg-red-500/20 text-red-400'
                                                                : 'border-white/10 bg-black/20 text-stone-300 hover:border-red-400/50'
                                                        }`}
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                                        <span className="hidden sm:inline">Not Recommended</span>
                                                        <span className="sm:hidden">👎</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Edit Content */}
                                            <textarea
                                                value={editReviewContent}
                                                onChange={(e) => setEditReviewContent(e.target.value)}
                                                className="w-full p-3 bg-black/20 border border-white/10 rounded-lg resize-none text-white placeholder-stone-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                                                rows={4}
                                            />

                                            {/* Edit Actions */}
                                            <div className="flex justify-end gap-2 flex-wrap">
                                                <button
                                                    onClick={cancelEditing}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-stone-400 hover:text-white transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Cancel</span>
                                                </button>
                                                <button
                                                    onClick={() => saveReviewEdit(reviewId)}
                                                    disabled={!editReviewContent.trim() || !editReviewRecommendation}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm rounded-lg hover:from-amber-700 hover:to-amber-800 disabled:from-stone-600 disabled:to-stone-600 disabled:cursor-not-allowed transition-all shadow-lg"
                                                >
                                                    <Check className="w-4 h-4" />
                                                    Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="text-stone-300 mb-3 leading-relaxed text-sm sm:text-base">
                                                {review.content}
                                            </p>
                                            <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm flex-wrap">
                                                <button 
                                                    onClick={() => handleHelpfulVote(reviewId, 'review')}
                                                    disabled={votingInProgress.has(reviewId)}
                                                    className={`flex items-center gap-1 transition-all ${
                                                        votedReviews.has(reviewId)
                                                            ? 'text-red-400 hover:text-red-300'
                                                            : 'text-stone-400 hover:text-white'
                                                    } ${votingInProgress.has(reviewId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${votedReviews.has(reviewId) ? 'fill-current' : ''}`} />
                                                    <span>{review.helpfulCount}</span>
                                                    <span className="hidden sm:inline">helpful</span>
                                                </button>
                                                <button 
                                                    onClick={() => toggleReplyForm(reviewId)}
                                                    className="flex items-center gap-1 text-stone-400 hover:text-white transition-colors"
                                                >
                                                    <MessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    <span className="hidden sm:inline">Reply</span>
                                                </button>
                                                {hasReplies && (
                                                    <button
                                                        onClick={() => toggleReplies(reviewId)}
                                                        className="flex items-center gap-1 text-stone-400 hover:text-amber-400 transition-colors"
                                                    >
                                                        {repliesExpanded ? (
                                                            <>
                                                                <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                <span className="hidden sm:inline">Hide replies</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                                                                <span className="sm:hidden">{review.replies!.length}</span>
                                                                <span className="hidden sm:inline">
                                                                    {review.replies!.length} {review.replies!.length === 1 ? 'reply' : 'replies'}
                                                                </span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {/* Reply Form */}
                                    {replyFormVisible && !isEditing && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <div className="flex gap-2 sm:gap-3">
                                                {user?.avatar_url ? (
                                                    <Image 
                                                        width={32}
                                                        height={32}
                                                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 border border-white/20 object-cover" 
                                                        src={user.avatar_url}
                                                        alt="Your profile"
                                                    />
                                                ) : (
                                                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex-shrink-0 border border-amber-400/20"></div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <textarea
                                                        value={replyTexts[reviewId] || ''}
                                                        onChange={(e) => handleReplyTextChange(reviewId, e.target.value)}
                                                        placeholder="Write a reply..."
                                                        className="w-full p-3 bg-black/20 border border-white/10 rounded-lg resize-none text-white placeholder-stone-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm"
                                                        rows={3}
                                                    />
                                                    <div className="flex justify-end gap-2 mt-2 flex-wrap">
                                                        <button
                                                            onClick={() => toggleReplyForm(reviewId)}
                                                            className="px-3 py-2 text-xs sm:text-sm text-stone-400 hover:text-white transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleReplySubmit(reviewId)}
                                                            disabled={!replyTexts[reviewId]?.trim()}
                                                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs sm:text-sm rounded-lg hover:from-amber-700 hover:to-amber-800 disabled:from-stone-600 disabled:to-stone-600 disabled:cursor-not-allowed transition-all shadow-lg"
                                                        >
                                                            <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            Reply
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Replies Section */}
                                    {hasReplies && repliesExpanded && !isEditing && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <div className="space-y-3">
                                                {review.replies!.map((reply) => {
                                                    const isEditingReply = editingReply === reply.id;
                                                    const showReplyDropdown = showDropdowns.has(reply.id);
                                                    const isDeletingReply = deletingItems.has(reply.id);

                                                    return (
                                                        <div key={reply.id} className="flex gap-2 sm:gap-3">
                                                            {reply.avatar_url ? (
                                                                <Image
                                                                    width={32}
                                                                    height={32}
                                                                    src={reply.avatar_url}
                                                                    alt={`${reply.username}'s profile`}
                                                                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 object-cover border border-white/20"
                                                                />
                                                            ) : (
                                                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex-shrink-0 border border-amber-400/20" />
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                            <span className={`text-sm font-medium truncate ${reply.isOfficial ? 'text-blue-400' : 'text-white'}`}>
                                                                                {reply.username}
                                                                            </span>
                                                                            {reply.isOfficial && (
                                                                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium border border-blue-400/20 backdrop-blur-sm flex-shrink-0">
                                                                                    Official
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-xs text-stone-400">
                                                                            {formatDate(reply.createdAt)}
                                                                            {reply.updatedAt && reply.updatedAt !== reply.createdAt && (
                                                                                <span className="ml-1">(edited)</span>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Dropdown for Reply Owner */}
                                                                    {userOwnsReply(reply) && !isEditingReply && (
                                                                        <div className="relative flex-shrink-0">
                                                                            <button
                                                                                onClick={() => toggleDropdown(reply.id)}
                                                                                className="text-stone-400 hover:text-white p-1 rounded transition-colors"
                                                                                disabled={isDeletingReply}
                                                                            >
                                                                                <MoreHorizontal className="w-3 h-3" />
                                                                            </button>
                                                                            {showReplyDropdown && (
                                                                                <div className="absolute right-0 top-full mt-1 bg-black/90 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg z-10 min-w-[120px]">
                                                                                    <button
                                                                                        onClick={() => startEditingReply(reply)}
                                                                                        className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors"
                                                                                    >
                                                                                        <Edit3 className="w-3 h-3" />
                                                                                        Edit
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => deleteReply(reply.id)}
                                                                                        disabled={isDeletingReply}
                                                                                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 flex items-center gap-2 transition-colors disabled:opacity-50"
                                                                                    >
                                                                                        <Trash2 className="w-3 h-3" />
                                                                                        {isDeletingReply ? 'Deleting...' : 'Delete'}
                                                                                    </button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Reply Content or Edit Form */}
                                                                {isEditingReply ? (
                                                                    <div className="space-y-2">
                                                                        <textarea
                                                                            value={editReplyContent}
                                                                            onChange={(e) => setEditReplyContent(e.target.value)}
                                                                            className="w-full p-3 bg-black/20 border border-white/10 rounded-lg resize-none text-white placeholder-stone-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm"
                                                                            rows={3}
                                                                        />
                                                                        <div className="flex justify-end gap-2 flex-wrap">
                                                                            <button
                                                                                onClick={cancelEditing}
                                                                                className="flex items-center gap-2 px-3 py-1 text-xs text-stone-400 hover:text-white transition-colors"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                                <span className="hidden sm:inline">Cancel</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => saveReplyEdit(reply.id)}
                                                                                disabled={!editReplyContent.trim()}
                                                                                className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-xs rounded-lg hover:from-amber-700 hover:to-amber-800 disabled:from-stone-600 disabled:to-stone-600 disabled:cursor-not-allowed transition-all shadow-lg"
                                                                            >
                                                                                <Check className="w-3 h-3" />
                                                                                Save
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <p className="text-stone-300 text-sm leading-relaxed mb-2">
                                                                            {reply.content}
                                                                        </p>
                                                                        <div className="flex items-center gap-3 text-xs">
                                                                            <button 
                                                                                onClick={() => handleHelpfulVote(reply.id, 'reply')}
                                                                                disabled={votingInProgress.has(reply.id)}
                                                                                className={`flex items-center gap-1 transition-all ${
                                                                                    votedReplies.has(reply.id)
                                                                                        ? 'text-red-400 hover:text-red-300'
                                                                                        : 'text-stone-400 hover:text-white'
                                                                                } ${votingInProgress.has(reply.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                            >
                                                                                <Heart className={`w-3 h-3 ${votedReplies.has(reply.id) ? 'fill-current' : ''}`} />
                                                                                {reply.helpfulCount}
                                                                            </button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>

        {/* Load More Button */}
        {/* {filteredReviews.length > 0 && (
            <div className="text-center mt-6">
                <button className="bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white px-6 py-2 rounded-lg font-medium transition-all backdrop-blur-sm">
                    Load More Reviews
                </button>
            </div>
        )} */}
    </div>
    );
}

export default Review;