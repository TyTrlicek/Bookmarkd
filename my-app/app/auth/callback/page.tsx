'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabaseClient'
import useAuthStore from '@/store/authStore'
import axios from 'axios'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the OAuth callback
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth?error=callback_error')
          return
        }

        if (data.session?.user) {
          const user = data.session.user
          
          // Check if this is a new Google user and create profile in your database
          try {
            // First check if user exists in your database
            const checkResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
              headers: { Authorization: `Bearer ${user.id}` },
            })
            
            // If user doesn't exist (404), create them
            if (checkResponse.status === 404) {
              await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/create`, {
                id: user.id,
                email: user.email,
                username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'user',
                avatar_url: user.user_metadata?.avatar_url || null,
              })
            }
          } catch (dbError: any) {
            // If error is 404, user doesn't exist, so create them
            if (dbError.response?.status === 404) {
              try {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/create`, {
                  id: user.id,
                  email: user.email,
                  username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'user',
                  avatar_url: user.user_metadata?.avatar_url || null,
                })
              } catch (createError) {
                console.error('Failed to create user in database:', createError)
              }
            } else {
              console.error('Database error:', dbError)
            }
          }

          // Initialize the auth store
          await useAuthStore.getState().initSession()
          
          // Redirect to home page
          router.push('/')
        } else {
          router.push('/auth')
        }
      } catch (error) {
        console.error('Callback handling error:', error)
        router.push('/auth?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-stone-600">Completing sign in...</p>
      </div>
    </div>
  )
}