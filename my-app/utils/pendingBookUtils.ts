import axios from 'axios'
import { supabase } from '@/lib/supabaseClient'

interface PendingBookAddition {
  openLibraryId: string
  rating: number
  status: string
  bookData: any
  timestamp: number
}

export const addPendingBookToCollection = async (): Promise<{ success: boolean, book?: any, error?: string }> => {
  try {
    // Get pending book data from localStorage
    const pendingData = localStorage.getItem('pendingBookAddition')
    if (!pendingData) {
      return { success: false, error: 'No pending book addition found' }
    }

    const pending: PendingBookAddition = JSON.parse(pendingData)

    // Check if the data is not too old (1 hour max)
    const oneHour = 60 * 60 * 1000
    if (Date.now() - pending.timestamp > oneHour) {
      localStorage.removeItem('pendingBookAddition')
      return { success: false, error: 'Pending book addition expired' }
    }

    // Get current session
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token

    if (!accessToken) {
      return { success: false, error: 'User not authenticated' }
    }

    // Add book to collection
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/user/booklist`,
      {
        openLibraryId: pending.openLibraryId,
        rating: pending.rating,
        status: pending.status
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // Clean up localStorage
    localStorage.removeItem('pendingBookAddition')

    return {
      success: true,
      book: {
        ...pending.bookData,
        rating: pending.rating,
        status: pending.status
      }
    }

  } catch (error) {
    console.error('Error adding pending book:', error)

    // Clean up localStorage on error
    localStorage.removeItem('pendingBookAddition')

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add book'
    }
  }
}

export const getPendingBookData = (): PendingBookAddition | null => {
  try {
    const pendingData = localStorage.getItem('pendingBookAddition')
    if (!pendingData) return null

    const pending: PendingBookAddition = JSON.parse(pendingData)

    // Check if expired
    const oneHour = 60 * 60 * 1000
    if (Date.now() - pending.timestamp > oneHour) {
      localStorage.removeItem('pendingBookAddition')
      return null
    }

    return pending
  } catch (error) {
    console.error('Error getting pending book data:', error)
    localStorage.removeItem('pendingBookAddition')
    return null
  }
}

export const clearPendingBookData = (): void => {
  localStorage.removeItem('pendingBookAddition')
}