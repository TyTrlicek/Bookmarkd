'use client'

import React, { useState } from 'react'
import { X, ListPlus, Lock, Globe, Hash, AlignLeft } from 'lucide-react'
import { List } from '../types/types'

interface CreateListModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (listData: {
    title: string
    description?: string
    isPublic: boolean
    isRanked: boolean
  }) => Promise<void>
  editList?: List | null
}

const CreateListModal: React.FC<CreateListModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editList = null
}) => {
  const [title, setTitle] = useState(editList?.title || '')
  const [description, setDescription] = useState(editList?.description || '')
  const [isPublic, setIsPublic] = useState(editList?.isPublic ?? true)
  const [isRanked, setIsRanked] = useState(editList?.isRanked ?? false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isEditMode = !!editList

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        isPublic,
        isRanked
      })
      onClose()
    } catch (err: any) {
      setError(err.message || 'Failed to save list')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-canvas-raised border border-line rounded-2xl max-w-md w-full "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ember rounded-xl flex items-center justify-center">
              <ListPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">
                {isEditMode ? 'Edit List' : 'Create New List'}
              </h3>
              <p className="text-ink-mute text-sm">
                {isEditMode ? 'Update your list details' : 'Make your own book collection'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-overlay transition-colors"
          >
            <X className="w-5 h-5 text-ink-mute" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-2">
              List Title <span className="text-rate-bad">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Best Fantasy Books of 2024"
              maxLength={100}
              className="w-full px-4 py-3 bg-overlay border border-line rounded-xl focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-colors placeholder-ink-faint text-ink"
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
              rows={3}
              className="w-full px-4 py-3 bg-overlay border border-line rounded-xl focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-colors placeholder-ink-faint text-ink resize-none"
            />
            <p className="text-xs text-ink0 mt-1">{description.length}/500</p>
          </div>

          {/* Toggle Options */}
          <div className="space-y-3">
            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between p-4 bg-overlay rounded-xl border border-line">
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
            <div className="flex items-center justify-between p-4 bg-overlay rounded-xl border border-line">
              <div className="flex items-center gap-3">
                <Hash className={`w-5 h-5 ${isRanked ? 'text-gold' : 'text-ink-mute'}`} />
                <div>
                  <p className="text-ink font-medium">
                    {isRanked ? 'Ranked List' : 'Unranked List'}
                  </p>
                  <p className="text-ink-mute text-xs">
                    {isRanked
                      ? 'Books will be numbered'
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

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-rate-bad/10 border border-rate-bad/30 rounded-xl text-rate-bad text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-line text-ink-soft rounded-xl hover:bg-overlay transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 px-4 py-3 bg-ember text-white hover:bg-ember-strong font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg "
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : isEditMode ? (
                'Save Changes'
              ) : (
                'Create List'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateListModal
