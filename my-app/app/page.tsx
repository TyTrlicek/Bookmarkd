import type { Metadata } from "next";
import Script from "next/script";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Bookmarkd – Track, Rate & Discover Books",
  description:
    "Bookmarkd is the ultimate book tracking app. Keep your personal collection, rate and review books, explore community rankings, discover recommendations, and earn achievements.",
  keywords: [
    "book tracker",
    "book ratings",
    "book reviews",
    "reading tracker",
    "personal book collection",
    "book recommendations",
  ],
  openGraph: {
    title: "Bookmarkd – Track, Rate & Discover Books",
    description:
      "Track your reading, review books, explore rankings, get recommendations, and earn achievements on Bookmarkd.",
    url: "https://bookmarkd.fun",
    siteName: "Bookmarkd",
    images: [
      {
        url: "/brand-logo.png",
        width: 1200,
        height: 630,
        alt: "Bookmarkd – Book tracking and reviews",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bookmarkd – Track, Rate & Discover Books",
    description:
      "Track your personal collection, rate books, see rankings, reviews, and earn achievements.",
    images: ["/brand-logo.png"],
    creator: "@bookmarkd",
  },
};

export default function HomePage() {
  return (
    <>
      {/* JSON-LD structured data for homepage */}
      <Script
        id="ld-json"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Bookmarkd",
            url: "https://bookmarkd.fun",
          }),
        }}
      />
      <HomeClient />
    </>
  );
}
