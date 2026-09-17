'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import axios from 'axios'
import Image from 'next/image'
import Link from 'next/link'
import {
  User as UserIcon,
  Users,
  BookOpen,
  Star,
  ListPlus,
  Loader2,
  BookMarked,
  Heart,
  Clock,
} from 'lucide-react'
import { PublicProfile } from '../../types/types'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import FollowButton from '../../components/FollowButton'
import FollowersModal from '../../components/FollowersModal'
import { formatDate } from '@/utils/util'

export default function PublicProfilePage() {
  const params = useParams()
  const username = params.username as string

  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'books' | 'reviews' | 'lists'>('books')
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        const accessToken = session?.access_token

        if (session?.user) {
          setCurrentUserId(session.user.id)
        }

        const headers: Record<string, string> = {}
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/u/${username}`,
          { headers }
        )

        setProfile(response.data)
      } catch (err: any) {
        if (err.response?.status === 404) {
          setError('User not found')
        } else {
          setError('Failed to load profile')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [username])

  const handleFollowChange = (isFollowing: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        isFollowing,
        followerCount: isFollowing ? profile.followerCount + 1 : profile.followerCount - 1,
      })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-canvas">
        <Header />
        <div className="mx-auto max-w-4xl px-6 py-32 text-center">
          <UserIcon className="mx-auto mb-6 h-16 w-16 text-ink-faint" />
          <h1 className="font-display text-2xl font-semibold text-ink">{error || 'User not found'}</h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-ink-mute">
            The reader you&apos;re looking for doesn&apos;t exist or may have been removed.
          </p>
          <Link
            href="/users"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ember-strong"
          >
            Discover readers
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  const isOwnProfile = currentUserId === profile.id

  const posterLink = (openLibraryId: string | undefined, image: string | undefined, title: string, badge?: React.ReactNode) => (
    <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-line bg-surface-2 transition-colors group-hover:border-gold/50">
      {image ? (
        <Image src={image} alt={title} width={200} height={300} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <BookOpen className="h-8 w-8 text-ink-faint" />
        </div>
      )}
      {badge}
    </div>
  )

  return (
    <div className="min-h-screen bg-canvas">
      <Header />

      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Profile Header */}
        <div className="mb-8 rounded-3xl border border-line bg-surface/50 p-8">
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-full border border-line-strong">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={`${profile.username}'s profile`}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-overlay">
                  <UserIcon className="h-12 w-12 text-ink-mute" />
                </div>
              )}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-ink">
                {profile.username}
              </h1>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-sm text-ink-mute md:justify-start">
                <button
                  onClick={() => setShowFollowersModal(true)}
                  className="flex items-center gap-1.5 transition-colors hover:text-gold"
                >
                  <Users className="h-4 w-4" />
                  <span className="font-semibold text-ink">{profile.followerCount}</span> followers
                </button>
                <button
                  onClick={() => setShowFollowingModal(true)}
                  className="flex items-center gap-1.5 transition-colors hover:text-gold"
                >
                  <span className="font-semibold text-ink">{profile.followingCount}</span> following
                </button>
              </div>

              {profile.bio && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{profile.bio}</p>
              )}
            </div>

            {!isOwnProfile && (
              <FollowButton
                userId={profile.id}
                initialIsFollowing={profile.isFollowing || false}
                size="lg"
                onFollowChange={handleFollowChange}
              />
            )}

            {isOwnProfile && (
              <Link
                href="/profile"
                className="rounded-full border border-line-strong bg-overlay px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-overlay-hover"
              >
                Edit profile
              </Link>
            )}
          </div>
        </div>

        {/* Favorites */}
        {profile.favoriteBooks && profile.favoriteBooks.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Heart className="h-4 w-4 text-rate-bad" />
              <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-mute">
                Favorite books
              </h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {profile.favoriteBooks.slice(0, 4).map((book) => (
                <Link key={book.id} href={`/book/${book.openLibraryId}`} className="group">
                  {posterLink(book.openLibraryId, book.image, book.title)}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recently Rated */}
        {profile.recentBooks && profile.recentBooks.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-gold" />
              <h2 className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-mute">
                Recent ratings
              </h2>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {profile.recentBooks.slice(0, 4).map((book) => (
                <Link key={book.id} href={`/book/${book.openLibraryId}`} className="group">
                  {posterLink(
                    book.openLibraryId,
                    book.image,
                    book.title,
                    <div className="absolute bottom-1 left-1 flex items-center gap-0.5 rounded bg-canvas/80 px-1.5 py-0.5 backdrop-blur-sm">
                      <Star className="h-2.5 w-2.5 fill-gold text-gold" />
                      <span className="text-[10px] font-medium text-ink">{book.rating}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          {[
            { icon: BookMarked, value: profile.bookCount, label: 'Books', color: 'text-rate-good' },
            { icon: Star, value: profile.reviewCount, label: 'Reviews', color: 'text-gold' },
            { icon: ListPlus, value: profile.listCount, label: 'Lists', color: 'text-hue-lists' },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="rounded-2xl border border-line bg-surface/50 p-6 text-center">
              <Icon className={`mx-auto mb-2 h-6 w-6 ${color}`} />
              <div className="font-display text-2xl font-semibold text-ink">{value}</div>
              <div className="text-xs text-ink-mute">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 border-b border-line">
          {(['books', 'reviews', 'lists'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`-mb-px border-b-2 px-5 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-gold text-gold'
                  : 'border-transparent text-ink-mute hover:text-ink'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Books tab */}
        {activeTab === 'books' && (
          <div>
            {profile.recentBooks.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface/50 py-12 text-center">
                <BookOpen className="mx-auto mb-3 h-10 w-10 text-ink-faint" />
                <p className="text-sm text-ink-mute">No rated books yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {profile.recentBooks.map((book) => (
                  <Link key={book.id} href={`/book/${book.openLibraryId}`} className="group">
                    {posterLink(book.openLibraryId, book.image, book.title)}
                    <div className="mt-2">
                      <h3 className="truncate text-sm font-medium text-ink transition-colors group-hover:text-gold">
                        {book.title}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-ink-mute">
                        <Star className="h-3 w-3 fill-gold text-gold" />
                        {book.rating}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === 'reviews' && (
          <div>
            {profile.recentReviews.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface/50 py-12 text-center">
                <Star className="mx-auto mb-3 h-10 w-10 text-ink-faint" />
                <p className="text-sm text-ink-mute">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.recentReviews.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-line bg-surface/50 p-6">
                    <Link
                      href={`/book/${review.book.openLibraryId}`}
                      className="mb-4 flex items-start gap-4"
                    >
                      <div className="h-16 w-11 flex-shrink-0 overflow-hidden rounded bg-surface-2">
                        {review.book.image && (
                          <Image
                            src={review.book.image}
                            alt={review.book.title}
                            width={48}
                            height={72}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-ink transition-colors hover:text-gold">
                          {review.book.title}
                        </h3>
                        <p className="text-sm text-ink-mute">{review.book.author}</p>
                      </div>
                    </Link>
                    <p className="line-clamp-3 text-sm text-ink-soft">{review.content}</p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-ink-faint">
                      <span>{formatDate(review.createdAt)}</span>
                      <span>{review.helpfulCount} likes</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lists tab */}
        {activeTab === 'lists' && (
          <div>
            {profile.publicLists.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface/50 py-12 text-center">
                <ListPlus className="mx-auto mb-3 h-10 w-10 text-ink-faint" />
                <p className="text-sm text-ink-mute">No public lists yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                {profile.publicLists.map((list) => (
                  <Link
                    key={list.id}
                    href={`/lists/${list.id}`}
                    className="rounded-2xl border border-line bg-surface/50 p-4 transition-colors hover:border-line-strong"
                  >
                    <div className="mb-3 flex gap-1">
                      {list.previewBooks.slice(0, 4).map((book) => (
                        <div key={book.id} className="h-14 w-10 overflow-hidden rounded bg-surface-2">
                          {book.image && (
                            <Image
                              src={book.image}
                              alt={book.title}
                              width={40}
                              height={56}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                    <h3 className="truncate font-semibold text-ink">{list.title}</h3>
                    <p className="text-sm text-ink-mute">
                      {list.itemCount} {list.itemCount === 1 ? 'book' : 'books'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <FollowersModal
        userId={profile.id}
        type="followers"
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        currentUserId={currentUserId || undefined}
      />

      <FollowersModal
        userId={profile.id}
        type="following"
        isOpen={showFollowingModal}
        onClose={() => setShowFollowingModal(false)}
        currentUserId={currentUserId || undefined}
      />

      <Footer />
    </div>
  )
}
