"use client"
import React from 'react';
import { ExternalLink, ShoppingCart } from 'lucide-react';

interface BuyNowButtonProps {
  isbn?: string;
  title: string;
}

const BuyNowButton: React.FC<BuyNowButtonProps> = ({ isbn, title }) => {
  const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'bookmarkd-20';
  const BOOKSHOP_TAG = process.env.NEXT_PUBLIC_BOOKSHOP_AFFILIATE_TAG || 'bookmarkd';

  const handleBuyClick = (link: string, platform: string) => {
    console.log(`Buy click: ${platform} for "${title}"`);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  if (!isbn) {
    return null;
  }

  return (
    <div className="p-4 sm:p-6 bg-[#2C3440] rounded-xl border border-amber-900/20">
      <h3 className="text-xs sm:text-sm font-semibold text-amber-400 mb-3 sm:mb-4 uppercase tracking-wider flex items-center gap-2">
        <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        Where to Buy
      </h3>
      <div className="space-y-2 sm:space-y-3">
        {/* Amazon - Orange/Black Brand Colors */}
        <a
          href={`https://www.amazon.com/dp/${isbn}?tag=${AMAZON_TAG}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            handleBuyClick(`https://www.amazon.com/dp/${isbn}?tag=${AMAZON_TAG}`, 'Amazon');
          }}
          className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 bg-gradient-to-r from-[#FF9900] to-[#FF9900] hover:from-[#FFB84D] hover:to-[#FFB84D] rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] group"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Amazon Logo Icon */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-black/10 rounded-md flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="black">
                <path d="M3 18c0-0.6 0.4-1 1-1h16c0.6 0 1 0.4 1 1s-0.4 1-1 1H4c-0.6 0-1-0.4-1-1z"/>
                <path d="M6 14c0-0.3 0.2-0.6 0.5-0.7l5-2c0.3-0.1 0.7-0.1 1 0l5 2c0.3 0.2 0.5 0.4 0.5 0.7 0 0 0 0.1 0 0.1-0.1 2.3-2.1 4.2-4.4 4.5-0.5 0.1-1.1 0.1-1.6 0-2.3-0.3-4.3-2.2-4.4-4.5 0 0 0-0.1 0-0.1z"/>
                <path d="M12 3c0.6 0 1 0.4 1 1v6c0 0.6-0.4 1-1 1s-1-0.4-1-1V4c0-0.6 0.4-1 1-1z"/>
                <circle cx="12" cy="6" r="1.5"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-black font-bold text-sm sm:text-base leading-tight">Amazon</span>
              <span className="text-black/70 text-xs">Fast shipping</span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black/80 group-hover:text-black transition-colors flex-shrink-0" />
        </a>

        {/* Bookshop.org - Blue Brand Colors */}
        <a
          href={`https://bookshop.org/a/${BOOKSHOP_TAG}/${isbn}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            handleBuyClick(`https://bookshop.org/a/${BOOKSHOP_TAG}/${isbn}`, 'Bookshop.org');
          }}
          className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-3.5 bg-gradient-to-r from-[#3077C6] to-[#2563B8] hover:from-[#4A8DD9] hover:to-[#3077C6] rounded-lg transition-all duration-200 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] group"
        >
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Bookshop Logo Icon */}
            <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-white/20 rounded-md flex-shrink-0">
              <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="white" stroke="white" strokeWidth="0.5">
                <path d="M4 2h16a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" strokeWidth="0"/>
                <path d="M6 5h12M6 9h12M6 13h8" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                <circle cx="17" cy="18" r="2" fill="white" stroke="none"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm sm:text-base leading-tight">Bookshop.org</span>
              <span className="text-white/80 text-xs">Support local bookstores</span>
            </div>
          </div>
          <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white/80 group-hover:text-white transition-colors flex-shrink-0" />
        </a>
      </div>
      <p className="text-xs text-stone-500 mt-4 text-center">Affiliate links support our platform</p>
    </div>
  );
};

export default BuyNowButton;
