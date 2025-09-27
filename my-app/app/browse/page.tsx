// app/browse/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Browse Books – Find Your Next Read on Bookmarkd",
  description:
    "Explore thousands of books with Bookmarkd. Search by title, author, or genre, and start your collection today.",
  keywords: ["browse books", "find books", "book search", "discover books", "book catalog"],
  alternates: {
    canonical: "https://bookmarkd.fun/browse",
  },
  openGraph: {
    title: "Browse Books – Find Your Next Read on Bookmarkd",
    description: "Explore thousands of books with Bookmarkd. Search by title, author, or genre, and start your collection today.",
    url: "https://bookmarkd.fun/browse",
  },
};

import BrowseClient from "./BrowseClient";

export default function BrowsePage() {
  return <BrowseClient />;
}
