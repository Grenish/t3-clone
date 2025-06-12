import React from 'react';
import { Star, Play, Clock } from 'lucide-react';
import { useTheme } from '@/util/theme-provider';

interface MediaRecommendationCardProps {
  title: string;
  genre: string;
  platform: string;
  rating: number;
  duration?: string;
  imageUrl: string;
  type: 'movie' | 'tv' | 'music';
  onPlay?: () => void;
}

const MediaRecommendationCard: React.FC<MediaRecommendationCardProps> = ({
  title,
  genre,
  platform,
  rating,
  duration,
  imageUrl,
  type,
  onPlay
}) => {
  const { isDarkMode } = useTheme();

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'netflix': return 'bg-gradient-to-r from-red-600 to-red-700 dark:from-red-500 dark:to-red-600';
      case 'spotify': return 'bg-gradient-to-r from-green-600 to-green-700 dark:from-green-500 dark:to-green-600';
      case 'prime video': return 'bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600';
      case 'disney+': return 'bg-gradient-to-r from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600';
      case 'hulu': return 'bg-gradient-to-r from-emerald-600 to-emerald-700 dark:from-emerald-500 dark:to-emerald-600';
      default: return 'bg-gradient-to-r from-gray-600 to-gray-700 dark:from-gray-500 dark:to-gray-600';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={14}
        strokeWidth={1.5}
        className={`${
          index < Math.floor(rating) 
            ? 'text-amber-400 fill-amber-400' 
            : index < rating 
            ? 'text-amber-400 fill-amber-400/50' 
            : 'text-gray-500 dark:text-gray-400'
        }`}
      />
    ));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className={`border rounded-xl shadow-xl overflow-hidden transition-all duration-300 ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700 shadow-gray-900/20 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}>
        <div className="flex h-36">
          {/* Image with overlay gradient */}
          <div className="relative w-28 h-full flex-shrink-0">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className={`absolute inset-0 bg-gradient-to-l via-transparent to-transparent opacity-60 ${
              isDarkMode ? 'from-gray-800' : 'from-white'
            }`} />
          </div>

          {/* Content section with improved spacing */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <h3 className={`font-semibold text-base leading-tight line-clamp-2 tracking-tight ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {title}
              </h3>
              <p className={`text-xs mt-1.5 tracking-wide font-medium uppercase ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {genre}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="flex items-center gap-0.5">
                  {renderStars(rating)}
                </div>
                <span className={`text-xs font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {rating.toFixed(1)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`${getPlatformColor(platform)} text-white text-xs py-1 px-3 rounded-full font-medium`}>
                  {platform}
                </span>
                
                {duration && (
                  <div className={`flex items-center gap-1.5 py-1 px-2 rounded-full ${
                    isDarkMode 
                      ? 'text-gray-300 bg-gray-700/80' 
                      : 'text-gray-600 bg-gray-100'
                  }`}>
                    <Clock size={11} />
                    <span className="text-xs font-medium">{duration}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with refined button */}
        <div className={`px-4 py-3 border-t ${
          isDarkMode 
            ? 'border-gray-700 bg-gray-800/80' 
            : 'border-gray-200 bg-gray-50'
        }`}>
          <button
            onClick={onPlay}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-500 dark:to-indigo-500 dark:hover:from-blue-600 dark:hover:to-indigo-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm"
          >
            <Play size={16} className="fill-current" />
            {type === 'music' ? 'Listen Now' : type === 'tv' ? 'Watch Series' : 'Watch Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaRecommendationCard;
