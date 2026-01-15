import React from 'react'
import {
  BookOpen,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Heart,
  ExternalLink,
  Shield,
  FileText,
  HelpCircle,
  Users,
  MessageCircle,
  ArrowRight,
  Coffee,
  Star
} from 'lucide-react'
import Image from 'next/image'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    platform: [
      { name: 'Browse Books', href: '/browse', icon: BookOpen },
      { name: 'Your Collection', href: '/collection', icon: Star },
      { name: 'Rankings', href: '/rankings', icon: Star },
      { name: 'Book Clubs', href: '/#', icon: Users, badge: 'Coming Soon' },
      { name: 'Discussions', href: '/#', icon: MessageCircle, badge: 'Coming Soon' },
    ],
    company: [
      { name: 'About', href: '/about', icon: Users },
      { name: 'Contact & Support', href: '/contact', icon: Mail },
      { name: 'Blog', href: '/blog', icon: FileText, badge: 'Coming Soon' },
      { name: 'Help & FAQ', href: '/help', icon: HelpCircle }
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy', icon: Shield },
      { name: 'Terms of Service', href: '/terms', icon: FileText },
      { name: 'Community Guidelines', href: '/community-guidelines', icon: Users },
      { name: 'Cookie Policy', href: '/cookies', icon: Shield }
    ]
  }

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#', color: 'hover:text-blue-400' },
    { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-sky-400' },
    { name: 'Instagram', icon: Instagram, href: '#', color: 'hover:text-pink-400' },
    { name: 'YouTube', icon: Youtube, href: '#', color: 'hover:text-red-400' }
  ]

  const stats = [
    { label: 'Active Readers', value: '10K+' },
    { label: 'Books Reviewed', value: '50K+' },
    { label: 'Reading Goals Met', value: '8K+' },
    { label: 'Book Clubs', value: '200+' }
  ]

  return (
    <footer className="relative mt-20">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#14181C] via-[#14181C] to-[#14181C]" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#14181C]/80 via-transparent to-transparent" />
      
      <div className="relative z-10">
        {/* Newsletter Signup Section - Commented out for now */}
        {/* <div className="bg-gradient-to-r from-amber-500/10 to-purple-500/10 backdrop-blur-sm border-y border-[#3D4451]">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-stone-50 mb-4">Stay in the Reading Loop</h3>
              <p className="text-stone-300 text-lg max-w-2xl mx-auto">
                Get weekly book recommendations, reading tips, and early access to new features
              </p>
            </div>
            
            <div className="max-w-md mx-auto">
              <div className="flex gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 bg-[#2C3440]/80 border border-[#3D4451] rounded-xl text-stone-50 placeholder-stone-400 focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20"
                />
                <button className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-50 font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 transition-all duration-200 shadow-lg hover:shadow-amber-500/25 flex items-center gap-2">
                  Subscribe
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-stone-400 mt-3 text-center">
                No spam, unsubscribe at any time
              </p>
            </div>
          </div>
        </div> */}

        {/* Stats Section - Commented out until you have real data */}
        {/* <div className="border-b border-[#3D4451]">
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="text-3xl font-bold text-stone-50 group-hover:text-amber-400 transition-colors">
                    {stat.value}
                  </div>
                  <div className="text-stone-400 text-sm font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div> */}

        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                  <Image src="/brand-logo.png" alt="brand" className="w-15 h-15 text-stone-50 rounded-full shadow-lg" width={60} height={60} />
                <h3 className="text-2xl font-bold text-amber-400">Bookmarkd</h3>
              </div>
              
              <p className="text-stone-300 mb-6 leading-relaxed">
                A personal book tracking and rating site. 
                Track your books, discover new favorites, and share your thoughts with our growing community.
              </p>

              {/* Social Links - Hidden until you create them */}
              {/* <div className="flex gap-4 mb-6">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon
                  return (
                    <a
                      key={index}
                      href={social.href}
                      className={`w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center text-stone-400 ${social.color} hover:bg-white/20 transition-all duration-200 border border-[#3D4451]`}
                      aria-label={social.name}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  )
                })}
              </div> */}

              {/* Contact Info */}
              <div className="space-y-3 text-stone-400 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4" />
                  <span>bookmarkd.fun@gmail.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4" />
                  <span>Dallas, TX</span>
                </div>
              </div>
            </div>

            {/* Platform Links */}
            <div>
              <h4 className="text-lg font-semibold text-stone-50 mb-6">Platform</h4>
              <ul className="space-y-3">
                {footerLinks.platform.map((link, index) => {
                  const Icon = link.icon
                  return (
                    <li key={index}>
                      <a
                        href={link.href}
                        className="flex items-center gap-3 text-stone-400 hover:text-amber-400 transition-colors group"
                      >
                        <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>{link.name}</span>
                        {link.badge && (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs text-center rounded-full border border-amber-400/20">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Support & Info Links */}
            <div>
              <h4 className="text-lg font-semibold text-stone-50 mb-6">Support & Info</h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => {
                  const Icon = link.icon
                  return (
                    <li key={index}>
                      <a
                        href={link.href}
                        className="flex items-center gap-3 text-stone-400 hover:text-amber-400 transition-colors group"
                      >
                        <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>{link.name}</span>
                        {link.badge && (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full border border-amber-400/20">
                            {link.badge}
                          </span>
                        )}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="text-lg font-semibold text-stone-50 mb-6">Legal & Privacy</h4>
              <ul className="space-y-3">
                {footerLinks.legal.map((link, index) => {
                  const Icon = link.icon
                  return (
                    <li key={index}>
                      <a
                        href={link.href}
                        className="flex items-center gap-3 text-stone-400 hover:text-amber-400 transition-colors group"
                      >
                        <Icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        <span>{link.name}</span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#3D4451]">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-stone-400 text-sm">
                <span>© {currentYear} Bookmarkd.</span>
                <span>All Rights Reserved.</span>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-stone-400">
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>Powered by OpenLibrary</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer