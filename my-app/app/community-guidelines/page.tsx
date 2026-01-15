'use client'

import React from 'react'
import { 
  Users, 
  Heart, 
  BookOpen, 
  Shield, 
  MessageSquare, 
  Flag, 
  Eye, 
  AlertTriangle,
  ChevronRight,
  Target,
  Calendar,
  Mail,
  CheckCircle,
  UserCheck,
  Lock,
  Handshake
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'

const CommunityGuidelinesPage = () => {
  const guidelines = [
    {
      id: 'respect',
      title: 'Be Respectful',
      icon: Heart,
      content: `Treat others as you'd like to be treated. Disagreements about books are fine; personal attacks are not.

It's okay to debate whether a book is overrated, but don't attack someone for their opinion.`
    },
    {
      id: 'relevant',
      title: 'Keep it Relevant',
      icon: BookOpen,
      content: `Posts and comments should focus on books, reading, and related discussions. Avoid unrelated content, spam, or self-promotion.`
    },
    {
      id: 'privacy',
      title: 'Protect Privacy',
      icon: Lock,
      content: `Do not share personal information about yourself or others. Avoid posting emails, phone numbers, or private addresses.

Keep discussions focused on books and reading experiences rather than personal details.`
    },
    {
      id: 'harassment',
      title: 'No Harassment or Hate Speech',
      icon: Shield,
      content: `Zero tolerance for bullying, threats, or discriminatory language based on race, gender, religion, sexual orientation, or any other personal characteristics.

Bookmarkd is a place for all readers to feel welcome and safe. Hateful behavior has no place in our community.`
    },
    {
      id: 'reporting',
      title: 'Report Problems',
      icon: Flag,
      content: `If you see inappropriate content, flag it or contact support immediately. We rely on users like you to help maintain a safe space.

Don't engage with problematic content. report it. All reported posts are reviewed promptly and we'll take appropriate action.`
    },
    {
      id: 'future',
      title: 'Future Features Disclaimer',
      icon: Target,
      content: `Community features like book clubs, discussion posts, and shared rankings are coming soon. These guidelines will evolve as the platform grows.

We're building Bookmarkd's community features thoughtfully, with your safety and experience as our top priority. Stay tuned for updates!`
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
            <Users className="w-8 h-8 text-stone-50" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-stone-50 mb-6 leading-tight">
            Community Guidelines
          </h1>
          
          <p className="text-xl text-stone-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            Guidelines to help readers connect, share, and track books safely and respectfully.
          </p>
          
          <div className="flex items-center justify-center gap-6 text-stone-400">
            <div className="flex items-center gap-2">
              <Handshake className="w-4 h-4 text-green-400" />
              <span>Respectful community</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span>Safe space</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
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
          {/* Introduction */}
          <div className="mb-16 bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451] text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-stone-50" />
            </div>
            
            <h2 className="text-2xl font-bold text-stone-50 mb-4">Building Our Reading Community</h2>
            <p className="text-stone-300 leading-relaxed max-w-3xl mx-auto">
              While Bookmarkd's full community features are still in development, these guidelines set the foundation 
              for how we'll interact when discussion posts, book clubs, and shared rankings arrive. Let's create a 
              space where every reader feels welcome to explore, learn, and share safely.
            </p>
          </div>

          {/* Guidelines Overview */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-stone-50 mb-8 flex items-center gap-3">
              <Eye className="w-6 h-6 text-amber-400" />
              Quick Overview
            </h2>
            
            <div className="bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-6 border border-[#3D4451]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {guidelines.map((guideline, index) => (
                  <button
                    key={guideline.id}
                    onClick={() => scrollToSection(guideline.id)}
                    className="flex items-center gap-3 p-4 rounded-xl bg-[#2C3440]/60 hover:bg-[#2C3440]/80 transition-all duration-200 text-left group border border-white/5 hover:border-amber-400/20"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <guideline.icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-stone-50 group-hover:text-amber-100 transition-colors font-medium">
                      {index + 1}. {guideline.title}
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-400 ml-auto group-hover:text-amber-400 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Guidelines Sections */}
          <div className="space-y-12">
            {guidelines.map((guideline, index) => (
              <section key={guideline.id} id={guideline.id} className="scroll-mt-24">
                <div className="bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451] relative overflow-hidden group">
                  {/* Background decoration */}
                  <div className="absolute top-4 right-4 opacity-20">
                    <guideline.icon className="w-16 h-16 text-amber-400" />
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <guideline.icon className="w-6 h-6 text-stone-50" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-sm font-semibold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full">
                            {index + 1}
                          </span>
                        </div>
                        <h2 className="text-2xl font-bold text-stone-50">{guideline.title}</h2>
                      </div>
                    </div>
                    
                    <div className="prose prose-invert max-w-none">
                      <p className="text-stone-300 leading-relaxed whitespace-pre-line">
                        {guideline.content}
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* Enforcement Section */}
          <div className="mt-16 bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-stone-50" />
              </div>
              <h3 className="text-2xl font-bold text-stone-50">Enforcement & Consequences</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-[#2C3440]/60 rounded-xl border border-white/5">
                <div className="text-yellow-400 font-semibold mb-2">First Warning</div>
                <div className="text-stone-300 text-sm">
                  Friendly reminder about community standards with guidance on appropriate behavior.
                </div>
              </div>
              
              <div className="p-6 bg-[#2C3440]/60 rounded-xl border border-white/5">
                <div className="text-orange-400 font-semibold mb-2">Temporary Suspension</div>
                <div className="text-stone-300 text-sm">
                  Temporary restriction from community features for repeated violations.
                </div>
              </div>
              
              <div className="p-6 bg-[#2C3440]/60 rounded-xl border border-white/5">
                <div className="text-red-400 font-semibold mb-2">Permanent Ban</div>
                <div className="text-stone-300 text-sm">
                  Permanent removal for severe violations or continued problematic behavior.
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-16 bg-gradient-to-r from-amber-500/10 to-amber-600/10 backdrop-blur-sm rounded-2xl p-8 border border-amber-400/20 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center mx-auto mb-6">
              <UserCheck className="w-6 h-6 text-stone-50" />
            </div>
            
            <h3 className="text-2xl font-bold text-stone-50 mb-4">Let's Build Something Great Together</h3>
            <p className="text-stone-300 mb-6 max-w-2xl mx-auto leading-relaxed">
              These guidelines help us create a Bookmarkd community where readers can explore, learn, and share safely. 
              By following these principles, you're helping build the kind of reading community we all want to be part of.
            </p>
            
            <div className="text-amber-300 font-medium">
              Ready to be part of our growing community? Keep these guidelines in mind as we roll out new features!
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-16 bg-[#2C3440]/80 backdrop-blur-sm rounded-2xl p-8 border border-[#3D4451] text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Mail className="w-6 h-6 text-stone-50" />
            </div>
            
            <h3 className="text-xl font-bold text-stone-50 mb-3">Questions or Concerns?</h3>
            <p className="text-stone-300 mb-6">
              If you have questions about these guidelines or need to report an issue, we're here to help.
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

export default CommunityGuidelinesPage