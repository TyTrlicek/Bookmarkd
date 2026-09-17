'use client'

import React, { useState, useEffect } from 'react'
import { X, Plus, Check, ListPlus, Loader2 } from 'lucide-react'
import { List } from '../types/types'
import axios from 'axios'
import { supabase } from '@/lib/supabaseClient'
import CreateListModal from './CreateListModal'

interface AddToListPopupProps {
  isOpen: boolean
  onClose: () => void
  bookId: string
  bookTitle: string
  openLibraryId?: string
  bookImage?: string
  bookAuthor?: string
}

const AddToListPopup: React.FC<AddToListPopupProps> = ({
  isOpen,
  onClose,
  bookId,
  bookTitle,
  openLibraryId,
  bookImage,
  bookAuthor
}) => {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [addingToList, setAddingToList] = useState<string | null>(null)
  const [addedLists, setAddedLists] = useState<Set<string>>(new Set())
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchLists()
    }
  }, [isOpen])

  const fetchLists = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        setError('Please log in to manage lists')
        setLoading(false)
        return
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/lists`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      setLists(response.data)

      // Determine which lists already contain this book
      const listsWithBook = new Set<string>()
      response.data.forEach((list: any) => {
        const previewBooks = list.previewBooks || []
        if (previewBooks.some((book: any) => book.id === bookId)) {
          listsWithBook.add(list.id)
        }
      })
      setAddedLists(listsWithBook)
    } catch (err) {
      console.error('Error fetching lists:', err)
      setError('Failed to load lists')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToList = async (listId: string) => {
    if (addedLists.has(listId)) return

    setAddingToList(listId)
    setError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        setError('Please log in')
        return
      }

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/lists/${listId}/books`,
        {
          bookId,
          openLibraryId,
          bookData: openLibraryId ? {
            title: bookTitle,
            author: bookAuthor,
            image: bookImage
          } : undefined
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )

      setAddedLists((prev) => new Set([...prev, listId]))
    } catch (err: any) {
      if (err.response?.data?.error === 'Book already in this list') {
        setAddedLists((prev) => new Set([...prev, listId]))
      } else {
        setError(err.response?.data?.error || 'Failed to add book to list')
      }
    } finally {
      setAddingToList(null)
    }
  }

  const handleCreateList = async (listData: {
    title: string
    description?: string
    isPublic: boolean
    isRanked: boolean
  }) => {
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token

    if (!accessToken) {
      throw new Error('Please log in')
    }

    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/lists`,
      listData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // Add book to the new list
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/lists/${response.data.id}/books`,
      {
        bookId,
        openLibraryId,
        bookData: openLibraryId ? {
          title: bookTitle,
          author: bookAuthor,
          image: bookImage
        } : undefined
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // Refresh lists
    await fetchLists()
  }

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-canvas/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <div
          className="bg-canvas border border-line rounded-2xl max-w-md w-full shadow-2xl max-h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-line flex-shrink-0">
            <div>
              <h3 className="text-lg font-bold text-ink">Add to List</h3>
              <p className="text-ink-mute text-sm truncate max-w-[250px]">
                {bookTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-ink-mute" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-ink-mute animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={fetchLists}
                  className="text-ink-mute hover:text-ink text-sm"
                >
                  Try again
                </button>
              </div>
            ) : lists.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-overlay rounded-full flex items-center justify-center mx-auto mb-4">
                  <ListPlus className="w-8 h-8 text-ink-mute" />
                </div>
                <p className="text-ink-mute mb-4">You don't have any lists yet</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-ember hover:bg-ember-strong text-white font-semibold rounded-full transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create your first list
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {lists.map((list) => {
                  const isAdded = addedLists.has(list.id)
                  const isAdding = addingToList === list.id

                  return (
                    <button
                      key={list.id}
                      onClick={() => handleAddToList(list.id)}
                      disabled={isAdded || isAdding}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isAdded
                          ? 'bg-overlay border-line-strong cursor-default'
                          : 'bg-surface border-line hover:border-line-strong'
                      }`}
                    >
                      <div className="text-left">
                        <p className="font-medium text-ink">{list.title}</p>
                        <p className="text-ink-mute text-sm">
                          {list._count?.items || 0} books
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        {isAdding ? (
                          <Loader2 className="w-5 h-5 text-ink-mute animate-spin" />
                        ) : isAdded ? (
                          <Check className="w-5 h-5 text-ink-mute" />
                        ) : (
                          <Plus className="w-5 h-5 text-ink-mute" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-line flex-shrink-0">
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-surface hover:bg-surface-2 text-ink font-medium rounded-xl border border-line transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create New List
            </button>
          </div>
        </div>
      </div>

      {/* Create List Modal */}
      <CreateListModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateList}
      />
    </>
  )
}

export default AddToListPopup
