import React, { useState, useEffect } from 'react';
import { Trophy, X, Star, BookOpen, Clock, Calendar, Target, Award, Flame, Users, Shapes, MessageSquare, Feather, Zap } from 'lucide-react';

// Achievement notification component
const AchievementNotification = ({ achievements, onClose }: any) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);


  // Achievement icon mapping
  const getAchievementIcon = (type: any) => {
  const iconMap: any = {
    milestone: BookOpen,
    genre: Shapes,
    review: MessageSquare,
    author: Feather,
    quirky: Zap,
    default: Trophy,
  };
  return iconMap[type] || iconMap.default;
};

  // Achievement color schemes
  const getAchievementColors = (tier: number) => {
    const colorMap: any = {
      1: 'from-gray-400 to-gray-600',
      2: 'from-green-400 to-green-600',
      3: 'from-blue-400 to-blue-600',
      4: 'from-purple-400 to-purple-600',
      5: 'from-yellow-400 to-yellow-600'
    };
    return colorMap[tier] || colorMap[1]
  };

  const handleNext = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!achievements || achievements.length === 0 || !isVisible) return null;

  const currentAchievement = achievements[currentIndex];
  const Icon = getAchievementIcon(currentAchievement.category);
  const colors = getAchievementColors(currentAchievement.tier);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-100 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 transform transition-all duration-300 ${
        isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        
        {/* Header with gradient background */}
        <div className={`bg-gradient-to-r ${colors} p-6 rounded-t-2xl text-white relative overflow-hidden`}>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-20">
            <div className="w-full h-full rounded-full border-4 border-white transform translate-x-8 -translate-y-8"></div>
          </div>
          <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
            <div className="w-full h-full rounded-full border-4 border-white transform -translate-x-4 translate-y-4"></div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors duration-200 z-10"
          >
            <X size={20} />
          </button>
          
          {/* Achievement content */}
          <div className="relative z-10 text-center">
            <div className="mb-4">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full backdrop-blur-sm border-2 border-white/30">
                <Icon size={32} className="text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">Achievement Unlocked!</h2>
            <h3 className="text-xl font-semibold opacity-90">{currentAchievement.name}</h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-gray-600 text-sm mb-4 leading-relaxed">
              {currentAchievement.description}
            </p>
            
            {/* Rarity badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
              <Award size={16} className="text-gray-500" />
              <span className="text-sm font-medium text-gray-700 capitalize">
                {currentAchievement.rarity}
              </span>
            </div>
          </div>

          {/* Progress indicator if multiple achievements */}
          {achievements.length > 1 && (
            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                {achievements.map((_: any, index: any) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                      index === currentIndex ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center">
                {currentIndex + 1} of {achievements.length} achievements
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {achievements.length > 1 && currentIndex < achievements.length - 1 ? (
              <>
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Skip All
                </button>
                <button
                  onClick={handleNext}
                  className={`flex-1 px-4 py-2 bg-gradient-to-r ${colors} text-white rounded-lg hover:opacity-90 transition-opacity duration-200 font-medium`}
                >
                  Next
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className={`w-full px-4 py-2 bg-gradient-to-r ${colors} text-white rounded-lg hover:opacity-90 transition-opacity duration-200 font-medium`}
              >
                Awesome!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementNotification;