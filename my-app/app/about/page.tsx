'use client'

import React from 'react'
import { 
  BookOpen, 
  Heart, 
  Star, 
  Users, 
  Zap, 
  TrendingUp, 
  Globe, 
  Code, 
  Mail,
  Target,
  Lightbulb,
  Calendar,
  ChevronRight,
  Bookmark,
  DollarSign
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const AboutPage = () => {
  const sections = [
    {
      id: 'mission',
      title: 'Our Mission',
      icon: Target,
      content: `Bookmarkd is a user focused platform for tracking and rating books. Built by a single passionate reader, it's designed as a simpler, faster alternative to bloated reading platforms, helping readers catalog their books, rate favorites, and discover new ones.

Inspired by the clean, community-driven experience of Letterboxd, Bookmarkd takes the best parts, ranking systems, structured ratings, and a clear interface and applies them to the world of books.`
    },
    {
      id: 'why',
      title: 'Why Bookmarkd?',
      icon: Lightbulb,
      content: `• Focused and simple: No distractions, no clutter, just a place to log, rate, and rank books.
• Rankings that matter: See which books rise to the top and explore personal and global favorites.
• Built for die-hard readers: Whether you're cataloging your lifetime reads or tracking your current favorites, Bookmarkd scales to your reading habits.`
    },
//     {
//       id: 'features',
//       title: 'What We Offer Today',
//       icon: Star,
//       content: `While community features like discussion clubs and shared rankings are coming in future updates, today BookMarkd helps serious readers track every book they've read and see how it stacks up.

// Our current features focus on what matters most: giving you the tools to catalog, rate, and organize your reading journey with precision and style.`
//     },
    {
      id: 'future',
      title: 'Looking Ahead',
      icon: TrendingUp,
      content: `Bookmarkd is just getting started. Future updates will introduce community-driven features like book clubs, discussion posts, and shared rankings so that readers can not only track their books, but also connect, compete, and share their love for reading.`
    },
    {
      id: 'tech',
      title: 'Tech & Data',
      icon: Code,
      content: `• Powered by OpenLibrary: Millions of books, freely accessible and constantly updated
• Built with modern tools: Next.js and Supabase ensure a fast, reliable, and scalable experience
• Designed for performance: Clean code, optimized loading, and responsive design across all devices`
    },
    {
      id: 'contact',
      title: 'Contact & Feedback',
      icon: Mail,
      content: `Bookmarkd is made to be site that listens to its users. Got suggestions, ideas, or just want to say hi? Every message is read and considered personally.

Your feedback shapes the future of Bookmarkd. Whether you've found a bug, have a feature request, or simply want to share some of your favorite books, we'd love to hear from you.`
    }
  ]

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen">
        <Header />
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#14181C] via-[#14181C] to-amber-900 pt-24 pb-16">
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181C]/60 via-transparent to-[#14181C]/40" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Bookmark className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-stone-50 mb-6 leading-tight">
            About Bookmarkd
          </h1>
          
          <p className="text-xl text-stone-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            A focused platform for readers who want to track, rate, and discover books without the clutter.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-stone-400">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span>Built by readers</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span>Lightning fast</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Book focused</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">

        <div className="absolute inset-0 bg-gradient-to-t from-[#14181C] via-[#14181C] to-[#14181C]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181C]/60 via-transparent to-[#14181C]/40 z-10" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
          {/* Table of Contents */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-stone-50 mb-8 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-amber-400" />
              What You'll Learn
            </h2>
            
            <div className="bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-6 border border-[#3D4451]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="flex items-center gap-3 p-4 rounded-xl bg-[#2C3440]/60 hover:bg-[#2C3440]/80 transition-all duration-200 text-left group border border-white/5 hover:border-amber-400/20"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <section.icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-stone-50 group-hover:text-amber-100 transition-colors font-medium">
                      {section.title}
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-400 ml-auto group-hover:text-amber-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* About Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <div className="bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451] relative overflow-hidden group">
                  {/* Background decoration */}
                  <div className="absolute top-4 right-4 opacity-20">
                    <section.icon className="w-16 h-16 text-amber-400" />
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <section.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-stone-50">{section.title}</h2>
                      </div>
                    </div>
                    
                    <div className="prose prose-invert max-w-none">
                      <p className="text-stone-300 leading-relaxed whitespace-pre-line">
                        {section.content}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* Stats Section */}
          <div className="mt-16 bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451]">
            <h3 className="text-2xl font-bold text-stone-50 mb-8 text-center flex items-center justify-center gap-3">
              <TrendingUp className="w-6 h-6 text-amber-400" />
              By the Numbers
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-[#2C3440]/60 rounded-xl border border-white/5">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-stone-50 mb-2">Millions</div>
                <div className="text-stone-400">Books Available</div>
              </div>
              
              <div className="text-center p-6 bg-[#2C3440]/60 rounded-xl border border-white/5">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-stone-50 mb-2">&lt;2s</div>
                <div className="text-stone-400">Average Load Time</div>
              </div>
              
              <div className="text-center p-6 bg-[#2C3440]/60 rounded-xl border border-white/5">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div className="text-3xl font-bold text-stone-50 mb-2">100%</div>
                <div className="text-stone-400">Free</div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-16 bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451] text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-stone-50 mb-3">Let's Connect</h3>
            <p className="text-stone-300 mb-6 max-w-2xl mx-auto">
              Have questions, suggestions, or just want to share your love of books? 
              We'd love to hear from you. Every message gets a personal response.
            </p>
            
            <a
              href="mailto:bookmarkd.fun@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Mail className="w-4 h-4" />
              Get in Touch
            </a>
          </div>
        </div>
        <Footer />
      </div>
      
    </div>
  )
}

export default AboutPage