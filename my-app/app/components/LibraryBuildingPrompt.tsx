"use client"
import React from 'react';
import { BookOpen, Search, TrendingUp, Sparkles, Plus, ArrowRight, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LibraryBuildingPromptProps {
  bookCount: number;
}

const LibraryBuildingPrompt: React.FC<LibraryBuildingPromptProps> = ({ bookCount }) => {
  const router = useRouter();

  const suggestions = [
    {
      title: "Browse Popular Books",
      description: "Discover trending and highly-rated books",
      icon: TrendingUp,
      action: () => router.push('/browse'),
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "View Book Rankings",
      description: "Look at what others are rating highly",
      icon: Star,
      action: () => router.push('/rankings'),
      color: "from-green-500 to-green-600"
    },
    {
      title: "See Your Collection",
      description: "View and edit your collection",
      icon: BookOpen,
      action: () => router.push('/collection'),
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-amber-400" />
          <h2 className="text-3xl font-bold text-white">Keep Building Your Library!</h2>
          <Sparkles className="w-6 h-6 text-amber-400" />
        </div>
        <p className="text-xl text-stone-300 mb-2">
          Great start! You have {bookCount} book{bookCount !== 1 ? 's' : ''} in your collection.
        </p>
        <p className="text-stone-400">
          Add more books to unlock achievements and get better recommendations.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="mb-12">
        <div className="bg-stone-800/50 rounded-2xl p-6 border border-stone-700/50">
          <div className="flex items-center justify-between mb-4">
            <span className="text-white font-medium">Library Progress</span>
            <span className="text-amber-400 font-bold">{bookCount}/6 books</span>
          </div>
          <div className="w-full bg-stone-700 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-amber-500 to-orange-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((bookCount / 6) * 100, 100)}%` }}
            ></div>
          </div>
          <p className="text-stone-400 text-sm">
            {6 - bookCount} more books until you unlock personal recommendations!
          </p>
        </div>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {suggestions.map((suggestion, index) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={index}
              onClick={suggestion.action}
              className="group bg-stone-800 backdrop-blur-sm rounded-2xl p-6 border border-stone-700/40 hover:border-amber-500/40 transition-all duration-300 hover:bg-stone-800/60 text-left"
            >
              <div className={`w-12 h-12 bg-gradient-to-r ${suggestion.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2 group-hover:text-amber-300 transition-colors">
                {suggestion.title}
              </h3>
              <p className="text-stone-400 text-sm mb-3">
                {suggestion.description}
              </p>
              <div className="flex items-center text-amber-400 text-sm font-medium">
                <span>Explore</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LibraryBuildingPrompt;