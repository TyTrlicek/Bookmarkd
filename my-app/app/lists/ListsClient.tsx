'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { List } from '../types/types'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ListCard from '../components/ListCard'
import { ListPlus, TrendingUp, Clock, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '@/hooks/useAuth'

const ListsClient = () => {
  const { isAuthenticated } = useAuth()
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'recent' | 'popular'>('recent')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchLists()
  }, [sort, page])

  const fetchLists = async () => {
    setLoading(true)
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/lists/discover`,
        {
          params: { sort, page, limit: 20 }
        }
      )

      setLists(response.data.lists)
      setTotalPages(response.data.pagination.totalPages)
    } catch (err) {
      console.error('Error fetching lists:', err)
    } finally {
      setLoading(false)
    }
  }

  const tabClass = (active: boolean) =>
    `inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
      active ? 'bg-gold-dim text-gold' : 'text-ink-mute hover:text-ink'
    }`

  return (
    <div className="min-h-screen bg-canvas">
      <Header />

      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Page Header */}
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="kicker">Community</p>
            <h1 className="font-display mt-2 text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-4xl">
              Lists
            </h1>
            <p className="mt-2 text-sm text-ink-mute">Book collections from the community.</p>
          </div>

          {isAuthenticated && (
            <Link
              href="/lists/new"
              className="inline-flex items-center gap-2 rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ember-strong"
            >
              <Plus className="h-4 w-4" />
              Create list
            </Link>
          )}
        </div>

        {/* Sort Tabs */}
        <div className="mb-8 inline-flex rounded-full border border-line bg-overlay p-1">
          <button
            onClick={() => {
              setSort('recent')
              setPage(1)
            }}
            className={tabClass(sort === 'recent')}
          >
            <Clock className="h-3.5 w-3.5" />
            Recent
          </button>
          <button
            onClick={() => {
              setSort('popular')
              setPage(1)
            }}
            className={tabClass(sort === 'popular')}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Popular
          </button>
        </div>

        {/* Lists Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gold" />
          </div>
        ) : lists.length === 0 ? (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-line bg-overlay">
              <ListPlus className="h-6 w-6 text-ink-mute" />
            </div>
            <h2 className="font-display text-xl font-semibold text-ink">No lists yet</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-mute">
              Be the first to build a collection for the community.
            </p>
            {isAuthenticated && (
              <Link
                href="/lists/new"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ember-strong"
              >
                <Plus className="h-4 w-4" />
                Create list
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 lg:grid-cols-5">
              {lists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-overlay px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-overlay-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-sm text-ink-mute">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-2 rounded-full border border-line bg-overlay px-4 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-overlay-hover disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}

export default ListsClient
