'use client'

import { useState, useEffect, Suspense } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
    </div>
  )
}

// Main component
function ResetPasswordForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (session && !error) {
        setIsValidSession(true)
      } else {
        setMessage('Invalid or expired reset link. Please request a new password reset.')
      }
    }

    checkSession()
  }, [])

  const validatePassword = (password: string): boolean => {
    return password.length >= 6
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage('')

    if (!validatePassword(newPassword)) {
      setMessage('Password must be at least 6 characters long.')
      setIsLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.')
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Password updated successfully! Redirecting to login...')
        setTimeout(() => {
          router.push('/auth?message=Password updated successfully')
        }, 2000)
      }
    } catch (error) {
      setMessage('Something went wrong. Please try again.')
    }

    setIsLoading(false)
  }

  if (!isValidSession && !message) {
    return <LoadingSpinner />
  }

  const isSuccessMsg = message.includes('successfully') || message.includes('Redirecting')

  return (
    <div className="grain relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 40% at 50% 0%, rgba(224,168,93,0.12), transparent 65%)',
        }}
      />

      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <Image src="/brand-logo.png" width={30} height={30} alt="" className="rounded-md" />
          <span className="font-display text-lg font-semibold text-ink">Bookmarkd</span>
        </div>

        <p className="kicker">Account</p>
        <h1 className="font-display mt-3 text-3xl font-semibold tracking-[-0.02em] text-ink">
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-ink-mute">Choose a new password for your account.</p>

        {isValidSession ? (
          <form onSubmit={handleResetPassword} className="mt-8 space-y-5">
            <div>
              <label htmlFor="newPassword" className="mb-1.5 block text-xs font-medium text-ink-mute">
                New password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-ink-faint" />
                </span>
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-line bg-overlay py-2.5 pl-9 pr-11 text-sm text-ink placeholder-ink-faint transition-colors focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-faint transition-colors hover:text-ink-soft"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-xs font-medium text-ink-mute"
              >
                Confirm new password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-ink-faint" />
                </span>
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-line bg-overlay py-2.5 pl-9 pr-11 text-sm text-ink placeholder-ink-faint transition-colors focus:border-gold/40 focus:outline-none focus:ring-1 focus:ring-gold/30"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-ink-faint transition-colors hover:text-ink-soft"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-ember px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-ember-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  Update password
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        ) : null}

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

        {!isValidSession && (
          <div className="mt-6">
            <button
              onClick={() => router.push('/auth')}
              className="text-sm font-medium text-gold transition-colors hover:text-gold-soft"
            >
              &larr; Back to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
