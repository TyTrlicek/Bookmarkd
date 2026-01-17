import { BookData } from "@/app/types/types"
import useAuthStore from "@/store/authStore";
import axios from "axios"

/**
 * Helper to get access token from auth store
 * Use this instead of supabase.auth.getSession()
 */
export const getAccessToken = async (): Promise<string | null> => {
  return useAuthStore.getState().getAccessToken();
};

export const getBookData = async (id: string, searchAuthor?: string): Promise<BookData | null> => {
  const accessToken = await getAccessToken();

  const headers = accessToken
    ? {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    : { 'Content-Type': 'application/json' };


    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/bookdata`, {
        params: { id: id, searchAuthor: searchAuthor },
        headers
      }, )
      console.log('book data:', res.data)
      return {
        title: res.data.title || 'Unknown Title',
        author: res.data.author || 'Unknown Author',
        description: res.data.description || 'No description available',
        image: res.data.image || null,
        publishedDate: res.data.publishedDate || 'Unknown Date',
        pageCount: res.data.pageCount || null,
        categories: res.data.categories || [],
        language: res.data.language || 'Unknown',
        openLibraryId: res.data.openLibraryId || null,
        isbn: res.data.isbn || null,
        averageRating: res.data.averageRating,
        totalRatings: res.data.totalRatings,
        popularityRank: res.data.popularityRank || 0,
        ratingRank: res.data.ratingRank || 0,
        userStatus: res.data.userStatus || null,
        userRating: res.data.userRating || null,
        id: res.data.id
      }
    } catch (err) {
      console.error('Error fetching book data from backend:', err)
      return null
    }
  }

  export const getSearchData = async (query: string): Promise<BookData[] | null> => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/search`, {
        params: { q: query },
      });
  
      console.log('book data:', res.data);
  
      if (!Array.isArray(res.data)) {
        throw new Error('Expected an array of books from backend');
      }
  
      const books: BookData[] = res.data.map((book) => ({
        title: book.title || query,
        author: book.author || 'Unknown Author',
        description: book.description || 'No description available',
        image: book.image || null,
        publishedDate: book.publishedDate || 'Unknown Date',
        pageCount: book.pageCount || null,
        categories: book.categories || [],
        language: book.language || 'Unknown',
        openLibraryId: book.openLibraryId || null,
        isbn: book.isbn || null,
        averageRating: book.averageRating || null,
        totalRatings: book.totalRatings || null,
        id: book.id,
      }));
  
      return books;
    } catch (err) {
      console.error('Error fetching book data from backend:', err);
      return null;
    }
  };

  export function toAmericanDate(isoString: string) {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric'
  });
}

export  const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return '1 day ago';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
        return `${Math.ceil(diffDays / 30)} months ago`;
    };

  export const truncate = (str: string, max = 160) =>
  str.length > max ? str.slice(0, max).trim() + '…' : str;

  