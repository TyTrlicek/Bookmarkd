'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { ArrowRight, AlertCircle, CheckCircle, User, Upload, X } from 'lucide-react'
import useAuthStore from '@/store/authStore'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

const FEATURES = [
  'Track every book you read',
  'Rate and review honestly',
  'Get picks based on your shelf',
  'Follow readers you trust',
]

export default function MobileAuthPage() {
  const [message, setMessage] = useState('')
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showProfileSetup] = useState(false)
  const [pendingUser] = useState<any>(null)
  const router = useRouter()

  // Google Sign In Handler
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
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

      const { data } = supabase.storage.from('avatar').getPublicUrl(filePath)

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
    } catch (err: any) {
      console.error('Failed to create user profile:', err)
      if (err.response?.data?.error) {
        setMessage(err.response.data.error)
      } else {
        setMessage('Failed to save user profile. Please try again.')
      }
    } finally {
      setIsUploadingImage(false)
    }
  }

  const isSuccessMsg =
    message.includes('Success') || message.includes('successfully') || message.includes('created')

  return (
    <div className="grain relative flex min-h-[100dvh] flex-col overflow-hidden bg-canvas px-6 pb-10 pt-14">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(80% 40% at 80% 0%, rgba(224,168,93,0.16), transparent 60%),' +
            'radial-gradient(60% 40% at 0% 100%, rgba(217,119,6,0.10), transparent 65%)',
        }}
      />

      <a href="/" className="flex items-center gap-2.5">
        <Image src="/brand-logo.png" width={30} height={30} alt="" className="rounded-md" />
        <span className="font-display text-lg font-semibold text-ink">Bookmarkd</span>
      </a>

      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        {!showProfileSetup ? (
          <>
            <p className="kicker">Welcome</p>
            <h1 className="font-display mt-3 text-[2rem] font-semibold leading-[1.12] tracking-[-0.02em] text-ink">
              Your reading life,{' '}
              <span className="italic text-gold" style={{ fontVariationSettings: '"WONK" 1' }}>
                in one place.
              </span>
            </h1>

            <ul className="mt-6 space-y-2.5">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-ink-soft">
                  <span className="h-1 w-1 rounded-full bg-gold" />
                  {f}
                </li>
              ))}
            </ul>

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

            <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">
              By continuing you agree to our Terms of Service and Privacy Policy.
            </p>
          </>
        ) : (
          <>
            <p className="kicker">Almost there</p>
            <h2 className="font-display mt-3 text-[2rem] font-semibold tracking-[-0.02em] text-ink">
              Set up your profile
            </h2>
            <p className="mt-2 text-sm text-ink-mute">Pick a username, add a photo if you like.</p>

            <form onSubmit={handleProfileSetup} className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block text-xs font-medium text-ink-mute">
                  Profile picture <span className="text-ink-faint">(optional)</span>
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border border-line bg-surface-2">
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
                        className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rate-bad text-white"
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
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full rounded-lg border border-line bg-overlay py-2.5 pl-9 pr-3.5 text-sm text-ink placeholder-ink-faint transition-colors focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/30"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploadingImage || !username.trim()}
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
  )
}
