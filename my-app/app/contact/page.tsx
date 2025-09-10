'use client'

import React, { useState } from 'react'
import { 
  Mail, 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Shield, 
  Clock, 
  Send,
  CheckCircle,
  AlertCircle,
  Users,
  BookOpen,
  Lock,
  Heart,
  HelpCircle,
  Zap
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const ContactSupportPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('')
  const [formSubmitted, setFormSubmitted] = useState(false)

  const supportCategories = [
    {
      id: 'feedback',
      title: 'Feedback & Suggestions',
      icon: Lightbulb,
      description: 'Share ideas for new features or improvements',
      details: `Have a suggestion for Bookmarkd? We read every email and consider every idea.

Whether it's a missing feature, a design improvement, or a completely new way to track books, we want to hear from you. Your feedback helps shape the future of our platform.`,
      emailSubject: '[Feedback] Your suggestion for Bookmarkd'
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: Bug,
      description: 'Report bugs, login issues, or technical problems',
      details: `Encountering a bug or need help using the platform? We'll get back to you quickly.

Please describe what you were trying to do, what happened, and what browser you're using. Screenshots are helpful but not required.`,
      emailSubject: '[Tech Support] Help needed with Bookmarkd'
    },
    {
      id: 'community',
      title: 'Community & Safety',
      icon: Shield,
      description: 'Report inappropriate content or safety concerns',
      details: `Report problems with user behavior or content that violates our community guidelines.

All reports are reviewed promptly and handled confidentially. Include as much detail as possible to help us investigate.`,
      emailSubject: '[Community Report] Safety concern'
    },
    {
      id: 'account',
      title: 'Account Issues',
      icon: Users,
      description: 'Login problems, password resets, or account questions',
      details: `Need help accessing your account or have questions about your data?

We can help with login issues, password resets, or questions about your reading data. Never share your password in emails.`,
      emailSubject: '[Account] Help with my Bookmarkd account'
    },
    {
      id: 'general',
      title: 'General Questions',
      icon: HelpCircle,
      description: 'Questions about how Bookmarkd works',
      details: `Have questions about how to use Bookmarkd or what features are coming next?

We're happy to explain how things work or share updates about upcoming features. No question is too basic!`,
      emailSubject: '[Question] About Bookmarkd'
    }
  ]

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? '' : categoryId)
  }

  const selectedCategoryData = supportCategories.find(cat => cat.id === selectedCategory)

  return (
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-blue-900 pt-24 pb-16">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Mail className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Contact & Support
          </h1>
          
          <p className="text-xl text-stone-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            We're here to help and listen to our readers. Every message matters to us.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-stone-400">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              <span>1-3 day response</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-red-400" />
              <span>Every email read</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Confidential</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-800 to-stone-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
          {/* Quick Contact */}
          <div className="mb-16 bg-gradient-to-r from-blue-500/10 to-blue-600/10 backdrop-blur-sm rounded-2xl p-8 border border-blue-400/20 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">Quick Contact</h2>
            <p className="text-stone-300 mb-6 leading-relaxed max-w-2xl mx-auto">
              For any questions, suggestions, or issues, email us directly. We typically respond within 1-3 business days and read every message personally.
            </p>
            
            <a
              href="mailto:bookmarkd.fun@gmail.com"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
            >
              <Mail className="w-5 h-5" />
              bookmarkd.fun@gmail.com
            </a>
          </div>

          {/* Support Categories */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-blue-400" />
              How Can We Help?
            </h2>
            
            <p className="text-stone-300 mb-8 leading-relaxed">
              Choose the category that best describes your question or concern. This helps us provide the most relevant help.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {supportCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategorySelect(category.id)}
                  className={`p-6 rounded-xl transition-all duration-200 text-left group border ${
                    selectedCategory === category.id
                      ? 'bg-blue-500/20 border-blue-400/40 shadow-lg'
                      : 'bg-black/30 border-white/10 hover:bg-black/40 hover:border-blue-400/20'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                      : 'bg-gradient-to-br from-blue-500/20 to-blue-600/20'
                  }`}>
                    <category.icon className={`w-5 h-5 ${
                      selectedCategory === category.id ? 'text-white' : 'text-blue-400'
                    }`} />
                  </div>
                  
                  <h3 className={`font-bold mb-2 transition-colors ${
                    selectedCategory === category.id ? 'text-blue-100' : 'text-white group-hover:text-blue-100'
                  }`}>
                    {category.title}
                  </h3>
                  
                  <p className="text-stone-300 text-sm leading-relaxed">
                    {category.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Selected Category Details */}
          {selectedCategoryData && (
            <div className="mb-16 bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <selectedCategoryData.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedCategoryData.title}</h3>
                  <p className="text-blue-300">{selectedCategoryData.description}</p>
                </div>
              </div>
              
              <div className="prose prose-invert max-w-none mb-6">
                <p className="text-stone-300 leading-relaxed whitespace-pre-line">
                  {selectedCategoryData.details}
                </p>
              </div>
              
              <a
                href={`mailto:bookmarkd.fun@gmail.com?subject=${encodeURIComponent(selectedCategoryData.emailSubject)}`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Send className="w-4 h-4" />
                Send Email
              </a>
            </div>
          )}

          {/* Response Time & Expectations */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <Clock className="w-6 h-6 text-green-400" />
              What to Expect
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Personal Response</h3>
                <p className="text-stone-300 text-sm leading-relaxed">
                  Every email is read personally by us. You'll get a thoughtful, human response, not an automated reply.
                </p>
              </div>
              
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Quick Turnaround</h3>
                <p className="text-stone-300 text-sm leading-relaxed">
                  We typically respond within 1-3 business days. Urgent issues like safety concerns are prioritized.
                </p>
              </div>
              
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Confidential</h3>
                <p className="text-stone-300 text-sm leading-relaxed">
                  Your messages are handled confidentially. We only share information when necessary to resolve issues.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy & Security Reminder */}
          <div className="mb-16 bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Privacy & Security</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Never Share Passwords</h4>
                    <p className="text-stone-300 text-sm">
                      We'll never ask for your password via email. If you need a password reset, we'll guide you through the secure process.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-white font-semibold mb-1">Safe to Share</h4>
                    <p className="text-stone-300 text-sm">
                      Your username, email address, and descriptions of issues are safe to include in support emails.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                <h4 className="text-white font-semibold mb-2">When Reporting Issues:</h4>
                <ul className="text-stone-300 text-sm space-y-1">
                  <li>• Describe what you were trying to do</li>
                  <li>• Explain what happened instead</li>
                  <li>• Include your browser type if relevant</li>
                  <li>• Screenshots are helpful but optional</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Future Community Features */}
          <div className="mb-16 bg-gradient-to-r from-purple-500/10 to-purple-600/10 backdrop-blur-sm rounded-2xl p-8 border border-purple-400/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Growing Support</h3>
            </div>
            
            <p className="text-stone-300 leading-relaxed">
              As we launch book clubs, discussion posts, and shared rankings, we'll expand our support to include community moderation and feature-specific help. The same principles apply: quick, personal, and thoughtful assistance for every reader.
            </p>
          </div>

          {/* Final CTA */}
          <div className="text-center bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-4">We're Here for You</h3>
            <p className="text-stone-300 mb-6 max-w-2xl mx-auto leading-relaxed">
              Your questions, feedback, and concerns help make Bookmarkd better for everyone. Don't hesitate to reach out—we genuinely want to hear from you.
            </p>
            
            <a
              href="mailto:bookmarkd.fun@gmail.com"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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

export default ContactSupportPage