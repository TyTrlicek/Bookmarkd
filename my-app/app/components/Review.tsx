"use client"
import { supabase } from '@/lib/supabaseClient';
import axios from 'axios';
import { Heart, MessageCircle, Plus, ChevronDown, ChevronUp, Send, MoreHorizontal, Edit3, Trash2, Check, X, Flag, Star } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ReplyData, ReviewData, User } from '../types/types';
import { formatDate } from '@/utils/util';

interface BookCardProps {
  totalRatings: number | null;
  setShowWriteReview: React.Dispatch<React.SetStateAction<boolean>>
  showWriteReview: boolean;
  reviewContent: string;
  containsSpoilers: boolean;
  setContainsSpoilers: React.Dispatch<React.SetStateAction<boolean>>
  id: string;
  setReviewContent: React.Dispatch<React.SetStateAction<string>>;
  isAuthenticated: boolean;
  onLoginRequired: () => void;
  checkAuth?: () => void;
}

const Review = ({ totalRatings, setShowWriteReview, showWriteReview, containsSpoilers, reviewContent, setContainsSpoilers, id, setReviewContent, isAuthenticated, onLoginRequired }: BookCardProps) => {

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

    // All reviews (no filtering needed)
    const filteredReviews = reviews;

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

    const reportContent = (itemType: 'review' | 'reply', itemId: string) => {
        console.log(`Report ${itemType} with ID: ${itemId}`);
        alert('Thank you for reporting this content. We will review it shortly.');
    }


    // Start editing review
    const startEditingReview = (review: ReviewData) => {
        setEditingReview(review.id);
        setEditReviewContent(review.content);
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
        setEditReplyContent('');
    };

    // Save review edit
    const saveReviewEdit = async (reviewId: string) => {
        if (!editReviewContent.trim()) return;

        if (!isAuthenticated) {
            onLoginRequired();
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            if (!accessToken) {
                console.error('No access token available');
                return;
            }

            const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}`, {
                content: editReviewContent,
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
                        ? { ...review, content: editReviewContent, updatedAt: new Date().toISOString() }
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

        if (!isAuthenticated) {
            onLoginRequired();
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            if (!accessToken) {
                console.error('No access token available');
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

        if (!isAuthenticated) {
            onLoginRequired();
            return;
        }

        try {
            setDeletingItems(prev => new Set(prev).add(reviewId));

            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            if (!accessToken) {
                console.error('No access token available');
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

        if (!isAuthenticated) {
            onLoginRequired();
            return;
        }

        try {
            setDeletingItems(prev => new Set(prev).add(replyId));

            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            if (!accessToken) {
                console.error('No access token available');
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
        // Check auth before showing reply form
        if (!isAuthenticated) {
            onLoginRequired();
            return;
        }

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

        // Check auth first
        if (!isAuthenticated) {
            onLoginRequired();
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            if (!accessToken) {
                console.error('No access token available');
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

        // Check auth first
        if (!isAuthenticated) {
            onLoginRequired();
            return;
        }

        try {
            setVotingInProgress(prev => new Set(prev).add(itemId));

            const { data: { session } } = await supabase.auth.getSession();
            const accessToken = session?.access_token;

            if (!accessToken) {
                console.error('No access token available');
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
    <div className="w-full space-y-6 overflow-hidden">
            {loading ? (
                <div className="text-center py-8">
                    <div className="text-stone-400">Loading reviews...</div>
                </div>
            ) : filteredReviews.length === 0 ? (
                <div className="text-center py-12">
                    <div className="text-stone-500 text-sm">
                        No reviews yet. Be the first to write one!
                    </div>
                </div>
            ) : (
                filteredReviews.map((review, index) => {
                    const reviewId = review.id || `review-${index}`;
                    const hasReplies = review.replies && review.replies.length > 0;
                    const repliesExpanded = expandedReplies.has(reviewId);
                    const replyFormVisible = showReplyForm.has(reviewId);
                    const isEditing = editingReview === reviewId;
                    const showDropdown = showDropdowns.has(reviewId);
                    const isDeleting = deletingItems.has(reviewId);

                    return (
                        <div key={index} className="pb-6 border-b border-stone-800 last:border-0">
                            <div className="flex items-start gap-2 sm:gap-3">
                                {/* Avatar */}
                                {review.avatar_url ? (
                                    <Image
                                        width={48}
                                        height={48}
                                        src={review.avatar_url}
                                        alt={`${review.username}'s profile`}
                                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex-shrink-0 object-cover border border-[#3D4451]"
                                    />
                                ) : (
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-amber-500/10 to-amber-600/10 rounded-full flex-shrink-0" />
                                )}

                                <div className="flex-1 min-w-0">
                                    {/* Header with username, rating, and dropdown */}
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="font-semibold text-stone-50 truncate">
                                                    {review.username}
                                                </span>
                                                {review.rating != null && review.rating > 0 && (
                                                    <>
                                                        <div className="flex items-center gap-0.5">
                                                            {[0, 1, 2, 3, 4].map((starIndex) => {
                                                                const fillPercentage = Math.max(0, Math.min(1, review.rating! - starIndex));
                                                                const isHalf = fillPercentage === 0.5;
                                                                return (
                                                                    <div key={starIndex} className="relative w-3.5 h-3.5">
                                                                        <Star className="absolute inset-0 w-3.5 h-3.5 text-stone-600" strokeWidth={1.5} />
                                                                        {fillPercentage > 0 && (
                                                                            <div
                                                                                className="absolute inset-0 overflow-hidden"
                                                                                style={{
                                                                                    clipPath: isHalf
                                                                                        ? 'polygon(0 0, 50% 0, 50% 100%, 0 100%)'
                                                                                        : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)'
                                                                                }}
                                                                            >
                                                                                <Star className="w-3.5 h-3.5 text-amber-400 fill-current" strokeWidth={1.5} />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </>
                                                )}
                                                <span className="text-stone-600">·</span>
                                                <span className="text-xs text-stone-500">
                                                    {formatDate(review.createdAt)}
                                                    {review.updatedAt && review.updatedAt !== review.createdAt && (
                                                        <span className="ml-1">(edited)</span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Dropdown Menu - Always visible */}
                                        {!isEditing && (
                                            <div className="relative flex-shrink-0">
                                                <button
                                                    onClick={() => toggleDropdown(reviewId)}
                                                    className="text-stone-400 hover:text-stone-50 p-1 rounded transition-colors"
                                                    disabled={isDeleting}
                                                >
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </button>
                                                {showDropdown && (
                                                    <div className="absolute right-0 top-full mt-1 bg-black/90 backdrop-blur-sm border border-[#3D4451] rounded-lg shadow-lg z-10 min-w-[120px]">
                                                        {userOwnsReview(review) ? (
                                                            <>
                                                                <button
                                                                    onClick={() => startEditingReview(review)}
                                                                    className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:text-stone-50 hover:bg-white/10 flex items-center gap-2 transition-colors"
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
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() => reportContent('review' ,reviewId)}
                                                                className="w-full text-left px-3 py-2 text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 flex items-center gap-2 transition-colors"
                                                            >
                                                                <Flag className="w-3 h-3" />
                                                                Report
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Review Content or Edit Form */}
                                    {isEditing ? (
                                        <div className="space-y-4">
                                            {/* Edit Content */}
                                            <textarea
                                                value={editReviewContent}
                                                onChange={(e) => setEditReviewContent(e.target.value)}
                                                className="w-full p-3 bg-[#2C3440]/60 border border-[#3D4451] rounded-lg resize-none text-stone-50 placeholder-stone-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                                                rows={4}
                                            />

                                            {/* Edit Actions */}
                                            <div className="flex justify-end gap-2 flex-wrap">
                                                <button
                                                    onClick={cancelEditing}
                                                    className="flex items-center gap-2 px-3 py-2 text-sm text-stone-400 hover:text-stone-50 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                    <span className="hidden sm:inline">Cancel</span>
                                                </button>
                                                <button
                                                    onClick={() => saveReviewEdit(reviewId)}
                                                    disabled={!editReviewContent.trim()}
                                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-stone-50 text-sm rounded-lg hover:from-amber-700 hover:to-amber-800 disabled:from-stone-600 disabled:to-stone-600 disabled:cursor-not-allowed transition-all shadow-lg"
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
                                                            : 'text-stone-400 hover:text-stone-50'
                                                    } ${votingInProgress.has(reviewId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    <Heart className={`w-3 h-3 sm:w-4 sm:h-4 ${votedReviews.has(reviewId) ? 'fill-current' : ''}`} />
                                                    <span>{review.helpfulCount}</span>
                                                    <span className="hidden sm:inline">Like</span>
                                                </button>
                                                <button 
                                                    onClick={() => toggleReplyForm(reviewId)}
                                                    className="flex items-center gap-1 text-stone-400 hover:text-stone-50 transition-colors"
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
                                        <div className="mt-4 pt-4 border-t border-[#3D4451]">
                                            <div className="flex gap-2 sm:gap-3">
                                                {user?.avatar_url ? (
                                                    <Image 
                                                        width={32}
                                                        height={32}
                                                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 border border-[#3D4451] object-cover" 
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
                                                        className="w-full p-3 bg-[#2C3440]/60 border border-[#3D4451] rounded-lg resize-none text-stone-50 placeholder-stone-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm"
                                                        rows={3}
                                                    />
                                                    <div className="flex justify-end gap-2 mt-2 flex-wrap">
                                                        <button
                                                            onClick={() => toggleReplyForm(reviewId)}
                                                            className="px-3 py-2 text-xs sm:text-sm text-stone-400 hover:text-stone-50 transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleReplySubmit(reviewId)}
                                                            disabled={!replyTexts[reviewId]?.trim()}
                                                            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-stone-50 text-xs sm:text-sm rounded-lg hover:from-amber-700 hover:to-amber-800 disabled:from-stone-600 disabled:to-stone-600 disabled:cursor-not-allowed transition-all shadow-lg"
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
                                        <div className="mt-4 pt-4 border-t border-[#3D4451]">
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
                                                                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex-shrink-0 object-cover border border-[#3D4451]"
                                                                />
                                                            ) : (
                                                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex-shrink-0 border border-amber-400/20" />
                                                            )}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                            <span className={`text-sm font-medium truncate ${reply.isOfficial ? 'text-blue-400' : 'text-stone-50'}`}>
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

                                                                    {/* Dropdown - Always visible */}
                                                                    {!isEditingReply && (
                                                                        <div className="relative flex-shrink-0">
                                                                            <button
                                                                                onClick={() => toggleDropdown(reply.id)}
                                                                                className="text-stone-400 hover:text-stone-50 p-1 rounded transition-colors"
                                                                                disabled={isDeletingReply}
                                                                            >
                                                                                <MoreHorizontal className="w-3 h-3" />
                                                                            </button>
                                                                            {showReplyDropdown && (
                                                                                <div className="absolute right-0 top-full mt-1 bg-black/90 backdrop-blur-sm border border-[#3D4451] rounded-lg shadow-lg z-10 min-w-[120px]">
                                                                                    {userOwnsReply(reply) ? (
                                                                                        <>
                                                                                            <button
                                                                                                onClick={() => startEditingReply(reply)}
                                                                                                className="w-full text-left px-3 py-2 text-sm text-stone-300 hover:text-stone-50 hover:bg-white/10 flex items-center gap-2 transition-colors"
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
                                                                                        </>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => reportContent( 'reply', reply.id)}
                                                                                            className="w-full text-left px-3 py-2 text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 flex items-center gap-2 transition-colors"
                                                                                        >
                                                                                            <Flag className="w-3 h-3" />
                                                                                            Report
                                                                                        </button>
                                                                                    )}
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
                                                                            className="w-full p-3 bg-[#2C3440]/60 border border-[#3D4451] rounded-lg resize-none text-stone-50 placeholder-stone-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 text-sm"
                                                                            rows={3}
                                                                        />
                                                                        <div className="flex justify-end gap-2 flex-wrap">
                                                                            <button
                                                                                onClick={cancelEditing}
                                                                                className="flex items-center gap-2 px-3 py-1 text-xs text-stone-400 hover:text-stone-50 transition-colors"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                                <span className="hidden sm:inline">Cancel</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => saveReplyEdit(reply.id)}
                                                                                disabled={!editReplyContent.trim()}
                                                                                className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-600 to-amber-700 text-stone-50 text-xs rounded-lg hover:from-amber-700 hover:to-amber-800 disabled:from-stone-600 disabled:to-stone-600 disabled:cursor-not-allowed transition-all shadow-lg"
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
                                                                                        : 'text-stone-400 hover:text-stone-50'
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
    );
}

export default Review;