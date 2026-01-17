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
      <div className="group bg-[#2C3440] rounded-xl border border-[#3D4451] hover:border-purple-500/50 transition-all duration-300 overflow-hidden hover:shadow-lg hover:shadow-purple-500/10">
        {/* Book Preview Grid */}
        <div className="aspect-square p-3 bg-[#14181C]">
          <div className="grid grid-cols-2 gap-1.5 w-full h-full">
            {[0, 1, 2, 3].map((index) => {
              const book = previewBooks[index]
              return (
                <div
                  key={index}
                  className="relative bg-[#2C3440] rounded-md overflow-hidden"
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
                      <div className="w-6 h-8 bg-[#3D4451] rounded-sm" />
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
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-stone-700/50 text-stone-400 text-xs rounded-full">
                <Lock className="w-3 h-3" />
                Private
              </span>
            )}
            {list.isRanked && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                <Hash className="w-3 h-3" />
                Ranked
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-stone-50 text-base line-clamp-2 mb-1 group-hover:text-purple-300 transition-colors">
            {list.title}
          </h3>

          {/* Book Count */}
          <p className="text-stone-400 text-sm mb-3">
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
                <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-3 h-3 text-white" />
                </div>
              )}
              <span className="text-stone-400 text-sm truncate">
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
