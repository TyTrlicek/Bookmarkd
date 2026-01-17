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
      className="fixed inset-0 bg-[#14181C]/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-[#14181C] border border-[#3D4451] rounded-2xl max-w-md w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3D4451]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
              <ListPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-stone-50">
                {isEditMode ? 'Edit List' : 'Create New List'}
              </h3>
              <p className="text-stone-400 text-sm">
                {isEditMode ? 'Update your list details' : 'Curate your own book collection'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-stone-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              List Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Best Fantasy Books of 2024"
              maxLength={100}
              className="w-full px-4 py-3 bg-[#2C3440] border border-[#3D4451] rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-stone-500 text-stone-50"
            />
            <p className="text-xs text-stone-500 mt-1">{title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-stone-300 mb-2">
              <AlignLeft className="w-4 h-4 inline mr-1" />
              Description <span className="text-stone-500">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this list about?"
              maxLength={500}
              rows={3}
              className="w-full px-4 py-3 bg-[#2C3440] border border-[#3D4451] rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors placeholder-stone-500 text-stone-50 resize-none"
            />
            <p className="text-xs text-stone-500 mt-1">{description.length}/500</p>
          </div>

          {/* Toggle Options */}
          <div className="space-y-3">
            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between p-4 bg-[#2C3440] rounded-xl border border-[#3D4451]">
              <div className="flex items-center gap-3">
                {isPublic ? (
                  <Globe className="w-5 h-5 text-green-400" />
                ) : (
                  <Lock className="w-5 h-5 text-stone-400" />
                )}
                <div>
                  <p className="text-stone-50 font-medium">
                    {isPublic ? 'Public' : 'Private'}
                  </p>
                  <p className="text-stone-400 text-xs">
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
                  isPublic ? 'bg-green-500' : 'bg-stone-600'
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
            <div className="flex items-center justify-between p-4 bg-[#2C3440] rounded-xl border border-[#3D4451]">
              <div className="flex items-center gap-3">
                <Hash className={`w-5 h-5 ${isRanked ? 'text-purple-400' : 'text-stone-400'}`} />
                <div>
                  <p className="text-stone-50 font-medium">
                    {isRanked ? 'Ranked List' : 'Unranked List'}
                  </p>
                  <p className="text-stone-400 text-xs">
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
                  isRanked ? 'bg-purple-500' : 'bg-stone-600'
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
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 border border-[#3D4451] text-stone-300 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25"
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
