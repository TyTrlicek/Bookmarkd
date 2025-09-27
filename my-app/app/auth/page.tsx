'use client'

import { useEffect, useState } from 'react'
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
import Footer from '../components/Footer'
import MobileAuthPage from './MobileAuthPage'

export default function AuthPage() {
  const [message, setMessage] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [pendingUser, setPendingUser] = useState<any>(null)
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false)

  // Development login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isDevLoginLoading, setIsDevLoginLoading] = useState(false)
  const [showDevLogin, setShowDevLogin] = useState(false)

  const isDevelopment = process.env.NODE_ENV === 'development'

  // Development Email/Password Sign In Handler
  const handleDevEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsDevLoginLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      })

      if (error) {
        setMessage(error.message)
        return
      }

      if (data.user) {
        // Check if user profile exists in our database
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${data.user.id}`)

          if (response.data) {
            // User exists, initialize session and redirect
            await useAuthStore.getState().initSession()
            router.push('/')
          } else {
            // User doesn't exist in our db, show profile setup
            setPendingUser(data.user)
            setShowProfileSetup(true)
          }
        } catch (err) {
          // User doesn't exist in our db, show profile setup
          setPendingUser(data.user)
          setShowProfileSetup(true)
        }
      }
    } catch (error) {
      setMessage('Failed to sign in. Please try again.')
      console.error('Dev sign in error:', error)
    } finally {
      setIsDevLoginLoading(false)
    }
  }

  // Development Sign Up Handler
  const handleDevEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsDevLoginLoading(true)
    setMessage('')

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
      })

      if (error) {
        setMessage(error.message)
        return
      }

      if (data.user) {
        setMessage('Account created! Please check your email to verify your account, then sign in.')
      }
    } catch (error) {
      setMessage('Failed to create account. Please try again.')
      console.error('Dev sign up error:', error)
    } finally {
      setIsDevLoginLoading(false)
    }
  }

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
      // Note: The redirect will happen automatically, so we don't need to handle success here
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
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setMessage('Please select a valid image file.')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage('Image size must be less than 5MB.')
        return
      }

      setProfileImage(file)
      
      // Create preview
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
    // Clear the file input
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
      // Upload profile image if provided
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

      // Initialize session and redirect
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
    { icon: Users, text: "Get Personalized Recommendations" },
    { icon: Star, text: "See What Others Rate Your Favorite Books" },
    { icon: Heart, text: "Discover your next favorite read" },
  ]

  const stats = [
    { value: "2M+", label: "Books Available" },
    { value: "500K+", label: "Authors" },
    { value: "50+", label: "Achievements" },
    { value: "24/7", label: "Book Discovery" }
  ]

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-t from-stone-900 via-stone-800 to-stone-800">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">

        {isMobile && 
        <MobileAuthPage />
        }

        {/* Left Side - Branding & Features */}
        {!isMobile && <>
        <div className="bg-gradient-to-br from-black/40 via-stone-800/60 to-black/30 p-8 lg:p-12 flex flex-col justify-center backdrop-blur-sm border-r border-white/10">
          <div className="max-w-md mx-auto lg:mx-0">
            {/* Logo & Title */}
            <div className="flex items-center gap-3 mb-8">
              <div className="relative">
                <Image src="/brand-logo.png" width={64} height={64} alt="logo" className='rounded-full'/>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Bookmarkd</h1>
                <p className="text-stone-300 text-sm">Keep track of your books effortlessly</p>
              </div>
            </div>

            {/* Main Heading */}
            <div className="mb-10">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
                {showProfileSetup ? 'Complete Your Profile' : 'Join Bookmarkd Today!'}
              </h2>
              <p className="text-lg text-stone-300">
                {showProfileSetup 
                  ? 'Just one more step to personalize your reading experience.'
                  : 'Join a community of readers who are discovering, tracking, and rating their favorite books with just one click.'
                }
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-10">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-black/30 backdrop-blur-sm rounded-lg flex items-center justify-center shadow-sm border border-white/20">
                    <feature.icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-stone-200">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center p-4 bg-black/20 backdrop-blur-sm rounded-xl border border-white/10">
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-stone-300">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-8 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-stone-800/80 to-stone-900/90 backdrop-blur-md">
          <div className="max-w-md mx-auto w-full">
            {!showProfileSetup ? (
              /* Google Sign In Section */
              <>
                {/* Form Header */}
                <div className="text-center mb-8">
                  <div className="relative mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-amber-500/30 rounded-full blur-xl" />
                    <div className="relative w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/30 border border-amber-400/30 mx-auto">
                      <BookOpen className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Get Started in Seconds
                  </h3>
                  <p className="text-stone-300">
                    Sign in with your Google account to join our growing community of readers
                  </p>
                </div>

                {/* Google Sign In Button */}
                <button 
  onClick={handleGoogleSignIn} 
  disabled={isGoogleLoading} 
  className="w-full mb-6 bg-white hover:bg-gray-50 text-gray-900 font-semibold py-4 px-6 rounded-lg  
             transition-all duration-300 ease-out flex items-center justify-center gap-3 
             focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500/50 focus:ring-offset-transparent 
             active:scale-95 shadow-lg hover:shadow-sm hover:shadow-gray-200/50
             disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer border border-gray-200
             hover:border-gray-300 hover:-translate-y-0.5 hover:scale-[1.02]
             group relative overflow-hidden" 
> 
  {/* Subtle background animation */}
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
      <span className="transition-all duration-300 group-hover:tracking-wide relative z-10">
        Continue with Google
      </span> 
    </> 
  )}
</button>

                {/* Development Email/Password Login */}
                {true && (
                  <div className="mb-6">
                    <div className="flex items-center my-4">
                      <div className="flex-1 border-t border-white/20"></div>
                      <span className="px-3 text-xs text-stone-400 bg-stone-800/50 rounded-full">No Google?</span>
                      <div className="flex-1 border-t border-white/20"></div>
                    </div>

                    <button
                      onClick={() => setShowDevLogin(!showDevLogin)}
                      className="w-full mb-4 bg-stone-700/30 hover:bg-stone-700/50 text-stone-200 font-medium py-3 px-4 rounded-lg border border-stone-600/30 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {showDevLogin ? 'Hide' : 'Show'} Email/Password Login
                    </button>

                    {showDevLogin && (
                      <div className="bg-stone-900/50 backdrop-blur-sm rounded-lg p-4 border border-stone-600/30">
                        <form onSubmit={handleDevEmailSignIn} className="space-y-4">
                          <div>
                            <label htmlFor="dev-email" className="block text-sm font-medium text-stone-200 mb-1">
                              Email
                            </label>
                            <input
                              id="dev-email"
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              className="w-full px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors placeholder-stone-400 text-white text-sm"
                            />
                          </div>

                          <div>
                            <label htmlFor="dev-password" className="block text-sm font-medium text-stone-200 mb-1">
                              Password
                            </label>
                            <input
                              id="dev-password"
                              type="password"
                              placeholder="Enter your password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              className="w-full px-3 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors placeholder-stone-400 text-white text-sm"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              disabled={isDevLoginLoading || !email.trim() || !password.trim()}
                              className="flex-1 bg-amber-600/80 hover:bg-amber-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              {isDevLoginLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                              ) : (
                                'Sign In'
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={handleDevEmailSignUp}
                              disabled={isDevLoginLoading || !email.trim() || !password.trim()}
                              className="flex-1 bg-stone-600/80 hover:bg-stone-600 text-white font-medium py-2 px-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              Sign Up
                            </button>
                          </div>
                        </form>

                        <p className="text-xs text-stone-500 mt-2 text-center">
                          Email Will be sent to your inbox for verification.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Benefits */}
                {/* <div className="bg-black/20 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Why use Google Sign-In?
                  </h4>
                  <ul className="space-y-2 text-sm text-stone-300">
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                      No passwords to remember or manage
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                      Secure authentication handled by Google
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                      Quick access across all your devices
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-amber-400 rounded-full"></div>
                      Get started reading in under 30 seconds
                    </li>
                  </ul>
                </div> */}

                {/* Privacy Note */}
                <div className="mt-6 text-center">
                  <p className="text-xs text-stone-400">
                    By continuing, you agree to our Terms of Service and Privacy Policy. 
                    We'll only access your basic profile information.
                  </p>
                </div>
              </>
            ) : (
              /* Profile Setup Form */
              <>
                <div className="text-center mb-8">
                  <div className="relative mx-auto mb-6">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-400/30 to-emerald-500/30 rounded-full blur-xl" />
                    <div className="relative w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-green-500/30 border border-green-400/30 mx-auto">
                      <User className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Complete Your Profile
                  </h3>
                  <p className="text-stone-300">
                    Choose a username and optionally add a profile picture
                  </p>
                </div>

                <form onSubmit={handleProfileSetup} className="space-y-6">
                  {/* Profile Picture Upload */}
                  <div>
                    <label className="block text-sm font-medium text-stone-200 mb-2">
                      Profile Picture <span className="text-stone-400">(Optional)</span>
                    </label>
                    <div className="flex items-center gap-4">
                      {/* Profile Picture Preview */}
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full bg-black/30 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center overflow-hidden">
                          {profileImagePreview ? (
                            <Image 
                              src={profileImagePreview} 
                              alt="Profile preview" 
                              fill
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-stone-400" />
                          )}
                        </div>
                        {profileImagePreview && (
                          <button
                            type="button"
                            onClick={removeImage}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      
                      {/* Upload Button */}
                      <div className="flex-1">
                        <label
                          htmlFor="profileImage"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/10 cursor-pointer transition-colors text-sm text-stone-200"
                        >
                          <Upload className="w-4 h-4 text-amber-400" />
                          {profileImage ? 'Change Photo' : 'Upload Photo'}
                        </label>
                        <input
                          id="profileImage"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <p className="text-xs text-stone-400 mt-1">
                          JPG, PNG, or GIF up to 5MB
                        </p>
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
                        <User className="h-5 w-5 text-amber-400" />
                      </div>
                      <input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors placeholder-stone-400 text-white"
                      />
                    </div>
                    <p className="text-xs text-stone-400 mt-1">
                      This is how other readers will see you
                    </p>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isUploadingImage || !username.trim()}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30 border border-amber-400/30"
                  >
                    {isUploadingImage ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
              <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 backdrop-blur-sm border ${
                message.includes('Success') || message.includes('successfully') || message.includes('created')
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' 
                  : 'bg-red-500/20 text-red-200 border-red-400/30'
              }`}>
                {message.includes('Success') || message.includes('successfully') || message.includes('created') ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm">{message}</span>
              </div>
            )}
          </div>
        </div></>}
      </div>
    </div>
  )
}