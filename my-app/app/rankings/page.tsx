import RankingClient from "./RankingClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Rankings – Top Rated Books | Bookmarkd",
  description: "Discover the highest-rated books on Bookmarkd. Explore global rankings, trending titles, and see what books the community loves most.",
  keywords: ["book rankings", "top rated books", "best books", "book reviews", "trending books"],
  alternates: {
    canonical: "https://bookmarkd.fun/rankings",
  },
  openGraph: {
    title: "Book Rankings – Top Rated Books | Bookmarkd",
    description: "Discover the highest-rated books on Bookmarkd. Explore global rankings, trending titles, and see what books the community loves most.",
    url: "https://bookmarkd.fun/rankings",
  },
};

export default function RankingsPage() {
  return <RankingClient />;
}
