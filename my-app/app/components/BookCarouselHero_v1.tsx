'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, useTexture, PerspectiveCamera } from '@react-three/drei'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import * as THREE from 'three'
import { BookOpen, Star, Heart, Search, TrendingUp } from 'lucide-react'

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
          <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={75} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} />
          <pointLight position={[-10, -10, -5]} intensity={0.5} color="#fbbf24" />

          <Suspense fallback={null}>
            <BookCarousel books={books} />
          </Suspense>

          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.5}
            enableDamping
            dampingFactor={0.05}
            rotateSpeed={0.5}
          />
        </Canvas>
      </div>

      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#14181C]/80 via-black/40 to-transparent z-10" />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="w-full max-w-7xl mx-auto px-6 py-20">
          <div className="pointer-events-auto bg-[#2C3440]/80 backdrop-blur-xl rounded-3xl border border-amber-500/20 p-8 md:p-12 max-w-2xl mx-auto relative overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-x-16 -translate-y-16" />
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-orange-500/10 to-transparent rounded-full translate-x-12 translate-y-12" />

            <div className="relative z-10">
              {/* Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <BookOpen className="w-10 h-10 text-stone-50" />
              </div>

              {/* Heading */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-stone-50 mb-4 text-center leading-tight">
                Discover Your Next
                <span className="block bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Favorite Book
                </span>
              </h1>

              <p className="text-lg md:text-xl text-stone-300 mb-8 text-center leading-relaxed">
                Join a community of readers where you can collect, rate, and discover amazing books.
                Build your personal library and never forget a great read again.
              </p>

              {/* Feature List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Search, text: "Search millions of books" },
                  { icon: Heart, text: "Build your book collection" },
                  { icon: Star, text: "Rate and review books" },
                  { icon: TrendingUp, text: "Get personalized recommendations" }
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <feature.icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <span className="text-stone-300 text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="space-y-4">
                <button
                  onClick={() => router.push('/auth')}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-1 transform text-lg"
                >
                  Get Started!
                </button>

                <button
                  onClick={() => router.push('/auth')}
                  className="w-full bg-white/10 hover:bg-white/20 text-stone-50 font-medium py-3 px-8 rounded-xl transition-all duration-300 border border-[#3D4451] hover:border-white/30 backdrop-blur-sm"
                >
                  Sign In
                </button>
              </div>

              <p className="text-xs text-stone-500 mt-6 text-center">
                Free forever • No credit card required • Join in 30 seconds
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// 3D Carousel component
function BookCarousel({ books }: { books: Book[] }) {
  const groupRef = useRef<THREE.Group>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Track mouse position for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1
      })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Auto-rotate carousel
      groupRef.current.rotation.y += delta * 0.2

      // Subtle mouse parallax (desktop only)
      if (window.innerWidth >= 768) {
        groupRef.current.rotation.x = THREE.MathUtils.lerp(
          groupRef.current.rotation.x,
          mousePosition.y * 0.1,
          0.05
        )
      }
    }
  })

  return (
    <group ref={groupRef}>
      {books.map((book, index) => {
        const totalBooks = books.length
        const angle = (index / totalBooks) * Math.PI * 2

        // Create spiral formation with varying radius
        const radiusVariation = Math.sin(index * 0.5) * 0.5
        const radius = 3 + (index % 3) * 0.3 + radiusVariation

        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const y = Math.sin(index * 0.3) * 0.8 // Vertical variation

        // Rotation to face center
        const rotationY = -angle + Math.PI / 2

        return (
          <BookMesh
            key={book.id}
            position={[x, y, z]}
            rotation={[0, rotationY, 0]}
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

  // Floating animation
  useFrame((state) => {
    if (meshRef.current) {
      const time = state.clock.getElapsedTime()
      const floatY = Math.sin(time * 0.5 + index * 0.3) * 0.1
      meshRef.current.position.y = position[1] + floatY

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
      <planeGeometry args={[0.8, 1.2]} />
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
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-[#14181C]/70 via-transparent to-[#14181C]/50 z-10" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 py-20 flex items-center min-h-screen">
        <div className="w-full">
          {/* Hero Content */}
          <div className="text-center mb-16 max-w-4xl mx-auto">
            <div className="mb-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-stone-50 mb-6 leading-tight">
                Discover Your Next
                <span className="block bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  Favorite Book
                </span>
              </h1>

              <p className="text-xl md:text-2xl text-stone-300 mb-8 leading-relaxed max-w-3xl mx-auto">
                Join a community of readers where you can collect, rate, and discover amazing books.
                Build your personal library and never forget a great read again.
              </p>
            </div>

            {/* CTA Section */}
            <div className="bg-[#2C3440]/80 backdrop-blur-xl rounded-3xl border border-amber-500/20 p-8 md:p-12 max-w-2xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -translate-x-16 -translate-y-16" />
              <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-orange-500/10 to-transparent rounded-full translate-x-12 translate-y-12" />

              <div className="relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <BookOpen className="w-10 h-10 text-stone-50" />
                </div>

                <h3 className="text-3xl md:text-4xl font-bold text-stone-50 mb-4">
                  Sign Up Now!
                </h3>

                <p className="text-lg text-stone-300 mb-8 leading-relaxed">
                  Create your personal library, rate and review your favorites, and discover books
                  you'll love based on your taste.
                </p>

                {/* Feature List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
                  {[
                    { icon: Search, text: "Search millions of books" },
                    { icon: Heart, text: "Build your book collection" },
                    { icon: Star, text: "Rate and review books" },
                    { icon: TrendingUp, text: "Get personalized recommendations" }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-stone-300 text-sm">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <div className="space-y-4">
                  <button
                    onClick={() => router.push('/auth')}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/25 hover:-translate-y-1 transform text-lg"
                  >
                    Get Started!
                  </button>

                  <button
                    onClick={() => router.push('/auth')}
                    className="w-full bg-white/10 hover:bg-white/20 text-stone-50 font-medium py-3 px-8 rounded-xl transition-all duration-300 border border-[#3D4451] hover:border-white/30 backdrop-blur-sm"
                  >
                    Sign In
                  </button>
                </div>

                <p className="text-xs text-stone-500 mt-6">
                  Free forever • No credit card required • Join in 30 seconds
                </p>
              </div>
            </div>
          </div>

          {/* Optional: Show some book covers in a grid */}
          {books.length > 0 && (
            <div className="mt-12 grid grid-cols-3 md:grid-cols-6 gap-4 max-w-4xl mx-auto opacity-50">
              {books.slice(0, 6).map((book) => (
                <div key={book.id} className="aspect-[2/3] rounded-lg overflow-hidden">
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
    </section>
  )
}
