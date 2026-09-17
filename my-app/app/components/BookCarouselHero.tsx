'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import axios from 'axios'
import { ArrowRight } from 'lucide-react'

interface Book {
  id: string
  title: string
  author: string
  image: string
  averageRating?: number
}

const META = ['Free forever', '3M+ books', 'No credit card']

// Seed covers so the wall always has something to show, even if the
// trending request is slow or fails. Open Library cover CDN, by ISBN.
const COVER_FALLBACKS: string[] = [
  '9780743273565', '9780061120084', '9780141036144', '9780316769488',
  '9780141439518', '9780618640157', '9780439023528', '9780316015844',
  '9780545010565', '9781594631931', '9780525478812', '9780062315007',
  '9780345339683', '9781400079278', '9780679732761', '9780140449136',
  '9780385333849', '9780375842207', '9780307277671', '9781501173219',
  '9780553213119', '9780679783268', '9780307387899', '9780446310789',
].map((isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`)

const fallbackBooks: Book[] = COVER_FALLBACKS.map((image, i) => ({
  id: `seed-${i}`,
  title: '',
  author: '',
  image,
}))

export default function BookCarouselHero() {
  const [books, setBooks] = useState<Book[]>(fallbackBooks)
  const router = useRouter()
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    let cancelled = false
    axios
      .get(`${process.env.NEXT_PUBLIC_API_URL}/api/trending`)
      .then((res) => {
        if (cancelled) return
        const live = (res.data ?? [])
          .filter((b: Book) => b?.image)
          .slice(0, 32)
        if (live.length >= 8) setBooks(live)
      })
      .catch((err) => console.error('Failed to fetch trending books:', err))
    return () => {
      cancelled = true
    }
  }, [])

  const [rowA, rowB] = useMemo(() => {
    const mid = Math.ceil(books.length / 2)
    return [books.slice(0, mid), books.slice(mid)] as const
  }, [books])

  const { scrollY } = useScroll()
  const wallY = useTransform(scrollY, [0, 700], [0, reduceMotion ? 0 : -60])
  const contentY = useTransform(scrollY, [0, 700], [0, reduceMotion ? 0 : 60])

  const rise = (i: number) => ({
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: reduceMotion ? 0 : 0.65,
      delay: reduceMotion ? 0 : 0.1 + i * 0.09,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  })

  return (
    <section className="grain relative isolate flex min-h-[100svh] items-center overflow-hidden bg-canvas">
      {/* ---- Backdrop glow + vignette ---- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(75% 55% at 70% 6%, rgba(224,168,93,0.17), transparent 60%),' +
            'radial-gradient(55% 45% at 12% 100%, rgba(217,119,6,0.10), transparent 65%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(125% 100% at 50% 0%, transparent 42%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* ---- Cover wall ---- */}
      <motion.div
        aria-hidden
        style={{ y: wallY }}
        className="pointer-events-none absolute inset-y-0 left-0 right-0 -z-[6] flex items-center opacity-50 [perspective:1600px] sm:opacity-80 lg:left-[42%]"
      >
        <div className="rail-mask flex w-full flex-col gap-4 [transform:rotateY(-26deg)_rotateX(7deg)_rotateZ(-3deg)] sm:gap-5">
          <CoverRow books={rowA} direction="left" duration={82} />
          <CoverRow books={rowB} direction="right" duration={96} />
          <CoverRow books={rowA} direction="left" duration={112} className="hidden lg:flex" />
        </div>
      </motion.div>

      {/* scrims for text legibility */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[5] bg-gradient-to-r from-canvas from-35% via-canvas/92 to-canvas/25 sm:to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-[5] h-32 bg-gradient-to-b from-canvas to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-[5] h-44 bg-gradient-to-t from-canvas to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 -z-[5] hidden w-40 bg-gradient-to-l from-canvas to-transparent sm:block"
      />

      {/* ---- Content ---- */}
      <motion.div
        style={{ y: contentY }}
        className="relative z-10 mx-auto w-full max-w-7xl px-5 py-20 sm:px-8"
      >
        <div className="max-w-xl">
          <motion.p {...rise(0)} className="kicker">
            A home for everything you read
          </motion.p>

          <motion.h1
            {...rise(1)}
            className="font-display mt-6 text-[clamp(2.15rem,4.4vw,3.35rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-ink"
          >
            <span className="block">Every book you&apos;ve read,</span>
            <span
              className="mt-1.5 block italic text-gold"
              style={{ fontVariationSettings: '"WONK" 1' }}
            >
              worth remembering.
            </span>
          </motion.h1>

          <motion.p
            {...rise(2)}
            className="mt-7 max-w-lg text-lg leading-relaxed text-ink-soft"
          >
            Track what you&apos;ve read, rate it honestly, and find your next
            book — alongside a community that cares about books as much as you do.
          </motion.p>

          <motion.div
            {...rise(3)}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <button
              onClick={() => router.push('/auth')}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-ember px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-ember-strong hover:shadow-[0_12px_40px_-10px_rgba(217,119,6,0.55)]"
            >
              Start your shelf
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={() => router.push('/browse')}
              className="inline-flex items-center justify-center rounded-full border border-line-strong bg-overlay px-7 py-3.5 text-sm font-medium text-ink backdrop-blur-sm transition-colors duration-300 hover:border-ink-mute hover:bg-overlay-hover"
            >
              Explore books
            </button>
          </motion.div>

          <motion.ul
            {...rise(4)}
            className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-ink-faint"
          >
            {META.map((label, i) => (
              <li key={label} className="flex items-center gap-3">
                {i > 0 && <span className="text-ink-faint/50">/</span>}
                {label}
              </li>
            ))}
          </motion.ul>
        </div>
      </motion.div>
    </section>
  )
}

function CoverRow({
  books,
  direction,
  duration,
  className = '',
}: {
  books: Book[]
  direction: 'left' | 'right'
  duration: number
  className?: string
}) {
  if (!books.length) return null
  const loop = [...books, ...books]
  return (
    <div
      className={`marquee-track ${
        direction === 'left' ? 'marquee-left' : 'marquee-right'
      } ${className}`}
      style={{ ['--marquee-duration' as string]: `${duration}s` }}
    >
      {loop.map((book, i) => (
        <div
          key={`${book.id}-${i}`}
          className="mx-2 h-[172px] w-[115px] shrink-0 overflow-hidden rounded-[5px] bg-surface-2 shadow-[0_22px_50px_-18px_rgba(0,0,0,0.85)] ring-1 ring-white/[0.06] sm:h-[200px] sm:w-[133px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={book.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            onError={(e) => {
              ;(e.currentTarget.parentElement as HTMLElement).style.visibility =
                'hidden'
            }}
          />
        </div>
      ))}
    </div>
  )
}
