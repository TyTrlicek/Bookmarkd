import { CheckCircle, Eye, Save, Trash2, X, XCircle } from "lucide-react"
import { BookInList } from "../types/types"
import { useState } from "react"
import axios from "axios"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"
import StarRating from "./StarRating"

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
    setTempRating: React.Dispatch<React.SetStateAction<number>>
}

const EditCollectionPopup = ({showEditPopup, editingBook, setBooks, books, tempStatus, tempRating, setEditingBook, setShowEditPopup, setTempStatus, setTempRating}: EditCollectionPopupProps) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    
    if (!showEditPopup || !editingBook) return null

    const handleSaveChanges = async () => {
        if (!editingBook) return

        try {
          // Store original values for rollback
          const originalBook = books.find(book => book.bookId === editingBook.bookId)
          const originalRating = originalBook?.rating
          const originalStatus = originalBook?.status

          // Auto-change status to "completed" when rating a "to-read" book
          // BUT only if the user didn't manually change the status themselves
          let effectiveStatus = tempStatus
          const userManuallyChangedStatus = tempStatus !== originalStatus

          // This matches backend behavior: backend always sets status to "completed" when rating
          if (tempRating > 0 && !userManuallyChangedStatus && originalStatus === 'to-read') {
            effectiveStatus = 'completed'
          }

          // Update local state optimistically with the effective status
          setBooks(prevBooks =>
            prevBooks.map(book =>
              book.bookId === editingBook.bookId
                ? { ...book, rating: tempRating, status: effectiveStatus }
                : book
            )
          )
    
          // Here you would make your API calls
          console.log(`Saving changes for book ${editingBook.bookId}:`, {
            rating: tempRating,
            status: effectiveStatus
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
              { rating: tempRating, bookId: editingBook.book.openLibraryId },
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )
          }

          // Save status if changed (using effectiveStatus, not tempStatus)
          if (effectiveStatus !== originalStatus) {
            await axios.put(
              `${process.env.NEXT_PUBLIC_API_URL}/collection/status`,
              { status: effectiveStatus, bookId: editingBook.book.openLibraryId },
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
        setShowDeleteConfirm(false)
    }

    return (
  <div className="fixed inset-0 bg-[#14181C]/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-[#14181C] backdrop-blur-lg rounded-xl shadow-2xl border border-[#3D4451] max-w-md w-full max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-[#3D4451]">
        <h3 className="text-lg font-semibold text-stone-50">Edit Book</h3>
        <button
          onClick={handleCloseEditPopup}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-stone-300 hover:text-stone-50" />
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
            <h4 className="font-medium text-stone-50 mb-1">{editingBook.book.title}</h4>
            <p className="text-sm text-stone-300">{editingBook.book.author}</p>
          </div>
        </div>

        {/* Status Section */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-stone-200 mb-3">Reading Status</label>
          <div className="space-y-2">
            {[
              { value: 'to-read', label: 'To Read', icon: Eye, color: 'blue' },
              { value: 'completed', label: 'Completed', icon: CheckCircle, color: 'emerald' },
              { value: 'dropped', label: 'Dropped', icon: XCircle, color: 'red' }
            ].map((status) => (
              <label key={status.value} className="flex items-center gap-3 p-3 border border-[#3D4451] rounded-lg hover:bg-white/5 cursor-pointer transition-colors backdrop-blur-sm">
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
                  status.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
                  'bg-red-500/20 text-red-400'
                } rounded-lg flex items-center justify-center backdrop-blur-sm border ${
                  status.color === 'blue' ? 'border-blue-500/30' :
                  status.color === 'emerald' ? 'border-emerald-500/30' :
                  'border-red-500/30'
                }`}>
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
          <div className="flex items-center justify-between mb-2">
            <StarRating
              rating={tempRating}
              onRatingChange={setTempRating}
              size="large"
              showValue={true}
            />
            {tempRating > 0 && (
              <button
                type="button"
                onClick={() => setTempRating(0)}
                className="text-xs text-stone-400 hover:text-stone-200 underline transition-colors"
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
      <div className="flex items-center justify-between p-6 border-t border-[#3D4451] bg-[#2C3440]/60 backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 text-red-400 bg-white/5 border border-red-500/30 rounded-lg hover:bg-red-500/10 transition-colors flex items-center gap-2 backdrop-blur-sm"
        >
          <Trash2 className="w-4 h-4" />
          Delete
        </button>
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCloseEditPopup}
            className="px-4 py-2 text-stone-300 bg-white/5 border border-[#3D4451] rounded-lg hover:bg-white/10 transition-colors backdrop-blur-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveChanges}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg hover:from-amber-600 hover:to-amber-700 transition-all flex items-center gap-2 shadow-lg"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </div>
    </div>
  </div>
)
  }

  export default EditCollectionPopup