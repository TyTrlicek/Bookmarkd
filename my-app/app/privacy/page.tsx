'use client'

import React from 'react'
import { 
  Shield, 
  Database, 
  Eye, 
  Cookie, 
  Share, 
  Lock, 
  Trash2, 
  UserCheck, 
  RefreshCw,
  Mail,
  ChevronRight,
  BookOpen,
  Calendar,
  Server,
  Globe,
  Key,
  Download,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'


const page = () => {
  const sections = [
    {
      id: 'information-collected',
      title: 'Information We Collect',
      icon: Database,
      content: `We collect the following information to provide and improve our services:

**Account Information:**
• Username (chosen by you)
• Email address (for account verification and communications)
• Password (securely hashed and salted via Supabase)
• Optional Google OAuth data (name, email, profile picture) if you sign in with Google

**Usage Information:**
• Books you view, rate, and review
• Reading preferences
• Platform interactions and activity
• Device information and browser type

**Automatically Collected:**
• IP address and location data
• Analytics data through Vercel Analytics
• Session data and login timestamps`
    },
    {
      id: 'how-we-use',
      title: 'How We Use Information',
      icon: Eye,
      content: `We use your information to:

• Provide and maintain your account and reading experience
• Personalize book recommendations and content
• Send important account notifications and updates
• Improve our platform through analytics and usage patterns
• Ensure platform security and prevent abuse
• Comply with legal obligations

**We do NOT:**
• Sell your personal information to third parties
• Use your data for advertising purposes
• Share your reading activity publicly without your consent
• Access your private messages or personal content`
    },
    {
      id: 'cookies-tracking',
      title: 'Cookies & Tracking',
      icon: Cookie,
      content: `**Essential Cookies:**
• Supabase authentication tokens (required for login sessions)
• Session cookies to keep you logged in
• Security tokens for account protection

**Analytics:**
• Currently using Vercel Analytics for basic usage statistics
• We may add Google Analytics in the future (with prior notice)
• All analytics data is aggregated and anonymized

**Your Control:**
• You can disable non-essential cookies in your browser settings
• Disabling essential cookies may affect platform functionality
• We respect "Do Not Track" signals where possible`
    },
    {
      id: 'sharing-information',
      title: 'Sharing of Information',
      icon: Share,
      content: `We do not sell or share your personal information, except with:

**Service Providers:**
• Supabase (authentication and database hosting)
• Vercel (platform hosting and analytics)
• OpenLibrary (book data - no personal data shared)

**Legal Requirements:**
• When required by law or legal process
• To protect our rights or prevent illegal activity
• In case of business transfer (with user notification)

**Community Features:**
• Your username and reviews are visible to other users
• Profile information you choose to make public`
    },
    {
      id: 'account-security',
      title: 'Account Security',
      icon: Lock,
      content: `We take security seriously:

**Password Protection:**
• All passwords are hashed and salted via Supabase
• We never store or see your actual password
• Strong password requirements encouraged

**Authentication Options:**
• Secure email/password login
• Google OAuth integration

**Data Protection:**
• All data transmitted using HTTPS encryption
• Regular security updates and monitoring
• Supabase security infrastructure`
    },
    {
      id: 'data-retention',
      title: 'Data Retention & Deletion',
      icon: Trash2,
      content: `**Data Retention:**
• Account data kept while your account is active
• Deleted accounts: data removed within 30 days
• Some data may be retained for legal/security purposes

**Account Deletion:**
• Users may contact us to request account deletion or data export
• Upon deletion, all personal data is permanently removed
**Data Export:**
• Request a copy of your data by contacting support
• Includes reviews, reading history, and account information
• Delivered in machine-readable format within 30 days`
    },
    {
      id: 'user-rights',
      title: 'Your Rights (GDPR/CCPA)',
      icon: UserCheck,
      content: `Under privacy laws, you have the right to:

**Access & Portability:**
• Request a copy of your personal data
• Receive data in a portable format
• Know what information we have about you

**Correction & Control:**
• Update or correct your information
• Control what data is public vs. private
• Opt-out of non-essential communications

**Deletion & Restriction:**
• Request deletion of your account and data
• Restrict processing of your information
• Object to certain uses of your data

**California Residents (CCPA):**
• Right to know what personal information is collected
• Right to delete personal information
• Right to opt-out of sale (we don't sell data)
• Right to non-discrimination for exercising these rights`
    },
    {
      id: 'policy-changes',
      title: 'Changes to This Policy',
      icon: RefreshCw,
      content: `We may update this Privacy Policy from time to time to reflect:

• Changes in our practices or services
• Legal or regulatory requirements
• User feedback and improvements

**Notification Process:**
• Significant changes will be announced via email
• Updates posted on this page with revision date
• Continued use constitutes acceptance of changes

**Your Options:**
• Review changes when notified
• Contact us with questions or concerns
• Delete your account if you disagree with changes`
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
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-amber-900 pt-24 pb-16">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Shield className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Privacy Policy
          </h1>
          
          <p className="text-xl text-stone-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            Your privacy matters to us. Learn how we collect, use, and protect your personal information.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-stone-400">
            <Calendar className="w-4 h-4" />
            <span>Last updated: December 2024</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-800 to-stone-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
          {/* Quick Summary */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              Privacy at a Glance
            </h2>
            
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">We Don't Sell Data</h3>
                    <p className="text-stone-400 text-sm">Your personal information is never sold to third parties</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Lock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Secure Storage</h3>
                    <p className="text-stone-400 text-sm">All data encrypted and stored securely via Supabase</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Trash2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Data Deletion</h3>
                    <p className="text-stone-400 text-sm">Request account deletion and data export anytime</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Eye className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Transparent Use</h3>
                    <p className="text-stone-400 text-sm">Clear information about how we use your data</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table of Contents */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <BookOpen className="w-6 h-6 text-amber-400" />
              Table of Contents
            </h2>
            
            <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sections.map((section, index) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className="flex items-center gap-3 p-4 rounded-xl bg-black/20 hover:bg-black/40 transition-all duration-200 text-left group border border-white/5 hover:border-amber-400/20"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <section.icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-white group-hover:text-amber-100 transition-colors font-medium">
                      {index + 1}. {section.title}
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-400 ml-auto group-hover:text-amber-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy Sections */}
          <div className="space-y-12">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10 relative overflow-hidden group">
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
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
                            {index + 1}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-white">{section.title}</h2>
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

          {/* Contact Section */}
          <div className="mt-16 bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-3">Privacy Questions or Data Requests?</h3>
            <p className="text-stone-300 mb-6">
              Contact us for account deletion, data export, or any privacy-related questions.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:bookmarkd.fun@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Mail className="w-4 h-4" />
                Privacy Support
              </a>
              
              <a
                href="mailto:bookmarkd.fun@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Download className="w-4 h-4" />
                Data Requests
              </a>
            </div>
            
            <p className="text-sm text-stone-400 mt-4">
              We typically respond to privacy requests within 30 days
            </p>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  )
}

export default page