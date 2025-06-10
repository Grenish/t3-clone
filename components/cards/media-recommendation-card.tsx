import React from 'react';
import { Star, Play, Clock } from 'lucide-react';

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
  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'netflix': return 'bg-gradient-to-r from-red-600 to-red-700';
      case 'spotify': return 'bg-gradient-to-r from-green-600 to-green-700';
      case 'prime video': return 'bg-gradient-to-r from-blue-600 to-blue-700';
      case 'disney+': return 'bg-gradient-to-r from-indigo-600 to-indigo-700';
      case 'hulu': return 'bg-gradient-to-r from-emerald-600 to-emerald-700';
      default: return 'bg-gradient-to-r from-gray-600 to-gray-700';
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
            : 'text-gray-500'
        }`}
      />
    ));
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden hover:border-gray-700 transition-all duration-300">
        <div className="flex h-36">
          {/* Image with overlay gradient */}
          <div className="relative w-28 h-full flex-shrink-0">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-gray-900 via-transparent to-transparent opacity-60" />
          </div>

          {/* Content section with improved spacing */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-white text-base leading-tight line-clamp-2 tracking-tight">
                {title}
              </h3>
              <p className="text-gray-400 text-xs mt-1.5 tracking-wide font-medium uppercase">
                {genre}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="flex items-center gap-0.5">
                  {renderStars(rating)}
                </div>
                <span className="text-gray-300 text-xs font-medium">
                  {rating.toFixed(1)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className={`${getPlatformColor(platform)} text-white text-xs py-1 px-3 rounded-full font-medium`}>
                  {platform}
                </span>
                
                {duration && (
                  <div className="flex items-center gap-1.5 text-gray-300 bg-gray-800/80 py-1 px-2 rounded-full">
                    <Clock size={11} />
                    <span className="text-xs font-medium">{duration}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer with refined button */}
        <div className="px-4 py-3 border-t border-gray-800 bg-gray-900/80">
          <button
            onClick={onPlay}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors duration-200 shadow-sm"
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
