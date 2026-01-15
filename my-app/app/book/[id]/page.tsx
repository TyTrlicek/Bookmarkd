'use client'

import { getBookData } from '../../../utils/util'
import Header from '@/app/components/Header'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React, { useEffect, useState } from 'react'


import StarRating from '@/app/components/StarRating'
import BookStatus from '@/app/components/BookStatus'

import Review from '@/app/components/Review'
import Image from 'next/image'
import Footer from '@/app/components/Footer'
import { supabase } from '@/lib/supabaseClient'
import axios from 'axios'
import MoreByAuthor from '@/app/components/MoreByAuthor'
import BuyNowButton from '@/app/components/BuyNowButton'
import LoginModal from '@/app/components/LoginModal'
import { useAuth } from '@/hooks/useAuth'

const BookPage = () => {
  const params = useParams()
  const searchParams = useSearchParams();
  const id = decodeURIComponent(params.id as string)
const searchAuthor = searchParams.get('author') 
    ? decodeURIComponent(searchParams.get('author') as string) 
    : 'Unknown Author';
    console.log('search author', searchAuthor)
  console.log("Book ID", id);

  const router = useRouter()
  const { isAuthenticated, accessToken, checkAuth } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [loginIntent, setLoginIntent] = useState<'rate' | 'status' | 'review' | null>(null)

  const [image, setImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRating, setUserRating] = useState(0)
  const [description, setDescription] = useState('')
  const [author, setAuthor] = useState('Unknown Author')
  const [publishedDate, setPublishedDate] = useState('Unknown Date')
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [categories, setCategories] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [data, setData] = useState<any>(null)
  const [openLibraryId, setOpenLibraryId] = useState<string | null>(null)
  const [averageRating, setAverageRating] = useState<number | null>(null)
  const [totalRatings, setTotalRatings] = useState<number | null>(null);
  const [popularityRank, setPopularityRank] = useState<number | null>(null);
  const [ratingRank, setRatingRank] = useState<number | null>(null);
  const [userStatus, setUserStatus] = useState<string | null>('');
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [reviewContent, setReviewContent] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);


  useEffect(() => {
    const fetchCover = async () => {
      try {
        const data = await getBookData(id, searchAuthor)
        const img = data?.image || null
        const userStatus = data?.userStatus || null
        const userRating = data?.userRating || 0
        const title = data?.title || ''
        const author = data?.author || 'Unknown Author'
        const publishedDate = data?.publishedDate || 'Unknown Date'
        const pageCount = data?.pageCount || null
        const categories = data?.categories || []
        const openLibraryId = data?.openLibraryId || null
        const averageRating = data?.averageRating || null
        const totalRatings = data?.totalRatings || null
        const ratingRank = data?.ratingRank || null
        const popularityRank = data?.popularityRank || null

        setUserStatus(userStatus);
        setUserRating(userRating);
        setRatingRank(ratingRank);
        setPopularityRank(popularityRank);
        setAverageRating(averageRating);
        setTotalRatings(totalRatings);
        setOpenLibraryId(openLibraryId);
        setData(data);
        setImage(img)
        setDescription(data?.description || '')
        setAuthor(author)
        setPublishedDate(publishedDate)
        setPageCount(pageCount)
        setCategories(categories)
        setTitle(title)


      } catch (err) {
        console.error('Failed to load cover:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCover()
  }, [id])

  const handleRatingChange = async (newRating: number) => {
    // Check auth first
    if (!isAuthenticated) {
      setLoginIntent('rate');
      setShowLoginModal(true);
      return;
    }

    if (!accessToken) {
      console.error('No access token available');
      return;
    }

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/collection/rating`,
        { bookId: openLibraryId, rating: newRating },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setUserRating(newRating);
      setUserStatus('completed');
    } catch (error) {
      console.error('Error updating rating:', error);
      alert('Failed to update rating. Please try again.');
    }
  };

  const handleStatusChange = async (newStatus: 'to-read' | 'completed' | 'dropped' | null) => {
    // Check auth first
    if (!isAuthenticated) {
      setLoginIntent('status');
      setShowLoginModal(true);
      return;
    }

    if (!accessToken) {
      console.error('No access token available');
      return;
    }

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/collection/status`,
        { bookId: openLibraryId, status: newStatus },
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );

      setUserStatus(newStatus);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    }
  };






return (
    <div className="min-h-screen bg-gradient-to-b from-[#14181C] via-[#14181C] to-[#14181C]">
      <Header />

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-16">

        {/* Mobile Book Cover & Quick Actions - Only visible on mobile */}
        <div className="lg:hidden mb-6 space-y-4">
          {/* Book Cover - Horizontal Layout on Mobile */}
          <div className="flex gap-4 items-start">
            {isLoading ? (
              <div className="w-24 h-36 sm:w-32 sm:h-48 bg-[#2C3440] animate-pulse rounded-lg shadow-xl flex-shrink-0" />
            ) : (
              <div className="relative flex-shrink-0">
                <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-lg blur opacity-75" />
                <Image
                  priority
                  width={128}
                  height={192}
                  src={image || ''}
                  alt={`Cover for ${title}`}
                  className="relative w-24 h-36 sm:w-32 sm:h-48 object-cover rounded-lg shadow-xl border border-amber-900/20"
                />
              </div>
            )}

            {/* Mobile Title & Meta */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-50 mb-2 bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent leading-tight">{title}</h1>
              <p className="text-amber-400 font-medium text-sm sm:text-base mb-2">{author}</p>
              <div className="flex items-center gap-2 text-stone-400 text-xs sm:text-sm flex-wrap">
                <span>
                  {publishedDate && publishedDate !== 'Unknown Date'
                    ? (() => {
                        const year = new Date(publishedDate).getFullYear();
                        return !isNaN(year) ? year : publishedDate.match(/\d{4}/)?.[0] || 'Unknown';
                      })()
                    : 'Unknown'
                  }
                </span>
                {pageCount && (
                  <>
                    <span className="text-stone-600">•</span>
                    <span>{pageCount}p</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Rating */}
          <div className="flex flex-col items-center gap-2 p-4 bg-[#2C3440] rounded-xl border border-amber-900/20">
            <StarRating
              rating={userRating}
              onRatingChange={handleRatingChange}
              size="large"
              showValue={true}
            />
            {!isAuthenticated && (
              <p className="text-xs text-center text-stone-500">
                <button
                  onClick={() => {
                    setLoginIntent('rate');
                    setShowLoginModal(true);
                  }}
                  className="text-amber-400 hover:text-amber-300 underline"
                >
                  Log in
                </button>
                {' '}to rate
              </p>
            )}
          </div>

          {/* Mobile Status Buttons */}
          <div className="flex flex-col items-center gap-2 p-4 bg-[#2C3440] rounded-xl border border-amber-900/20">
            <BookStatus
              status={userStatus as 'to-read' | 'completed' | 'dropped' | null}
              onStatusChange={handleStatusChange}
              disabled={userRating > 0}
              isRated={userRating > 0}
            />
            {!isAuthenticated && (
              <p className="text-xs text-center text-stone-500">
                <button
                  onClick={() => {
                    setLoginIntent('status');
                    setShowLoginModal(true);
                  }}
                  className="text-amber-400 hover:text-amber-300 underline"
                >
                  Log in
                </button>
                {' '}to track
              </p>
            )}
          </div>

          {/* Mobile Write Review Button */}
          <button
            onClick={() => {
              if (!isAuthenticated) {
                setLoginIntent('review');
                setShowLoginModal(true);
                return;
              }
              setShowWriteReview(!showWriteReview);
            }}
            className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium rounded-xl transition-all shadow-lg"
          >
            {showWriteReview ? 'Cancel Review' : 'Write a Review'}
          </button>

          {/* Mobile Write Review Form */}
          {showWriteReview && (
            <div className="space-y-3 p-4 bg-[#2C3440] rounded-xl border border-amber-900/20">
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="Share your thoughts about this book..."
                className="w-full px-3 py-2 bg-[#14181C] border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-sm resize-none"
                rows={6}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-stone-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={containsSpoilers}
                    onChange={(e) => setContainsSpoilers(e.target.checked)}
                    className="rounded border-stone-600 text-amber-600 focus:ring-amber-600"
                  />
                  Contains spoilers
                </label>
                <span className="text-xs text-stone-500">{reviewContent.length} characters</span>
              </div>
              <button
                onClick={async () => {
                  if (!isAuthenticated || !accessToken) {
                    setShowLoginModal(true);
                    return;
                  }

                  try {
                    await axios.post(
                      `${process.env.NEXT_PUBLIC_API_URL}/create-review`,
                      {
                        bookId: id,
                        content: reviewContent,
                        containsSpoilers: containsSpoilers,
                        isPrivate: false
                      },
                      {
                        headers: {
                          Authorization: `Bearer ${accessToken}`,
                          'Content-Type': 'application/json'
                        }
                      }
                    );
                    setReviewContent('');
                    setContainsSpoilers(false);
                    setShowWriteReview(false);
                    window.location.reload();
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
                      console.error('Error posting review:', error);
                      alert('Failed to post review. Please try again.');
                    }
                  }
                }}
                disabled={!reviewContent.trim()}
                className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-white font-medium rounded-lg transition-all text-sm"
              >
                Post Review
              </button>
            </div>
          )}

          {/* Mobile Buy Button */}
          {data?.isbn && (
            <BuyNowButton
              isbn={data?.isbn}
              title={title}
            />
          )}
        </div>

        <div className="flex gap-10 items-start">

          {/* Left Sidebar - Cover & Actions - Desktop Only */}
          <div className="hidden lg:block flex-shrink-0 w-72 space-y-6">
            {/* Book Cover */}
            {isLoading ? (
              <div className="w-full aspect-[2/3] bg-[#2C3440] animate-pulse rounded-xl shadow-2xl" />
            ) : (
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300" />
                <Image
                  priority
                  width={288}
                  height={432}
                  src={image || ''}
                  alt={`Cover for ${title}`}
                  className="relative w-full aspect-[2/3] object-cover rounded-xl shadow-2xl border border-amber-900/20"
                />
              </div>
            )}

            {/* Star Rating */}
            <div className="space-y-3">
              <div className="flex justify-center">
                <StarRating
                  rating={userRating}
                  onRatingChange={handleRatingChange}
                  size="large"
                  showValue={true}
                />
              </div>
              {!isAuthenticated && (
                <p className="text-xs text-center text-stone-500">
                  <button
                    onClick={() => {
                      setLoginIntent('rate');
                      setShowLoginModal(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 underline"
                  >
                    Log in
                  </button>
                  {' '}to rate this book
                </p>
              )}
            </div>

            {/* Status Buttons */}
            <div className="space-y-2">
              <div className="flex justify-center">
                <BookStatus
                  status={userStatus as 'to-read' | 'completed' | 'dropped' | null}
                  onStatusChange={handleStatusChange}
                  disabled={userRating > 0}
                  isRated={userRating > 0}
                />
              </div>
              {!isAuthenticated && (
                <p className="text-xs text-center text-stone-500">
                  <button
                    onClick={() => {
                      setLoginIntent('status');
                      setShowLoginModal(true);
                    }}
                    className="text-amber-400 hover:text-amber-300 underline"
                  >
                    Log in
                  </button>
                  {' '}to track this book
                </p>
              )}
            </div>

            {/* Purchase Links */}
            {data?.isbn && (
              <BuyNowButton
                isbn={data?.isbn}
                title={title}
              />
            )}

            {/* Write Review Section */}
            <div className="p-4 bg-[#2C3440] rounded-xl border border-amber-900/20">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    setLoginIntent('review');
                    setShowLoginModal(true);
                    return;
                  }
                  setShowWriteReview(!showWriteReview);
                }}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium rounded-lg transition-all shadow-lg"
              >
                {showWriteReview ? 'Cancel Review' : 'Write a Review'}
              </button>

              {showWriteReview && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Share your thoughts about this book..."
                    className="w-full px-3 py-2 bg-[#2C3440] border border-stone-700 rounded-lg text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 text-sm resize-none"
                    rows={6}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-stone-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={containsSpoilers}
                        onChange={(e) => setContainsSpoilers(e.target.checked)}
                        className="rounded border-stone-600 text-amber-600 focus:ring-amber-600"
                      />
                      Contains spoilers
                    </label>
                    <span className="text-xs text-stone-500">{reviewContent.length} characters</span>
                  </div>
                  <button
                    onClick={async () => {
                      // Auth check already done by Write Review button, but double-check
                      if (!isAuthenticated || !accessToken) {
                        setShowLoginModal(true);
                        return;
                      }

                      try {
                        await axios.post(
                          `${process.env.NEXT_PUBLIC_API_URL}/create-review`,
                          {
                            bookId: id,
                            content: reviewContent,
                            containsSpoilers: containsSpoilers,
                            isPrivate: false
                          },
                          {
                            headers: {
                              Authorization: `Bearer ${accessToken}`,
                              'Content-Type': 'application/json'
                            }
                          }
                        );
                        setReviewContent('');
                        setContainsSpoilers(false);
                        setShowWriteReview(false);
                        // Refresh reviews
                        window.location.reload();
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
                          console.error('Error posting review:', error);
                          alert('Failed to post review. Please try again.');
                        }
                      }
                    }}
                    disabled={!reviewContent.trim()}
                    className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-stone-700 disabled:text-stone-500 text-white font-medium rounded-lg transition-all text-sm"
                  >
                    Post Review
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Content Column - Right Side */}
          <div className="flex-1 pb-16">

            {/* Title & Metadata Header - Desktop Only (hidden on mobile since it's in mobile section) */}
            <div className="hidden lg:block mb-6">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-stone-50 mb-3 bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent">{title}</h1>
              <div className="flex items-center gap-3 text-stone-400 text-sm md:text-base flex-wrap">
                <span className="text-amber-400 font-medium">{author}</span>
                <span className="text-stone-600">•</span>
                <span>
                  {publishedDate && publishedDate !== 'Unknown Date'
                    ? (() => {
                        const year = new Date(publishedDate).getFullYear();
                        return !isNaN(year) ? year : publishedDate.match(/\d{4}/)?.[0] || 'Unknown';
                      })()
                    : 'Unknown'
                  }
                </span>
                {pageCount && (
                  <>
                    <span className="text-stone-600">•</span>
                    <span>{pageCount} pages</span>
                  </>
                )}
                {categories && categories.length > 0 && (
                  <>
                    <span className="text-stone-600">•</span>
                    <span className="text-stone-500">{categories[0]}</span>
                  </>
                )}
              </div>
            </div>

            {/* Stats Bar - Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 p-4 sm:p-5 bg-gradient-to-br from-[#14181C]/80 via-[#14181C]/60 to-[#14181C]/80 rounded-xl border border-amber-900/20 shadow-lg">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-br from-amber-400 to-orange-500 bg-clip-text text-transparent">{averageRating?.toFixed(1) ?? 'N/A'}</div>
                <div className="text-xs text-amber-600/80 uppercase tracking-wide font-semibold">Rating</div>
              </div>
              <div className="text-center lg:border-l border-stone-800">
                <div className="text-2xl sm:text-3xl font-bold text-stone-50">{totalRatings ?? 0}</div>
                <div className="text-xs text-stone-500 uppercase tracking-wide">Ratings</div>
              </div>
              <div className="text-center border-t lg:border-t-0 lg:border-l border-stone-800 pt-3 lg:pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-stone-50">#{ratingRank}</div>
                <div className="text-xs text-stone-500 uppercase tracking-wide">Ranked</div>
              </div>
              <div className="text-center border-t lg:border-t-0 lg:border-l border-stone-800 pt-3 lg:pt-0">
                <div className="text-2xl sm:text-3xl font-bold text-stone-50">#{popularityRank}</div>
                <div className="text-xs text-stone-500 uppercase tracking-wide">Popular</div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-[#2C3440] rounded-xl border border-stone-800/50">
              <h2 className="text-base sm:text-lg font-semibold text-amber-400 mb-2 sm:mb-3">Synopsis</h2>
              <div className="prose prose-stone max-w-none">
                {(() => {
                  const desc = description || 'No description available.';
                  const isLongDescription = desc.length > 300;
                  const shouldShowButton = isLongDescription;
                  const displayText = shouldShowButton && !isDescriptionExpanded
                    ? desc.substring(0, 300) + '...'
                    : desc;

                  return (
                    <div>
                      <p className="text-stone-300 leading-relaxed text-sm sm:text-base">
                        {displayText}
                      </p>
                      {shouldShowButton && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-2 sm:mt-3 text-amber-500 hover:text-amber-400 text-xs sm:text-sm font-medium transition-colors"
                        >
                          {isDescriptionExpanded ? 'Show less' : 'Show more'}
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Genres */}
            {categories && categories.length > 0 && (
              <div className="mb-6 sm:mb-8">
                <h3 className="text-xs sm:text-sm font-semibold text-amber-400 mb-2 sm:mb-3 uppercase tracking-wider">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((tag) => (
                    <span key={tag} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-br from-amber-900/30 to-orange-900/20 text-amber-200 text-xs sm:text-sm rounded-lg border border-amber-900/30 hover:border-amber-700/50 hover:bg-amber-900/40 transition-all">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* More by Author */}
            {author && author !== 'Unknown Author' && data?.id && (
              <div className="mb-6 sm:mb-8">
                <MoreByAuthor author={author} currentBookId={data.id} />
              </div>
            )}

            {/* Reviews Section - Letterboxd Style */}
            <div className="mt-8 sm:mt-12">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-50 mb-4 sm:mb-6">Reviews</h2>
              <Review
                totalRatings={totalRatings}
                setShowWriteReview={setShowWriteReview}
                showWriteReview={showWriteReview}
                reviewContent={reviewContent}
                containsSpoilers={containsSpoilers}
                setContainsSpoilers={setContainsSpoilers}
                id={id}
                setReviewContent={setReviewContent}
                isAuthenticated={isAuthenticated || false}
                onLoginRequired={() => setShowLoginModal(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            setLoginIntent(null);
          }}
          onSuccess={async () => {
            setShowLoginModal(false);
            await checkAuth(); // Refresh auth state

            // Execute pending action based on intent
            if (loginIntent === 'review') {
              setShowWriteReview(true);
            }
            // Rate and status intents don't need follow-up - user can now click again

            setLoginIntent(null);
          }}
        />
      )}

      <Footer />
    </div>
  )
}

export default BookPage