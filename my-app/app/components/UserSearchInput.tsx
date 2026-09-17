'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import axios from 'axios'
import { Search, Loader2, X } from 'lucide-react'
import { PublicUser } from '../types/types'
import UserCard from './UserCard'
import { debounce } from 'lodash'

interface UserSearchInputProps {
  onResultClick?: (user: PublicUser) => void
  placeholder?: string
  className?: string
  currentUserId?: string
}

export default function UserSearchInput({
  onResultClick,
  placeholder = 'Search users...',
  className = '',
  currentUserId
}: UserSearchInputProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PublicUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setIsLoading(true)

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
          params: { q: searchQuery, limit: 10 }
        }
      )

      setResults(response.data)
    } catch (error) {
      console.error('Error searching users:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Debounce the search function
  const debouncedSearch = useCallback(
    debounce((q: string) => searchUsers(q), 300),
    [searchUsers]
  )

  useEffect(() => {
    debouncedSearch(query)
    return () => debouncedSearch.cancel()
  }, [query, debouncedSearch])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleResultClick = (user: PublicUser) => {
    onResultClick?.(user)
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  const handleFollowChange = (userId: string, isFollowing: boolean) => {
    setResults(prev => prev.map(user =>
      user.id === userId ? { ...user, isFollowing } : user
    ))
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-full border border-line bg-overlay py-3 pl-11 pr-10 text-sm text-ink placeholder-ink-faint transition-colors focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/30"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('')
              setResults([])
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-faint transition-colors hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-line bg-canvas-raised shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gold" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-sm text-ink-mute">
              No users found
            </div>
          ) : (
            <div className="space-y-2 p-2">
              {results.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleResultClick(user)}
                  className="cursor-pointer"
                >
                  <UserCard
                    user={user}
                    size="sm"
                    showBio={false}
                    currentUserId={currentUserId}
                    onFollowChange={handleFollowChange}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
