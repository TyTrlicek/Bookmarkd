'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { useTexture, PerspectiveCamera } from '@react-three/drei'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import * as THREE from 'three'
import { BookOpen, Star, Search, TrendingUp, ArrowRight, Sparkles } from 'lucide-react'

interface Book {
  id: string
  title: string
  author: string
  image: string
  averageRating?: number
}

interface BookCarouselProps {}

export default function BookCarouselHero({}: BookCarouselProps) {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [webGLSupported, setWebGLSupported] = useState(true)
  const router = useRouter()

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      setWebGLSupported(!!gl)
    } catch (e) {
      setWebGLSupported(false)
    }
  }, [])

  // Fetch trending books
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/trending`)
        const isMobile = window.innerWidth < 768
        const bookCount = isMobile ? 15 : 30
        setBooks(res.data.slice(0, bookCount))
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch trending books:', error)
        setLoading(false)
      }
    }
    fetchBooks()
  }, [])

  // Show loading state
  if (loading) {
    return <LoadingState />
  }

  // Show fallback for reduced motion or no WebGL
  if (prefersReducedMotion || !webGLSupported || books.length === 0) {
    return <StaticFallbackHero books={books} />
  }

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#14181C] via-amber-900 to-[#14181C]">
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas>
          <PerspectiveCamera makeDefault position={[0, 0, 3]} fov={60} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#fbbf24" />

          <Suspense fallback={null}>
            <BookCarousel books={books} />
          </Suspense>
        </Canvas>
      </div>

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#14181C]/80 via-black/40 to-transparent z-10" />

      {/* Main Content - Centered and Clean */}
      <div className="relative z-20 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full">
          <div className="text-center space-y-12">

            {/* Hero Heading */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
                <span className="block text-stone-50 mb-2">Your Books,</span>
                <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                  Your Story
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-stone-400 max-w-3xl mx-auto leading-relaxed font-light">
                Track, rate, and discover books. Build your personal library and connect with fellow readers.
              </p>
            </div>

            {/* CTA Buttons - More prominent */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <button
                onClick={() => router.push('/auth')}
                className="group w-full sm:w-auto relative px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/50 hover:-translate-y-1"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => router.push('/auth')}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-stone-50 font-medium rounded-xl border border-[#3D4451] hover:border-[#3D4451] transition-all duration-300 backdrop-blur-sm"
              >
                Sign In
              </button>
            </div>

            {/* Feature Grid - More organized */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto pt-8">
              {[
                { icon: Search, label: "Discover", desc: "Millions of books" },
                { icon: BookOpen, label: "Track", desc: "Your reading list" },
                { icon: Star, label: "Rate", desc: "Share your thoughts" },
                { icon: TrendingUp, label: "Explore", desc: "Trending titles" }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl border border-[#3D4451] hover:border-amber-500/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 mb-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-stone-50 font-semibold text-lg mb-1">{feature.label}</h3>
                  <p className="text-stone-400 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-stone-500 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>Join in 30 Seconds</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// 3D Carousel component - Horizontal panning
function BookCarousel({ books }: { books: Book[] }) {
  const groupRef = useRef<THREE.Group>(null)
  const spacing = 1.8

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Pan horizontally from right to left at slower constant speed
      groupRef.current.position.x -= delta * 0.8

      // Calculate the width of one full set of books
      const setWidth = books.length * spacing

      // When we've scrolled past one complete set, reset by exactly one set width
      // This creates a seamless infinite loop
      if (groupRef.current.position.x <= -setWidth) {
        groupRef.current.position.x += setWidth
      }
    }
  })

  // Triple the books array for seamless infinite scrolling
  const infiniteBooks = [...books, ...books, ...books]

  return (
    <group ref={groupRef}>
      {infiniteBooks.map((book, index) => {
        // Arrange books in a horizontal line
        const x = index * spacing

        // All books perfectly aligned on Y axis
        const y = 0

        // Keep Z position close and consistent (just in front of camera)
        const z = 0

        return (
          <BookMesh
            key={`${book.id}-${index}`}
            position={[x, y, z]}
            rotation={[0, 0, 0]}
            imageUrl={book.image}
            index={index}
          />
        )
      })}
    </group>
  )
}

// Individual book mesh component
function BookMesh({
  position,
  rotation,
  imageUrl,
  index
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  imageUrl: string
  index: number
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)

  // Load texture - Suspense will handle loading states
  const texture = useTexture(imageUrl)

  // Hover animation only
  useFrame(() => {
    if (meshRef.current) {
      // Subtle scale on hover
      const targetScale = hovered ? 1.1 : 1
      meshRef.current.scale.setScalar(
        THREE.MathUtils.lerp(meshRef.current.scale.x, targetScale, 0.1)
      )
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={rotation}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <planeGeometry args={[1.2, 1.8]} />
      <meshStandardMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent
        opacity={0.9}
      />
    </mesh>
  )
}

// Loading state component
function LoadingState() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#14181C] via-amber-900 to-[#14181C] flex items-center justify-center">
      <div className="text-center z-10">
        <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-stone-50 text-lg">Loading your personalized experience...</p>
      </div>
    </section>
  )
}

// Static fallback for reduced motion or no WebGL
function StaticFallbackHero({ books }: { books: Book[] }) {
  const router = useRouter()

  return (
    <section className="relative overflow-hidden bg-gradient-to-t from-[#14181C] via-[#14181C] to-amber-900 min-h-screen">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(251, 191, 36, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(251, 191, 36, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="relative z-20 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full">
          <div className="text-center space-y-12">

            {/* Hero Heading */}
            <div className="space-y-6">
              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
                <span className="block text-stone-50 mb-2">Your Books,</span>
                <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
                  Your Story
                </span>
              </h1>

              <p className="text-xl sm:text-2xl text-stone-400 max-w-3xl mx-auto leading-relaxed font-light">
                Track, rate, and discover books. Build your personal library and connect with fellow readers.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <button
                onClick={() => router.push('/auth')}
                className="group w-full sm:w-auto relative px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/50 hover:-translate-y-1"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-700 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => router.push('/auth')}
                className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-stone-50 font-medium rounded-xl border border-[#3D4451] hover:border-[#3D4451] transition-all duration-300 backdrop-blur-sm"
              >
                Sign In
              </button>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto pt-8">
              {[
                { icon: Search, label: "Discover", desc: "Millions of books" },
                { icon: BookOpen, label: "Track", desc: "Your reading list" },
                { icon: Star, label: "Rate", desc: "Share your thoughts" },
                { icon: TrendingUp, label: "Explore", desc: "Trending titles" }
              ].map((feature, index) => (
                <div
                  key={index}
                  className="group p-6 bg-white/5 hover:bg-white/10 backdrop-blur-sm rounded-2xl border border-[#3D4451] hover:border-amber-500/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 mb-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-amber-400" />
                  </div>
                  <h3 className="text-stone-50 font-semibold text-lg mb-1">{feature.label}</h3>
                  <p className="text-stone-400 text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-stone-500 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>Free Forever</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span>Join in 30 Seconds</span>
              </div>
            </div>

            {/* Book preview grid */}
            {books.length > 0 && (
              <div className="mt-16 grid grid-cols-4 md:grid-cols-8 gap-3 max-w-5xl mx-auto opacity-30">
                {books.slice(0, 8).map((book) => (
                  <div key={book.id} className="aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
                    <img
                      src={book.image}
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
