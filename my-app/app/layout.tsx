import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';
import AuthProvider from '@/providers/AuthProvider';

import "./globals.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bookmarkd – Track Your Books & Discover New Favorites",
  description:
   "Bookmarkd is your personal book hub. Track and organize your collection, discover new titles, rate and review books, and explore global rankings fueled by a community of passionate readers.",
  keywords: ["books", "reading", "book reviews", "book tracking", "reading list", "book recommendations"],
  authors: [{ name: "Bookmarkd" }],
  creator: "Bookmarkd",
  publisher: "Bookmarkd",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title: "Bookmarkd – Track Your Books and Discover New Reads",
    description:
      "Bookmarkd is your personal book hub. Track and organize your collection, discover new titles, rate and review books, and explore global rankings fueled by a community of passionate readers.",
    url: "https://bookmarkd.fun",
    siteName: "Bookmarkd",
    type: "website",
    images: [
      {
        url: "https://bookmarkd.fun/social-image.png",
        width: 1200,
        height: 630,
        alt: "Bookmarkd – Track and Rate Books",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bookmarkd – Track Books & Discover New Favorites",
    description:
      "Bookmarkd is a personal book tracking/rating app. Track books you've read, organize your collection, rate and review titles, and explore global rankings powered by a community of readers.",
    images: ["/social-image.png"],
    // creator: "@Bookmarkd", // optional Twitter handle
  },
  icons: {
    icon: "/brand-logo.png",
    shortcut: "/brand-logo.png",
    apple: "https://bookmarkd.fun/brand-logo.png",
  },
};




export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
