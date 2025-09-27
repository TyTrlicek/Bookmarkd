'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Achievement, BookData, User, UserActivity } from '../types/types'
import { 
  BookOpen, 
  Star, 
  LogOut, 
  Settings,
  Crown,
  Calendar,
  Award,
  Target,
  BookMarked,
  User as UserIcon,
  Mail,
  Shield,
  Clock,
  TrendingUp,
  X,
  Upload,
  Save,
  Camera,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import Header from '../components/Header'
import useAuthStore from '@/store/authStore'
import axios from 'axios'
import { toAmericanDate } from '@/utils/util'
import Image from 'next/image'
import Footer from '../components/Footer'
import { set } from 'lodash'
import FavoritesList from '../components/FavoritesList'

export default function AccountPage() {
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
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementCount, setAchievementCount] = useState(0);
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [favoriteBooks, setFavoriteBooks] = useState<BookData[]>([]);
const [favoritesLoading, setFavoritesLoading] = useState(true);

  const router = useRouter()

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

useEffect(() => {
  const fetchUserData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    if (!accessToken) {
      router.push('/auth');
      return;
    }

    try {
      // Fetch user stats
      const statsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/stats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const statsData = statsResponse.data;


      setUser(statsData.user);
      setAverageRating(statsData.averageRating.toFixed(2));
      setBooksInCollection(statsData.booksInCollection);
      setReviewsWritten(statsData.reviewsWritten);

      setEditForm({
        username: statsData.username || '',
        bio: statsData.bio || '',
        avatar_url: statsData.avatar_url || ''
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
      // Fetch achievements
      const achievementsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/achievements`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      const userAchievements = achievementsResponse.data.achievements || [];
      setAchievementCount(userAchievements.length);

      const combinedAchievements = allAchievements.map((ach: Achievement) => ({
        ...ach,
        earned: !!userAchievements.find((ua: Achievement) => ua.id === ach.id),
      }));

      setAchievements(combinedAchievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
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
      setIsLoading(false);
    }
  };

  fetchUserData();
}, [router]);


  const handleLogout = async () => {
    console.log('Logging out user...')
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

    try {
      const fileExt = newProfileImage.name.split('.').pop()
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
    { label: "Books in Collection", value: booksInCollection, icon: BookMarked, color: "from-blue-500 to-blue-600" },
    { label: "Books Rated This Year", value: reviewsWritten || 0, icon: BookOpen, color: "from-amber-500 to-amber-600" },
    { label: "Average Book Rating", value: (averageRating || 0), icon: Star, color: "from-emerald-500 to-emerald-600" },
    { label: "Achievements Unlocked", value: achievementCount, icon: Award, color: "from-purple-500 to-purple-600" }
  ]

  const allowedGenres = [
  "Fantasy",
  "Romance",
  "Science Fiction",
  "Magic",
  "Mystery",
  "Thriller",
  "Supernatural",
  "Non-Fiction",
  "Adventure"
];

const allAchievements = [
  { id: 5, name: "Bookworm I", description: "Finish 1 book", icon: "📕" },
  { id: 6, name: "Bookworm II", description: "Finish 10 books", icon: "📘" },
  { id: 7, name: "Bookworm III", description: "Finish 50 books", icon: "📗" },
  { id: 8, name: "Bookworm IV", description: "Finish 100 books", icon: "📕" },
  { id: 9, name: "Bookworm V", description: "Finish 250 books", icon: "📙" },
  { id: 10, name: "Bookworm VI", description: "Finish 500 books", icon: "📚" },
  { id: 11, name: "Bookworm VII", description: "Finish 1000 books", icon: "📚" },
  { id: 12, name: "Explorer I", description: "Read books from 10 different authors", icon: "🧭" },
  { id: 13, name: "Explorer II", description: "Read books from 50 different authors", icon: "🧭" },
  { id: 14, name: "Explorer III", description: "Read books from 100 different authors", icon: "🧭" },
  { id: 15, name: "Genre Collector I", description: "Read books from 5 different genres", icon: "🎨" },
  { id: 16, name: "Genre Collector II", description: "Read books from 9 different genres", icon: "🎨" },
  { id: 17, name: "Reviewer I", description: "Write your first review", icon: "✍️" },
  { id: 18, name: "Reviewer II", description: "Write 10 reviews", icon: "📝" },
  { id: 19, name: "Reviewer III", description: "Write 50 reviews", icon: "📝" },
  { id: 20, name: "Old Timer", description: "Log a book that's been in your TBR for over a year", icon: "⏳" },
  { id: 21, name: "Night Owl", description: "Log a book after midnight", icon: "🌙" },
  { id: 22, name: "Honest Critic", description: "Give 10 books a 1-star rating", icon: "⭐" },
  { id: 23, name: "Balanced Critic", description: "Give at least one book each rating from 1–10 stars", icon: "⚖️" }
];

let idCounter = 24;

allowedGenres.forEach((genre) => {
  allAchievements.push(
    { id: idCounter++, name: `${genre} Reader I`, description: `Read 10 ${genre} books`, icon: "📖" },
    { id: idCounter++, name: `${genre} Reader II`, description: `Read 50 ${genre} books`, icon: "📖" },
    { id: idCounter++, name: `${genre} Reader III`, description: `Read 100 ${genre} books`, icon: "📖" }
  );
});





  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <p className="text-stone-300 text-xl">Loading your profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-stone-900 via-stone-800 to-stone-800">
      {/* Header */}
      <Header />

      {/* Background Elements */}

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* Profile Section */}
        <section className="mb-16">
          <div className="bg-black/30 backdrop-blur-sm rounded-3xl p-10 mb-10 border border-white/10 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-amber-400/30 shadow-2xl">
                {user?.avatar_url ? (
                  <Image 
                  width={128}
                  height={128}
                    src={user.avatar_url} 
                    alt={`${user.username}'s profile picture`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                    <UserIcon className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-4xl font-bold text-white mb-3">
                  Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">{user?.username}</span>!
                </h2>
                {user?.bio && (
                  <p className="text-xl text-stone-300 mb-4 max-w-2xl leading-relaxed">
                    {user.bio}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row items-center gap-6 text-stone-400">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>Member since {new Date(user?.createdAt || '').getFullYear()}</span>
                  </div>
                  {/* <div className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <span className="text-amber-300 font-medium">Premium Reader</span>
                  </div> */}
                </div>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={handleEditProfile}
                  className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all backdrop-blur-sm group"
                >
                  <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                  Edit Profile
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-xl transition-all font-bold shadow-lg hover:shadow-amber-500/25"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Delete Account Modal */}
{showDeleteModal && (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowDeleteModal(false)}>
    <div className="bg-stone-900 border border-red-500/30 rounded-3xl max-w-md w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
      {/* Modal Header */}
      <div className="flex items-center justify-between p-8 border-b border-red-500/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Delete Account</h3>
            <p className="text-red-400 text-sm">This action cannot be undone</p>
          </div>
        </div>
        <button
          onClick={() => setShowDeleteModal(false)}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
        >
          <X className="w-6 h-6 text-stone-400" />
        </button>
      </div>

      {/* Modal Content */}
      <div className="p-8 space-y-6">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <h4 className="text-red-300 font-semibold mb-3">What will be deleted:</h4>
          <ul className="text-red-200 text-sm space-y-2">
            <li>• Your profile and account information</li>
            <li>• All your book collections and ratings</li>
            <li>• All your reviews and comments</li>
            <li>• Your reading history and achievements</li>
            <li>• Your profile picture and settings</li>
          </ul>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-300 mb-3">
            Type "DELETE" to confirm:
          </label>
          <input
            type="text"
            placeholder="DELETE"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="w-full px-4 py-3 bg-black/30 border border-red-500/30 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors placeholder-stone-500 text-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
            className="flex-1 px-6 py-3 border border-white/30 text-stone-300 rounded-xl hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeleting || deleteConfirmText !== 'DELETE'}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
<section className="mt-16 mb-16 bg-stone-900 px-6 py-4 rounded-3xl border border-white/10 shadow-2xl">
  <div className="flex items-center justify-between mb-8">
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
        <BookMarked className="w-6 h-6 text-white" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-white">Favorite Books</h2>
        <p className="text-stone-300">Your Personal Favorites</p>
      </div>
    </div>
    
    {/* Show book count */}
    {/* <div className="text-right">
      <div className="text-2xl font-bold text-white">{favoriteBooks.length}</div>
      <div className="text-sm text-stone-400">books</div>
    </div> */}
  </div>

  {/* Desktop: Grid Layout */}
  <div className="hidden md:block">
    <FavoritesList
      books={favoriteBooks}
      loading={favoritesLoading}
      onRemoveBook={handleRemoveFavoriteBook}
      onAddBook={handleAddFavoriteBook}
      showAddSlots={true}
      maxSlots={6}
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
      maxSlots={6}
      layout="horizontal"
      showStats={false}
      className="mb-8"
    />
  </div>

  {/* Empty State */}
  {/* {!favoritesLoading && favoriteBooks.length === 0 && (
    <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/10">
      <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-400/20">
        <BookMarked className="w-10 h-10 text-amber-400" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">No Favorites Yet</h3>
      <p className="text-stone-400 mb-6 max-w-md mx-auto">
        Start building your collection by adding books you love to your favorites. 
        These will be your go-to recommendations for other readers!
      </p>
      <button 
        onClick={() => router.push('/browse')} 
        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl transition-all shadow-lg hover:shadow-amber-500/25"
      >
        <BookOpen className="w-5 h-5" />
        Discover Books
      </button>
    </div>
  )} */}
</section>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {userStats.map((stat, index) => (
              <div key={index} className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/10 hover:bg-black/40 transition-all group shadow-lg">
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-3xl font-bold text-white mb-2 group-hover:text-amber-200 transition-colors">{stat.value}</div>
                <div className="text-sm text-stone-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>



        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Achievements Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Achievements</h2>
                <p className="text-stone-300">Your reading milestones</p>
              </div>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 shadow-lg max-h-144 overflow-y-auto no-scrollbar">
              {achievements.map((achievement, index) => (
                <div key={index} className={`p-6 hover:bg-white/5 transition-colors group ${index !== achievements.length - 1 ? 'border-b border-white/10' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl ${achievement.earned ? 'bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-400/20' : 'bg-stone-800/50 border border-stone-700/50'}`}>
                      {achievement.earned ? achievement.icon : '🔒'}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold mb-1 ${achievement.earned ? 'text-white group-hover:text-amber-300 transition-colors' : 'text-stone-500'}`}>
                        {achievement.name}
                      </h3>
                      <p className={`text-sm ${achievement.earned ? 'text-stone-300' : 'text-stone-600'}`}>
                        {achievement.description}
                      </p>
                    </div>
                    {achievement.earned && (
                      <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <div className="w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activity Section */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Recent Activity</h2>
                <p className="text-stone-300">Your Recent Activity</p>
              </div>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10 shadow-lg max-h-144 overflow-y-auto no-scrollbar">
              <div className="space-y-6">
                {recentActivity.map((activity, index) => (
                  <div 
                    key={activity.id || index} 
                    className="flex items-start gap-4 py-4 border-b border-white/10 last:border-b-0 group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 border border-amber-400/20">
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
                        <UserIcon className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="space-y-1">
                        <p className="text-white text-sm leading-relaxed group-hover:text-amber-100 transition-colors">
                          <span className="font-medium">{activity.data.message}</span>
                        </p>
                      </div>
                      <p className="text-xs text-stone-500 mt-2">
                        {toAmericanDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        {/* Quick Actions */}
        {/* <section className="mt-16">
          <h2 className="text-3xl font-bold text-white mb-8">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <button className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-black/40 transition-all text-left group shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-3 text-xl group-hover:text-amber-200 transition-colors">Add New Book</h3>
              <p className="text-stone-400 text-sm">Track a new book you're reading</p>
            </button>

            <button className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-black/40 transition-all text-left group shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-3 text-xl group-hover:text-amber-200 transition-colors">Write Review</h3>
              <p className="text-stone-400 text-sm">Share your thoughts on a book</p>
            </button>

            <button className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:bg-black/40 transition-all text-left group shadow-lg">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-semibold text-white mb-3 text-xl group-hover:text-amber-200 transition-colors">View Stats</h3>
              <p className="text-stone-400 text-sm">Detailed reading analytics</p>
            </button>
          </div>
        </section> */}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowEditModal(false)}>
          <div className="bg-stone-900 border border-white/20 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-8 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Edit Profile</h3>
                  <p className="text-stone-400 text-sm">Update your profile information</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors border border-white/20"
              >
                <X className="w-6 h-6 text-stone-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8 space-y-8">
              {/* Profile Picture Section */}
              <div>
                <label className="block text-sm font-medium text-stone-300 mb-4">
                  Profile Picture
                </label>
                <div className="flex items-center gap-6">
                  {/* Current/Preview Image */}
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20">
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
                        <div className="w-full h-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                          <UserIcon className="w-10 h-10 text-white" />
                        </div>
                      )}
                    </div>
                    {newProfileImagePreview && (
                      <button
                        type="button"
                        onClick={removeNewImage}
                        className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Upload Button */}
                  <div className="flex-1">
                    <label
                      htmlFor="editProfileImage"
                      className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 rounded-xl hover:bg-white/10 cursor-pointer transition-colors text-sm text-white backdrop-blur-sm"
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
                    <p className="text-xs text-stone-500 mt-2">
                      JPG, PNG, or GIF up to 5MB
                    </p>
                  </div>
                </div>
              </div>

              {/* Username Field */}
              <div>
                <label htmlFor="editUsername" className="block text-sm font-medium text-stone-300 mb-3">
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
                    className="w-full px-4 py-4 bg-black/30 border border-white/20 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors placeholder-stone-500 text-white backdrop-blur-sm"
                  />
                  <p className="text-xs text-stone-500 mt-2">
                    {editForm.username.length}/20 characters
                  </p>
                </div>
              </div>

              

              {/* Bio Field */}
              {/* <div>
                <label htmlFor="editBio" className="block text-sm font-medium text-stone-300 mb-3">
                  Bio <span className="text-stone-500">(Optional)</span>
                </label>
                <textarea
                  id="editBio"
                  placeholder="Tell other readers about yourself..."
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={4}
                  maxLength={200}
                  className="w-full px-4 py-4 bg-black/30 border border-white/20 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors placeholder-stone-500 text-white backdrop-blur-sm resize-none"
                />
                <p className="text-xs text-stone-500 mt-2">
                  {editForm.bio.length}/200 characters
                </p>
              </div> */}

              {/* Message Display */}
              {editMessage && (
                <div className={`p-4 rounded-xl flex items-center gap-3 border ${
                  editMessage.includes('Success') || editMessage.includes('successfully')
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' 
                    : 'bg-red-500/10 text-red-300 border-red-500/30'
                }`}>
                  <span className="text-sm">{editMessage}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 border border-white/30 text-stone-300 rounded-xl hover:bg-white/10 transition-colors disabled:opacity-50 backdrop-blur-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving || !editForm.username.trim()}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-amber-500/25"
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
              className="flex items-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 rounded-xl border border-red-500/30 transition-all backdrop-blur-sm group"
            >
              <Trash2 className="w-5 h-5 hidden sm:block" />
              Delete Account
            </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}