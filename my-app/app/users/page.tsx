'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import axios from 'axios'
import { Users, Loader2 } from 'lucide-react'
import { PublicUser, UserRecommendation } from '../types/types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import UserCard from '../components/UserCard'
import UserSearchInput from '../components/UserSearchInput'
import { useRouter } from 'next/navigation'

export default function UsersPage() {
  const router = useRouter()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<UserRecommendation[]>([])
  const [popularUsers, setPopularUsers] = useState<PublicUser[]>([])
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true)
  const [isLoadingPopular, setIsLoadingPopular] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setCurrentUserId(session.user.id)
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    }
    checkAuth()
  }, [])

  // Fetch recommendations (only for authenticated users)
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!isAuthenticated) {
        setIsLoadingRecommendations(false)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        const accessToken = session?.access_token

        if (!accessToken) {
          setIsLoadingRecommendations(false)
          return
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/recommendations`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { limit: 6 }
          }
        )

        // Filter out any users without usernames
        const validUsers = (response.data || []).filter((u: UserRecommendation) => u.username)
        setRecommendations(validUsers)
      } catch (error) {
        console.error('Error fetching recommendations:', error)
      } finally {
        setIsLoadingRecommendations(false)
      }
    }

    fetchRecommendations()
  }, [isAuthenticated])

  // Fetch popular users
  useEffect(() => {
    const fetchPopularUsers = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const accessToken = session?.access_token

        const headers: Record<string, string> = {}
        if (accessToken) {
          headers.Authorization = `Bearer ${accessToken}`
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/search`,
          {
            headers,
            params: { limit: 12 }
          }
        )

        // Filter out any users without usernames
        const validUsers = (response.data || []).filter((u: PublicUser) => u.username)
        setPopularUsers(validUsers)
      } catch (error) {
        console.error('Error fetching popular users:', error)
      } finally {
        setIsLoadingPopular(false)
      }
    }

    fetchPopularUsers()
  }, [])

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setRecommendations(prev => prev.map(user =>
      user.id === userId ? { ...user, isFollowing } : user
    ))
    setPopularUsers(prev => prev.map(user =>
      user.id === userId ? { ...user, isFollowing } : user
    ))
  }

  const handleUserClick = (user: PublicUser) => {
    router.push(`/u/${user.username}`)
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Header />

      <div className="mx-auto max-w-6xl px-6 py-12">
        {/* Page Header */}
        <div className="mb-10">
          <p className="kicker">Community</p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
            Discover readers
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-mute">
            Find and follow other readers to see their activity and pick up books through their taste.
          </p>
        </div>

        {/* Search */}
        <div className="mb-12 max-w-xl">
          <UserSearchInput
            placeholder="Search for users by username…"
            onResultClick={handleUserClick}
            currentUserId={currentUserId || undefined}
          />
        </div>

        {/* Recommendations Section (only for authenticated users) */}
        {isAuthenticated && (
          <section className="mb-12">
            <div className="mb-6">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-gold">For you</p>
              <h2 className="font-display mt-1.5 text-xl font-semibold text-ink">Recommended readers</h2>
              <p className="mt-1 text-sm text-ink-mute">Based on who you follow.</p>
            </div>

            {isLoadingRecommendations ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gold" />
              </div>
            ) : recommendations.length === 0 ? (
              <div className="rounded-2xl border border-line bg-surface/50 p-8 text-center">
                <Users className="mx-auto mb-3 h-10 w-10 text-ink-faint" />
                <p className="text-sm text-ink-mute">
                  Follow some readers to get personalized recommendations.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    currentUserId={currentUserId || undefined}
                    onFollowChange={handleFollowChange}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Popular Users Section */}
        <section>
          <div className="mb-6">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-hue-lists">Popular</p>
            <h2 className="font-display mt-1.5 text-xl font-semibold text-ink">Most followed</h2>
            <p className="mt-1 text-sm text-ink-mute">Readers with the biggest followings.</p>
          </div>

          {isLoadingPopular ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : popularUsers.length === 0 ? (
            <div className="rounded-2xl border border-line bg-surface/50 p-8 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-ink-faint" />
              <p className="text-sm text-ink-mute">No users found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {popularUsers.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  currentUserId={currentUserId || undefined}
                  onFollowChange={handleFollowChange}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  )
}
