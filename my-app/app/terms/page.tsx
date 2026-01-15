'use client'

import React from 'react'
import { 
  Shield, 
  Users, 
  Lock, 
  MessageSquare, 
  Flag, 
  Copyright, 
  Globe, 
  UserX, 
  AlertTriangle, 
  RefreshCw,
  ChevronRight,
  BookOpen,
  Calendar,
  Mail
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const page = () => {
  const sections = [
    {
      id: 'acceptance',
      title: 'Acceptance of Terms',
      icon: Shield,
      content: `By accessing and using our book reading platform, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service. These terms constitute a legally binding agreement between you and our platform.`
    },
    {
      id: 'eligibility',
      title: 'Eligibility & Age Restrictions',
      icon: Users,
      content: `You must be at least 13 years old to create an account and use our services. Users under 18 must have parental consent. By creating an account, you represent that you meet these age requirements and have the legal capacity to enter into this agreement.`
    },
    {
      id: 'accounts',
      title: 'User Accounts & Security',
      icon: Lock,
      content: `You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to suspend or terminate accounts that violate these terms or show suspicious activity.`
    },
    {
      id: 'content',
      title: 'Content Rules',
      icon: MessageSquare,
      content: `When posting reviews, comments, or other content, you agree not to:
      • Post offensive, harmful, or discriminatory content
      • Share spam or promotional material unrelated to books
      • Include major spoilers without proper warnings
      • Post copyrighted material without permission
      • Impersonate others or create fake accounts
      
      You retain ownership of your content but grant us a license to display and distribute it through our platform.`
    },
    {
      id: 'moderation',
      title: 'Moderation & Reporting',
      icon: Flag,
      content: `We employ automated filtering for banned words and rely on community reporting to maintain a safe environment. Users are responsible for their own content and may be banned for breaking rules. We reserve the right to remove content and suspend accounts at our discretion.`
    },
    {
      id: 'intellectual',
      title: 'Intellectual Property',
      icon: Copyright,
      content: `All platform features, design, and functionality are protected by intellectual property laws. Book data and cover images are sourced from third-party services and remain the property of their respective owners. Users may not reproduce our platform's design or functionality without permission.`
    },
    {
      id: 'third-party',
      title: 'Third-Party Services Disclaimer',
      icon: Globe,
      content: `Our book data is powered by OpenLibrary and other third-party services. We do not guarantee the accuracy, completeness, or availability of this data. We are not responsible for any issues arising from third-party service interruptions or data inaccuracies.`
    },
    {
      id: 'termination',
      title: 'Account Termination & Deletion',
      icon: UserX,
      content: `We reserve the right to terminate accounts that violate these terms. We are working on offering account deletion and data export features in the near future. Users will be notified of these features when they become available.`
    },
    {
      id: 'liability',
      title: 'Limitation of Liability',
      icon: AlertTriangle,
      content: `Our platform is provided "as is" without warranties. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Our total liability is limited to the amount you've paid us, if any, in the past 12 months.`
    },
    {
      id: 'updates',
      title: 'Updates to Terms',
      icon: RefreshCw,
      content: `We may update these terms from time to time. Significant changes will be communicated through email or platform notifications. Continued use of the service after changes constitutes acceptance of the updated terms.`
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
      <div className="relative bg-gradient-to-br from-[#14181C] via-[#14181C] to-amber-900 pt-24 pb-16">
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181C]/60 via-transparent to-[#14181C]/40" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Shield className="w-8 h-8 text-stone-50" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-stone-50 mb-6 leading-tight">
            Terms of Service
          </h1>
          
          <p className="text-xl text-stone-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            Please read these terms carefully before using our book reading platform.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-stone-400">
            <Calendar className="w-4 h-4" />
            <span>Last updated: December 2024</span>
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
              Table of Contents
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
                      {index + 1}. {section.title}
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-400 ml-auto group-hover:text-amber-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Terms Sections */}
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
                        <section.icon className="w-6 h-6 text-stone-50" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
                            {index + 1}
                          </span>
                        </div>
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

          {/* Contact Section */}
          <div className="mt-16 bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451] text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-stone-50" />
            </div>
            
            <h3 className="text-xl font-bold text-stone-50 mb-3">Questions about our Terms?</h3>
            <p className="text-stone-300 mb-6">
              If you have any questions about these Terms of Service, please don't hesitate to contact us.
            </p>
            
            <a
              href="mailto:bookmarkd.fun@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Mail className="w-4 h-4" />
              Contact Support
            </a>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  )
}

export default page