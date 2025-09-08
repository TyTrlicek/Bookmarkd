"use client"
import { supabase } from '@/lib/supabaseClient';
import axios from 'axios';
import { Heart, MessageCircle, Plus, ChevronDown, ChevronUp, Send } from 'lucide-react'
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
    
    // Simplified reply functionality states - only one layer
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [showReplyForm, setShowReplyForm] = useState<Set<string>>(new Set());
    const [replyTexts, setReplyTexts] = useState<{[key: string]: string}>({});
    const [user, setUser] = useState<User | null>(null);
    
    // Separate vote tracking for reviews and replies
    const [votedReviews, setVotedReviews] = useState<Set<string>>(new Set());
    const [votedReplies, setVotedReplies] = useState<Set<string>>(new Set());
    const [votingInProgress, setVotingInProgress] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchReview = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${id}`, {params: { id: id }});
                setReviews(response.data || null);
                console.log("reviews data:", response.data);

                // Fetch vote status for reviews and replies
                const { data: { session } } = await supabase.auth.getSession();
                const accessToken = session?.access_token;
                
                if (accessToken && response.data.length > 0) {
                    // Fetch vote status for all reviews
                    const reviewVotePromises = response.data.map((review: ReviewData) => 
                        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${review.id}/vote-status`, {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        }).catch(() => null)
                    );

                    // Collect all replies from all reviews (flattened, single layer only)
                    const allReplies = response.data.flatMap((review: ReviewData) => 
                        review.replies || []
                    );

                    // Fetch vote status for all replies
                    const replyVotePromises = allReplies.map((reply: ReplyData) => 
                        axios.get(`${process.env.NEXT_PUBLIC_API_URL}/replies/${reply.id}/vote-status`, {
                            headers: { Authorization: `Bearer ${accessToken}` }
                        }).catch(() => null)
                    );

                    // Process all vote results
                    const [reviewVoteResults, replyVoteResults] = await Promise.all([
                        Promise.all(reviewVotePromises),
                        Promise.all(replyVotePromises)
                    ]);

                    // Update voted reviews set
                    const votedReviewsSet = new Set<string>();
                    reviewVoteResults.forEach((result, index) => {
                        if (result?.data?.hasVoted) {
                            votedReviewsSet.add(response.data[index].id);
                        }
                    });
                    setVotedReviews(votedReviewsSet);

                    // Update voted replies set
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
                router.push('/auth');
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
                console.log(response.data);
            } catch (error) {
                console.error('Failed to fetch user:', error);
                router.push('/auth');
            }
        };

        fetchUser();
    }, [router]);

    // Filter reviews based on selected filter
    const filteredReviews = reviews.filter(review => {
        if (reviewFilter === 'all') return true;
        return review.recommendation === reviewFilter;
    });

    // Function to format date

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

    // Simplified reply functionality - only for main reviews
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

    // Simplified reply submit - only replies to main reviews
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
                parentId: null, // Always null since we're only allowing one layer
                content: replyText,
            }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
      
            if (response.status === 201) {
                // Clear the form
                setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
                setShowReplyForm(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(reviewId);
                    return newSet;
                });
      
                // Refresh reviews to get updated data
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
                // Refresh reviews after posting
                const updatedReviews = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${id}`, {params: { id: id }});
                if (updatedReviews.data) {
                    setReviews(updatedReviews.data);
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                // Axios errors may have a 'response' property
                const axiosError = error as any;
                console.error('Failed to post review:', axiosError.response?.data || error.message);
            } else {
                console.error('Failed to post review:', error);
            }
        }
    };

    // Simplified vote handling for both reviews and replies
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

            // Use different endpoints for reviews vs replies
            const endpoint = itemType === 'review' 
                ? `${process.env.NEXT_PUBLIC_API_URL}/reviews/${itemId}/vote`
                : `${process.env.NEXT_PUBLIC_API_URL}/${itemId}/vote`;

            const response = await axios.post(endpoint, {}, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.success) {
                // Update appropriate vote status set
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

                    // Update review helpful count
                    setReviews(prev => prev.map(review => 
                        review.id === itemId 
                            ? { ...review, helpfulCount: response.data.helpfulCount }
                            : review
                    ));
                } else {
                    // Handle reply votes
                    setVotedReplies(prev => {
                        const newSet = new Set(prev);
                        if (response.data.isHelpful) {
                            newSet.add(itemId);
                        } else {
                            newSet.delete(itemId);
                        }
                        return newSet;
                    });

                    // Update reply helpful count in the reviews state
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
                    <div className="flex gap-3">
                        <button
                            onClick={() => setUserRecommendation('recommended')}
                            className={`px-4 py-2 rounded-lg border-2 transition-colors flex items-center gap-2 backdrop-blur-sm ${
                                userRecommendation === 'recommended'
                                    ? 'border-green-500 bg-green-500/20 text-green-400'
                                    : 'border-white/10 bg-black/20 text-stone-300 hover:border-green-400/50'
                            }`}
                        >
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            Recommended
                        </button>
                        <button
                            onClick={() => setUserRecommendation('mixed')}
                            className={`px-4 py-2 rounded-lg border-2 transition-colors flex items-center gap-2 backdrop-blur-sm ${
                                userRecommendation === 'mixed'
                                    ? 'border-yellow-500 bg-yellow-500/20 text-yellow-400'
                                    : 'border-white/10 bg-black/20 text-stone-300 hover:border-yellow-400/50'
                            }`}
                        >
                            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                            Mixed Feelings
                        </button>
                        <button
                            onClick={() => setUserRecommendation('not-recommended')}
                            className={`px-4 py-2 rounded-lg border-2 transition-colors flex items-center gap-2 backdrop-blur-sm ${
                                userRecommendation === 'not-recommended'
                                    ? 'border-red-500 bg-red-500/20 text-red-400'
                                    : 'border-white/10 bg-black/20 text-stone-300 hover:border-red-400/50'
                            }`}
                        >
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            Not Recommended
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
                        <label className="flex items-center gap-2 text-sm text-stone-300">
                            <input 
                                type="checkbox" 
                                className="rounded border-white/20 bg-black/20 text-amber-600 focus:ring-amber-500/50" 
                                checked={containsSpoilers} 
                                onChange={(e) => setContainsSpoilers(e.target.checked)}
                            />
                            Contains spoilers
                        </label>
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
            <div className="flex gap-1 bg-black/20 backdrop-blur-sm p-1 rounded-lg w-fit border border-white/10">
                <button
                    onClick={() => setReviewFilter('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        reviewFilter === 'all'
                            ? 'bg-amber-600 text-white shadow-lg'
                            : 'text-stone-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    All Reviews ({reviews.length})
                </button>
                <button
                    onClick={() => setReviewFilter('recommended')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        reviewFilter === 'recommended'
                            ? 'bg-amber-600 text-white shadow-lg'
                            : 'text-stone-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Recommended ({reviews.filter(r => r.recommendation === 'recommended').length})
                </button>
                <button
                    onClick={() => setReviewFilter('mixed')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        reviewFilter === 'mixed'
                            ? 'bg-amber-600 text-white shadow-lg'
                            : 'text-stone-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                    Mixed ({reviews.filter(r => r.recommendation === 'mixed').length})
                </button>
                <button
                    onClick={() => setReviewFilter('not-recommended')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                        reviewFilter === 'not-recommended'
                            ? 'bg-amber-600 text-white shadow-lg'
                            : 'text-stone-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    Not Recommended ({reviews.filter(r => r.recommendation === 'not-recommended').length})
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
                    
                    return (
                        <div key={index} className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                            <div className="flex items-start gap-3">
                                {/* Avatar */}
                                {review.avatar_url ? (
                                    <Image
                                    width={48}
                                    height={48}
                                        src={review.avatar_url}
                                        alt={`${review.username}'s profile`}
                                        className="w-12 h-12 rounded-full flex-shrink-0 object-cover border border-white/20"
                                    />
                                ) : (
                                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex-shrink-0 border border-amber-400/20" />
                                )}

                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-medium text-white">
                                            {review.username}
                                        </span>
                                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm border ${
                                            review.recommendation === 'recommended' ? 'bg-green-500/20 text-green-400 border-green-400/20' :
                                            review.recommendation === 'mixed' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-400/20' :
                                            'bg-red-500/20 text-red-400 border-red-400/20'
                                        }`}>
                                            <div className={`w-2 h-2 rounded-full ${
                                                review.recommendation === 'recommended' ? 'bg-green-500' :
                                                review.recommendation === 'mixed' ? 'bg-yellow-500' :
                                                'bg-red-500'
                                            }`}></div>
                                            {badge.label}
                                        </div>
                                        <span className="text-sm text-stone-400">
                                            • {formatDate(review.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-stone-300 mb-3 leading-relaxed">
                                        {review.content}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm">
                                        <button 
                                            onClick={() => handleHelpfulVote(reviewId, 'review')}
                                            disabled={votingInProgress.has(reviewId)}
                                            className={`flex items-center gap-1 transition-all ${
                                                votedReviews.has(reviewId)
                                                    ? 'text-red-400 hover:text-red-300'
                                                    : 'text-stone-400 hover:text-white'
                                            } ${votingInProgress.has(reviewId) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Heart className={`w-4 h-4 ${votedReviews.has(reviewId) ? 'fill-current' : ''}`} />
                                            {review.helpfulCount} helpful
                                        </button>
                                        <button 
                                            onClick={() => toggleReplyForm(reviewId)}
                                            className="flex items-center gap-1 text-stone-400 hover:text-white transition-colors"
                                        >
                                            <MessageCircle className="w-4 h-4" />
                                            Reply
                                        </button>
                                        {hasReplies && (
                                            <button
                                                onClick={() => toggleReplies(reviewId)}
                                                className="flex items-center gap-1 text-stone-400 hover:text-amber-400 transition-colors"
                                            >
                                                {repliesExpanded ? (
                                                    <>
                                                        <ChevronUp className="w-4 h-4" />
                                                        Hide replies
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown className="w-4 h-4" />
                                                        {review.replies!.length} {review.replies!.length === 1 ? 'reply' : 'replies'}
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Reply Form */}
                                    {replyFormVisible && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <div className="flex gap-3">
                                                {user?.avatar_url ? (
                                                    <Image 
                                                    width={48}
                                                    height={48}
                                                        className="w-12 h-12 rounded-full flex-shrink-0 border border-white/20 object-cover" 
                                                        src={user.avatar_url}
                                                        alt="Your profile"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex-shrink-0 border border-amber-400/20"></div>
                                                )}
                                                <div className="flex-1">
                                                    <textarea
                                                        value={replyTexts[reviewId] || ''}
                                                        onChange={(e) => handleReplyTextChange(reviewId, e.target.value)}
                                                        placeholder="Write a reply..."
                                                        className="w-full p-3 bg-black/20 border border-white/10 rounded-lg resize-none text-white placeholder-stone-400 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50"
                                                        rows={3}
                                                    />
                                                    <div className="flex justify-end gap-2 mt-2">
                                                        <button
                                                            onClick={() => toggleReplyForm(reviewId)}
                                                            className="px-4 py-2 text-sm text-stone-400 hover:text-white transition-colors"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleReplySubmit(reviewId)}
                                                            disabled={!replyTexts[reviewId]?.trim()}
                                                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white text-sm rounded-lg hover:from-amber-700 hover:to-amber-800 disabled:from-stone-600 disabled:to-stone-600 disabled:cursor-not-allowed transition-all shadow-lg"
                                                        >
                                                            <Send className="w-4 h-4" />
                                                            Reply
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Replies Section - Single Layer Only */}
                                    {hasReplies && repliesExpanded && (
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <div className="space-y-3">
                                                {review.replies!.map((reply) => (
                                                    <div key={reply.id} className="flex gap-3">
                                                        {reply.avatar_url ? (
                                                            <Image
                                                            width={48}
                                                            height={48}
                                                                src={reply.avatar_url}
                                                                alt={`${reply.username}'s profile`}
                                                                className="w-12 h-12 rounded-full flex-shrink-0 object-cover border border-white/20"
                                                            />
                                                        ) : (
                                                            <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex-shrink-0 border border-amber-400/20" />
                                                        )}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className={`text-sm font-medium ${reply.isOfficial ? 'text-blue-400' : 'text-white'}`}>
                                                                    {reply.username}
                                                                </span>
                                                                {reply.isOfficial && (
                                                                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full font-medium border border-blue-400/20 backdrop-blur-sm">
                                                                        Official
                                                                    </span>
                                                                )}
                                                                <span className="text-xs text-stone-400">
                                                                    {formatDate(reply.createdAt)}
                                                                </span>
                                                            </div>
                                                            <p className="text-stone-300 text-sm leading-relaxed mb-2">
                                                                {reply.content}
                                                            </p>
                                                            <div className="flex items-center gap-4 text-xs">
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
                                                        </div>
                                                    </div>
                                                ))}
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
        {filteredReviews.length > 0 && (
            <div className="text-center mt-6">
                <button className="bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white px-6 py-2 rounded-lg font-medium transition-all backdrop-blur-sm">
                    Load More Reviews
                </button>
            </div>
        )}
    </div>
    );
}

export default Review;