import { Metadata } from "next";
import { getBookData } from "@/utils/util";
import BookClient from "./BookClient";
import Script from "next/script";

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

const truncate = (str: string, max = 160) =>
  str.length > max ? str.slice(0, max).trim() + "…" : str;

export async function generateMetadata(
  { params }: PageProps
): Promise<Metadata> {
  const id = decodeURIComponent(params.id);
  const book = await getBookData(id);

  if (!book) {
    return {
      title: "Book Not Found – Bookmarkd",
      description: "The book you are looking for does not exist.",
      openGraph: {
        type: "website",
        url: `https://bookmarkd.fun/book/${encodeURIComponent(id)}`,
        title: "Book Not Found – Bookmarkd",
        description: "The book you are looking for does not exist.",
        images: [
          { url: "/default-book-cover.png", width: 400, height: 600 },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: "Book Not Found – Bookmarkd",
        description: "The book you are looking for does not exist.",
        images: ["/default-book-cover.png"],
      },
    };
  }

  const description = truncate(
    book.description ||
      "Discover this book and see what users think on Bookmarkd."
  );
  const author = book.author || "Unknown Author";
  const imageUrl = book.image || "/default-book-cover.png";
  const bookUrl = `https://bookmarkd.fun/book/${encodeURIComponent(
    book.openLibraryId || book.id
  )}`;

  return {
    title: `${book.title} by ${author} – Bookmarkd`,
    description,
    openGraph: {
      type: "book",
      url: bookUrl,
      title: `${book.title} by ${author} – Bookmarkd`,
      description,
      images: [{ url: imageUrl, width: 400, height: 600 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${book.title} by ${author} – Bookmarkd`,
      description,
      images: [imageUrl],
    },
  };
}

export default async function BookPage({ params }: PageProps) {
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
