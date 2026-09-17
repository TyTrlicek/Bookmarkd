'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { BookData } from '@/app/types/types'
import {
  ArrowLeft,
  Lock,
  Globe,
  Hash,
  AlignLeft,
  Search,
  Plus,
  X,
  Loader2,
  BookOpen,
  GripVertical,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import axios from 'axios'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'
import { getSearchData } from '@/utils/util'
import { debounce } from 'lodash'

interface ListBook {
  id: number
  title: string
  author: string
  image: string
  openLibraryId?: string
}

const NewListPage = () => {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [isRanked, setIsRanked] = useState(false)
  const [books, setBooks] = useState<ListBook[]>([])

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<BookData[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth?redirect=/lists/new')
    }
  }, [isAuthenticated, authLoading, router])

  // Search books
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      setShowSearchResults(false)
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    try {
      const response = await getSearchData(query)
      setSearchResults(response ?? [])
      setShowSearchResults(true)
    } catch (error) {
      console.error('Error searching books:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      handleSearch(query)
    }, 500),
    []
  )

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
      setIsSearching(false)
    }

    return () => {
      debouncedSearch.cancel()
    }
  }, [searchQuery, debouncedSearch])

  // Add book to list
  const handleAddBook = (book: BookData) => {
    // Check if book already exists (by id or openLibraryId)
    const isDuplicate = books.some((b) => {
      if (book.id && b.id === book.id) return true
      if (book.openLibraryId && b.openLibraryId === book.openLibraryId) return true
      return false
    })
    if (isDuplicate) {
      return
    }

    setBooks((prev) => [
      ...prev,
      {
        id: book.id,
        title: book.title,
        author: book.author,
        image: book.image,
        openLibraryId: book.openLibraryId
      }
    ])

    // Clear search
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  // Remove book from list
  const handleRemoveBook = (bookId: number) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId))
  }

  // Move book up in list
  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newBooks = [...books]
    ;[newBooks[index - 1], newBooks[index]] = [newBooks[index], newBooks[index - 1]]
    setBooks(newBooks)
  }

  // Move book down in list
  const handleMoveDown = (index: number) => {
    if (index === books.length - 1) return
    const newBooks = [...books]
    ;[newBooks[index], newBooks[index + 1]] = [newBooks[index + 1], newBooks[index]]
    setBooks(newBooks)
  }

  // Submit list
  const handleSubmit = async () => {
    setError('')

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (title.length > 100) {
      setError('Title must be 100 characters or less')
      return
    }

    if (description.length > 500) {
      setError('Description must be 500 characters or less')
      return
    }

    setIsSubmitting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        throw new Error('Please log in to create a list')
      }

      // Create the list
      const createResponse = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/lists`,
        {
          title: title.trim(),
          description: description.trim() || undefined,
          isPublic,
          isRanked
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const listId = createResponse.data.id

      // Add books to the list
      for (let i = 0; i < books.length; i++) {
        const book = books[i]
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/lists/${listId}/books`,
          {
            bookId: book.id || undefined,
            openLibraryId: book.openLibraryId,
            position: i + 1,
            // Send book data so the backend can create the book if needed
            bookData: {
              title: book.title,
              author: book.author,
              image: book.image
            }
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        )
      }

      // Redirect to the new list
      router.push(`/lists/${listId}`)
    } catch (err: any) {
      console.error('Error creating list:', err)
      setError(err.response?.data?.message || err.message || 'Failed to create list')
      setIsSubmitting(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-gold animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/lists"
              className="inline-flex items-center gap-2 text-ink-mute hover:text-ink-soft transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Lists
            </Link>
          </div>
          <h1 className="font-display text-xl font-semibold text-ink">New List</h1>
          <div className="w-24" /> {/* Spacer for alignment */}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Left Column - List Settings */}
          <div className="bg-surface rounded-2xl p-6 border border-line">
            <h2 className="font-display text-base font-semibold text-ink mb-6">List Settings</h2>

            <div className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-2">
                  Name <span className="text-rate-bad">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Best Fantasy Books of 2024"
                  maxLength={100}
                  className="w-full px-4 py-3 bg-canvas border border-line rounded-xl focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-colors placeholder-ink-faint text-ink"
                />
                <p className="text-xs text-ink0 mt-1">{title.length}/100</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-2">
                  <AlignLeft className="w-4 h-4 inline mr-1" />
                  Description <span className="text-ink0">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What's this list about?"
                  maxLength={500}
                  rows={4}
                  className="w-full px-4 py-3 bg-canvas border border-line rounded-xl focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-colors placeholder-ink-faint text-ink resize-none"
                />
                <p className="text-xs text-ink0 mt-1">{description.length}/500</p>
              </div>

              {/* Toggle Options */}
              <div className="space-y-3">
                {/* Public/Private Toggle */}
                <div className="flex items-center justify-between p-4 bg-canvas rounded-xl border border-line">
                  <div className="flex items-center gap-3">
                    {isPublic ? (
                      <Globe className="w-5 h-5 text-rate-high" />
                    ) : (
                      <Lock className="w-5 h-5 text-ink-mute" />
                    )}
                    <div>
                      <p className="text-ink font-medium">
                        {isPublic ? 'Public' : 'Private'}
                      </p>
                      <p className="text-ink-mute text-xs">
                        {isPublic
                          ? 'Anyone can view this list'
                          : 'Only you can see this list'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isPublic ? 'bg-rate-high' : 'bg-surface-2'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isPublic ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Ranked Toggle */}
                <div className="flex items-center justify-between p-4 bg-canvas rounded-xl border border-line">
                  <div className="flex items-center gap-3">
                    <Hash className={`w-5 h-5 ${isRanked ? 'text-gold' : 'text-ink-mute'}`} />
                    <div>
                      <p className="text-ink font-medium">
                        {isRanked ? 'Ranked List' : 'Unranked List'}
                      </p>
                      <p className="text-ink-mute text-xs">
                        {isRanked
                          ? 'Numbers will be shown'
                          : 'Books displayed without numbers'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRanked(!isRanked)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isRanked ? 'bg-ember' : 'bg-surface-2'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isRanked ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Add Books */}
          <div className="bg-surface rounded-2xl p-6 border border-line">
            <h2 className="font-display text-base font-semibold text-ink mb-6">Add Books</h2>

            {/* Search Input */}
            <div className="relative">
              <div className="relative">
                <Search
                  className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                    isSearching ? 'text-gold' : 'text-ink-mute'
                  }`}
                />
                {isSearching && (
                  <Loader2 className="w-4 h-4 text-gold absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin" />
                )}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for books..."
                  className={`w-full pl-10 py-3 bg-canvas border border-line rounded-xl focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-colors placeholder-ink-faint text-ink ${
                    isSearching ? 'pr-10' : 'pr-4'
                  }`}
                />
              </div>

              {/* Search Results Dropdown */}
              {(showSearchResults || isSearching) && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-canvas border border-line rounded-xl shadow-xl max-h-80 overflow-y-auto z-20">
                  {isSearching ? (
                    <div className="p-4 text-center">
                      <Loader2 className="w-5 h-5 text-gold animate-spin mx-auto mb-2" />
                      <p className="text-ink-mute text-sm">Searching books...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    searchResults.slice(0, 6).map((book) => {
                      const isAdded = books.some((b) =>
                        (book.id && b.id === book.id) ||
                        (book.openLibraryId && b.openLibraryId === book.openLibraryId)
                      )
                      return (
                        <div
                          key={book.id || book.openLibraryId || book.title}
                          onClick={() => !isAdded && handleAddBook(book)}
                          className={`p-3 border-b border-line last:border-b-0 flex items-center gap-3 ${
                            isAdded
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-surface cursor-pointer'
                          }`}
                        >
                          <div className="w-10 h-14 bg-surface-2 rounded overflow-hidden flex-shrink-0">
                            {book.image ? (
                              <Image
                                src={book.image}
                                alt={book.title}
                                width={40}
                                height={56}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-4 h-4 text-ink0" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-ink text-sm font-medium truncate">
                              {book.title}
                            </p>
                            <p className="text-ink-mute text-xs truncate">
                              {book.author || 'Unknown Author'}
                            </p>
                          </div>
                          {isAdded ? (
                            <span className="text-xs text-ink0">Added</span>
                          ) : (
                            <Plus className="w-5 h-5 text-gold flex-shrink-0" />
                          )}
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-4 text-center">
                      <BookOpen className="w-8 h-8 text-ink0 mx-auto mb-2" />
                      <p className="text-ink-mute text-sm">No books found</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Hint */}
            <p className="text-ink0 text-xs mt-3">
              Search for books by title or author and click to add them to your list.
            </p>
          </div>
        </div>

        {/* Books in List Section */}
        <div className="bg-surface rounded-2xl p-6 border border-line mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-base font-semibold text-ink">
              Books in This List ({books.length})
            </h2>
          </div>

          {books.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gold-dim rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-gold" />
              </div>
              <p className="text-ink-mute mb-2">No books added yet</p>
              <p className="text-ink0 text-sm">Use the search above to add books to your list</p>
            </div>
          ) : (
            <div className="space-y-3">
              {books.map((book, index) => (
                <div
                  key={book.id}
                  className="flex items-center gap-4 p-4 bg-canvas rounded-xl border border-line group"
                >
                  {/* Rank Number */}
                  {isRanked && (
                    <div className="w-8 h-8 bg-ember text-white font-semibold rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                      {index + 1}
                    </div>
                  )}

                  {/* Reorder Controls */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-ink0 hover:text-ink-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === books.length - 1}
                      className="p-1 text-ink0 hover:text-ink-soft disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Book Cover */}
                  <div className="w-12 h-16 bg-surface-2 rounded overflow-hidden flex-shrink-0">
                    {book.image ? (
                      <Image
                        src={book.image}
                        alt={book.title}
                        width={48}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-ink0" />
                      </div>
                    )}
                  </div>

                  {/* Book Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-ink font-medium truncate">{book.title}</p>
                    <p className="text-ink-mute text-sm truncate">
                      {book.author || 'Unknown Author'}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveBook(book.id)}
                    className="p-2 text-ink0 hover:text-rate-bad hover:bg-rate-bad/10 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-rate-bad/10 border border-rate-bad/30 rounded-xl text-rate-bad text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href="/lists"
            className="px-6 py-3 border border-line text-ink-soft rounded-xl hover:bg-overlay transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="px-8 py-3 bg-ember text-white hover:bg-ember-strong font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg "
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              'Save List'
            )}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}

export default NewListPage
