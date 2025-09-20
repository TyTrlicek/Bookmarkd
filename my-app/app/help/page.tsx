'use client'

import React, { useState } from 'react'
import { 
  HelpCircle, 
  User, 
  BookOpen, 
  Edit3, 
  Search, 
  TrendingUp, 
  Smartphone, 
  Award, 
  Mail,
  ChevronDown,
  ChevronUp,
  Plus,
  Star,
  Users,
  Shield,
  Zap,
  MessageCircle,
  Calendar,
  CheckCircle,
  ArrowRight,
  Globe,
  Book
} from 'lucide-react'
import Header from '../components/Header'
import Footer from '../components/Footer'


const page = () => {
  const [openFAQ, setOpenFAQ] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index)
  }

  const faqs = [
    {
      id: 'what-is-bookmarkd',
      question: 'What is Bookmarkd?',
      icon: BookOpen,
      category: 'Getting Started',
      answer: `Bookmarkd is your personal digital library and book discovery platform. Track your reading progress, rate and review books, get personalized recommendations, and connect with other readers.

Key features:
• Track books you've read, want to read, and are currently reading
• Write reviews and rate books on a scale of 1-10
• Get personalized book recommendations
• View trending books and popular titles
• See how other users rated books on the rankings page
`
    },
    {
      id: 'how-to-sign-up',
      question: 'How do I sign up?',
      icon: User,
      category: 'Getting Started',
      answer: `Getting started is simple:

1. Click the "Sign Up" button in the top right corner\n
2. Sign up with Google for quick access\n
3. Start adding books to your library!\n

Your account will sync across all devices once you're logged in.`
    },
    {
      id: 'add-first-book',
      question: 'How do I add my first book?',
      icon: Plus,
      category: 'Getting Started',
      answer: `Adding books to your library is easy:

1. Use the search bar or navigate to the "browse" page to find your book by title or author\n
2. Click on the book from search results\n
3. Click the "Add to Collection" button\n
3. Choose your reading status\n
   \t- "To be Read" - books on your wishlist\n
   \t- "Currently Reading" - books you're reading now\n
   \t- "Completed" - finished books you can rate and review\n
4. For finished books, add your rating (1-10)\n
5. Write an optional review to share your thoughts\n

Your books will appear in your collections page.`
    },
//     {
//       id: 'edit-delete-review',
//       question: 'Can I edit or delete a review/rating?',
//       icon: Edit3,
//       category: 'Managing Content',
//       answer: `Yes, you have full control over your reviews and ratings:

// **Editing:**
// • Go to the book's page
// • Click the edit icon on your review
// • Update your rating or review text
// • Save changes

// **Deleting:**
// • Find your review on your profile or the book page
// • Click the delete/trash icon
// • Confirm deletion

// **Note:** Changes are immediate and will update your reading statistics automatically.`
//     },
    {
      id: 'missing-book',
      question: 'What if a book isn\'t in the database?',
      icon: Search,
      category: 'Book Database',
      answer: `Our book database is powered by OpenLibrary, which contains millions of titles. However, some books might be missing or hard to find:

**If you can't find a book:**
• Try the external secondary search feature on the browse page
• Try different search terms (author's full name, subtitle, etc.)
• Check for alternate spellings or translations

**Request a missing book:**
• Contact our support with book details
• Include: title, author, ISBN (if available), publication year
• We'll work to add it to our database
`
    },
    {
      id: 'how-rankings-work',
      question: 'How do rankings and recommendations work?',
      icon: TrendingUp,
      category: 'Features',
      answer: `Our platform features a comprehensive global ranking system that evaluates books across our entire community:

**Global Book Rankings:**
• **Rating-based:** Books ranked by average rating (higher ratings = better rank)
• **Popularity-based:** Books ranked by total number of ratings (more ratings = higher popularity)
• **Minimum threshold:** Only books with at least ten ratings appear in rankings

**Filtering Options:**
• **Genre filters:** View rankings for specific categories (Fiction, Mystery, Romance, etc.)
• **Publication decade:** Filter by 2020s, 2010s, 2000s, 1990s, 1980s, or older books
• **Search within rankings:** Find specific titles or authors in the ranked results
• **Pagination:** Browse through up to 100 books per page

**How Rankings Are Calculated:**
1. **Average Rating:** Sum of all user ratings ÷ number of ratings
2. **Total Ratings:** Count of all users who rated the book
3. **Quality threshold:** Books need genuine ratings to appear (no zero-rating books)
4. **Updated once a day:** Rankings are recalculated every 24 hours

**Personal Recommendations:**
• Your reading history and rating patterns
• Books liked by users with similar tastes
• Popular books in your favorite genres
• Authors you've enjoyed before

The global rankings give you a true picture of what the entire Bookmarkd community thinks about each book!`
    },

    {
      id: 'multiple-devices',
      question: 'Can I use Bookmarkd on multiple devices?',
      icon: Smartphone,
      category: 'Account & Sync',
      answer: `Absolutely! Your Bookmarkd account syncs across all devices:

**Supported platforms:**
• Web browsers (desktop and mobile)
• Mobile web app (works on phones and tablets)
• Progressive Web App (PWA) - install like a native app

**What syncs:**
• Your entire book library
• Reading progress and status
• Reviews and ratings
• Account settings and preferences

**Tip:** Log in with the same account on all devices for seamless syncing. Changes appear instantly across all your devices.`
    },
    {
      id: 'contact-support',
      question: 'Who can I contact for more help?',
      icon: Mail,
      category: 'Support',
      answer: `We're here to help! Contact us for any questions or issues:

**General Support:**
• Email: bookmarkd.fun@gmail.com
• Response time: Within 24-48 hours

**Technical Issues:**
• Bug reports and feature requests
• Account access problems
• Sync or performance issues

**Community Guidelines:**
• Report inappropriate content
• Content moderation questions

**Before contacting support:**
• Check this FAQ for common questions
• Try logging out and back in for sync issues
• Clear your browser cache if experiencing problems`
    }
  ]

  const categories = Array.from(new Set(faqs.map(faq => faq.category)))

  const quickActions = [
    {
      title: 'Getting Started Guide',
      description: 'New to Bookmarkd? Start here',
      icon: Book,
      color: 'from-emerald-500 to-emerald-600',
      action: () => setOpenFAQ(0)
    },
    {
      title: 'Add Your First Book',
      description: 'Learn how to build your library',
      icon: Plus,
      color: 'from-blue-500 to-blue-600',
      action: () => setOpenFAQ(2)
    },
    {
      title: 'Contact Support',
      description: 'Get help from us directly',
      icon: MessageCircle,
      color: 'from-purple-500 to-purple-600',
      action: () => setOpenFAQ(8)
    },
    {
      title: 'Request Missing Book',
      description: 'Can\'t find a book? Let us know',
      icon: Search,
      color: 'from-amber-500 to-amber-600',
      action: () => setOpenFAQ(4)
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-emerald-900 pt-24 pb-16">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Help & FAQ
          </h1>
          
          <p className="text-xl text-stone-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            Find answers to common questions and learn how to make the most of your book tracking experience.
          </p>
          
          <div className="flex items-center justify-center gap-2 text-stone-400">
            <Calendar className="w-4 h-4" />
            <span>Updated regularly with new questions</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-stone-800 to-stone-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40 z-10" />
        
        <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">

          {/* FAQ Categories */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <HelpCircle className="w-6 h-6 text-emerald-400" />
              Frequently Asked Questions
            </h2>
            
            <div className="flex flex-wrap gap-3">
              {categories.map((category) => (
                <div
                  key={category}
                  className="px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full border border-emerald-400/30 text-emerald-300 text-sm font-medium"
                >
                  {category}
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="bg-black/30 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-black/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <faq.icon className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                          {faq.category}
                        </span>
                      </div>
                      <h3 className="text-white font-semibold text-lg">{faq.question}</h3>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    {openFAQ === index ? (
                      <ChevronUp className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                </button>
                
                {openFAQ === index && (
                  <div className="px-6 pb-6 border-t border-white/10 bg-gradient-to-r from-black/10 to-emerald-900/5">
                    <div className="pt-6">
                      <div className="prose prose-invert max-w-none">
                        <div 
                          className="text-stone-300 leading-relaxed space-y-4"
                          dangerouslySetInnerHTML={{
                            __html: faq.answer
                              .split('\n\n')
                              .map(paragraph => {
                                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                                  // Handle bold headers
                                  const text = paragraph.replace(/\*\*/g, '')
                                  return `<h4 class="text-emerald-300 font-semibold text-lg mb-3 flex items-center gap-2">
                                    <div class="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                    ${text}
                                  </h4>`
                                } else if (paragraph.includes('•')) {
                                  // Handle bullet points
                                  const lines = paragraph.split('\n')
                                  const title = lines[0]
                                  const bullets = lines.slice(1).filter(line => line.startsWith('•'))
                                  
                                  let html = title ? `<p class="text-stone-300 mb-3 font-medium">${title}</p>` : ''
                                  
                                  if (bullets.length > 0) {
                                    html += '<div class="grid gap-2 ml-4">'
                                    bullets.forEach(bullet => {
                                      const text = bullet.replace('•', '').trim()
                                      html += `
                                        <div class="flex items-start gap-3 group">
                                          <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-2.5 flex-shrink-0 group-hover:bg-emerald-300 transition-colors"></div>
                                          <span class="text-stone-300 group-hover:text-stone-200 transition-colors">${text}</span>
                                        </div>
                                      `
                                    })
                                    html += '</div>'
                                  }
                                  
                                  return html
                                } else if (paragraph.includes(':')) {
                                  // Handle numbered steps or definitions
                                  const lines = paragraph.split('\n')
                                  return lines.map(line => {
                                    if (/^\d+\./.test(line.trim())) {
                                      const [number, ...rest] = line.trim().split(' ')
                                      return `
                                        <div class="flex items-start gap-4 py-2 px-4 rounded-lg bg-black/20 border border-emerald-400/10 hover:border-emerald-400/20 transition-colors group">
                                          <div class="w-6 h-6 bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span class="text-emerald-300 text-sm font-semibold">${number.replace('.', '')}</span>
                                          </div>
                                          <span class="text-stone-300 group-hover:text-stone-200 transition-colors">${rest.join(' ')}</span>
                                        </div>
                                      `
                                    } else {
                                      return `<p class="text-stone-300">${line}</p>`
                                    }
                                  }).join('')
                                } else {
                                  // Regular paragraphs
                                  return `<p class="text-stone-300 leading-relaxed">${paragraph}</p>`
                                }
                              })
                              .join('')
                          }}
                        />
                      </div>
                      
                      {/* Add a subtle separator for longer answers */}
                      {faq.answer.length > 300 && (
                        <div className="mt-6 pt-4 border-t border-emerald-400/10">
                          <div className="flex items-center gap-2 text-emerald-400/60">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm">Hope this helps!</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Still Need Help Section */}
          <div className="mt-16 bg-black/30 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-white mb-3">Still need help?</h3>
            <p className="text-stone-300 mb-6">
              Can't find the answer you're looking for? We are here to help.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:bookmarkd.fun@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Mail className="w-4 h-4" />
                Contact Support
              </a>
              
              <a
                href="mailto:bookmarkd.fun@gmail.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Star className="w-4 h-4" />
                Send Feedback
              </a>
            </div>
            
            <p className="text-sm text-stone-400 mt-4">
              We typically respond within 24-48 hours
            </p>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  )
}

export default page