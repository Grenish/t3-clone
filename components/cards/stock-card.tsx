"use client";

import React, { useState } from "react";
import { TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react";
import { useTheme } from "@/util/theme-switcher";

interface StockData {
  name: string;
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  exchange: string;
  currency?: string;
  chartData?: number[];
  volume?: number;
  marketCap?: string;
  dayRange?: { low: number; high: number };
  peRatio?: number;
  dividendYield?: number;
  sector?: string;
  industry?: string;
  description?: string;
  previousClose?: number;
  weekHigh52?: number;
  weekLow52?: number;
  beta?: number;
  eps?: number;
  bookValue?: number;
  priceToBook?: number;
  lastUpdated?: string;
  error?: string;
}

interface StockCardProps {
  stock: StockData;
  onClick?: () => void;
  className?: string;
}

const MinimalSparkline: React.FC<{ data: number[]; isPositive: boolean }> = ({
  data,
  isPositive,
}) => {
  if (!data || data.length < 2) return null;

  const width = 120;
  const height = 40;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="opacity-80">
      <polyline
        points={points}
        fill="none"
        stroke={isPositive ? "#10b981" : "#ef4444"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

const MetricItem: React.FC<{ 
  label: string; 
  value: string | number | null | undefined; 
  format?: 'currency' | 'percentage' | 'number' | 'text';
  currency?: string;
}> = ({ label, value, format = 'text', currency = 'USD' }) => {
  if (value === null || value === undefined) return null;

  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return `${currency === 'USD' ? '$' : currency === 'INR' ? '₹' : currency}${val.toLocaleString()}`;
      case 'percentage':
        return `${val.toFixed(2)}%`;
      case 'number':
        return val.toFixed(2);
      default:
        return val.toString();
    }
  };

  return (
    <div className="flex justify-between items-center py-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatValue(value)}</span>
    </div>
  );
};

export default function StockCard({
  stock,
  onClick,
  className = "",
}: StockCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { isDarkMode } = useTheme();

  if (!stock) {
    return null;
  }

  // Handle error state
  if (stock.error || stock.price === undefined || stock.price === 0) {
    return (
      <div className={`
        rounded-lg border p-6 shadow-sm max-w-sm w-full
        ${isDarkMode 
          ? 'bg-gray-800 border-gray-700 shadow-gray-900/20' 
          : 'bg-white border-gray-200'
        }
        ${className}
      `}>
        <div className="text-center space-y-3">
          <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-red-900/20' : 'bg-red-50'
          }`}>
            <TrendingDown className={`w-6 h-6 ${
              isDarkMode ? 'text-red-400' : 'text-red-500'
            }`} />
          </div>
          <div>
            <h3 className={`font-semibold mb-1 ${
              isDarkMode ? 'text-gray-100' : 'text-gray-900'
            }`}>
              {stock.name || `${stock.ticker} Stock`}
            </h3>
            <p className={`text-sm mb-3 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {stock.ticker} • {stock.exchange}
            </p>
            <p className={`text-sm px-3 py-2 rounded-md ${
              isDarkMode 
                ? 'text-red-400 bg-red-900/20' 
                : 'text-red-600 bg-red-50'
            }`}>
              {stock.error || "Unable to fetch stock data"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isPositive = (stock.change ?? 0) >= 0;
  const changeColor = isPositive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";

  const formatLargeNumber = (num?: number | string | null) => {
    if (!num) return "N/A";
    const value = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(value)) return "N/A";
    if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
    if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toLocaleString();
  };

  const getPerformanceIndicator = () => {
    if (!stock.weekHigh52 || !stock.weekLow52 || stock.price === undefined) return null;
    const range = stock.weekHigh52 - stock.weekLow52;
    if (range === 0) return null;
    const position = ((stock.price - stock.weekLow52) / range) * 100;
    return Math.max(0, Math.min(100, position));
  };

  const performancePosition = getPerformanceIndicator();

  return (
    <div
      className={`
        rounded-lg border shadow-sm
        hover:shadow-md transition-all duration-200 cursor-pointer
        max-w-sm w-full
        ${isDarkMode 
          ? 'bg-gray-800 border-gray-700 shadow-gray-900/20 hover:shadow-gray-900/30 hover:border-gray-600' 
          : 'bg-white border-gray-200 hover:border-gray-300'
        }
        ${className}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg leading-tight truncate">
              {stock.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {stock.ticker}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{stock.exchange}</span>
              {stock.sector && (
                <>
                  <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{stock.sector}</span>
                </>
              )}
            </div>
          </div>
          {stock.chartData && (
            <div className="ml-4 flex-shrink-0">
              <MinimalSparkline data={stock.chartData} isPositive={isPositive} />
            </div>
          )}
        </div>

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-baseline gap-1 mb-2">
              {stock.currency && stock.currency !== "USD" && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stock.currency === 'INR' ? '₹' : stock.currency}
                </span>
              )}
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {(stock.price ?? 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            
            <div className={`inline-flex items-center gap-1 ${changeColor}`}>
              {isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {isPositive ? "+" : ""}
                {(stock.change ?? 0).toFixed(2)} ({isPositive ? "+" : ""}
                {(stock.changePercent ?? 0).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 52W Performance Range */}
      {performancePosition !== null && stock.weekLow52 && stock.weekHigh52 && (
        <div className="px-6 pb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            52W Range: {stock.weekLow52.toFixed(2)} - {stock.weekHigh52.toFixed(2)}
          </div>
          <div className="relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div 
              className={`absolute top-0 left-0 h-full rounded-full ${
                isPositive ? 'bg-green-500 dark:bg-green-400' : 'bg-red-500 dark:bg-red-400'
              }`}
              style={{ width: `${performancePosition}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {performancePosition.toFixed(0)}% of range
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="border-t border-gray-100 dark:border-gray-700">
        <div className="p-6 space-y-1">
          <MetricItem 
            label="Volume" 
            value={stock.volume ? formatLargeNumber(stock.volume) : null}
          />
          <MetricItem 
            label="Market Cap" 
            value={stock.marketCap ? formatLargeNumber(stock.marketCap) : null}
          />
          <MetricItem 
            label="P/E Ratio" 
            value={stock.peRatio}
            format="number"
          />
          <MetricItem 
            label="Dividend Yield" 
            value={stock.dividendYield}
            format="percentage"
          />

          {/* Expandable Details */}
          {(stock.eps !== undefined || stock.beta !== undefined || stock.bookValue !== undefined) && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails(!showDetails);
                }}
                className="flex items-center justify-between w-full py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                <span>More details</span>
                {showDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showDetails && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
                  <MetricItem 
                    label="EPS" 
                    value={stock.eps}
                    format="currency"
                    currency={stock.currency}
                  />
                  <MetricItem 
                    label="Beta" 
                    value={stock.beta}
                    format="number"
                  />
                  <MetricItem 
                    label="Book Value" 
                    value={stock.bookValue}
                    format="currency"
                    currency={stock.currency}
                  />
                  <MetricItem 
                    label="P/B Ratio" 
                    value={stock.priceToBook}
                    format="number"
                  />
                </div>
              )}
            </>
          )}

          {/* Day Range */}
          {stock.dayRange && stock.price !== undefined && (
            <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Today's Range</span>
                <span className="text-xs text-gray-600 dark:text-gray-300">
                  {stock.dayRange.low.toFixed(2)} - {stock.dayRange.high.toFixed(2)}
                </span>
              </div>
              <div className="relative h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                <div 
                  className="absolute top-1/2 w-2 h-2 bg-gray-800 dark:bg-gray-200 rounded-full border border-white dark:border-gray-800 shadow-sm transform -translate-y-1/2"
                  style={{ 
                    left: `${Math.max(0, Math.min(100, ((stock.price - stock.dayRange.low) / (stock.dayRange.high - stock.dayRange.low)) * 100))}%`,
                    transform: 'translateX(-50%) translateY(-50%)'
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 rounded-b-lg">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Updated: {stock.lastUpdated ? new Date(stock.lastUpdated).toLocaleTimeString() : 'N/A'}
        </div>
      </div>
    </div>
  );
}
