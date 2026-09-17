'use client'

import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import axios from 'axios'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  userId: string
  initialIsFollowing: boolean
  onFollowChange?: (isFollowing: boolean) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline'
  className?: string
}

export default function FollowButton({
  userId,
  initialIsFollowing,
  onFollowChange,
  size = 'md',
  variant = 'default',
  className = ''
}: FollowButtonProps) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [isLoading, setIsLoading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pendingRef = useRef(false)

  const handleClick = useCallback(async () => {
    // Prevent double-clicks and race conditions
    if (pendingRef.current || isLoading) return
    pendingRef.current = true
    setError(null)

    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token

    if (!accessToken) {
      pendingRef.current = false
      router.push('/auth?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    // Optimistic update
    const previousState = isFollowing
    setIsFollowing(!isFollowing)
    onFollowChange?.(!isFollowing)
    setIsLoading(true)

    try {
      if (previousState) {
        await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${userId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      } else {
        await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/follow/${userId}`, {}, {
          headers: { Authorization: `Bearer ${accessToken}` }
        })
      }
    } catch (err) {
      // Revert optimistic update on error
      setIsFollowing(previousState)
      onFollowChange?.(previousState)

      const errorMessage = axios.isAxiosError(err) && err.response?.data?.error
        ? err.response.data.error
        : 'Failed to update follow status'
      setError(errorMessage)
      console.error('Failed to toggle follow:', err)

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000)
    } finally {
      setIsLoading(false)
      pendingRef.current = false
    }
  }, [isFollowing, isLoading, userId, router, onFollowChange])

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2'
  }

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  const variantClasses = {
    default: isFollowing
      ? isHovered
        ? 'bg-rate-bad/15 text-rate-bad border border-rate-bad/30 hover:bg-rate-bad/25'
        : 'bg-overlay text-ink-soft border border-line-strong hover:bg-overlay-hover'
      : 'bg-ember text-white hover:bg-ember-strong',
    outline: isFollowing
      ? isHovered
        ? 'border border-rate-bad/30 text-rate-bad hover:bg-rate-bad/10'
        : 'border border-line-strong text-ink-soft hover:bg-overlay'
      : 'border border-gold/50 text-gold hover:bg-gold-dim'
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={handleClick}
        disabled={isLoading}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        {isLoading ? (
          <Loader2 className={`${iconSizes[size]} animate-spin`} />
        ) : isFollowing ? (
          <>
            <UserMinus className={iconSizes[size]} />
            <span>{isHovered ? 'Unfollow' : 'Following'}</span>
          </>
        ) : (
          <>
            <UserPlus className={iconSizes[size]} />
            <span>Follow</span>
          </>
        )}
      </button>
      {error && (
        <div className="absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-rate-bad/90 px-3 py-1.5 text-xs text-white shadow-lg">
          {error}
        </div>
      )}
    </div>
  )
}
