// app/browse/page.tsx  
export const metadata = {
  title: "Browse Books – Find Your Next Read on Bookmarkd",
  description:
    "Explore thousands of books with Bookmarkd. Search by title, author, or genre, and start your collection today.",
};

import BrowseClient from "./BrowseClient";

export default function BrowsePage() {
  return <BrowseClient />;
}
