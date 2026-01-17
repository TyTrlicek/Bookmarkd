'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Header from '@/app/components/Header'
import Footer from '@/app/components/Footer'
import { ListWithItems } from '@/app/types/types'
import {
  ArrowLeft,
  Lock,
  Globe,
  Hash,
  User,
  Edit3,
  Trash2,
  GripVertical,
  X,
  Loader2,
  Calendar,
  BookOpen,
  Plus
} from 'lucide-react'
import axios from 'axios'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/hooks/useAuth'

const ListDetailPage = () => {
  const params = useParams()
  const router = useRouter()
  const listId = params.id as string
  const { isAuthenticated } = useAuth()

  const [list, setList] = useState<ListWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isOwner, setIsOwner] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [removingBook, setRemovingBook] = useState<string | null>(null)

  useEffect(() => {
    fetchList()
  }, [listId])

  const fetchList = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      const userId = session?.user?.id

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/lists/${listId}`,
        accessToken
          ? {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          : {}
      )

      setList(response.data)
      setIsOwner(userId === response.data.userId)
    } catch (err: any) {
      console.error('Error fetching list:', err)
      if (err.response?.status === 404) {
        setError('List not found')
      } else if (err.response?.status === 403) {
        setError('This list is private')
      } else {
        setError('Failed to load list')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteList = async () => {
    setDeleting(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        throw new Error('Please log in')
      }

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/lists/${listId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      router.push('/profile')
    } catch (err) {
      console.error('Error deleting list:', err)
      setDeleting(false)
    }
  }

  const handleRemoveBook = async (bookId: string) => {
    setRemovingBook(bookId)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        throw new Error('Please log in')
      }

      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/api/lists/${listId}/books/${bookId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      // Update local state
      if (list) {
        setList({
          ...list,
          items: list.items.filter((item) => item.bookId !== bookId),
          _count: { items: (list._count?.items || 1) - 1 }
        })
      }
    } catch (err) {
      console.error('Error removing book:', err)
    } finally {
      setRemovingBook(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#14181C]">
        <Header />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !list) {
    return (
      <div className="min-h-screen bg-[#14181C]">
        <Header />
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <X className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-stone-50 mb-3">{error || 'List not found'}</h1>
          <p className="text-stone-400 mb-6">
            The list you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <Link
            href="/lists"
            className="inline-flex items-center gap-2 px-5 py-3 bg-purple-500 hover:bg-purple-400 text-white font-semibold rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Browse Lists
          </Link>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#14181C]">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Link */}
        <Link
          href="/lists"
          className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Lists
        </Link>

        {/* List Header */}
        <div className="bg-[#2C3440] rounded-2xl p-6 md:p-8 border border-[#3D4451] mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                {list.isPublic ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/20 text-green-300 text-xs rounded-full">
                    <Globe className="w-3 h-3" />
                    Public
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-700/50 text-stone-400 text-xs rounded-full">
                    <Lock className="w-3 h-3" />
                    Private
                  </span>
                )}
                {list.isRanked && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                    <Hash className="w-3 h-3" />
                    Ranked
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-bold text-stone-50 mb-3">
                {list.title}
              </h1>

              {/* Description */}
              {list.description && (
                <p className="text-stone-300 text-lg mb-4 max-w-2xl">
                  {list.description}
                </p>
              )}

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-stone-400">
                {/* Author */}
                <Link
                  href={`/user/${list.user?.id}`}
                  className="flex items-center gap-2 hover:text-stone-300 transition-colors"
                >
                  {list.user?.avatar_url ? (
                    <Image
                      src={list.user.avatar_url}
                      alt={list.user.username || 'User'}
                      width={24}
                      height={24}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                      <User className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span>{list.user?.username || 'Anonymous'}</span>
                </Link>

                {/* Book Count */}
                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4" />
                  <span>{list._count?.items || 0} books</span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Updated{' '}
                    {new Date(list.updatedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex items-center gap-3">
                <Link
                  href={`/lists/${listId}/edit`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#14181C] hover:bg-[#0D1117] text-stone-300 rounded-lg border border-[#3D4451] transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit
                </Link>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Books Grid */}
        {list.items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-stone-50 mb-3">No books yet</h2>
            <p className="text-stone-400">
              {isOwner
                ? 'Start adding books to your list from any book page.'
                : 'This list is empty.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {list.items.map((item, index) => (
              <div
                key={item.id}
                className="group relative bg-[#2C3440] rounded-xl border border-[#3D4451] overflow-hidden hover:border-purple-500/50 transition-all"
              >
                {/* Rank Number */}
                {list.isRanked && (
                  <div className="absolute top-2 left-2 z-10 w-8 h-8 bg-purple-500 text-white font-bold rounded-lg flex items-center justify-center text-sm shadow-lg">
                    {index + 1}
                  </div>
                )}

                {/* Remove Button (Owner) */}
                {isOwner && (
                  <button
                    onClick={() => handleRemoveBook(item.bookId)}
                    disabled={removingBook === item.bookId}
                    className="absolute top-2 right-2 z-10 w-8 h-8 bg-red-500/80 hover:bg-red-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {removingBook === item.bookId ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </button>
                )}

                {/* Book Cover */}
                <Link href={`/book/${item.book.openLibraryId}`}>
                  <div className="aspect-[2/3] relative">
                    {item.book.image ? (
                      <Image
                        src={item.book.image}
                        alt={item.book.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#3D4451] flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-stone-500" />
                      </div>
                    )}
                  </div>
                </Link>

                {/* Book Info */}
                <div className="p-3">
                  <Link href={`/book/${item.book.openLibraryId}`}>
                    <h3 className="font-medium text-stone-50 text-sm line-clamp-2 mb-1 hover:text-purple-300 transition-colors">
                      {item.book.title}
                    </h3>
                  </Link>
                  <p className="text-stone-400 text-xs truncate">
                    {item.book.author || 'Unknown Author'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-[#14181C]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            className="bg-[#14181C] border border-red-500/30 rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-stone-50 mb-2">Delete List?</h3>
              <p className="text-stone-400">
                Are you sure you want to delete "{list.title}"? This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 border border-[#3D4451] text-stone-300 rounded-xl hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteList}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

export default ListDetailPage
