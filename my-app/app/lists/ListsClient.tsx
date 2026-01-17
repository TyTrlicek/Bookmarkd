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

  return (
    <div className="min-h-screen bg-[#14181C]">
      <Header />

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <ListPlus className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-stone-50">Lists</h1>
            </div>
            <p className="text-stone-400">
              Discover curated book collections from the community
            </p>
          </div>

          {isAuthenticated && (
            <Link
              href="/lists/new"
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-400 hover:to-purple-500 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-500/25"
            >
              <Plus className="w-5 h-5" />
              Create List
            </Link>
          )}
        </div>

        {/* Sort Tabs */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => {
              setSort('recent')
              setPage(1)
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              sort === 'recent'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-stone-400 hover:text-stone-300 hover:bg-white/5'
            }`}
          >
            <Clock className="w-4 h-4" />
            Recent
          </button>
          <button
            onClick={() => {
              setSort('popular')
              setPage(1)
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              sort === 'popular'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-stone-400 hover:text-stone-300 hover:bg-white/5'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Popular
          </button>
        </div>

        {/* Lists Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
          </div>
        ) : lists.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ListPlus className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-stone-50 mb-3">No Lists Yet</h2>
            <p className="text-stone-400 mb-6 max-w-md mx-auto">
              Be the first to create a curated book collection for the community!
            </p>
            {isAuthenticated && (
              <Link
                href="/lists/new"
                className="inline-flex items-center gap-2 px-5 py-3 bg-purple-500 hover:bg-purple-400 text-white font-semibold rounded-xl transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create List
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {lists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#2C3440] hover:bg-[#3D4451] text-stone-300 rounded-lg border border-[#3D4451] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <span className="text-stone-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#2C3440] hover:bg-[#3D4451] text-stone-300 rounded-lg border border-[#3D4451] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
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
