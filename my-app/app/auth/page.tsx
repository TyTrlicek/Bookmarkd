'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { 
  BookOpen, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  ArrowRight,
  Sparkles,
  Users,
  Star,
  Heart,
  AlertCircle,
  CheckCircle,
  User,
  Camera,
  Upload,
  X,
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Footer from '../components/Footer'


export default function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authMode, setAuthMode] = useState('signup') // or 'signup'
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const router = useRouter();

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

  const handleForgotPassword = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsLoading(true)
  setMessage('')

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setResetSent(true)
      setMessage('Password reset instructions have been sent to your email!')
    }
  } catch (error) {
    setMessage('Something went wrong. Please try again.')
  }

  setIsLoading(false)
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

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setMessage('');

  try {
    let result;

    if (authMode === 'login') {
      result = await supabase.auth.signInWithPassword({ email, password });
    } else {
      result = await supabase.auth.signUp({
        email,
        password,
        options: {
          // This should be the URL your user is redirected to after clicking
          // the confirmation link in the email
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (authMode === 'signup') {
        const user = result.data.user;

        if (user) {
          try {
            // Upload profile image if provided
            let avatarUrl = null;
            if (profileImage) {
              avatarUrl = await uploadImage(user.id);
              if (!avatarUrl) {
                setMessage('Account created but failed to upload profile picture.');
              }
            }

            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/users/create`, {
              id: user.id,
              email: user.email,
              username: username,
              avatar_url: avatarUrl,
            });
            console.log('User saved to DB');
          } catch (err) {
            console.error('Failed to create user in DB:', err);
            setMessage('Signup succeeded, but failed to save user profile.');
          }
        }
      }
    }

    if (result.error) {
      setMessage(result.error.message);
    } else {
      if (authMode === 'signup') {
        // 🔑 Don't redirect here — just tell them to check their email
        setMessage('Account created! Please check your email to confirm before logging in.');
      } else {
        // For login, we can init session + redirect
        await useAuthStore.getState().initSession();
        setMessage('Logged in successfully!');
        router.push('/');
      }
    }
  } catch (error) {
    setMessage('Something went wrong. Please try again.');
  }

  setIsLoading(false);
};

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

  return (
    <div className="min-h-screen bg-gradient-to-t from-stone-900 via-stone-800 to-stone-800">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Side - Branding & Features */}
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
                {authMode === 'login' ? 'Welcome Back!' : 'Sign Up For Free!'}
              </h2>
              <p className="text-lg text-stone-300">
                {authMode === 'login' 
                  ? 'Continue tracking your book collection and connect with fellow readers.'
                  : 'Join a community of readers who are discovering, tracking, and rating their favorite books.'
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

        {/* Right Side - Auth Form */}
        <div className="p-8 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-stone-800/80 to-stone-900/90 backdrop-blur-md">
          <div className="max-w-md mx-auto w-full">
            {/* Form Header */}
            <div className="text-center mb-8">
              <div className="relative mx-auto mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400/30 to-amber-500/30 rounded-xl blur-2xl" />
                {/* <div className="relative w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 border border-amber-400/30">
                  <Sparkles className="w-8 h-8 text-white" />
                </div> */}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </h3>
              <p className="text-stone-300">
                {authMode === 'login' 
                  ? 'Enter your credentials to access your account'
                  : 'Fill in your details to get started'
                }
              </p>
            </div>

            {/* Google Sign In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full mb-6 bg-black/30 backdrop-blur-sm border border-white/20 text-stone-200 font-medium py-3 px-4 rounded-lg 
                         transition-all duration-200 flex items-center justify-center gap-3
                         hover:bg-white/10 hover:shadow-md hover:border-white/30
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500/50 focus:ring-offset-transparent
                         active:scale-95
                         disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isGoogleLoading ? (
                <div className="w-5 h-5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center mb-6">
              <div className="flex-1 border-t border-white/20"></div>
              <span className="px-4 text-sm text-stone-400">or</span>
              <div className="flex-1 border-t border-white/20"></div>
            </div>

            {/* Conditional Auth Forms */}
            {authMode === 'forgot-password' ? (
              /* Forgot Password Form */
              <form onSubmit={handleForgotPassword} className="space-y-6">
                <div>
                  <label htmlFor="resetEmail" className="block text-sm font-medium text-stone-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-amber-400" />
                    </div>
                    <input
                      id="resetEmail"
                      type="email"
                      placeholder="Enter your email address"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors placeholder-stone-400 text-white"
                    />
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    We'll send password reset instructions to this email
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || resetSent}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : resetSent ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Email Sent
                    </>
                  ) : (
                    <>
                      Send Reset Instructions
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {resetSent && (
                  <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-blue-200">
                        <p className="font-medium mb-1">Check your email!</p>
                        <p>We've sent password reset instructions to <span className="font-medium">{resetEmail}</span></p>
                        <p className="mt-2">Didn't receive it? Check your spam folder or try again.</p>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              /* Regular Login/Signup Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture Upload - Only for Signup */}
                {authMode === "signup" && (
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
                )}

                {/* Username Field */}
                {authMode === "signup" && (
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-stone-200 mb-2">
                      Username
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
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-stone-200 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-amber-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-10 pr-4 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors placeholder-stone-400 text-white"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-stone-200 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-amber-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-10 pr-12 py-3 bg-black/30 backdrop-blur-sm border border-white/20 rounded-lg focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-colors placeholder-stone-400 text-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-stone-400 hover:text-amber-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-stone-400 hover:text-amber-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || isUploadingImage}
                  className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-500/30 border border-amber-400/30"
                >
                  {isLoading || isUploadingImage ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Message Display */}
            {message && (
              <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 backdrop-blur-sm border ${
                message.includes('Success') || message.includes('successfully') || message.includes('Account created')
                  ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30' 
                  : 'bg-red-500/20 text-red-200 border-red-400/30'
              }`}>
                {message.includes('Success') || message.includes('successfully') || message.includes('Account created') ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                )}
                <span className="text-sm">{message}</span>
              </div>
            )}

            {/* Mode Switch */}
            <div className="mt-8 text-center">
              <p className="text-stone-300 mb-4">
                {authMode === 'login' && "Don't have an account?"}
                {authMode === 'signup' && "Already have an account?"}
                {authMode === 'forgot-password' && "Remember your password?"}
              </p>
              <button
                onClick={() => {
                  if (authMode === 'forgot-password') {
                    setAuthMode('login')
                  } else {
                    setAuthMode(authMode === 'login' ? 'signup' : 'login')
                  }
                  setMessage('')
                  setResetSent(false)
                  setProfileImage(null)
                  setProfileImagePreview(null)
                }}
                className="text-amber-400 hover:text-amber-300 font-semibold transition-colors"
              >
                {authMode === 'login' && 'Create Account'}
                {authMode === 'signup' && 'Sign In Instead'}
                {authMode === 'forgot-password' && 'Back to Sign In'}
              </button>
            </div>

            {/* Additional Links */}
            {authMode === 'login' && (
              <div className="mt-6 text-center">
                <button 
                  onClick={() => {
                    setAuthMode('forgot-password')
                    setMessage('')
                    setResetSent(false)
                  }}
                  className="text-stone-400 hover:text-stone-300 text-sm transition-colors"
                >
                  Forgot your password?
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}