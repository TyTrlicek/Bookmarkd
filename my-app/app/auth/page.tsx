'use client'

import { Suspense, useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
  ArrowRight,
  AlertCircle,
  CheckCircle,
  User,
  Upload,
  X,
  Loader2,
} from 'lucide-react'
import useAuthStore from '@/store/authStore'
import axios from 'axios'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import MobileAuthPage from './MobileAuthPage'

function AuthPageContent() {
  const [message, setMessage] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [pendingUser, setPendingUser] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isMobile, setIsMobile] = useState(false)

  // Handle OAuth callback with ?setup=true (user needs profile setup)
  useEffect(() => {
    const needsSetup = searchParams.get('setup') === 'true'
    if (needsSetup) {
      const initSetup = async () => {
        const { data } = await supabase.auth.getSession()
        if (data.session?.user) {
          setPendingUser(data.session.user)
          setShowProfileSetup(true)
        } else {
          // No session, redirect to normal auth
          router.push('/auth')
        }
      }
      initSetup()
    }
  }, [searchParams, router])

  // Development login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isDevLoginLoading, setIsDevLoginLoading] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const isDevelopment = process.env.NODE_ENV === 'development'

  // Username validation helper
  const validateUsername = (value: string): string => {
    const trimmed = value.trim()
    if (trimmed.length === 0) return ''
    if (trimmed.length < 3) return 'Username must be at least 3 characters'
    if (trimmed.length > 20) return 'Username must be 20 characters or less'
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return 'Only letters, numbers, underscores, and dashes allowed'
    }
    return ''
  }

  // Password validation helper
  const validatePassword = (value: string): string => {
    if (value.length === 0) return ''
    if (value.length < 8) return 'Password must be at least 8 characters'
    return ''
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsername(value)
    setUsernameError(validateUsername(value))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setPassword(value)
    setPasswordError(validatePassword(value))
  }

  const isUsernameValid = username.trim().length >= 3 && !usernameError
  const isPasswordValid = password.length >= 8

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

      if (data.user && data.session) {
        // Check if user profile exists in our database
        try {
          const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.data) {
            // User exists, initialize session and redirect
            await useAuthStore.getState().initSession()
            router.push('/')
          } else {
            // User doesn't exist in our db, show profile setup
            setPendingUser(data.user)
            setShowProfileSetup(true)
          }
        } catch (err: any) {
          // 404 means user doesn't exist in our db, show profile setup
          // Any other error is a server issue
          if (err.response?.status === 404) {
            setPendingUser(data.user)
            setShowProfileSetup(true)
          } else {
            console.error('Error checking user profile:', err)
            setMessage('An error occurred. Please try again.')
          }
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

    // Validate file extension
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    const fileExt = profileImage.name.split('.').pop()?.toLowerCase()
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      setMessage('Invalid file type. Please use JPG, PNG, GIF, or WebP.')
      return null
    }

    // Validate MIME type matches extension
    const mimeToExt: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp']
    }
    const allowedExtsForMime = mimeToExt[profileImage.type]
    if (!allowedExtsForMime || !allowedExtsForMime.includes(fileExt)) {
      setMessage('File extension does not match file type.')
      return null
    }

    setIsUploadingImage(true)
    try {
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

      // Initialize session and redirect with welcome flag for new users
      await useAuthStore.getState().initSession()
      setMessage('Profile created successfully!')
      router.push('/?welcome=true')
    } catch (err: any) {
      console.error('Failed to create user profile:', err)
      // Check for specific error messages from the backend
      if (err.response?.data?.error) {
        setMessage(err.response.data.error)
      } else {
        setMessage('Failed to save user profile. Please try again.')
      }
    } finally {
      setIsUploadingImage(false)
    }
  }

  const features = [
    'Track every book you read',
    'Rate and review honestly',
    'Get picks based on your shelf',
    'Follow readers you trust',
  ]

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const isSuccessMsg =
    message.includes('Success') || message.includes('successfully') || message.includes('created')

  if (isMobile) return <MobileAuthPage />

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1.05fr_1fr]">
      {/* ---- Left: brand panel ---- */}
      <div className="grain relative hidden overflow-hidden border-r border-line lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(70% 50% at 78% 0%, rgba(224,168,93,0.18), transparent 58%),' +
              'radial-gradient(60% 50% at 5% 100%, rgba(217,119,6,0.12), transparent 62%)',
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 -z-[5] flex items-center gap-3 pr-4 opacity-[0.16] [mask-image:linear-gradient(to_bottom,transparent,#000_18%,#000_82%,transparent)]"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-[360px] w-16 rounded-sm"
              style={{
                transform: `translateY(${(i % 2) * 48 - 24}px) rotate(-4deg)`,
                background: `linear-gradient(180deg, var(--surface-2), var(--surface)) padding-box`,
                boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.06), 0 30px 60px -30px #000',
              }}
            />
          ))}
        </div>

        <a href="/" className="relative flex items-center gap-2.5">
          <Image src="/brand-logo.png" width={32} height={32} alt="" className="rounded-md" />
          <span className="font-display text-lg font-semibold text-ink">Bookmarkd</span>
        </a>

        <div className="relative max-w-md">
          <h1 className="font-display text-[clamp(2rem,3vw,2.9rem)] font-semibold leading-[1.12] tracking-[-0.02em] text-ink">
            {showProfileSetup ? (
              <>One more step to make it yours.</>
            ) : (
              <>
                Your reading life,{' '}
                <span className="italic text-gold" style={{ fontVariationSettings: '"WONK" 1' }}>
                  in one place.
                </span>
              </>
            )}
          </h1>
          <p className="mt-5 max-w-sm text-[0.95rem] leading-relaxed text-ink-mute">
            {showProfileSetup
              ? 'Pick a name other readers will know you by. You can change it later.'
              : 'Keep every book you’ve read, rate them honestly, and build a shelf that actually reflects your taste.'}
          </p>
          <ul className="mt-8 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm text-ink-soft">
                <span className="h-1 w-1 rounded-full bg-gold" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative max-w-sm">
          <p className="font-display text-lg italic leading-snug text-ink-soft">
            Reading is worth keeping a record of.
          </p>
          <p className="mt-3 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-faint">
            Free forever &middot; No credit card
          </p>
        </div>
      </div>

      {/* ---- Right: form ---- */}
      <div className="flex flex-col justify-center px-6 py-14 sm:px-10">
        <div className="mx-auto w-full max-w-sm">
          {!showProfileSetup ? (
            <>
              <p className="kicker">Welcome</p>
              <h2 className="font-display mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink">
                Get started
              </h2>
              <p className="mt-2 text-sm text-ink-mute">
                Sign in or create an account — takes about 30 seconds.
              </p>

              <button
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#1a1a1a] transition-all hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a1a1a] border-t-transparent" />
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-line" />
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.2em] text-ink-faint">
                  or with email
                </span>
                <div className="h-px flex-1 bg-line" />
              </div>

              <form onSubmit={handleDevEmailSignIn} className="space-y-4">
                <div>
                  <label htmlFor="dev-email" className="mb-1.5 block text-xs font-medium text-ink-mute">
                    Email
                  </label>
                  <input
                    id="dev-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-lg border border-line bg-overlay px-3.5 py-2.5 text-sm text-ink placeholder-ink-faint transition-colors focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/30"
                  />
                </div>
                <div>
                  <label htmlFor="dev-password" className="mb-1.5 block text-xs font-medium text-ink-mute">
                    Password
                  </label>
                  <input
                    id="dev-password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={handlePasswordChange}
                    required
                    className={`w-full rounded-lg border bg-overlay px-3.5 py-2.5 text-sm text-ink placeholder-ink-faint transition-colors focus:outline-none focus:ring-1 focus:ring-gold/30 ${
                      passwordError ? 'border-rate-bad/60' : 'border-line focus:border-gold/40'
                    }`}
                  />
                  {passwordError && <p className="mt-1 text-xs text-rate-bad">{passwordError}</p>}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isDevLoginLoading || !email.trim() || !password.trim()}
                    className="flex-1 rounded-full bg-ember px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ember-strong disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isDevLoginLoading ? (
                      <div className="mx-auto h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      'Sign in'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDevEmailSignUp}
                    disabled={isDevLoginLoading || !email.trim() || !isPasswordValid}
                    className="flex-1 rounded-full border border-line-strong bg-overlay px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-overlay-hover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Create account
                  </button>
                </div>
              </form>

              <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">
                By continuing you agree to our Terms of Service and Privacy Policy.
              </p>
            </>
          ) : (
            /* Profile setup */
            <>
              <p className="kicker">Almost there</p>
              <h2 className="font-display mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink">
                Set up your profile
              </h2>
              <p className="mt-2 text-sm text-ink-mute">Pick a username, add a photo if you like.</p>

              <form onSubmit={handleProfileSetup} className="mt-8 space-y-6">
                <div>
                  <label className="mb-2 block text-xs font-medium text-ink-mute">
                    Profile picture <span className="text-ink-faint">(optional)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-2">
                        {profileImagePreview ? (
                          <Image src={profileImagePreview} alt="" fill className="object-cover" />
                        ) : (
                          <User className="h-5 w-5 text-ink-faint" />
                        )}
                      </div>
                      {profileImagePreview && (
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rate-bad text-white transition-colors hover:opacity-90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <div className="flex-1">
                      <label
                        htmlFor="profileImage"
                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-line bg-overlay px-4 py-2 text-xs font-medium text-ink transition-colors hover:bg-overlay-hover"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {profileImage ? 'Change photo' : 'Upload photo'}
                      </label>
                      <input id="profileImage" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                      <p className="mt-1.5 text-xs text-ink-faint">JPG, PNG or GIF, up to 5MB</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="username" className="mb-1.5 block text-xs font-medium text-ink-mute">
                    Username
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <User className="h-4 w-4 text-ink-faint" />
                    </span>
                    <input
                      id="username"
                      type="text"
                      placeholder="yourname"
                      value={username}
                      onChange={handleUsernameChange}
                      maxLength={20}
                      required
                      className={`w-full rounded-lg border bg-overlay py-2.5 pl-9 pr-3.5 text-sm text-ink placeholder-ink-faint transition-colors focus:outline-none focus:ring-1 focus:ring-gold/30 ${
                        usernameError ? 'border-rate-bad/60' : 'border-line focus:border-gold/40'
                      }`}
                    />
                  </div>
                  <p className={`mt-1.5 text-xs ${usernameError ? 'text-rate-bad' : 'text-ink-faint'}`}>
                    {usernameError || '3–20 characters — letters, numbers, _ and - only'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isUploadingImage || !isUsernameValid}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-ember px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-ember-strong disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isUploadingImage ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      Finish setup
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {message && (
            <div
              className={`mt-6 flex items-start gap-3 rounded-lg border p-3.5 text-sm ${
                isSuccessMsg
                  ? 'border-rate-high/30 bg-rate-high/10 text-rate-high'
                  : 'border-rate-bad/30 bg-rate-bad/10 text-rate-bad'
              }`}
            >
              {isSuccessMsg ? (
                <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              )}
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading fallback for Suspense
function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <Loader2 className="h-8 w-8 animate-spin text-gold" />
    </div>
  )
}

// Default export with Suspense boundary for useSearchParams
export default function AuthPage() {
  return (
    <Suspense fallback={<AuthLoading />}>
      <AuthPageContent />
    </Suspense>
  )
}