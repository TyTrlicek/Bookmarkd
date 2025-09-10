import { getBookData } from "@/utils/util";
import BookClient from "./BookClient";
import Script from "next/script";

export default async function BookPage({
  params,
}: {
  params: { id: string };
}) {
  const id = decodeURIComponent(params.id);
  const book = await getBookData(id);

  if (!book) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        <h1>Book Not Found</h1>
      </div>
    );
  }

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    author: book.author || "Unknown Author",
    image: book.image || "/default-book-cover.png",
    description: book.description || "",
    url: `https://bookmarkd.fun/book/${encodeURIComponent(
      book.openLibraryId || book.id
    )}`,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: book.averageRating || 0,
      reviewCount: book.totalRatings || 0,
    },
    datePublished: book.publishedDate || undefined,
    genre: book.categories || undefined,
  };

  return (
    <>
      <Script
        id={`book-ld-${book.id}`}
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <BookClient id={id} />
    </>
  );
}
