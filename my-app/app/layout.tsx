import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from '@vercel/analytics/next';

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
  title: "Bookmarkd – Track Your Reading Journey & Discover Great Books",
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
  alternates: {
    canonical: "https://bookmarkd.fun",
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
        url: "https://bookmarkd.fun/brand-logo.png", 
        width: 1200,
        height: 630,
        alt: "Bookmarkd – Track Your Reading Journey",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bookmarkd – Track Your Reading Journey & Discover Great Books",
    description:
      "Bookmarkd is a personal reading companion. Track books you’ve read, organize your collection, rate and review titles, and explore global rankings powered by book lovers worldwide.",
    images: ["/brand-image.png"],
    creator: "@Bookmarkd", // optional Twitter handle
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
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
        {children}
        <Analytics />
      </body>
    </html>
  );
}
