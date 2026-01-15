export interface User {
    id: string;
    email?: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
    createdAt?: string;
    bio?: string;
  }

  export interface BookData {
    title: string
    id: number
    author: string
    description: string
    image: string
    publishedDate: string
    pageCount: number | null
    categories?: string[]
    language?: string
    openLibraryId?: string // New field for Open Library ID
    isbn?: string // New field for ISBN
    averageRating?: number
    totalRatings?: number
    ratingRank?: number
    popularityRank?: number
    userRating?: number
    userStatus?: string

}


export interface BookInList {
  id: string; // UserBook id
  addedAt: string; // ISO date string (renamed from dateAdded)
  bookId: string;
  
  // User-specific data from UserBook
  status?: string;
  rating?: number;
  comment?: string; // renamed from comments
  
  // Book data (from the related Book model)
  book: {
    id: string;
    title: string;
    author?: string;
    image?: string;
    description?: string;
    pageCount?: number;
    publishedDate?: string;
    publisher?: string;
    categories?: string[];
    language?: string;
    openLibraryId?: string; // New field for Open Library ID
    isbn?: string; // New field for ISBN
  };
}

export interface ReplyData {
  id: string;
  content: string;
  createdAt: string;
  username: string;
  helpfulCount: number;
  replies?: ReplyData[];
  isOfficial?: boolean;
  avatar_url?: string;
  updatedAt?: string;
  userId?: string;
}

// Add interface for review data with replies
export interface ReviewData {
  id: string;
  content: string;
  createdAt: string;
  helpfulCount: number;
  recommendation: string;
  username: string;
  replies?: ReplyData[];
  avatar_url: string;
  userId?: string;
  updatedAt?: string;
}

export interface UserActivity {
  id: string;
  userId: string;
  actorId?: string | null;
  type: string;          // e.g. 'reply', 'like', 'status_update', etc.
  reviewId?: string | null;
  bookId?: string | null;
  data: Record<string, any>;  // JSON field, can be any object
  createdAt: string;     // ISO date string
  read: boolean;
};

  