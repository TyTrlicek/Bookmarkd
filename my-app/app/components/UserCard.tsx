'use client'

import { PublicUser, UserRecommendation } from '../types/types'
import Image from 'next/image'
import Link from 'next/link'
import { User as UserIcon, Users } from 'lucide-react'
import FollowButton from './FollowButton'

interface UserCardProps {
  user: PublicUser | UserRecommendation
  showFollowButton?: boolean
  showBio?: boolean
  size?: 'sm' | 'md' | 'lg'
  onFollowChange?: (userId: string, isFollowing: boolean) => void
  currentUserId?: string
}

export default function UserCard({
  user,
  showFollowButton = true,
  showBio = true,
  size = 'md',
  onFollowChange,
  currentUserId
}: UserCardProps) {
  const isOwnProfile = currentUserId === user.id
  const reason = 'reason' in user ? user.reason : undefined

  const sizeClasses = {
    sm: {
      container: 'p-3',
      avatar: 'w-10 h-10',
      username: 'text-sm',
      stats: 'text-xs',
      bio: 'text-xs'
    },
    md: {
      container: 'p-4',
      avatar: 'w-12 h-12',
      username: 'text-base',
      stats: 'text-sm',
      bio: 'text-sm'
    },
    lg: {
      container: 'p-6',
      avatar: 'w-16 h-16',
      username: 'text-lg',
      stats: 'text-sm',
      bio: 'text-base'
    }
  }

  const classes = sizeClasses[size]

  return (
    <div className={`rounded-xl border border-line bg-surface transition-colors hover:border-line-strong ${classes.container}`}>
      <div className="flex items-start gap-3">
        <Link href={`/u/${user.username}`} className="flex-shrink-0">
          {user.avatar_url ? (
            <Image
              src={user.avatar_url}
              alt={`${user.username}'s avatar`}
              width={64}
              height={64}
              className={`${classes.avatar} rounded-full border border-line object-cover transition-colors hover:border-gold/50`}
            />
          ) : (
            <div className={`${classes.avatar} flex items-center justify-center rounded-full border border-line bg-overlay`}>
              <UserIcon className="h-1/2 w-1/2 text-ink-mute" />
            </div>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link
                href={`/u/${user.username}`}
                className={`block truncate font-semibold text-ink transition-colors hover:text-gold ${classes.username}`}
              >
                {user.username}
              </Link>
              <div className={`mt-1 flex items-center gap-3 text-ink-mute ${classes.stats}`}>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {user.followerCount} followers
                </span>
              </div>
            </div>

            {showFollowButton && !isOwnProfile && (
              <FollowButton
                userId={user.id}
                initialIsFollowing={user.isFollowing || false}
                size={size === 'lg' ? 'md' : 'sm'}
                onFollowChange={(isFollowing) => onFollowChange?.(user.id, isFollowing)}
              />
            )}
          </div>

          {showBio && user.bio && (
            <p className={`mt-2 line-clamp-2 text-ink-mute ${classes.bio}`}>
              {user.bio}
            </p>
          )}

          {reason && (
            <p className={`mt-2 text-gold/80 ${classes.stats}`}>
              {reason}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
