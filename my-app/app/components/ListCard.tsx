'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { List } from '../types/types'
import { Lock, Hash, User } from 'lucide-react'

interface ListCardProps {
  list: List
  showAuthor?: boolean
}

const ListCard: React.FC<ListCardProps> = ({ list, showAuthor = true }) => {
  const bookCount = list._count?.items || 0
  const previewBooks = list.previewBooks || []

  return (
    <Link href={`/lists/${list.id}`}>
      <div className="group bg-surface rounded-xl border border-line hover:border-line-strong transition-all duration-300 overflow-hidden ">
        {/* Book Preview Grid */}
        <div className="aspect-square p-3 bg-canvas">
          <div className="grid grid-cols-2 gap-1.5 w-full h-full">
            {[0, 1, 2, 3].map((index) => {
              const book = previewBooks[index]
              return (
                <div
                  key={index}
                  className="relative bg-surface rounded-md overflow-hidden"
                >
                  {book?.image ? (
                    <Image
                      src={book.image}
                      alt={book.title || 'Book cover'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 25vw, 15vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="w-6 h-8 bg-surface-2 rounded-sm" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* List Info */}
        <div className="p-4">
          {/* Badges */}
          <div className="flex items-center gap-2 mb-2">
            {!list.isPublic && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-overlay text-ink-mute text-xs rounded-full">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
            {list.isRanked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-overlay text-ink-mute text-xs rounded-full">
                <Hash className="w-3 h-3" />
                Ranked
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-ink text-base line-clamp-2 mb-1 group-hover:text-gold-soft transition-colors">
            {list.title}
          </h3>

          {/* Book Count */}
          <p className="text-ink-mute text-sm mb-3">
            {bookCount} {bookCount === 1 ? 'book' : 'books'}
          </p>

          {/* Author */}
          {showAuthor && list.user && (
            <div className="flex items-center gap-2">
              {list.user.avatar_url ? (
                <Image
                  src={list.user.avatar_url}
                  alt={list.user.username || 'User'}
                  width={24}
                  height={24}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-6 h-6 bg-gradient-to-br from-surface-2 to-surface-2 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-ink-mute text-sm truncate">
                {list.user.username || 'Anonymous'}
              </span>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default ListCard
