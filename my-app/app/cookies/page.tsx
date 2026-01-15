'use client'

import React, { useState } from 'react'
import { 
  Cookie, 
  Shield, 
  Settings, 
  Eye, 
  BarChart3, 
  Globe, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Lock,
  RefreshCw,
  ExternalLink,
  Info,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  User,
  Calendar
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const CookiePolicyPage = () => {
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Always true, can't be disabled
    analytics: true,
    preferences: true
  })

  const cookieTypes = [
    {
      id: 'essential',
      title: 'Essential Cookies',
      icon: Zap,
      required: true,
      description: 'Required for the site to function properly',
      details: `These cookies are necessary for Bookmarkd to work. They handle your login session, remember your book tracking data, and keep the site secure.

Without these cookies, you wouldn't be able to log in, save books, or use core features of the platform.`,
      examples: [
        'Login session tokens',
        'Book tracking data',
        'Security tokens',
        'Site functionality'
      ],
      duration: 'Session or up to 30 days'
    },
    {
      id: 'preferences',
      title: 'Preference Cookies',
      icon: User,
      required: false,
      description: 'Remember your settings and preferences',
      details: `These cookies remember your choices to make Bookmarkd more personalized. They save settings like your preferred theme, display options, and other customizations.

Disabling these won't break the site, but you'll need to reset your preferences each visit.`,
      examples: [
        'Dark/light mode preference',
        'Display settings',
        'Sort preferences',
        'Language settings'
      ],
      duration: 'Up to 1 year'
    },
    {
      id: 'analytics',
      title: 'Analytics Cookies',
      icon: BarChart3,
      required: false,
      description: 'Help us understand how the site is used',
      details: `These cookies collect anonymous information about how people use Bookmarkd. This helps us understand which features are popular, identify bugs, and improve the platform.

All data is anonymous and aggregated. We never track individual reading habits or personal information.`,
      examples: [
        'Pages visited',
        'Feature usage',
        'Performance data',
        'Error tracking'
      ],
      duration: 'Up to 2 years'
    }
  ]

  const toggleCookiePreference = (cookieId: string) => {
    if (cookieId === 'essential') return // Can't disable essential cookies
    
    setCookiePreferences(prev => ({
      ...prev,
      [cookieId]: !prev[cookieId as keyof typeof prev]
    }))
  }

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#14181C] via-[#14181C] to-orange-900 pt-24 pb-16">
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181C]/60 via-transparent to-[#14181C]/40" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Cookie className="w-8 h-8 text-stone-50" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-stone-50 mb-6 leading-tight">
            Cookie Policy
          </h1>
          
          <p className="text-xl text-stone-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            Simple, transparent information about the cookies we use and how you can manage them.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-stone-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span>Privacy focused</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Transparent</span>
            </div>
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-purple-400" />
              <span>Your control</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181C] via-[#14181C] to-[#14181C]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181C]/60 via-transparent to-[#14181C]/40 z-10" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
          {/* Introduction */}
          <div className="mb-16 bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                <Info className="w-6 h-6 text-stone-50" />
              </div>
              <h2 className="text-2xl font-bold text-stone-50">What This Page Covers</h2>
            </div>
            
            <p className="text-stone-300 leading-relaxed text-lg mb-6">
              Bookmarkd uses cookies to make your experience smoother and to help us understand how the site is used. This policy explains what cookies are, which ones we use, and how you can manage them.
            </p>
            
            <div className="bg-[#2C3440]/60 rounded-xl p-6 border border-white/5">
              <h3 className="text-stone-50 font-semibold mb-3">What Are Cookies?</h3>
              <p className="text-stone-300 text-sm leading-relaxed">
                Cookies are small text files stored on your device when you visit a website. They help remember your settings, keep you logged in, and understand how people use the site. Think of them as helpful notes that make your next visit more convenient.
              </p>
            </div>
          </div>

          {/* Cookie Types */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-stone-50 mb-8 flex items-center gap-3">
              <Cookie className="w-6 h-6 text-orange-400" />
              Types of Cookies We Use
            </h2>
            
            <div className="space-y-6">
              {cookieTypes.map((cookieType) => (
                <div key={cookieType.id} className="bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451]">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        cookieType.required 
                          ? 'bg-gradient-to-br from-green-500 to-green-600' 
                          : 'bg-gradient-to-br from-orange-500 to-orange-600'
                      }`}>
                        <cookieType.icon className="w-6 h-6 text-stone-50" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-stone-50 mb-1">{cookieType.title}</h3>
                        <p className="text-stone-300">{cookieType.description}</p>
                        {cookieType.required && (
                          <span className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-green-300 bg-green-500/10 px-2 py-1 rounded-full">
                            <Lock className="w-3 h-3" />
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {!cookieType.required && (
                      <button
                        onClick={() => toggleCookiePreference(cookieType.id)}
                        className="flex items-center gap-2 text-sm"
                      >
                        {cookiePreferences[cookieType.id as keyof typeof cookiePreferences] ? (
                          <ToggleRight className="w-8 h-8 text-green-400" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-stone-500" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  <div className="prose prose-invert max-w-none mb-6">
                    <p className="text-stone-300 leading-relaxed whitespace-pre-line">
                      {cookieType.details}
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#2C3440]/60 rounded-xl p-4 border border-white/5">
                      <h4 className="text-stone-50 font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        Examples
                      </h4>
                      <ul className="text-stone-300 text-sm space-y-1">
                        {cookieType.examples.map((example, index) => (
                          <li key={index}>• {example}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-[#2C3440]/60 rounded-xl p-4 border border-white/5">
                      <h4 className="text-stone-50 font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        Duration
                      </h4>
                      <p className="text-stone-300 text-sm">{cookieType.duration}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How We Use Cookies */}
          <div className="mb-16 bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-stone-50" />
              </div>
              <h3 className="text-2xl font-bold text-stone-50">How We Use Cookies</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-stone-50 font-semibold mb-1">Keep You Logged In</h4>
                    <p className="text-stone-300 text-sm">
                      Save your login session so you don't have to sign in every time you visit.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-stone-50 font-semibold mb-1">Remember Preferences</h4>
                    <p className="text-stone-300 text-sm">
                      Store settings like your preferred theme, display options, and customizations.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-stone-50 font-semibold mb-1">Track Your Books</h4>
                    <p className="text-stone-300 text-sm">
                      Save your reading progress and book collections securely.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-stone-50 font-semibold mb-1">Improve Performance</h4>
                    <p className="text-stone-300 text-sm">
                      Collect anonymous data to understand usage patterns and fix issues.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Managing Cookies */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-stone-50 mb-8 flex items-center gap-3">
              <Settings className="w-6 h-6 text-purple-400" />
              Managing Your Cookie Preferences
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#2C3440]/80 backdrop-blur-sm rounded-xl p-6 border border-[#3D4451]">
                <h3 className="text-lg font-bold text-stone-50 mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  Browser Settings
                </h3>
                
                <p className="text-stone-300 text-sm mb-4 leading-relaxed">
                  Most browsers allow you to block or delete cookies. Here's how to access cookie settings in popular browsers:
                </p>
                
                <ul className="text-stone-300 text-sm space-y-2">
                  <li>• <strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
                  <li>• <strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
                  <li>• <strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                  <li>• <strong>Edge:</strong> Settings → Site permissions → Cookies</li>
                </ul>
              </div>
              
              <div className="bg-[#2C3440]/80 backdrop-blur-sm rounded-xl p-6 border border-[#3D4451]">
                <h3 className="text-lg font-bold text-stone-50 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  Important Notes
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-stone-300 text-sm">
                      Disabling essential cookies will prevent core features from working properly.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-stone-300 text-sm">
                      Analytics and preference cookies can be disabled without affecting basic functionality.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                    <p className="text-stone-300 text-sm">
                      Your preferences are saved and will be respected on future visits.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Third-Party Services */}
          <div className="mb-16 bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-stone-50" />
              </div>
              <h3 className="text-2xl font-bold text-stone-50">Third-Party Services</h3>
            </div>
            
            <p className="text-stone-300 leading-relaxed mb-6">
              Bookmarkd integrates with external services to provide book data and improve functionality. These services may set their own cookies:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#2C3440]/60 rounded-xl p-4 border border-white/5">
                <h4 className="text-stone-50 font-semibold mb-2">OpenLibrary Integration</h4>
                <p className="text-stone-300 text-sm mb-3">
                  We use OpenLibrary's API to fetch book covers and metadata. They may set cookies for their service.
                </p>
                <a 
                  href="https://openlibrary.org/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                >
                  OpenLibrary Privacy Policy
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              
              <div className="bg-[#2C3440]/60 rounded-xl p-4 border border-white/5">
                <h4 className="text-stone-50 font-semibold mb-2">Our Promise</h4>
                <p className="text-stone-300 text-sm">
                  We do not sell your data to third parties. Any analytics we collect is anonymous and used solely to improve Bookmarkd for all users.
                </p>
              </div>
            </div>
          </div>

          {/* Policy Updates */}
          <div className="mb-16 bg-gradient-to-r from-green-500/10 to-green-600/10 backdrop-blur-sm rounded-2xl p-8 border border-green-400/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-stone-50" />
              </div>
              <h3 className="text-2xl font-bold text-stone-50">Updates to This Policy</h3>
            </div>
            
            <p className="text-stone-300 leading-relaxed mb-4">
              We may update this cookie policy occasionally as we add new features or improve existing ones. Any changes will be posted here, so you always know what cookies are being used and why.
            </p>
            
            <div className="flex items-center gap-2 text-sm text-green-300">
              <Calendar className="w-4 h-4" />
              <span>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          {/* Contact */}
          <div className="text-center bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451]">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-6 h-6 text-stone-50" />
            </div>
            
            <h3 className="text-2xl font-bold text-stone-50 mb-4">Questions About Cookies?</h3>
            <p className="text-stone-300 mb-6 max-w-2xl mx-auto leading-relaxed">
              If you have questions about our cookie policy or how we handle your data, we're happy to help. Your privacy matters to us.
            </p>
            
            <a
              href="mailto:bookmarkd.fun@gmail.com?subject=Cookie%20Policy%20Question"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Cookie className="w-4 h-4" />
              Ask About Cookies
            </a>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  )
}

export default CookiePolicyPage