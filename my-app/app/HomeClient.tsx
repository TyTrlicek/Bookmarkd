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
import EnhancedHero from './components/EnhancedHero'
import { UserActivity } from './types/types'
import { toAmericanDate } from '@/utils/util'
import Image from 'next/image'
import Footer from './components/Footer'
import { useRouter } from 'next/navigation'

const HomePage = () => {
  const [activeSection, setActiveSection] = useState('trending')
  const [searchQuery, setSearchQuery] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [trendingData, setTrendingData] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<UserActivity[]>([]);
  const [reccomendationData, setReccomendationData] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const router = useRouter();
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

  const Target = ({ className }: { className: string }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  )

  const stats = [
    { label: "Books Read This Year", value: "47", icon: BookOpen, color: "bg-amber-600" },
    { label: "Reading Goal Progress", value: "94%", icon: Target, color: "bg-emerald-600" },
    { label: "Books in Collection", value: "312", icon: BookMarked, color: "bg-blue-600" },
    { label: "Reviews Written", value: "28", icon: Star, color: "bg-purple-600" }
  ]

  // Coming Soon Component
  const ComingSoonSection = ({ icon: Icon, iconColor, title, subtitle, description }: {
    icon: React.ElementType,
    iconColor: string,
    title: string,
    subtitle: string,
    description: string
  }) => (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className={`w-12 h-12 bg-gradient-to-br ${iconColor} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-white">{title}</h2>
          <p className="text-stone-300">{subtitle}</p>
        </div>
      </div>
      
      <div className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 relative overflow-hidden">
        {/* Coming Soon Content */}
        <div className="p-12 text-center relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-purple-500/5" />
          <div className="absolute top-4 right-4">
            <Sparkles className="w-8 h-8 text-amber-400/30" />
          </div>
          <div className="absolute bottom-4 left-4">
            <Zap className="w-6 h-6 text-purple-400/30" />
          </div>
          
          {/* Main content */}
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-400/20">
              <Sparkles className="w-10 h-10 text-amber-400" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3">Coming Soon</h3>
            <p className="text-stone-400 mb-6 max-w-md mx-auto leading-relaxed">
              {description}
            </p>
            
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500/20 to-purple-500/20 backdrop-blur-sm rounded-full border border-amber-400/30 text-amber-300 font-medium">
              <Clock className="w-4 h-4" />
              Stay tuned for updates
            </div>
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
    <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="h-108 relative">
        {!isEmpty ? (
          <BookList trendingData={data} />
        ) : (
          <div className="h-full flex items-center justify-center">
            {emptyStateContent}
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <EnhancedHero userStats={userStats}/>

      {/* Main Content with Dark Theme */}
      <div className="relative">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-800 to-stone-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />

        
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
          {/* Trending Section */}
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Trending Now</h2>
                  <p className="text-stone-300">Most popular books this week</p>
                </div>
              </div>
            </div>
            
            {/* Fixed Height Book List Container */}
            <FixedHeightBookSection 
              data={trendingData}
              isEmpty={!trendingData || (Array.isArray(trendingData) && trendingData.length === 0)}
              emptyStateContent={
                <div className="flex flex-col items-center justify-center px-4 text-center max-w-md">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-full flex items-center justify-center mb-6 border border-amber-500/30">
                    <TrendingUp className="w-8 h-8 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    No Trending Books Yet
                  </h3>
                  <p className="text-stone-300 text-lg">
                    Check back soon for the latest trending books!
                  </p>
                </div>
              }
            />
          </section>

          {/* Recommended Section */}
          <section className="mb-20">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Recommended for You</h2>
                  <p className="text-stone-300">Personalized picks based on your taste</p>
                </div>
              </div>
            </div>

            {/* Fixed Height Book List Container */}
            <FixedHeightBookSection 
              data={reccomendationData}
              isEmpty={reccomendationData.length === 0}
              emptyStateContent={
                <div className="flex flex-col items-center justify-center px-4 text-center max-w-md">
                  {/* Decorative icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                    <Award className="w-8 h-8 text-emerald-400" />
                  </div>

                  {/* Conditional messaging */}
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    Want recommended books?
                  </h3>

                  <p className="text-stone-300 text-lg mb-8">
                    {!session
                      ? "Sign in to get personalized book recommendations tailored just for you."
                      : userStats && userStats.booksInCollection >= 1 && userStats.booksInCollection < 5
                      ? `Add more books to your collection to unlock personalized recommendations.`
                      : "Add books to your collection so we can suggest similar books you'll love."
                    }
                  </p>

                  {/* Conditional button */}
                  {!session ? (
                    <button 
                      onClick={() => router.push('/auth')}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </button>
                  ) : (
                    <button 
                      onClick={() => router.push('/browse')}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Browse Books
                    </button>
                  )}

                  {/* Optional secondary action for signed-in users */}
                  {session && (
                    <p className="text-stone-400 text-sm mt-4">
                      Or explore our{' '}
                      <span 
                        className="text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        trending books
                      </span>{' '}
                      to get started
                    </p>
                  )}
                </div>
              }
            />
          </section>

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
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Recent Activity</h2>
                <p className="text-stone-300">What's happening in your network</p>
              </div>
            </div>
            
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="space-y-6 max-h-112 overflow-y-auto">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 py-4 border-b border-white/10 last:border-b-0 group">
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
                      <p className="text-white group-hover:text-amber-100 transition-colors">
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

    </div>
  )}

export default HomePage