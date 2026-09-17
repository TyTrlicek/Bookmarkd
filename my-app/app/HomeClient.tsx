'use client'

import React, { useState, useEffect } from 'react'
import {
  BookOpen,
  Star,
  Heart,
  Share2,
  Download,
  ShoppingCart,
  TrendingUp,
  Calendar,
  Users,
  Award,
  ChevronRight,
  Play,
  Bookmark,
  MessageCircle,
  Plus,
  ExternalLink,
  Search,
  Bell,
  User,
  Clock,
  Crown,
  Coffee,
  ArrowRight,
  BookMarked,
  Sparkles,
  Zap,
  Link
} from 'lucide-react'
import BookList from './components/BookList'
import Header from './components/Header'
import axios from 'axios'
import useAuthStore from '@/store/authStore'
import { supabase } from '@/lib/supabaseClient'
import BookCarouselHero from './components/BookCarouselHero'
import { UserActivity, List } from './types/types'
import { toAmericanDate } from '@/utils/util'
import Image from 'next/image'
import Footer from './components/Footer'
import { useRouter, useSearchParams } from 'next/navigation'
import ListCard from './components/ListCard'
import OnboardingModal from './components/OnboardingModal'
import OnboardingProgress from './components/OnboardingProgress'
import DevOnboardingPanel from './components/DevOnboardingPanel'

const HomePage = () => {
  const [activeSection, setActiveSection] = useState('trending')
  const [searchQuery, setSearchQuery] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [trendingData, setTrendingData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([]);
  const [reccomendationData, setReccomendationData] = useState<any[]>([]);
  const [recentlyRatedData, setRecentlyRatedData] = useState<any[]>([]);
  const [popularLists, setPopularLists] = useState<List[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [devBookCountOverride, setDevBookCountOverride] = useState<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuthStore();

  useEffect(() => {
    useAuthStore.getState().initSession();
  }, []);


  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        useAuthStore.getState().clearSession();
      } else if (event === 'SIGNED_IN') {
        useAuthStore.getState().setSession(session);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Check for welcome param to show onboarding modal for new users
  useEffect(() => {
    const welcomeParam = searchParams.get('welcome');
    if (welcomeParam === 'true' && session) {
      setShowOnboardingModal(true);
    }
  }, [searchParams, session]);

  useEffect (() => {
    const fetchTrendingData = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/trending`)
      setTrendingData(res.data);
    } catch (error) {
      console.error(error);
    }
  }
  fetchTrendingData();

  const fetchRecentlyRatedData = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/recently-rated`);
      setRecentlyRatedData(res.data);
    } catch (error) {
      console.error(error);
    }
  };
  fetchRecentlyRatedData();

  const fetchPopularLists = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/lists/popular`);
      setPopularLists(res.data);
    } catch (error) {
      console.error(error);
    }
  };
  fetchPopularLists();

  const fetchRecentActivity = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/activity/recent-activity`)
      setRecentActivity(res.data);
    } catch (error) {
      console.error(error);
    }
  }
  // fetchRecentActivity();

  const fetchReccomendationData = async () => {
    try{
      const {
    data: { session },
  } = await supabase.auth.getSession();

  const accessToken = session?.access_token;

  if (!accessToken) {
    setReccomendationData([]);
    return [];
  }

  const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/recommendations`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  setReccomendationData(response.data);
  console.log('recommendation data', response.data);
    }
    catch (error) {
      console.error(error);
  }

  }
  fetchReccomendationData();

  const fetchUserStats = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;

      if (!accessToken) {
        setUserStats(null);
        return;
      }

      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/users/stats`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      setUserStats(response.data);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
      setUserStats(null);
    }
  };
  fetchUserStats();

}, [])

  // Fetch onboarding status
  const fetchOnboardingStatus = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) return;

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/onboarding-status`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setHasSeenWelcome(response.data.hasSeenWelcome ?? false);
    } catch (error) {
      console.error('Failed to fetch onboarding status:', error);
    }
  };

  // Fetch onboarding status when session changes
  useEffect(() => {
    if (session) {
      fetchOnboardingStatus();
    }
  }, [session]);

  // Handle onboarding modal close
  const handleOnboardingClose = async () => {
    setShowOnboardingModal(false);

    // Remove the welcome param from URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.delete('welcome');
    window.history.replaceState({}, '', url.pathname);

    // Mark welcome as seen in the backend
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (accessToken) {
        await axios.put(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/onboarding`,
          { hasSeenWelcome: true },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        setHasSeenWelcome(true);
      }
    } catch (error) {
      console.error('Failed to update onboarding status:', error);
    }
  };

  // Reset onboarding state (dev only)
  const handleResetOnboarding = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const accessToken = session?.access_token;
      if (!accessToken) return;

      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/onboarding/reset`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setHasSeenWelcome(false);
      // Refresh user stats to get updated state
      await fetchOnboardingStatus();
    } catch (error) {
      console.error('Failed to reset onboarding state:', error);
    }
  };

  // Clear session dismissal (dev only)
  const handleClearDismissal = () => {
    sessionStorage.removeItem('onboarding_progress_dismissed');
  };

  // Section heading — mono kicker + display title
  const SectionHeader = ({
    kicker,
    title,
    subtitle,
    accent = 'var(--gold)',
    action,
  }: {
    kicker: string;
    title: string;
    subtitle?: string;
    accent?: string;
    action?: React.ReactNode;
  }) => (
    <div className="mb-7">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p
            className="font-mono text-[0.7rem] uppercase tracking-[0.22em]"
            style={{ color: accent }}
          >
            {kicker}
          </p>
          <h2 className="font-display mt-2 text-2xl font-semibold tracking-[-0.01em] text-ink sm:text-[1.75rem]">
            {title}
          </h2>
        </div>
        {action}
      </div>
      {subtitle && (
        <p className="mt-1.5 text-sm text-ink-mute">{subtitle}</p>
      )}
      <div
        className="mt-4 h-px w-full"
        style={{
          background: `linear-gradient(to right, ${accent}55, var(--line) 40%, transparent)`,
        }}
      />
    </div>
  )

  // Coming Soon Component
  const ComingSoonSection = ({ icon: Icon, title, subtitle, description }: {
    icon: any;
    iconColor?: string;
    title: string;
    subtitle: string;
    description: string;
  }) => (
    <section>
      <SectionHeader kicker="On the way" title={title} subtitle={subtitle} accent="var(--ink-mute)" />
      <div className="grain relative overflow-hidden rounded-2xl border border-line bg-surface/60 p-10 text-center">
        <div className="relative z-10">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-overlay">
            <Icon className="h-6 w-6 text-ink-mute" />
          </div>
          <h3 className="font-display text-xl font-semibold text-ink">Coming soon</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-mute">
            {description}
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-faint">
            <Clock className="h-3.5 w-3.5" />
            In progress
          </div>
        </div>
      </div>
    </section>
  )

  // Fixed Height Book Section Component
  const FixedHeightBookSection = ({
    data,
    isEmpty = false,
    emptyStateContent
  }: {
    data: any,
    isEmpty?: boolean,
    emptyStateContent?: React.ReactNode
  }) => (
    <div className="rounded-2xl border border-line bg-surface/50 p-3 sm:p-4">
      {!isEmpty ? (
        <div className="relative h-72 sm:h-108">
          <BookList trendingData={data} />
        </div>
      ) : (
        <div className="flex min-h-[240px] items-center justify-center px-6 py-12">
          {emptyStateContent}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Hero Section - Conditional Rendering */}
      {!session && <BookCarouselHero />}

      {/* Optional: Small welcome banner for authenticated users */}
      {/* {session && userStats && (
        <div className="bg-gradient-to-r from-amber-900 to-[#14181C] border-b border-amber-500 py-6">
          <div className="max-w-7xl mx-auto px-6">
            <p className="text-stone-300 text-lg">
              Welcome back! You have <span className="text-amber-400 font-semibold">{userStats.booksInCollection}</span> books in your collection.
            </p>
          </div>
        </div>
      )} */}

      {/* Main Content */}
      <div className="relative bg-canvas">
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          {/* Trending Section */}
          <section className="mb-20">
            <SectionHeader
              kicker="Trending now"
              title="Most read this week"
              subtitle="What the community is picking up right now"
              accent="var(--gold)"
            />
            <FixedHeightBookSection
              data={trendingData}
              isEmpty={!trendingData || (Array.isArray(trendingData) && trendingData.length === 0)}
              emptyStateContent={
                <div className="flex flex-col items-center justify-center px-4 text-center max-w-md">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-overlay">
                    <TrendingUp className="h-6 w-6 text-gold" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-ink">
                    Nothing trending yet
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-mute">
                    Check back soon for this week&apos;s most-read books.
                  </p>
                </div>
              }
            />
          </section>

          {/* Recently Rated Section */}
          <section className="mb-20">
            <SectionHeader
              kicker="Recently rated"
              title="Fresh from the community"
              subtitle="The latest ratings and reviews as they land"
              accent="var(--hue-rated)"
            />
            <FixedHeightBookSection
              data={recentlyRatedData}
              isEmpty={!recentlyRatedData || recentlyRatedData.length === 0}
              emptyStateContent={
                <div className="flex flex-col items-center justify-center px-4 text-center max-w-md">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-overlay">
                    <Star className="h-6 w-6" style={{ color: 'var(--hue-rated)' }} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-ink">
                    No ratings yet
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-mute">
                    Be the first to rate a book.
                  </p>
                </div>
              }
            />
          </section>

          {/* Recommended Section */}
          <section className="mb-20">
            <SectionHeader
              kicker="For you"
              title="Recommended reads"
              subtitle="Personalized picks based on your shelf"
              accent="var(--hue-recommended)"
            />
            <FixedHeightBookSection
              data={reccomendationData}
              isEmpty={reccomendationData.length === 0}
              emptyStateContent={
                <div className="flex flex-col items-center justify-center px-4 text-center max-w-md">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-line bg-overlay">
                    <Award className="h-6 w-6" style={{ color: 'var(--hue-recommended)' }} />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-ink">
                    Want tailored picks?
                  </h3>
                  <p className="mt-1.5 mb-6 text-sm text-ink-mute">
                    {!session
                      ? "Sign in and we'll build recommendations around what you read."
                      : userStats && userStats.booksInCollection >= 1 && userStats.booksInCollection < 5
                      ? "Add a few more books to your collection to unlock recommendations."
                      : "Add books to your collection so we can suggest ones you'll love."}
                  </p>
                  <button
                    onClick={() => router.push(!session ? '/auth' : '/browse')}
                    className="inline-flex items-center gap-2 rounded-full bg-ember px-6 py-2.5 text-sm font-semibold text-white transition-colors duration-300 hover:bg-ember-strong"
                  >
                    {!session ? 'Sign in' : 'Browse books'}
                  </button>
                </div>
              }
            />
          </section>

          {/* Popular Lists Section */}
          {popularLists.length > 0 && (
            <section className="mb-20">
              <SectionHeader
                kicker="Popular lists"
                title="Collections worth browsing"
                subtitle="Curated shelves from readers across Bookmarkd"
                accent="var(--hue-lists)"
                action={
                  <button
                    onClick={() => router.push('/lists')}
                    className="shrink-0 font-mono text-[0.7rem] uppercase tracking-[0.16em] text-ink-mute transition-colors hover:text-ink"
                  >
                    View all
                  </button>
                }
              />
              <div className="rounded-2xl border border-line bg-surface/50 p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {popularLists.slice(0, 5).map((list) => (
                    <ListCard key={list.id} list={list} />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Coming Soon Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
            {/* Book Clubs Coming Soon */}
            <ComingSoonSection
              icon={Users}
              iconColor="from-purple-500 to-purple-600"
              title="Book Clubs"
              subtitle="Join the conversation"
              description="Connect with fellow readers, share your thoughts, and discover new perspectives through our upcoming book club feature."
            />

            {/* Hot Discussions Coming Soon */}
            <ComingSoonSection
              icon={MessageCircle}
              iconColor="from-blue-500 to-blue-600"
              title="Hot Discussions"
              subtitle="Latest community topics"
              description="Engage in meaningful conversations about your favorite books and authors with our community discussion platform."
            />
          </div>

          {/* Recent Activity */}
          {/* <section className="mb-16">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-stone-50" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-stone-50">Recent Activity</h2>
                <p className="text-stone-300">What's happening in your network</p>
              </div>
            </div>
            
            <div className="bg-[#2C3440] backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451]">
              <div className="space-y-6 max-h-112 overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 py-4 border-b border-[#3D4451] last:border-b-0 group">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500/20 to-amber-600/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 border border-amber-400/20">
                      {!activity.data.avatar_url && <User className="w-6 h-6 text-amber-400" />}
                      {activity.data.avatar_url && <Image
                                      src={activity.data.avatar_url}
                                      alt={`user's profile`}
                                      width={48}
                                      height={48}
                                      className="w-full h-full rounded-full flex-shrink-0 object-cover"
                                  />}
                    </div>
                    <div className="flex-1">
                      <p className="text-stone-50 group-hover:text-amber-100 transition-colors">
                        <span className="font-semibold">{activity.data.globalMessage}</span>
                      </p>
                      <p className="text-sm text-stone-400 mt-1">{toAmericanDate(activity.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section> */}
        </div>
        <Footer />
      </div>

      {/* Onboarding Modal for new users */}
      <OnboardingModal
        isOpen={showOnboardingModal}
        onClose={handleOnboardingClose}
        username={userStats?.user?.username}
      />

      {/* Progress indicator for users with < 5 books */}
      {session && userStats && (devBookCountOverride !== null ? devBookCountOverride : userStats.booksInCollection) < 5 && !showOnboardingModal && (
        <OnboardingProgress
          booksInCollection={devBookCountOverride !== null ? devBookCountOverride : userStats.booksInCollection}
          targetBooks={5}
        />
      )}

      {/* Dev panel for testing onboarding (only in development) */}
      <DevOnboardingPanel
        isVisible={process.env.NODE_ENV === 'development'}
        onShowModal={() => setShowOnboardingModal(true)}
        onResetState={handleResetOnboarding}
        onClearDismissal={handleClearDismissal}
        onBookCountOverride={setDevBookCountOverride}
        currentState={{
          booksInCollection: userStats?.booksInCollection ?? 0,
          hasSeenWelcome,
          showingModal: showOnboardingModal,
          devBookCountOverride
        }}
      />
    </div>
  )}

export default HomePage