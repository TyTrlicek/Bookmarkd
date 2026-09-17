'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import axios from 'axios'
import { X, Users, Loader2 } from 'lucide-react'
import { FollowUser } from '../types/types'
import UserCard from './UserCard'

interface FollowersModalProps {
  userId: string
  type: 'followers' | 'following'
  isOpen: boolean
  onClose: () => void
  currentUserId?: string
}

export default function FollowersModal({
  userId,
  type,
  isOpen,
  onClose,
  currentUserId
}: FollowersModalProps) {
  const [users, setUsers] = useState<FollowUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const fetchUsers = useCallback(async (cursor?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const headers: Record<string, string> = {}
      if (accessToken) {
        headers.Authorization = `Bearer ${accessToken}`
      }

      const endpoint = type === 'followers'
        ? `/api/follow/users/${userId}/followers`
        : `/api/follow/users/${userId}/following`

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers,
        params: { cursor, limit: 20 }
      })

      return response.data
    } catch (error) {
      console.error(`Error fetching ${type}:`, error)
      return { users: [], nextCursor: null }
    }
  }, [userId, type])

  useEffect(() => {
    if (!isOpen) return

    const loadInitialUsers = async () => {
      setIsLoading(true)
      const data = await fetchUsers()
      setUsers(data.users)
      setNextCursor(data.nextCursor)
      setIsLoading(false)
    }

    loadInitialUsers()
  }, [isOpen, fetchUsers])

  const loadMore = async () => {
    if (!nextCursor || isLoadingMore) return

    setIsLoadingMore(true)
    const data = await fetchUsers(nextCursor)
    setUsers(prev => [...prev, ...data.users])
    setNextCursor(data.nextCursor)
    setIsLoadingMore(false)
  }

  const handleFollowChange = (targetUserId: string, isFollowing: boolean) => {
    setUsers(prev => prev.map(user =>
      user.id === targetUserId ? { ...user, isFollowing } : user
    ))
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-line bg-canvas-raised shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line p-5">
          <h3 className="font-display text-lg font-semibold capitalize tracking-[-0.02em] text-ink">
            {type}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-overlay hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-gold" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center">
              <Users className="mx-auto mb-3 h-10 w-10 text-ink-faint" />
              <p className="text-sm text-ink-mute">
                {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <>
              {users.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  size="sm"
                  showBio={false}
                  currentUserId={currentUserId}
                  onFollowChange={handleFollowChange}
                />
              ))}

              {nextCursor && (
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="flex w-full items-center justify-center gap-2 py-3 text-sm text-ink-mute transition-colors hover:text-ink"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading…
                    </>
                  ) : (
                    'Load more'
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
