'use client'

import { getBookData } from '../../../utils/util'
import Header from '@/app/components/Header'
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'


import { 
  BookOpen, 
  Star, 
  Heart, 
  Share2, 
  Download, 
  ShoppingCart,
  TrendingUp,
  Calendar,
  Users,
  Award,
  ChevronRight,
  Play,
  Bookmark,
  MessageCircle,
  Plus,
  ExternalLink
} from 'lucide-react'
import AddToCollectionPopup from '@/app/components/AddToCollectionPopup'

import Review from '@/app/components/Review'
import Image from 'next/image'

const BookPage = () => {
  const params = useParams()
  const id = decodeURIComponent(params.id as string)

  const router = useRouter()
  
  const [image, setImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFavorited, setIsFavorited] = useState(false)
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
  const [reviewFilter, setReviewFilter] = useState('');
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [userRecommendation, setUserRecommendation] = useState('');
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [reviewContent, setReviewContent] = useState('');


  useEffect(() => {
    const fetchCover = async () => {
      try {
        const data = await getBookData(id)
        const img = data?.image || null
        const userStatus = data?.userStatus || null
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

  const formatDate = (dateString: string, longYear = false) => {
            const date = new Date(dateString);
            const month = date.getMonth() + 1;
            const day = date.getDate();
            const year = longYear ? date.getFullYear() : date.getFullYear().toString().slice(-2);
            return `${month}-${day}-${year}`;
          };






return (
    <div className="min-h-screen">
      <Header />
      
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-800 to-stone-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Sidebar - Book Cover & Actions */}
            <div className="lg:col-span-1">
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                
                {/* Book Cover */}
                <div className="text-center mb-6">
                  {isLoading ? (
                    <div className="w-48 h-72 bg-stone-600/30 animate-pulse rounded-lg mx-auto shadow-md" />
                  ) : (
                    <Image
                    priority
                    width={192}
                    height={288}
                      src={image || ''}
                      alt={`Cover for ${title}`}
                      className="min-w-60 min-h-96 object-cover rounded-lg mx-auto shadow-md hover:shadow-lg transition-shadow"
                    />
                  )}
                </div>

                {/* Primary Actions */}
                <div className="space-y-3 mb-6">
                  {/* <button className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg">
                    <ShoppingCart className="w-4 h-4" />
                    Buy Now - $12.99
                  </button> */}
                  
                  <AddToCollectionPopup openLibraryId = {openLibraryId || ''} buttonType='book-page' userStatus={userStatus}/>
                </div>

                {/* Metadata */}
                <div className="space-y-4 mb-6">
                  <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                    <h3 className="font-semibold text-white mb-3">Book Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stone-300">Author:</span>
                        <span className="text-white font-medium">{author}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-300">Published:</span>
                        <span className="text-white">{formatDate(publishedDate)}</span>
                      </div>
                      {/* <div className="flex justify-between">
                        <span className="text-stone-300">Pages:</span>
                        <span className="text-white">{pageCount}</span>
                      </div> */}
                      <div className="flex justify-between">
                        <span className="text-stone-300">Genre:</span>
                        <span className="text-white">{categories[0]}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Secondary Actions */}
                {/* <div className="flex gap-2">
                  <button 
                    className={`flex-1 p-2 rounded-lg border transition-all backdrop-blur-sm ${
                      isFavorited 
                        ? 'bg-red-500/20 text-red-400 border-red-400/30 hover:bg-red-500/30' 
                        : 'bg-white/5 text-stone-300 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => setIsFavorited(!isFavorited)}
                  >
                    <Heart className={`w-4 h-4 mx-auto ${isFavorited ? 'fill-current' : ''}`} />
                  </button>
                  <button className="flex-1 p-2 bg-white/5 text-stone-300 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm">
                    <Share2 className="w-4 h-4 mx-auto" />
                  </button>
                  <button className="flex-1 p-2 bg-white/5 text-stone-300 border border-white/10 rounded-lg hover:bg-white/10 hover:text-white transition-all backdrop-blur-sm">
                    <ExternalLink className="w-4 h-4 mx-auto" />
                  </button>
                </div> */}
              </div>
            </div>

            {/* Right Content Area */}
            <div className="lg:col-span-2">
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10">
                
                {/* Header with Title */}
                <div className="p-6 border-b border-white/10">
                  <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
                  <p className="text-stone-300">By {author}</p>
                </div>

                {/* Statistics Bar */}
                <div className="p-6 border-b border-white/10">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    
                    {/* Score */}
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-xl p-4 mb-2 shadow-lg">
                        <div className="text-2xl font-bold">{averageRating?.toFixed(2) ?? 'N/A'}</div>
                        <div className="text-xs opacity-90">SCORE</div>
                      </div>
                      <div className="text-xs text-stone-400">
                        {totalRatings ?? 0} ratings
                      </div>
                    </div>

                    {/* Ranking */}
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-xl p-4 mb-2 shadow-lg">
                        <div className="text-2xl font-bold">#{ratingRank}</div>
                        <div className="text-xs opacity-90">RANKED</div>
                      </div>
                      <div className="text-xs text-stone-400">
                        Top books
                      </div>
                    </div>

                    {/* Popularity */}
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl p-4 mb-2 shadow-lg">
                        <div className="text-2xl font-bold">#{popularityRank}</div>
                        <div className="text-xs opacity-90">POPULAR</div>
                      </div>
                      <div className="text-xs text-stone-400">
                        Most read
                      </div>
                    </div>

                    {/* Members */}
                    <div className="text-center">
                      <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-xl p-4 mb-2 shadow-lg">
                        <div className="text-2xl font-bold">{totalRatings ?? 0}</div>
                        <div className="text-xs opacity-90">MEMBERS</div>
                      </div>
                      <div className="text-xs text-stone-400">
                        In collections
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Description</h2>
                  <div className="prose prose-stone max-w-none">
                      <p className="text-stone-300 leading-relaxed">
                          {description || 'No description available.'}
                      </p>
                  </div>

                  {/* Tags */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-white mb-2">Genres</h3>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-sm border border-amber-400/20 backdrop-blur-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Review 
                    totalRatings={totalRatings} 
                    setShowWriteReview={setShowWriteReview} 
                    showWriteReview={showWriteReview} 
                    setUserRecommendation={setUserRecommendation} 
                    userRecommendation={userRecommendation} 
                    reviewContent={reviewContent} 
                    containsSpoilers={containsSpoilers} 
                    setContainsSpoilers={setContainsSpoilers} 
                    reviewFilter={reviewFilter} 
                    setReviewFilter={setReviewFilter} 
                    id={id} 
                    setReviewContent={setReviewContent}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookPage