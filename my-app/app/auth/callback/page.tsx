'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import useAuthStore from '@/store/authStore'
import { addPendingBookToCollection, getPendingBookData } from '@/utils/pendingBookUtils'

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState('Completing sign in...')
  const [bookTitle, setBookTitle] = useState<string | null>(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth?error=callback_failed')
          return
        }

        if (data.session) {
          // Update auth store
          useAuthStore.getState().setSession(data.session)

          // Check for pending book addition
          const pendingBook = getPendingBookData()

          if (pendingBook) {
            setBookTitle(pendingBook.bookData.title)
            setStatus(`Adding "${pendingBook.bookData.title}" to your collection...`)

            // Add the pending book
            const result = await addPendingBookToCollection()

            if (result.success) {
              setStatus(`Successfully added "${pendingBook.bookData.title}"!`)
              // Wait a bit to show success message
              setTimeout(() => {
                // Redirect back to the book page or home
                const redirectUrl = localStorage.getItem('loginRedirectUrl')
                localStorage.removeItem('loginRedirectUrl')

                if (redirectUrl) {
                  window.location.href = redirectUrl
                } else {
                  router.push('/')
                }
              }, 2000)
            } else {
              console.error('Failed to add pending book:', result.error)
              setStatus('Sign in complete! Redirecting...')
              // Still redirect even if book addition fails
              setTimeout(() => {
                const redirectUrl = localStorage.getItem('loginRedirectUrl')
                localStorage.removeItem('loginRedirectUrl')

                if (redirectUrl) {
                  window.location.href = redirectUrl
                } else {
                  router.push('/')
                }
              }, 1500)
            }
          } else {
            // No pending book, normal redirect
            const redirectUrl = localStorage.getItem('loginRedirectUrl')
            localStorage.removeItem('loginRedirectUrl')

            if (redirectUrl) {
              window.location.href = redirectUrl
            } else {
              router.push('/')
            }
          }
        } else {
          // No session, redirect to auth page
          router.push('/auth')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        router.push('/auth?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-[#14181C] to-[#14181C] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-stone-50 text-xl font-semibold mb-2">{status}</p>
        {bookTitle && (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-4 mt-4 border border-amber-500/30">
            <p className="text-amber-300 text-sm">
              📚 {bookTitle}
            </p>
          </div>
        )}
        <p className="text-stone-400 text-sm mt-4">Please wait while we complete the process.</p>
      </div>
    </div>
  )
}