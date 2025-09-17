'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { 
  BookOpen, 
  ArrowRight,
  Users,
  Star,
  Heart,
  AlertCircle,
  CheckCircle,
  User,
  Upload,
  X,
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function MobileAuthPage() {
  const [message, setMessage] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [pendingUser, setPendingUser] = useState<any>(null)
  const router = useRouter()

  // Google Sign In Handler
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setMessage('')
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })

      if (error) {
        setMessage(error.message)
      }
    } catch (error) {
      setMessage('Failed to sign in with Google. Please try again.')
      console.error('Google sign in error:', error)
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage('Please select a valid image file.')
        return
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setMessage('Image size must be less than 5MB.')
        return
      }

      setProfileImage(file)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setProfileImage(null)
    setProfileImagePreview(null)
    const fileInput = document.getElementById('profileImage') as HTMLInputElement
    if (fileInput) fileInput.value = ''
  }

  const uploadImage = async (userId: string): Promise<string | null> => {
    if (!profileImage) return null

    setIsUploadingImage(true)
    try {
      const fileExt = profileImage.name.split('.').pop()
      const fileName = `${userId}-${Date.now()}.${fileExt}`
      const filePath = `avatar/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(filePath, profileImage)

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
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingUser || !username.trim()) return

    setIsUploadingImage(true)
    setMessage('')

    try {
      let avatarUrl = null
      if (profileImage) {
        avatarUrl = await uploadImage(pendingUser.id)
        if (!avatarUrl) {
          setMessage('Failed to upload profile picture, but account was created.')
        }
      }

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/create`, {
        id: pendingUser.id,
        email: pendingUser.email,
        username: username.trim(),
        avatar_url: avatarUrl,
      })

      await useAuthStore.getState().initSession()
      setMessage('Profile created successfully!')
      router.push('/')
    } catch (err) {
      console.error('Failed to create user profile:', err)
      setMessage('Failed to save user profile. Please try again.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const features = [
    { icon: BookOpen, text: "Track All Of Your Books" },
    { icon: Star, text: "See What Others Rate Your Favorite Books" },
    { icon: Users, text: "Get Personalized Recommendations" },  
    { icon: Heart, text: "Discover your next favorite read" },
  ]

  const stats = [
    { value: "2M+", label: "Books Available" },
    { value: "500K+", label: "Authors" },
    { value: "50+", label: "Achievements" },
    { value: "24/7", label: "Book Discovery" }
  ]

  return (
    <div className="min-h-[100dvh] bg-gradient-to-t from-stone-900 via-stone-800 to-stone-800 p-4 flex flex-col">
      {/* Header with Logo and Title */}
      <div className="text-center pt-6 pb-4">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="relative">
            <Image src="/brand-logo.png" width={48} height={48} alt="logo" className='rounded-full'/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Bookmarkd</h1>
            <p className="text-stone-300 text-xs">Keep track of your books effortlessly</p>
          </div>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        {!showProfileSetup ? (
          /* Google Sign In Section */
          <>
            {/* Welcome Message */}
            <div className="text-center mb-6">
              <div className="relative mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-amber-500/30 rounded-full blur-xl" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/30 border border-amber-400/30 mx-auto">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">
                Join Bookmarkd Today!
              </h2>
              <p className="text-stone-300 text-sm">
                Sign in with Google to start creating your personal book collection
              </p>
            </div>

            {/* Google Sign In Button */}
            <button 
              onClick={handleGoogleSignIn} 
              disabled={isGoogleLoading} 
              className="w-full mb-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-3.5 px-6 rounded-lg  
                         transition-all duration-300 ease-out flex items-center justify-center gap-3 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500/50 focus:ring-offset-transparent 
                         active:scale-95 shadow-lg hover:shadow-sm hover:shadow-gray-200/50
                         disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-gray-200
                         hover:border-gray-300 hover:-translate-y-0.5 hover:scale-[1.02]
                         group relative overflow-hidden" 
            > 
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50/30 to-transparent 
                              translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
              
              {isGoogleLoading ? ( 
                <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" /> 
              ) : ( 
                <> 
                  <svg className="w-5 h-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3" viewBox="0 0 24 24"> 
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/> 
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/> 
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/> 
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/> 
                  </svg> 
                  <span className="transition-all duration-300 group-hover:tracking-wide relative z-10 text-sm">
                    Continue with Google
                  </span> 
                </> 
              )} 
            </button>

            {/* Quick Features */}
            <div className="space-y-2 mb-4">
              {features.slice(0, 4).map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-black/30 backdrop-blur-sm rounded-md flex items-center justify-center border border-white/20">
                    <feature.icon className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="text-stone-200 text-sm">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {stats.slice(0, 2).map((stat, index) => (
                <div key={index} className="text-center p-3 bg-black/20 backdrop-blur-sm rounded-lg border border-white/10">
                  <div className="text-lg font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-stone-300">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Privacy Note */}
            <div className="text-center">
              <p className="text-xs text-stone-400">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </>
        ) : (
          /* Profile Setup Form */
          <>
            <div className="text-center mb-6">
              <div className="relative mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-emerald-500/30 rounded-full blur-xl" />
                <div className="relative w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 border border-green-400/30 mx-auto">
                  <User className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Complete Your Profile
              </h3>
              <p className="text-stone-300 text-sm">
                Choose a username and optionally add a profile picture
              </p>
            </div>

            <form onSubmit={handleProfileSetup} className="space-y-4">
              {/* Profile Picture Upload */}
              <div>
                <label className="block text-sm font-medium text-stone-200 mb-2">
                  Profile Picture <span className="text-stone-400">(Optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center overflow-hidden">
                      {profileImagePreview ? (
                        <Image 
                          src={profileImagePreview} 
                          alt="Profile preview" 
                          fill
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-stone-400" />
                      )}
                    </div>
                    {profileImagePreview && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                      >
                        <X className="w-2 h-2" />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <label
                      htmlFor="profileImage"
                      className="inline-flex items-center gap-2 px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/10 cursor-pointer transition-colors text-xs text-stone-200"
                    >
                      <Upload className="w-3 h-3 text-amber-400" />
                      {profileImage ? 'Change Photo' : 'Upload Photo'}
                    </label>
                    <input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-stone-200 mb-2">
                  Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-amber-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full pl-9 pr-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors placeholder-stone-400 text-white text-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isUploadingImage || !username.trim()}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30 border border-amber-400/30"
              >
                {isUploadingImage ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Complete Setup
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        {/* Message Display */}
        {message && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 backdrop-blur-sm border ${
            message.includes('Success') || message.includes('successfully') || message.includes('created')
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' 
              : 'bg-red-500/20 text-red-200 border-red-400/30'
          }`}>
            {message.includes('Success') || message.includes('successfully') || message.includes('created') ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span className="text-xs">{message}</span>
          </div>
        )}
      </div>
    </div>
  )
}