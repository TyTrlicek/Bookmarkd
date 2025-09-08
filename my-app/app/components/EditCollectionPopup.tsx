import { BookOpenCheck, CheckCircle, Eye, Save, Star, Trash2, X } from "lucide-react"
import { BookInList } from "../types/types"
import { useState } from "react"
import axios from "axios"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"

interface EditCollectionPopupProps {
    showEditPopup: boolean;
    editingBook: BookInList | null;
    setBooks: React.Dispatch<React.SetStateAction<BookInList[]>>
    books: BookInList[]
    tempStatus: string | undefined;
    tempRating: number;
    setEditingBook: React.Dispatch<React.SetStateAction<BookInList | null>>;
    setShowEditPopup: React.Dispatch<React.SetStateAction<boolean>>
    setTempStatus: React.Dispatch<React.SetStateAction<string | undefined>>
    setHoverRating: React.Dispatch<React.SetStateAction<number>>
    setTempRating: React.Dispatch<React.SetStateAction<number>>
    hoverRating: number;
}

const EditCollectionPopup = ({showEditPopup, editingBook, setBooks, books, tempStatus, tempRating, setEditingBook, setShowEditPopup, setTempStatus, setHoverRating, setTempRating, hoverRating}: EditCollectionPopupProps) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    
    if (!showEditPopup || !editingBook) return null

    const handleSaveChanges = async () => {
        if (!editingBook) return
    
        try {
          // Store original values for rollback
          const originalBook = books.find(book => book.bookId === editingBook.bookId)
          const originalRating = originalBook?.rating
          const originalStatus = originalBook?.status
    
          // Update local state optimistically
          setBooks(prevBooks => 
            prevBooks.map(book => 
              book.bookId === editingBook.bookId 
                ? { ...book, rating: tempRating, status: tempStatus } 
                : book
            )
          )
    
          // Here you would make your API calls
          console.log(`Saving changes for book ${editingBook.bookId}:`, {
            rating: tempRating,
            status: tempStatus
          })
    
          const {
            data: { session }
          } = await supabase.auth.getSession();
          
          const accessToken = session?.access_token;
    
          if (!accessToken) {
            throw new Error('No access token available')
          }
    
          // Save rating if changed
          if (tempRating !== originalRating) {
            await axios.put(
              `${process.env.NEXT_PUBLIC_API_URL}/collection/rating`, 
              { rating: tempRating, bookId: editingBook.bookId }, 
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )
          }
    
          // Save status if changed
          if (tempStatus !== originalStatus) {
            await axios.put(
              `${process.env.NEXT_PUBLIC_API_URL}/collection/status`, 
              { status: tempStatus, bookId: editingBook.bookId }, 
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )
          }
    
          handleCloseEditPopup()
        } catch (error) {
          console.error('Error saving changes:', error)
          
          // Rollback the optimistic update
          const originalBook = books.find(book => book.bookId === editingBook.bookId)
          setBooks(prevBooks => 
            prevBooks.map(book => 
              book.bookId === editingBook.bookId 
                ? { ...book, rating: originalBook?.rating, status: originalBook?.status } 
                : book
            )
          )
          
          // Optional: Show error message to user
          alert('Failed to save changes. Please try again.')
        }
      }

    const handleDeleteBook = async () => {
        if (!editingBook) return

        try {
          // Optimistically remove from local state
          setBooks(prevBooks => 
            prevBooks.filter(book => book.bookId !== editingBook.bookId)
          )

          const {
            data: { session }
          } = await supabase.auth.getSession();
          
          const accessToken = session?.access_token;

          if (!accessToken) {
            throw new Error('No access token available')
          }

          // Make API call to delete book
          await axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/collection/${editingBook.bookId}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
              }
            }
          )

          console.log(`Book ${editingBook.bookId} deleted successfully`)
          handleCloseEditPopup()
        } catch (error) {
          console.error('Error deleting book:', error)
          
          // Rollback the optimistic update by re-adding the book
          const originalBook = books.find(book => book.bookId === editingBook.bookId)
          if (originalBook) {
            setBooks(prevBooks => [...prevBooks, originalBook])
          }
          
          alert('Failed to delete book. Please try again.')
        }
    }

    const handleCloseEditPopup = () => {
        setEditingBook(null)
        setShowEditPopup(false)
        setTempRating(0)
        setTempStatus('')
        setHoverRating(0)
        setShowDeleteConfirm(false)
    }

    return (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-black backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 max-w-md w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/20">
        <h3 className="text-lg font-semibold text-white">Edit Book</h3>
        <button
          onClick={handleCloseEditPopup}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-stone-300 hover:text-white" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Book Info */}
        <div className="flex items-start gap-4 mb-6">
          <Image 
            src={editingBook.book.image || '/placeholder-book-cover.png'}
            alt={editingBook.book.title}
            width={64}
            height={96}
            className="w-16 h-24 object-cover rounded-lg shadow-lg"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white mb-1">{editingBook.book.title}</h4>
            <p className="text-sm text-stone-300">{editingBook.book.author}</p>
          </div>
        </div>

        {/* Status Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-200 mb-3">Reading Status</label>
          <div className="space-y-2">
            {[
              { value: 'to-read', label: 'To Read', icon: Eye, color: 'blue' },
              { value: 'reading', label: 'Currently Reading', icon: BookOpenCheck, color: 'amber' },
              { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'emerald' }
            ].map((status) => (
              <label key={status.value} className="flex items-center gap-3 p-3 border border-white/20 rounded-lg hover:bg-white/5 cursor-pointer transition-colors backdrop-blur-sm">
                <input
                  type="radio"
                  name="status"
                  value={status.value}
                  checked={tempStatus === status.value}
                  onChange={(e) => setTempStatus(e.target.value)}
                  className="text-amber-500 focus:ring-amber-500/50 bg-white/10 border-white/30"
                />
                <div className={`w-8 h-8 ${
                  status.color === 'blue' ? 'bg-blue-500/20 text-blue-400' :
                  status.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-emerald-500/20 text-emerald-400'
                } rounded-lg flex items-center justify-center backdrop-blur-sm border border-${status.color === 'blue' ? 'blue' : status.color === 'amber' ? 'amber' : 'emerald'}-500/30`}>
                  <status.icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-stone-200">{status.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Rating Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-200 mb-3">Rating</label>
          <div className="flex items-center gap-2 mb-2">
            {[...Array(10)].map((_, i) => {
              const starValue = i + 1
              const isActive = starValue <= (hoverRating || tempRating)
              return (
                <button
                  key={i}
                  type="button"
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setTempRating(starValue)}
                  className="hover:scale-110 transition-transform"
                >
                  <Star 
                    className={`w-6 h-6 ${isActive ? 'text-amber-400 fill-amber-400' : 'text-stone-500 hover:text-amber-300'}`} 
                  />
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-300">
              {tempRating && hoverRating > 0 ? `${hoverRating}/10` : `${tempRating}/10`}
            </span>
            {tempRating > 0 && (
              <button
                type="button"
                onClick={() => setTempRating(0)}
                className="text-xs text-stone-400 hover:text-stone-200 underline"
              >
                Clear rating
              </button>
            )}
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg backdrop-blur-sm">
            <h4 className="text-sm font-medium text-red-300 mb-2">Are you sure?</h4>
            <p className="text-sm text-red-200 mb-4">
              This will permanently remove "{editingBook.book.title}" from your library. This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteBook}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors shadow-lg"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 bg-white/10 text-red-300 text-sm border border-red-500/30 rounded-md hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-white/20 bg-black/20 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 text-red-400 bg-white/5 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-2 backdrop-blur-sm"
        >
          <Trash2 className="w-4 h-4" />
          Delete Book
        </button>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCloseEditPopup}
            className="px-4 py-2 text-stone-300 bg-white/5 border border-white/20 rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all flex items-center gap-2 shadow-lg"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  </div>
)
  }

  export default EditCollectionPopup