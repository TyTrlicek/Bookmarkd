'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { BookData, User, UserActivity, List } from '../types/types'
import {
  BookOpen,
  Star,
  LogOut,
  Settings,
  BookMarked,
  User as UserIcon,
  X,
  Save,
  Camera,
  Trash2,
  AlertTriangle,
  ListPlus,
  Plus,
  Users,
  ExternalLink,
  Pencil,
  Check
} from 'lucide-react'
import Header from '../components/Header'
import useAuthStore from '@/store/authStore'
import axios from 'axios'
import { toAmericanDate } from '@/utils/util'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '../components/Footer'
import FavoritesList from '../components/FavoritesList'
import { useAuth } from '@/hooks/useAuth'
import ListCard from '../components/ListCard'
import FollowersModal from '../components/FollowersModal'

export default function AccountPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    avatar_url: ''
  })
  const [newProfileImage, setNewProfileImage] = useState<File | null>(null)
  const [newProfileImagePreview, setNewProfileImagePreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editMessage, setEditMessage] = useState('')
  const [averageRating, setAverageRating] = useState();
  const [booksInCollection, setBooksInCollection] = useState(0);
  const [reviewsWritten, setReviewsWritten] = useState(0);
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [favoriteBooks, setFavoriteBooks] = useState<BookData[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [userLists, setUserLists] = useState<List[]>([]);
  const [listsLoading, setListsLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);

  const fetchFavoriteBooks = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    setFavoriteBooks([]);
    return [];
  }

  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/favorites`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    return response.data.map((fav: any) => ({
      id: fav.book.id,
      title: fav.book.title,
      author: fav.book.author,
      image: fav.book.image,
      publishedDate: fav.book.publishedDate, 
      rating: 5,
      averageRating: fav.book.averageRating || 0,
    }));
  } catch (error) {
    console.error('Failed to fetch favorite books:', error);
    return [];
  }
};

const handleRemoveFavoriteBook = async (bookId: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    throw new Error('No access token available');
  }

  try {
    await axios.delete(
      `${process.env.NEXT_PUBLIC_API_URL}/api/favorites/${bookId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    setFavoriteBooks(prev => prev.filter(book => String(book.id) !== bookId));
  } catch (error) {
    console.error('Failed to remove book from favorites:', error);
    throw error;
  }
};

const handleAddFavoriteBook = async (selectedBook: BookData) => {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    router.push('/auth');
    return;
  }

  try {
    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/api/favorites`,
      { bookId: selectedBook.id },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    setFavoriteBooks(prev => [...prev, selectedBook]);
  } catch (error) {
    console.error('Failed to add book to favorites:', error);
    throw error;
  }
};

const fetchUserLists = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const accessToken = session?.access_token;

  if (!accessToken) {
    setUserLists([]);
    setListsLoading(false);
    return;
  }

  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/lists`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    setUserLists(response.data);
  } catch (error) {
    console.error('Failed to fetch user lists:', error);
    setUserLists([]);
  } finally {
    setListsLoading(false);
  }
};

useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    router.push('/auth?redirect=/profile');
  }
}, [isAuthenticated, authLoading, router]);

useEffect(() => {
  if (!isAuthenticated) return;

  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      console.error('No access token available');
      return;
    }

    let userUsername: string | null = null;

    try {
      // Fetch user stats
      const statsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/stats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const statsData = statsResponse.data;

      userUsername = statsData.user?.username || null;
      setUser(statsData.user);
      setAverageRating(statsData.averageRating.toFixed(2));
      setBooksInCollection(statsData.booksInCollection);
      setReviewsWritten(statsData.reviewsWritten);

      setEditForm({
        username: statsData.user?.username || '',
        bio: statsData.user?.bio || '',
        avatar_url: statsData.user?.avatar_url || ''
      });
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }

    try {
      // Fetch recent activity
      const activityResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/activity/user-activity`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      setRecentActivity(activityResponse.data);
    } catch (error) {
      console.error('Error getting user activity:', error);
    }

    try {
      // Fetch favorite books
      setFavoritesLoading(true);
      const books = await fetchFavoriteBooks();
      setFavoriteBooks(books);
    } catch (error) {
      console.error('Failed to fetch favorite books:', error);
      setFavoriteBooks([]);
    } finally {
      setFavoritesLoading(false);
    }

    try {
      // Fetch user lists
      await fetchUserLists();
    } catch (error) {
      console.error('Failed to fetch user lists:', error);
    }

    try {
      // Fetch follower/following counts
      if (userUsername) {
        const profileResponse = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/u/${userUsername}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        setFollowerCount(profileResponse.data.followerCount || 0);
        setFollowingCount(profileResponse.data.followingCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch follow counts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchUserData();
}, [isAuthenticated, router]);


  const handleLogout = async () => {
    await supabase.auth.signOut()
    useAuthStore.getState().clearSession()
    router.push('/auth')
  }

  const handleEditProfile = () => {
    setShowEditModal(true)
    setEditMessage('')
    if (user) {
      setEditForm({
        username: user.username || '',
        bio: user.bio || '',
        avatar_url: user.avatar_url || ''
      });
    }
    setNewProfileImage(null)
    setNewProfileImagePreview(null)
  }

  const handleStartEditBio = () => {
    setBioText(user?.bio || '')
    setIsEditingBio(true)
  }

  const handleCancelEditBio = () => {
    setIsEditingBio(false)
    setBioText('')
  }

  const handleSaveBio = async () => {
    if (!user) return

    setIsSavingBio(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      if (!accessToken) {
        setIsSavingBio(false)
        return
      }

      await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/users/update`, {
        bio: bioText
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      setUser(prev => prev ? { ...prev, bio: bioText } : null)
      setIsEditingBio(false)
    } catch (error) {
      console.error('Failed to update bio:', error)
    } finally {
      setIsSavingBio(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setEditMessage('Please select a valid image file.')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setEditMessage('Image size must be less than 5MB.')
        return
      }

      setNewProfileImage(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setNewProfileImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setEditMessage('')
    }
  }

  const removeNewImage = () => {
    setNewProfileImage(null)
    setNewProfileImagePreview(null)
    const fileInput = document.getElementById('editProfileImage') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const handleDeleteAccount = async () => {
  if (!user || deleteConfirmText !== 'DELETE') return;
  
  setIsDeleting(true);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      alert('Session expired. Please log in again.');
      return;
    }

    const response = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/users/delete`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 200) {
      // Clear local session
      await supabase.auth.signOut();
      useAuthStore.getState().clearSession();
      
      // Redirect to auth page with a message
      router.push('/auth?message=Account deleted successfully');
    }
  } catch (error) {
    console.error('Failed to delete account:', error);
    alert('Failed to delete account. Please try again.');
  }

  setIsDeleting(false);
};

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!newProfileImage) return null

    // Validate file extension
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const fileExt = newProfileImage.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      setEditMessage('Invalid file type. Please use JPG, PNG, GIF, or WebP.')
      return null
    }

    // Validate MIME type matches extension
    const mimeToExt: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp']
    }
    const allowedExtsForMime = mimeToExt[newProfileImage.type]
    if (!allowedExtsForMime || !allowedExtsForMime.includes(fileExt)) {
      setEditMessage('File extension does not match file type.')
      return null
    }

    try {
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatar/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(filePath, newProfileImage)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return null
      }

      const { data } = supabase.storage
        .from('avatar')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return
    
    setIsSaving(true)
    setEditMessage('')

    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      
      const accessToken = session?.access_token;

      if (!accessToken) {
        setEditMessage('Session expired. Please log in again.')
        setIsSaving(false)
        return
      }

      let newAvatarUrl = editForm.avatar_url
      if (newProfileImage) {
        const uploadedUrl = await uploadImage(user.id)
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl
        } else {
          setEditMessage('Failed to upload new profile picture.')
          setIsSaving(false)
          return
        }
      }

      const response = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/users/update`, {
        username: editForm.username,
        bio: editForm.bio,
        avatar_url: newAvatarUrl,
      }, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })
setUser((prevUser) => ({
  ...prevUser,
  username: editForm.username,
  bio: editForm.bio,
  avatar_url: newAvatarUrl,
}) as User);
      setEditMessage('Profile updated successfully!')
      
      setTimeout(() => {
        setShowEditModal(false)
      }, 500)

    } catch (error) {
      if(axios.isAxiosError(error) && error.status === 400) {
        setEditMessage('Username already taken. Please choose another.')
      }
      else{
      console.error('Failed to update profile:', error)
      setEditMessage('Failed to update profile. Please try again.')
      }
    }

    setIsSaving(false)
  }

  const userStats = [
    { label: "Books in Collection", value: booksInCollection, icon: BookMarked, color: "text-rate-good" },
    { label: "Books Rated This Year", value: reviewsWritten || 0, icon: BookOpen, color: "text-gold" },
    { label: "Average Book Rating", value: (averageRating || 0), icon: Star, color: "text-rate-high" }
  ]


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-overlay">
            <BookOpen className="h-6 w-6 animate-pulse text-gold" />
          </div>
          <p className="text-sm text-ink-mute">Loading your profile…</p>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <Header />

      {/* Background Elements */}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Profile Section */}
        <section className="mb-16">
          <div className="mb-10 rounded-3xl border border-line bg-surface/50 p-8 md:p-10">
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-full border border-line-strong">
                {user?.avatar_url ? (
                  <Image 
                  width={128}
                  height={128}
                    src={user.avatar_url} 
                    alt={`${user.username}'s profile picture`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-overlay">
                    <UserIcon className="h-12 w-12 text-ink-mute" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-ink">
                  Welcome back,{' '}
                  <span className="italic text-gold" style={{ fontVariationSettings: '"WONK" 1' }}>
                    {user?.username}
                  </span>
                </h2>

                {/* Followers/Following */}
                <div className="flex flex-col sm:flex-row items-center gap-6 text-ink-mute mb-4">
                  <button
                    onClick={() => setShowFollowersModal(true)}
                    className="flex items-center gap-2 hover:text-gold transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span><span className="font-semibold text-ink">{followerCount}</span> followers</span>
                  </button>
                  <button
                    onClick={() => setShowFollowingModal(true)}
                    className="flex items-center gap-2 hover:text-gold transition-colors"
                  >
                    <span><span className="font-semibold text-ink">{followingCount}</span> following</span>
                  </button>
                </div>

                {/* Inline Bio Section */}
                <div className="max-w-2xl">
                  {isEditingBio ? (
                    <div className="space-y-3">
                      <textarea
                        value={bioText}
                        onChange={(e) => setBioText(e.target.value)}
                        placeholder="Write something about yourself..."
                        maxLength={500}
                        rows={3}
                        className="w-full px-4 py-3 bg-canvas-raised border border-line rounded-xl focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-colors placeholder-ink-faint text-ink text-lg resize-none"
                        autoFocus
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-ink0">{bioText.length}/500</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleCancelEditBio}
                            disabled={isSavingBio}
                            className="px-4 py-2 text-sm text-ink-mute hover:text-ink transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveBio}
                            disabled={isSavingBio}
                            className="flex items-center gap-2 px-4 py-2 bg-ember text-white hover:bg-ember-strong font-medium rounded-lg text-sm transition-all disabled:opacity-50"
                          >
                            {isSavingBio ? (
                              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                Save
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="group">
                      {user?.bio ? (
                        <div className="flex items-start gap-2">
                          <p className="text-lg md:text-xl text-ink-soft leading-relaxed flex-1">
                            {user.bio}
                          </p>
                          <button
                            onClick={handleStartEditBio}
                            className="p-2 text-ink0 hover:text-gold hover:bg-overlay-hover rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100 flex-shrink-0"
                            title="Edit bio"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleStartEditBio}
                          className="flex items-center gap-2 text-ink0 hover:text-gold transition-colors text-base md:text-lg py-2"
                        >
                          <Plus className="w-5 h-5" />
                          Add a bio
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {user?.username && (
                  <Link
                    href={`/u/${user.username}`}
                    className="group flex items-center gap-2 rounded-full border border-line-strong bg-overlay px-5 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-overlay-hover"
                  >
                    <ExternalLink className="w-5 h-5" />
                    View Public Profile
                  </Link>
                )}
                <button
                  onClick={handleEditProfile}
                  className="flex items-center gap-2 px-6 py-3 bg-overlay hover:bg-overlay-hover text-ink rounded-xl border border-line transition-all backdrop-blur-sm group"
                >
                  <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  Edit Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-3 bg-ember text-white hover:bg-ember-strong rounded-xl transition-all font-bold shadow-lg "
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Delete Account Modal */}
{showDeleteModal && (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowDeleteModal(false)}>
    <div className="bg-canvas-raised border border-rate-bad/30 rounded-3xl max-w-md w-full " onClick={(e) => e.stopPropagation()}>
      {/* Modal Header */}
      <div className="flex items-center justify-between p-8 border-b border-rate-bad/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rate-bad/15 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-rate-bad" />
          </div>
          <div>
            <h3 className="font-display text-xl font-semibold text-ink">Delete Account</h3>
            <p className="text-rate-bad text-sm">This action cannot be undone</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteModal(false)}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-overlay-hover transition-colors"
        >
          <X className="w-6 h-6 text-ink-mute" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="p-8 space-y-6">
        <div className="bg-rate-bad/10 border border-rate-bad/30 rounded-xl p-6">
          <h4 className="text-rate-bad font-semibold mb-3">What will be deleted:</h4>
          <ul className="text-rate-bad text-sm space-y-2">
            <li>• Your profile and account information</li>
            <li>• All your book collections and ratings</li>
            <li>• All your reviews and comments</li>
            <li>• Your reading history and activity</li>
            <li>• Your profile picture and settings</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink-soft mb-3">
            Type "DELETE" to confirm:
          </label>
          <input
            type="text"
            placeholder="DELETE"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="w-full px-4 py-3 bg-surface border border-rate-bad/30 rounded-xl focus:ring-1 focus:ring-rate-bad/40 focus:border-rate-bad/50 transition-colors placeholder-ink-faint text-ink"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
            className="flex-1 px-6 py-3 border border-line-strong text-ink-soft rounded-xl hover:bg-overlay-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting || deleteConfirmText !== 'DELETE'}
            className="flex-1 bg-rate-bad hover:opacity-90 text-ink font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Delete Forever
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Favorite Books Section */}
<section className="mt-16 mb-16 bg-canvas-raised px-6 py-4 rounded-3xl border border-line ">
  <div className="mb-8">
    <div className="flex items-baseline gap-4 mb-3">
      {/* Small accent element */}
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 bg-hue-lists rounded-full" />
        <div className="w-1 h-1 bg-hue-lists/50 rounded-full" />
      </div>

      <div className="flex-1">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-ink">Favorite Books</h2>
      </div>
    </div>

    <p className="text-ink-mute text-sm ml-7 mb-4">Your personal favorites</p>

    {/* Subtle divider with gradient */}
    <div className="h-px bg-gradient-to-r from-hue-lists/30 via-line to-transparent" />
  </div>

  {/* Desktop: Grid Layout */}
  <div className="hidden md:block">
    <FavoritesList
      books={favoriteBooks}
      loading={favoritesLoading}
      onRemoveBook={handleRemoveFavoriteBook}
      onAddBook={handleAddFavoriteBook}
      showAddSlots={true}
      maxSlots={4}
      layout="grid"
      showStats={false}
      className="mb-8"
    />
  </div>

  {/* Mobile: Horizontal Scroll */}
  <div className="md:hidden">
    <FavoritesList
      books={favoriteBooks}
      loading={favoritesLoading}
      onRemoveBook={handleRemoveFavoriteBook}
      onAddBook={handleAddFavoriteBook}
      showAddSlots={true}
      maxSlots={4}
      layout="horizontal"
      showStats={false}
      className="mb-8"
    />
  </div>

  {/* Empty State */}
  {/* {!favoritesLoading && favoriteBooks.length === 0 && (
    <div className="bg-surface backdrop-blur-sm rounded-2xl p-12 text-center border border-line">
      <div className="w-20 h-20 bg-overlay rounded-full flex items-center justify-center mx-auto mb-6 border border-line">
        <BookMarked className="w-10 h-10 text-gold" />
      </div>
      <h3 className="font-display text-xl font-semibold text-ink mb-4">No Favorites Yet</h3>
      <p className="text-ink-mute mb-6 max-w-md mx-auto">
        Start building your collection by adding books you love to your favorites.
        These will be your go-to recommendations for other readers!
      </p>
      <button
        onClick={() => router.push('/browse')}
        className="inline-flex items-center gap-2 px-6 py-3 bg-ember text-white hover:bg-ember-strong font-bold rounded-xl transition-all shadow-lg "
      >
        <BookOpen className="w-5 h-5" />
        Discover Books
      </button>
    </div>
  )} */}
</section>

{/* My Lists Section */}
<section className="mt-16 mb-16 bg-canvas-raised px-6 py-4 rounded-3xl border border-line ">
  <div className="mb-8">
    <div className="flex items-baseline gap-4 mb-3">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 bg-hue-lists rounded-full" />
        <div className="w-1 h-1 bg-hue-lists/50 rounded-full" />
      </div>

      <div className="flex-1 flex items-center justify-between">
        <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-ink">My Lists</h2>
        <Link
          href="/lists/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-ember text-white hover:bg-ember-strong font-medium rounded-lg transition-all shadow-lg  text-sm"
        >
          <Plus className="w-4 h-4" />
          Create List
        </Link>
      </div>
    </div>

    <p className="text-ink-mute text-sm ml-7 mb-4">Your book collections</p>

    <div className="h-px bg-gradient-to-r from-hue-lists/30 via-line to-transparent" />
  </div>

  {listsLoading ? (
    <div className="flex items-center justify-center py-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
    </div>
  ) : userLists.length === 0 ? (
    <div className="bg-surface backdrop-blur-sm rounded-2xl p-12 text-center border border-line">
      <div className="w-20 h-20 bg-overlay rounded-full flex items-center justify-center mx-auto mb-6 border border-hue-lists/20">
        <ListPlus className="w-10 h-10 text-hue-lists" />
      </div>
      <h3 className="font-display text-xl font-semibold text-ink mb-4">No Lists Yet</h3>
      <p className="text-ink-mute mb-6 max-w-md mx-auto">
        Create your first list to create and share your favorite book collections!
      </p>
      <Link
        href="/lists/new"
        className="inline-flex items-center gap-2 px-6 py-3 bg-ember text-white hover:bg-ember-strong font-bold rounded-xl transition-all shadow-lg "
      >
        <Plus className="w-5 h-5" />
        Create Your First List
      </Link>
    </div>
  ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {userLists.map((list) => (
        <ListCard key={list.id} list={list} showAuthor={false} />
      ))}
    </div>
  )}
</section>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {userStats.map((stat, index) => (
              <div key={index} className="rounded-2xl border border-line bg-surface/50 p-6 text-center">
                <stat.icon className={`mx-auto mb-3 h-6 w-6 ${stat.color}`} />
                <div className="font-display text-2xl font-semibold text-ink">{stat.value}</div>
                <div className="mt-0.5 text-xs text-ink-mute">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>



        {/* Recent Activity Section */}
        <section>
            <div className="mb-6">
              <div className="flex items-baseline gap-4 mb-3">
                {/* Small accent element */}
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-rate-good rounded-full" />
                  <div className="w-1 h-1 bg-rate-good/50 rounded-full" />
                </div>

                <div className="flex-1">
                  <h2 className="font-display text-2xl font-semibold tracking-[-0.01em] text-ink">Recent Activity</h2>
                </div>
              </div>

              <p className="text-ink-mute text-sm ml-7 mb-4">Your recent activity</p>

              {/* Subtle divider with gradient */}
              <div className="h-px bg-gradient-to-r from-rate-good/30 via-line to-transparent" />
            </div>
            
            <div className="bg-surface backdrop-blur-sm rounded-2xl p-8 border border-line shadow-lg max-h-144 overflow-y-auto no-scrollbar">
              <div className="space-y-6">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={activity.id || index} 
                    className="flex items-start gap-4 py-4 border-b border-line last:border-b-0 group"
                  >
                    <div className="w-12 h-12 bg-overlay backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 border border-line">
                      {activity.data.avatar_url ? (
                        <Image
                          width={48}
                          height={48}
                          src={activity.data.avatar_url}
                          alt={`user's profile`}
                          className="w-full h-full rounded-full flex-shrink-0 object-cover"
                        />
                      ) : user?.avatar_url ? (
                        <Image
                        width={48}
                        height={48}
                          src={user?.avatar_url}
                          alt={`user's profile`}
                          className="w-full h-full rounded-full flex-shrink-0 object-cover"
                        />
                      ) : (
                        <UserIcon className="w-6 h-6 text-gold" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="space-y-1">
                        <p className="text-ink text-sm leading-relaxed group-hover:text-gold-soft transition-colors">
                          <span className="font-medium">{activity.data.message}</span>
                        </p>
                      </div>
                      <p className="text-xs text-ink0 mt-2">
                        {toAmericanDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        {/* Quick Actions */}
        {/* <section className="mt-16">
          <h2 className="text-3xl font-bold text-ink mb-8">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <button className="bg-surface backdrop-blur-sm rounded-2xl p-8 border border-line hover:bg-surface transition-all text-left group shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <BookOpen className="w-8 h-8 text-ink" />
              </div>
              <h3 className="font-semibold text-ink mb-3 text-xl group-hover:text-gold-soft transition-colors">Add New Book</h3>
              <p className="text-ink-mute text-sm">Track a new book you're reading</p>
            </button>

            <button className="bg-surface backdrop-blur-sm rounded-2xl p-8 border border-line hover:bg-surface transition-all text-left group shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Star className="w-8 h-8 text-ink" />
              </div>
              <h3 className="font-semibold text-ink mb-3 text-xl group-hover:text-gold-soft transition-colors">Write Review</h3>
              <p className="text-ink-mute text-sm">Share your thoughts on a book</p>
            </button>

            <button className="bg-surface backdrop-blur-sm rounded-2xl p-8 border border-line hover:bg-surface transition-all text-left group shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <TrendingUp className="w-8 h-8 text-ink" />
              </div>
              <h3 className="font-semibold text-ink mb-3 text-xl group-hover:text-gold-soft transition-colors">View Stats</h3>
              <p className="text-ink-mute text-sm">Detailed reading analytics</p>
            </button>
          </div>
        </section> */}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-canvas-raised border border-line rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto no-scrollbar " onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-line">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-ember rounded-xl flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold text-ink">Edit Profile</h3>
                  <p className="text-ink-mute text-sm">Update your profile information</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-overlay-hover transition-colors border border-line"
              >
                <X className="w-6 h-6 text-ink-mute" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-8">
              {/* Profile Picture Section */}
              <div>
                <label className="block text-sm font-medium text-ink-soft mb-4">
                  Profile Picture
                </label>
                <div className="flex items-center gap-6">
                  {/* Current/Preview Image */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-line">
                      {newProfileImagePreview ? (
                        <Image 
                          width={96}
                          height={96}
                          src={newProfileImagePreview} 
                          alt="New profile preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : user?.avatar_url ? (
                        <Image 
                          width={96}
                          height={96}
                          src={user.avatar_url} 
                          alt="Current profile picture" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-ember flex items-center justify-center">
                          <UserIcon className="w-10 h-10 text-white" />
                        </div>
                      )}
                    </div>
                    {newProfileImagePreview && (
                      <button
                        type="button"
                        onClick={removeNewImage}
                        className="absolute -top-1 -right-1 w-7 h-7 bg-rate-bad hover:opacity-90 text-ink rounded-full flex items-center justify-center transition-colors shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  <div className="flex-1">
                    <label
                      htmlFor="editProfileImage"
                      className="inline-flex items-center gap-2 px-6 py-3 border border-line-strong rounded-xl hover:bg-overlay-hover cursor-pointer transition-colors text-sm text-ink backdrop-blur-sm"
                    >
                      <Camera className="w-5 h-5" />
                      {newProfileImage ? 'Change Photo' : 'Upload New Photo'}
                    </label>
                    <input
                      id="editProfileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-ink0 mt-2">
                      JPG, PNG, or GIF up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Username Field */}
              <div>
                <label htmlFor="editUsername" className="block text-sm font-medium text-ink-soft mb-3">
                  Username
                </label>
                <div className="relative">
                  <input
                    id="editUsername"
                    type="text"
                    placeholder="Enter your username"
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    maxLength={20}
                    className="w-full px-4 py-4 bg-surface border border-line rounded-xl focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-colors placeholder-ink-faint text-ink backdrop-blur-sm"
                  />
                  <p className="text-xs text-ink0 mt-2">
                    {editForm.username.length}/20 characters
                  </p>
                </div>
              </div>

              

              {/* Bio Field */}
              <div>
                <label htmlFor="editBio" className="block text-sm font-medium text-ink-soft mb-3">
                  Bio <span className="text-ink0">(Optional)</span>
                </label>
                <textarea
                  id="editBio"
                  placeholder="Tell other readers about yourself..."
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={4}
                  maxLength={500}
                  className="w-full px-4 py-4 bg-surface border border-line rounded-xl focus:ring-1 focus:ring-gold/30 focus:border-gold/40 transition-colors placeholder-ink-faint text-ink backdrop-blur-sm resize-none"
                />
                <p className="text-xs text-ink0 mt-2">
                  {editForm.bio.length}/500 characters
                </p>
              </div>

              {/* Message Display */}
              {editMessage && (
                <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                  editMessage.includes('Success') || editMessage.includes('successfully')
                    ? 'bg-rate-high/10 text-rate-high border-rate-high/30' 
                    : 'bg-rate-bad/10 text-rate-bad border-rate-bad/30'
                }`}>
                  <span className="text-sm">{editMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 border border-line-strong text-ink-soft rounded-xl hover:bg-overlay-hover transition-colors disabled:opacity-50 backdrop-blur-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving || !editForm.username.trim()}
                  className="flex-1 bg-ember text-white hover:bg-ember-strong font-bold py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg "
                >
                  {isSaving ? (
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5 hidden sm:block" />
                      Save Changes
                    </>
                  )}
                </button>

                <button 
              onClick={() => {
                setShowEditModal(false)
                setShowDeleteModal(true)
                
              }}
              className="flex items-center gap-2 px-6 py-3 bg-rate-bad/15 hover:bg-rate-bad/25 text-rate-bad hover:text-rate-bad rounded-xl border border-rate-bad/30 transition-all backdrop-blur-sm group"
            >
              <Trash2 className="w-5 h-5 hidden sm:block" />
              Delete Account
            </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {user && (
        <FollowersModal
          userId={user.id}
          type="followers"
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          currentUserId={user.id}
        />
      )}

      {/* Following Modal */}
      {user && (
        <FollowersModal
          userId={user.id}
          type="following"
          isOpen={showFollowingModal}
          onClose={() => setShowFollowingModal(false)}
          currentUserId={user.id}
        />
      )}

      <Footer />
    </div>
  )
}