'use client'

import { getBookData } from '../../../utils/util'
import Header from '@/app/components/Header'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import React, { Suspense, useEffect, useState } from 'react'


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
import AddToListPopup from '@/app/components/AddToListPopup'
import { ListPlus, Loader2 } from 'lucide-react'

function BookPageContent() {
  const params = useParams()
  const searchParams = useSearchParams();
  const id = decodeURIComponent(params.id as string)
const searchAuthor = searchParams.get('author')
    ? decodeURIComponent(searchParams.get('author') as string)
    : 'Unknown Author';

  const router = useRouter()
  const { isAuthenticated, accessToken,getAccessToken } = useAuth()
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
  const [userStatus, setUserStatus] = useState<'to-read' | 'completed' | 'dropped' | null>(null);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [reviewContent, setReviewContent] = useState('');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);


  useEffect(() => {
    const fetchCover = async () => {
      try {
        const data = await getBookData(id, searchAuthor)
        const img = data?.image || null
        const userStatus = (data?.userStatus as 'to-read' | 'completed' | 'dropped' | null) || null
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
    <div className="min-h-screen bg-canvas overflow-x-hidden">
      <Header />

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-8 pb-16 w-full">

        {/* Mobile Book Cover & Quick Actions - Only visible on mobile */}
        <div className="lg:hidden mb-6 space-y-4">
          {/* Book Cover - Centered on Mobile */}
          <div className="flex flex-col items-center gap-4">
            {isLoading ? (
              <div className="w-48 h-72 bg-surface animate-pulse rounded-lg shadow-xl flex-shrink-0" />
            ) : (
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 " />
                <Image
                  priority
                  width={192}
                  height={288}
                  src={image || ''}
                  alt={`Cover for ${title}`}
                  className="relative w-48 h-72 object-cover rounded-lg shadow-xl border border-line"
                />
              </div>
            )}

            {/* Mobile Title & Meta */}
            <div className="w-full text-center">
              <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink mb-2 leading-tight">{title}</h1>
              <p className="text-gold font-medium text-sm sm:text-base mb-2">{author}</p>
              <div className="flex items-center justify-center gap-2 text-ink-mute text-xs sm:text-sm flex-wrap">
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
                    <span className="text-ink-faint">•</span>
                    <span>{pageCount}p</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Rating */}
          <div className="flex flex-col items-center gap-2 p-4 bg-surface rounded-xl border border-line">
            <StarRating
              rating={userRating}
              onRatingChange={handleRatingChange}
              size="large"
              showValue={true}
            />
            {!isAuthenticated && (
              <p className="text-xs text-center text-ink-faint">
                <button
                  onClick={() => {
                    setLoginIntent('rate');
                    setShowLoginModal(true);
                  }}
                  className="text-gold hover:text-gold-soft underline"
                >
                  Log in
                </button>
                {' '}to rate
              </p>
            )}
          </div>

          {/* Mobile Status Buttons */}
          <div className="flex flex-col items-center gap-2 p-4 bg-surface rounded-xl border border-line">
            <BookStatus
              status={userStatus}
              onStatusChange={handleStatusChange}
              disabled={userRating > 0}
              isRated={userRating > 0}
            />
            {!isAuthenticated && (
              <p className="text-xs text-center text-ink-faint">
                <button
                  onClick={() => {
                    setLoginIntent('status');
                    setShowLoginModal(true);
                  }}
                  className="text-gold hover:text-gold-soft underline"
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
            className="w-full px-4 py-3 bg-ember hover:bg-ember-strong text-white font-semibold rounded-full transition-colors"
          >
            {showWriteReview ? 'Cancel Review' : 'Write a Review'}
          </button>

          {/* Mobile Write Review Form */}
          {showWriteReview && (
            <div className="space-y-3 p-4 bg-surface rounded-xl border border-line">
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="Share your thoughts about this book..."
                className="w-full px-3 py-2 bg-canvas border border-line rounded-lg text-ink placeholder-ink-faint focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/30 text-sm resize-none"
                rows={6}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-ink-mute cursor-pointer">
                  <input
                    type="checkbox"
                    checked={containsSpoilers}
                    onChange={(e) => setContainsSpoilers(e.target.checked)}
                    className="rounded border-line text-ember focus:ring-gold/40"
                  />
                  Contains spoilers
                </label>
                <span className="text-xs text-ink-faint">{reviewContent.length} characters</span>
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
                className="w-full px-4 py-2 bg-ember hover:bg-ember-strong disabled:opacity-40 text-white font-semibold rounded-full transition-colors text-sm"
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

          {/* Mobile Add to List Button */}
          {data?.id && (
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  setLoginIntent('status');
                  setShowLoginModal(true);
                  return;
                }
                setShowAddToList(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface hover:bg-surface-2 text-ink font-medium rounded-xl border border-line hover:border-line-strong transition-all"
            >
              <ListPlus className="w-5 h-5 text-ink-mute" />
              Add to List
            </button>
          )}
        </div>

        <div className="flex gap-10 items-start">

          {/* Left Sidebar - Cover & Actions - Desktop Only */}
          <div className="hidden lg:block flex-shrink-0 w-72 space-y-6">
            {/* Book Cover */}
            {isLoading ? (
              <div className="w-full aspect-[2/3] bg-surface animate-pulse rounded-xl shadow-2xl" />
            ) : (
              <div className="relative group">
                <div className="absolute inset-0 " />
                <Image
                  priority
                  width={288}
                  height={432}
                  src={image || ''}
                  alt={`Cover for ${title}`}
                  className="relative w-full aspect-[2/3] object-cover rounded-xl shadow-2xl border border-line"
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
                <p className="text-xs text-center text-ink-faint">
                  <button
                    onClick={() => {
                      setLoginIntent('rate');
                      setShowLoginModal(true);
                    }}
                    className="text-gold hover:text-gold-soft underline"
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
                  status={userStatus}
                  onStatusChange={handleStatusChange}
                  disabled={userRating > 0}
                  isRated={userRating > 0}
                />
              </div>
              {!isAuthenticated && (
                <p className="text-xs text-center text-ink-faint">
                  <button
                    onClick={() => {
                      setLoginIntent('status');
                      setShowLoginModal(true);
                    }}
                    className="text-gold hover:text-gold-soft underline"
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
            <div className="p-4 bg-surface rounded-xl border border-line">
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    setLoginIntent('review');
                    setShowLoginModal(true);
                    return;
                  }
                  setShowWriteReview(!showWriteReview);
                }}
                className="w-full px-4 py-2.5 bg-ember hover:bg-ember-strong text-white font-semibold rounded-full transition-colors"
              >
                {showWriteReview ? 'Cancel Review' : 'Write a Review'}
              </button>

              {showWriteReview && (
                <div className="mt-4 space-y-3">
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Share your thoughts about this book..."
                    className="w-full px-3 py-2 bg-surface border border-line rounded-lg text-ink placeholder-ink-faint focus:outline-none focus:border-gold/40 focus:ring-1 focus:ring-gold/30 text-sm resize-none"
                    rows={6}
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-ink-mute cursor-pointer">
                      <input
                        type="checkbox"
                        checked={containsSpoilers}
                        onChange={(e) => setContainsSpoilers(e.target.checked)}
                        className="rounded border-line text-ember focus:ring-gold/40"
                      />
                      Contains spoilers
                    </label>
                    <span className="text-xs text-ink-faint">{reviewContent.length} characters</span>
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
                    className="w-full px-4 py-2 bg-ember hover:bg-ember-strong disabled:opacity-40 text-white font-semibold rounded-full transition-colors text-sm"
                  >
                    Post Review
                  </button>
                </div>
              )}
            </div>

            {/* Add to List Button */}
            {data?.id && (
              <button
                onClick={() => {
                  if (!isAuthenticated) {
                    setLoginIntent('status');
                    setShowLoginModal(true);
                    return;
                  }
                  setShowAddToList(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface hover:bg-surface-2 text-ink font-medium rounded-xl border border-line hover:border-line-strong transition-all"
              >
                <ListPlus className="w-5 h-5 text-ink-mute" />
                Add to List
              </button>
            )}
          </div>

          {/* Content Column - Right Side */}
          <div className="flex-1 pb-16 w-full min-w-0 overflow-hidden">

            {/* Title & Metadata Header - Desktop Only (hidden on mobile since it's in mobile section) */}
            <div className="hidden lg:block mb-6 w-full overflow-hidden">
              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-[-0.02em] text-ink mb-3 break-words">{title}</h1>
              <div className="flex items-center gap-3 text-ink-mute text-sm md:text-base flex-wrap">
                <span className="text-gold font-medium">{author}</span>
                <span className="text-ink-faint">•</span>
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
                    <span className="text-ink-faint">•</span>
                    <span>{pageCount} pages</span>
                  </>
                )}
                {categories && categories.length > 0 && (
                  <>
                    <span className="text-ink-faint">•</span>
                    <span className="text-ink-faint">{categories[0]}</span>
                  </>
                )}
              </div>
            </div>

            {/* Stats Bar - Responsive Grid */}
            <div className="mb-8 grid w-full grid-cols-2 divide-x divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface/50 lg:grid-cols-4 lg:divide-y-0">
              <div className="p-5">
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-mute">Rating</div>
                <div className="font-display mt-1.5 text-2xl font-semibold text-gold">{averageRating?.toFixed(1) ?? '—'}</div>
              </div>
              <div className="p-5">
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-mute">Ratings</div>
                <div className="font-display mt-1.5 text-2xl font-semibold text-ink">{totalRatings ?? 0}</div>
              </div>
              <div className="p-5">
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-mute">Ranked</div>
                <div className="font-display mt-1.5 text-2xl font-semibold text-ink">{ratingRank ? `#${ratingRank}` : '—'}</div>
              </div>
              <div className="p-5">
                <div className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-mute">Popular</div>
                <div className="font-display mt-1.5 text-2xl font-semibold text-ink">{popularityRank ? `#${popularityRank}` : '—'}</div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8 w-full">
              <h2 className="font-display text-xl font-semibold text-ink">Synopsis</h2>
              <div className="mt-3 h-px w-full bg-gradient-to-r from-gold/30 via-line to-transparent" />
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
                      <p className="text-ink-soft leading-relaxed text-sm sm:text-base break-words">
                        {displayText}
                      </p>
                      {shouldShowButton && (
                        <button
                          onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                          className="mt-2 sm:mt-3 text-gold hover:text-gold-soft text-xs sm:text-sm font-medium transition-colors"
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
              <div className="w-full mb-6 sm:mb-8 overflow-hidden">
                <h3 className="text-xs sm:text-sm font-mono text-ink-mute mb-2 sm:mb-3 uppercase tracking-widest">Genres</h3>
                <div className="flex flex-wrap gap-2">
                  {categories.map((tag) => (
                    <span key={tag} className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-line bg-overlay px-3 py-1 text-xs text-ink-mute transition-colors hover:border-line-strong">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* More by Author */}
            {author && author !== 'Unknown Author' && data?.id && (
              <div className="w-full mb-8 sm:mb-12 pb-8 border-b border-line overflow-hidden">
                <MoreByAuthor author={author} currentBookId={data.id} />
              </div>
            )}

            {/* Reviews Section - Letterboxd Style */}
            <div className="w-full mt-8 sm:mt-12 pb-8 overflow-hidden">
              <h2 className="text-2xl font-semibold text-ink mb-5 font-display">Reviews</h2>
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
            await getAccessToken(); // Refresh access token

            // Execute pending action based on intent
            if (loginIntent === 'review') {
              setShowWriteReview(true);
            }
            // Rate and status intents don't need follow-up - user can now click again

            setLoginIntent(null);
          }}
        />
      )}

      {/* Add to List Popup */}
      {data?.id && (
        <AddToListPopup
          isOpen={showAddToList}
          onClose={() => setShowAddToList(false)}
          bookId={data.id}
          bookTitle={title}
          openLibraryId={data.openLibraryId}
          bookImage={data.image}
          bookAuthor={data.author}
        />
      )}

      {/* Visual separator before footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="border-t border-line mt-12"></div>
      </div>

      <Footer />
    </div>
  )
}

// Loading fallback for Suspense
function BookPageLoading() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center">
      <Loader2 className="w-10 h-10 text-gold animate-spin" />
    </div>
  )
}

// Default export with Suspense boundary for useSearchParams
export default function BookPage() {
  return (
    <Suspense fallback={<BookPageLoading />}>
      <BookPageContent />
    </Suspense>
  )
}