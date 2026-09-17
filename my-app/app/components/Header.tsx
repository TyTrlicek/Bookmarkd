"use client"
import React, { useCallback, useEffect, useState, useRef } from 'react'
import { Bell, Coffee, Search, User, Menu, X, Share2, Bookmark, Heart, Clock, CheckCircle, BookOpen, BookMarked, Loader2 } from "lucide-react";
import Link from 'next/link';
import { BookData } from '../types/types';
import { debounce } from 'lodash';
import { getSearchData } from '@/utils/util';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import axios from 'axios';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import useAuthStore from '@/store/authStore';

interface UserActivity {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
  type?: string;
  data?: {
    message: string;
  }
}

const Header = () => {
  const { isAuthenticated, accessToken } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [books, setBooks] = useState<BookData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSearchLoading, setIsSearchLoading] = useState(false); // New loading state for search
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<UserActivity[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const mobileNotificationsRef = useRef<HTMLDivElement>(null);
  const router = useRouter()

  const toggleMenu = () => {
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSearch = () => {
    setIsMenuOpen(false);
    setIsNotificationsOpen(false);
    setIsSearchOpen(!isSearchOpen);
  };

  const toggleNotifications = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    if (!isNotificationsOpen) {
      await fetchNotifications();
    }
    if(isNotificationsOpen){
    setIsNotificationsOpen(false);
    }
    else{
      setIsNotificationsOpen(true);
    }
      setSearchQuery('');
  };

  const fetchNotifications = async () => {
    if (!accessToken) {
      setNotifications([]);
      setNotificationCount(0);
      return;
    }

    setIsLoadingNotifications(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/activity/unread`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      setNotifications(response.data);
      setNotificationCount(response.data.length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoadingNotifications(false);
    }
  };

  const markAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const accessToken = await useAuthStore.getState().getAccessToken();
    if (!accessToken) return;

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/activity/mark-read`, {}, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setNotificationCount(0);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  };

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setNotificationCount(0);
    }
  }, [isAuthenticated, accessToken]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setBooks([]);
      setShowSearchResults(false);
      setIsSearchLoading(false);
      return;
    }

    setIsSearchLoading(true); // Start loading
    try {
      const response = await getSearchData(query);
      setBooks(response ?? []);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error fetching books:', error);
      setBooks([]);
      setShowSearchResults(false);
    } finally {
      setIsSearchLoading(false); // End loading
    }
  };
  
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      handleSearch(query);
    }, 500),
    []
  );

  useEffect(() => {
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery);
    } else {
      setBooks([]);
      setShowSearchResults(false);
      setIsSearchLoading(false);
    }

    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isInsideDesktopNotifications = notificationsRef.current && notificationsRef.current.contains(event.target as Node);
      const isInsideMobileNotifications = mobileNotificationsRef.current && mobileNotificationsRef.current.contains(event.target as Node);
      
      if (!isInsideDesktopNotifications && !isInsideMobileNotifications) {
        setIsNotificationsOpen(false);
      }
      
      const isInsideDesktopSearch = searchRef.current && searchRef.current.contains(event.target as Node);
      const isInsideMobileSearch = mobileSearchRef.current && mobileSearchRef.current.contains(event.target as Node);
      
      if (!isInsideDesktopSearch && !isInsideMobileSearch) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchItemClick = (id: string, author?: string) => {
      router.push(
    `/book/${encodeURIComponent(id)}?author=${encodeURIComponent(author ?? '')}`
  );
  };

  const BookListItem = ({ book }: { book: BookData }) => (
    <div 
      className="p-3 hover:bg-overlay cursor-pointer border-b border-line bg-surface last:border-b-0"
      onClick={() => handleSearchItemClick((book.openLibraryId ?? ''), book.author)}
    >
      <div className="flex gap-3">
        <div className="w-12 h-16 bg-surface-2 rounded overflow-hidden flex-shrink-0">
          <Image 
          width={48}
          height={64}
            src={book.image || '/api/placeholder/48/64'} 
            alt={book.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/api/placeholder/48/64'
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-ink-soft text-sm truncate">
            {book.title}
          </h3>
          <p className="text-ink-mute text-xs mb-1">
            by {book.author || 'Unknown Author'}
          </p>
        </div>
      </div>
    </div>
  );

  const SearchLoadingItem = () => (
    <div className="p-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 text-gold animate-spin" />
        <span className="text-ink-mute text-sm">Searching books...</span>
      </div>
    </div>
  );

  const SearchEmptyState = () => (
    <div className="p-4 text-center">
      <BookOpen className="w-8 h-8 text-ink-faint mx-auto mb-2" />
      <p className="text-ink-mute text-sm">No books found</p>
      <p className="text-ink-faint text-xs">Try a different search term</p>
    </div>
  );

  const NotificationItem = ({ notification }: { notification: UserActivity }) => (
    <div className="p-4 border-b border-line last:border-b-0 hover:bg-overlay transition-colors">
      <div className="flex items-start gap-3">
        <div className="mt-1">
          <div className={`w-2 h-2 rounded-full ${notification.read ? "bg-line-strong" : "bg-gold"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-ink-soft leading-relaxed">
            {notification.data?.message}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-ink-mute" />
            <span className="text-xs text-ink-faint">
              {formatTimeAgo(notification.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex-shrink-0">
              <Image 
                src="/logo.png" 
                alt="Bookmarkd Logo" 
                width={120} 
                height={40} 
                className="h-8 w-auto sm:h-10"
                priority
              />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <a href="/" className="text-ink-mute hover:text-ink font-medium transition-colors">Home</a>
            <a href="/browse" className="text-ink-mute hover:text-ink font-medium transition-colors">Browse</a>
            {isAuthenticated && (
              <a href="/collection" className="text-ink-mute hover:text-ink font-medium transition-colors">My Collection</a>
            )}
            <a href="/rankings" className="text-ink-mute hover:text-ink font-medium transition-colors">Rankings</a>
            <a href="/lists" className="text-ink-mute hover:text-ink font-medium transition-colors">Lists</a>
            <a href="/users" className="text-ink-mute hover:text-ink font-medium transition-colors">Community</a>
          </nav>

          {/* Desktop Search */}
          <div className="hidden md:flex items-center gap-4">
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <Search className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                  isSearchLoading ? 'text-gold' : 'text-ink-mute'
                }`} />
                {/* Show loading spinner when searching */}
                {isSearchLoading && (
                  <Loader2 className="w-4 h-4 text-gold absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin" />
                )}
                <input
                  type="text"
                  placeholder="Search books, authors..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className={`pl-10 py-2 bg-surface text-ink placeholder-ink-faint rounded-lg border border-line focus:outline-none focus:ring-1 focus:ring-gold/40 focus:border-gold/40 w-64 transition-all ${
                    isSearchLoading ? 'pr-10' : 'pr-4'
                  }`}
                />
              </div>
              
              {/* Desktop Search Results Dropdown */}
              {(showSearchResults || isSearchLoading) && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-line rounded-lg shadow-xl max-h-96 overflow-y-auto z-55">
                  {isSearchLoading ? (
                    <SearchLoadingItem />
                  ) : books.length > 0 ? (
                    <>
                      {books.slice(0, 5).map((book, index) => (
                        <BookListItem key={book.openLibraryId || index} book={book} />
                      ))}
                      {books.length > 0 && (
                        <div className="p-2 flex items-center justify-between text-xs border-t border-line">
                          <span className="text-ink-mute">
                            Showing {books.slice(0,5).length} of {books.length} results
                          </span>
                          <Link 
                            href={`/browse?search=${encodeURIComponent(searchQuery)}`}
                            className="text-gold hover:text-gold-soft font-medium transition-colors"
                            onClick={() => setShowSearchResults(false)}
                          >
                            View all
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <SearchEmptyState />
                  )}
                </div>
              )}
            </div>
            
            {/* Desktop Notifications */}
            {isAuthenticated && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={toggleNotifications}
                  className="p-2 text-ink-mute hover:text-ink relative transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 text-[10px] bg-gold text-canvas rounded-full flex items-center justify-center font-medium">
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 top-full mt-1 w-80 bg-surface border border-line rounded-lg shadow-xl z-55">
                    <div className="p-4 border-b border-line bg-canvas">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-ink">Notifications</h3>
                        {notificationCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-gold hover:text-gold-soft font-medium flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                      {isLoadingNotifications ? (
                        <div className="p-8 text-center">
                          <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full mx-auto"></div>
                          <p className="text-ink-mute text-sm mt-2">Loading notifications...</p>
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <NotificationItem key={notification.id} notification={notification} />
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell className="w-12 h-12 text-ink-faint mx-auto mb-3" />
                          <p className="text-ink-mute text-sm">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {isAuthenticated ? (
              <Link href="/profile" className="p-2 text-ink-mute hover:text-ink transition-colors">
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/auth"
                className="px-4 py-2 bg-ember hover:bg-ember-strong text-white text-sm font-semibold rounded-full transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleSearch}
              className="p-2 text-ink-mute hover:text-ink transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            {isAuthenticated && (
              <button
                onClick={toggleNotifications}
                className="p-2 text-ink-mute hover:text-ink relative transition-colors"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 text-[10px] bg-gold text-canvas rounded-full flex items-center justify-center font-medium">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>
            )}
            {isAuthenticated ? (
              <Link href="/profile" className="p-2 text-ink-mute hover:text-ink transition-colors">
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link
                href="/auth"
                className="px-3 py-1.5 bg-ember hover:bg-ember-strong text-white text-sm font-semibold rounded-full transition-colors"
              >
                Sign In
              </Link>
            )}
            <button
              onClick={toggleMenu}
              className="p-2 text-ink-mute hover:text-ink lg:hidden transition-colors"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {isSearchOpen && (
          <div className="md:hidden mt-3 pb-1" ref={mobileSearchRef}>
            <div className="relative">
              <div className="relative">
                <Search className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 transition-colors ${
                  isSearchLoading ? 'text-gold' : 'text-ink-mute'
                }`} />
                {/* Show loading spinner when searching */}
                {isSearchLoading && (
                  <Loader2 className="w-4 h-4 text-gold absolute right-3 top-1/2 transform -translate-y-1/2 animate-spin" />
                )}
                <input
                  type="text"
                  placeholder="Search books, authors..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  className={`w-full pl-10 py-2 bg-surface text-ink placeholder-ink-faint rounded-lg border border-line focus:outline-none focus:ring-1 focus:ring-gold/40 focus:border-gold/40 transition-all ${
                    isSearchLoading ? 'pr-10' : 'pr-4'
                  }`}
                  autoFocus
                />
              </div>
              
              {/* Mobile Search Results Dropdown */}
              {(showSearchResults || isSearchLoading) && searchQuery.trim() && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-line rounded-lg shadow-xl max-h-80 overflow-y-auto z-55">
                  {isSearchLoading ? (
                    <SearchLoadingItem />
                  ) : books.length > 0 ? (
                    <>
                      {books.slice(0, 4).map((book, index) => (
                        <BookListItem key={book.openLibraryId || index} book={book} />
                      ))}
                      {books.length > 0 && (
                        <div className="p-2 flex items-center justify-between text-xs border-t border-line">
                          <span className="text-ink-mute">
                            Showing {books.slice(0,5).length} of {books.length} results
                          </span>
                          <Link 
                            href={`/browse?search=${encodeURIComponent(searchQuery)}`}
                            className="text-gold hover:text-gold-soft font-medium transition-colors"
                            onClick={() => {
                              setShowSearchResults(false);
                              setIsSearchOpen(false);
                            }}
                          >
                            View all
                          </Link>
                        </div>
                      )}
                    </>
                  ) : (
                    <SearchEmptyState />
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Notifications Panel */}
        {isAuthenticated && isNotificationsOpen && (
          <div className="md:hidden mt-3 pb-1" ref={mobileNotificationsRef}>
            <div className="bg-surface border border-line rounded-lg shadow-xl">
              <div className="p-4 border-b border-line bg-canvas">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-ink">Notifications</h3>
                  {notificationCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-gold hover:text-gold-soft font-medium flex items-center gap-1 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {isLoadingNotifications ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-gold border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-ink-mute text-sm mt-2">Loading notifications...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <NotificationItem key={notification.id} notification={notification} />
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-ink-faint mx-auto mb-3" />
                    <p className="text-ink-mute text-sm">No new notifications</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-3 pb-3 border-t border-line pt-3">
            <nav className="flex flex-col gap-3">
              <a
                href="/"
                className="text-ink-mute hover:text-ink font-medium py-2 px-3 rounded-lg hover:bg-surface transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="/browse"
                className="text-ink-mute hover:text-ink font-medium py-2 px-3 rounded-lg hover:bg-surface transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse
              </a>
              {isAuthenticated && (
                <a
                  href="/collection"
                  className="text-ink-mute hover:text-ink font-medium py-2 px-3 rounded-lg hover:bg-surface transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Collection
                </a>
              )}
              {/* <a
                href="#"
                className="text-ink-mute hover:text-ink font-medium transition-colors py-2 px-3 rounded-lg hover:bg-surface"
                onClick={() => setIsMenuOpen(false)}
              >
                Clubs
              </a> */}
              <a
                href="/rankings"
                className="text-ink-mute hover:text-ink font-medium py-2 px-3 rounded-lg hover:bg-surface transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Rankings
              </a>
              <a
                href="/lists"
                className="text-ink-mute hover:text-ink font-medium py-2 px-3 rounded-lg hover:bg-surface transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Lists
              </a>
              <a
                href="/users"
                className="text-ink-mute hover:text-ink font-medium py-2 px-3 rounded-lg hover:bg-surface transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Community
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header