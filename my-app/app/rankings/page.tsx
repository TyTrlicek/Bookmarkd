import type { Metadata } from "next";
import RankingClient from "./RankingClient";

export const metadata: Metadata = {
  title: "Top Ranked Books – Bookmarkd Global Book Rankings",
  description:
    "Discover the highest rated books on Bookmarkd. See global rankings powered by book lovers worldwide and explore popular reads today.",
  authors: [{ name: "Bookmarkd" }],
  publisher: "Bookmarkd",
  creator: "Bookmarkd",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  alternates: { canonical: "https://bookmarkd.fun/rankings" },
  openGraph: {
    title: "Top Ranked Books – Bookmarkd Global Book Rankings",
    description:
      "Discover the highest rated books on Bookmarkd. See global rankings powered by book lovers worldwide and explore popular reads today.",
    url: "https://bookmarkd.fun/rankings",
    siteName: "Bookmarkd",
    type: "website",
    images: [
      {
        url: "https://bookmarkd.fun/brand-logo.png",
        width: 1200,
        height: 630,
        alt: "Bookmarkd Book Rankings",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Top Ranked Books – Bookmarkd Global Book Rankings",
    description:
      "Discover the highest rated books on Bookmarkd. See global rankings powered by book lovers worldwide and explore popular reads today.",
    images: ["/brand-logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RankingsPage() {
  return <RankingClient />;
}
