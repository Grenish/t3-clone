"use client";

import React from "react";
import Image from "next/image";
import { Star, StarHalf } from "lucide-react";
import { useTheme } from "@/util/theme-provider";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  rating: number;
  reviewCount?: number;
  imageUrl: string;
  imageAlt?: string;
  platform: "amazon" | "flipkart" | "ebay" | "other";
  discount?: number;
  onClick?: (id: string) => void;
  className?: string;
}

const platformConfig = {
  amazon: {
    color: "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800",
    textColor: "text-orange-700 dark:text-orange-400",
    dotColor: "bg-orange-400 dark:bg-orange-500",
    label: "Amazon",
  },
  flipkart: {
    color: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    textColor: "text-blue-700 dark:text-blue-400",
    dotColor: "bg-blue-400 dark:bg-blue-500",
    label: "Flipkart",
  },
  ebay: {
    color: "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800",
    textColor: "text-yellow-700 dark:text-yellow-400",
    dotColor: "bg-yellow-400 dark:bg-yellow-500",
    label: "eBay",
  },
  other: {
    color: "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700",
    textColor: "text-gray-700 dark:text-gray-300",
    dotColor: "bg-gray-400 dark:bg-gray-500",
    label: "Store",
  },
};

const StarRating: React.FC<{ rating: number; size?: number }> = ({
  rating,
  size = 12,
}) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(
        <Star key={i} size={size} className="fill-amber-400 text-amber-400" />
      );
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <StarHalf
          key={i}
          size={size}
          className="fill-amber-400 text-amber-400"
        />
      );
    } else {
      stars.push(<Star key={i} size={size} className="text-gray-200 dark:text-gray-600" />);
    }
  }

  return <div className="flex items-center gap-0.5">{stars}</div>;
};

export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  title,
  price,
  originalPrice,
  currency = "$",
  rating,
  reviewCount,
  imageUrl,
  imageAlt,
  platform,
  discount,
  onClick,
  className = "",
}) => {
  const platformStyle = platformConfig[platform];
  const { isDarkMode } = useTheme();

  const handleClick = () => {
    onClick?.(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.(id);
    }
  };

  return (
    <div
      className={`
        group relative rounded-lg border-0
        transition-all duration-300 ease-out cursor-pointer overflow-hidden
        focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:ring-offset-1
        w-full max-w-[280px] sm:max-w-[240px] md:max-w-[220px] lg:max-w-[280px]
        ${isDarkMode 
          ? 'bg-gray-800 shadow-[0_1px_10px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]' 
          : 'bg-white shadow-[0_1px_10px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]'
        }
        ${className}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View product: ${title}`}
    >
      {/* Discount Badge */}
      {discount && (
        <div className="absolute top-1.5 right-1.5 z-10">
          <div className="bg-red-500/90 dark:bg-red-600/90 backdrop-blur-sm text-white text-[10px] font-medium px-1.5 py-0.5 rounded-full shadow-sm">
            -{discount}%
          </div>
        </div>
      )}

      {/* Product Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50/50 dark:bg-gray-700/50 rounded-t-lg">
        <Image
          src={imageUrl}
          alt={imageAlt || title}
          fill
          className="object-cover group-hover:scale-103 transition-transform duration-400 ease-out"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Product Details */}
      <div className="p-2.5 space-y-1.5">
        {/* Platform Badge */}
        <div className="flex items-center justify-between">
          <div
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border ${platformStyle.color}`}
          >
            <div
              className={`w-0.5 h-0.5 rounded-full ${platformStyle.dotColor}`}
            />
            <span
              className={`text-[10px] font-medium ${platformStyle.textColor}`}
            >
              {platformStyle.label}
            </span>
          </div>
        </div>

        {/* Product Title */}
        <h3
          className={`font-medium line-clamp-2 text-xs leading-4 transition-colors ${
            isDarkMode 
              ? 'text-gray-200 group-hover:text-gray-100' 
              : 'text-gray-800 group-hover:text-gray-900'
          }`}
          title={title}
        >
          {title}
        </h3>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-1.5">
          <StarRating rating={rating} size={8} />
          <div className="flex items-center gap-0.5">
            <span className={`text-[10px] font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {rating.toFixed(1)}
            </span>
            {reviewCount && (
              <span className={`text-[9px] ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                (
                {reviewCount > 999
                  ? `${Math.floor(reviewCount / 1000)}k`
                  : reviewCount}
                )
              </span>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div className="flex items-baseline gap-1.5">
          <span className={`text-sm font-bold ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            {currency}
            {price.toFixed(2)}
          </span>
          {originalPrice && originalPrice > price && (
            <span className={`text-[10px] line-through ${
              isDarkMode ? 'text-gray-500' : 'text-gray-400'
            }`}>
              {currency}
              {originalPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {/* Subtle bottom accent */}
      <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        isDarkMode ? 'via-gray-700' : 'via-gray-100'
      }`} />
    </div>
  );
};

export default ProductCard;
