"use client";

import React from "react";

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
  error?: string;
}

interface StockCardProps {
  stock: StockData;
  onClick?: () => void;
  className?: string;
}

const Sparkline: React.FC<{ data: number[]; isPositive: boolean }> = ({
  data,
  isPositive,
}) => {
  if (!data || data.length < 2) return null;

  const width = 100;
  const height = 32;
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
    <div className="relative">
      <svg width={width} height={height} className="opacity-90">
        <defs>
          <linearGradient
            id={`gradient-${isPositive ? "up" : "down"}`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop
              offset="0%"
              stopColor={isPositive ? "#10b981" : "#ef4444"}
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor={isPositive ? "#10b981" : "#ef4444"}
              stopOpacity="0.05"
            />
          </linearGradient>
        </defs>
        <polyline
          points={`0,${height} ${points} ${width},${height}`}
          fill={`url(#gradient-${isPositive ? "up" : "down"})`}
          stroke="none"
        />
        <polyline
          points={points}
          fill="none"
          stroke={isPositive ? "#10b981" : "#ef4444"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

const TrendIcon: React.FC<{ direction: "up" | "down" }> = ({ direction }) => (
  <div
    className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${
      direction === "up" ? "bg-green-100" : "bg-red-100"
    }`}
  >
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="currentColor"
      className="inline-block"
    >
      {direction === "up" ? (
        <path d="M5 1L8.5 6.5H1.5L5 1Z" />
      ) : (
        <path d="M5 9L1.5 3.5H8.5L5 9Z" />
      )}
    </svg>
  </div>
);

export default function StockCard({
  stock,
  onClick,
  className = "",
}: StockCardProps) {
  if (!stock) {
    return null;
  }

  // Handle error state
  if (stock.error || stock.price === undefined || stock.price === 0) {
    return (
      <div
        className={`
          group relative bg-white border border-red-200 rounded-xl p-6 shadow-sm
          max-w-sm min-w-[340px]
          ${className}
        `}
      >
        {/* Error State */}
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900 mb-1">
              {stock.name || `${stock.ticker} Stock`}
            </h3>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
              {stock.ticker}
            </p>
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
              {stock.error || "Unable to fetch stock data"}
            </p>
          </div>
          <div className="text-xs text-gray-500">
            Please try again later or verify the ticker symbol
          </div>
        </div>
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const changeColor = isPositive ? "text-green-600" : "text-red-600";
  const changeBgColor = isPositive
    ? "bg-green-50 border-green-200"
    : "bg-red-50 border-red-200";

  const formatVolume = (volume?: number) => {
    if (!volume) return "N/A";
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(1)}K`;
    return volume.toString();
  };

  return (
    <div
      className={`
        group relative bg-white border border-gray-200 rounded-xl p-6 shadow-sm
        hover:border-gray-300
        transition-all duration-300 ease-out cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        max-w-sm min-w-[340px]
        ${className}
      `}
      onClick={onClick}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      tabIndex={0}
      role="button"
      aria-label={`${stock.name} stock information`}
    >
      {/* Exchange Badge */}
      <div className="absolute top-4 right-4">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          {stock.exchange}
        </span>
      </div>

      {/* Header */}
      <div className="mb-6 pr-16">
        <h3 className="font-bold text-lg text-gray-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors">
          {stock.name}
        </h3>
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {stock.ticker}
          </p>
          {stock.sector && (
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              {stock.sector}
            </span>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-2 gap-6 items-start">
        {/* Price Information */}
        <div className="space-y-4">
          <div>
            <div className="flex items-baseline space-x-2">
              {stock.currency && stock.currency !== "USD" && (
                <span className="text-sm font-medium text-gray-400">
                  {stock.currency}
                </span>
              )}
              <span className="text-2xl font-bold text-gray-900">
                {(stock.price || 0).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>

          {/* Change Information */}
          <div
            className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg border ${changeBgColor}`}
          >
            <TrendIcon direction={isPositive ? "up" : "down"} />
            <div className={`${changeColor}`}>
              <span className="text-sm font-semibold">
                {isPositive ? "+" : ""}
                {(stock.change || 0).toFixed(2)}
              </span>
              <span className="text-xs font-medium ml-1">
                ({isPositive ? "+" : ""}
                {(stock.changePercent || 0).toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Day Range */}
          {stock.dayRange && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Day Range:</span>
              <div className="mt-1">
                {stock.dayRange.low.toFixed(2)} -{" "}
                {stock.dayRange.high.toFixed(2)}
              </div>
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="flex justify-end">
          {stock.chartData && (
            <div className="text-right">
              <div className="mb-2">
                <Sparkline data={stock.chartData} isPositive={isPositive} />
              </div>
              <p className="text-xs text-gray-400 font-medium">7D Trend</p>
            </div>
          )}
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            {stock.volume && (
              <div className="flex justify-between">
                <span className="text-gray-500">Volume:</span>
                <span className="font-medium text-gray-700">
                  {formatVolume(stock.volume)}
                </span>
              </div>
            )}
            {stock.peRatio && (
              <div className="flex justify-between">
                <span className="text-gray-500">P/E:</span>
                <span className="font-medium text-gray-700">
                  {stock.peRatio.toFixed(2)}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            {stock.marketCap && (
              <div className="flex justify-between">
                <span className="text-gray-500">Market Cap:</span>
                <span className="font-medium text-gray-700">
                  {stock.marketCap}
                </span>
              </div>
            )}
            {stock.dividendYield && (
              <div className="flex justify-between">
                <span className="text-gray-500">Div Yield:</span>
                <span className="font-medium text-gray-700">
                  {stock.dividendYield.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Bottom Border */}
      <div
        className={`absolute bottom-0 left-6 right-6 h-0.5 ${
          isPositive ? "bg-green-200" : "bg-red-200"
        } opacity-50`}
      />

      {/* Accessibility Enhancement */}
      <div className="sr-only">
        {stock.name} ({stock.ticker}) trading on {stock.exchange}. Current
        price: {stock.price || 0} {stock.currency || "USD"}.
        {isPositive ? "Increased" : "Decreased"} by {Math.abs(stock.change || 0)}
        or {Math.abs(stock.changePercent || 0)} percent.
        {stock.volume && ` Volume: ${formatVolume(stock.volume)}.`}
        {stock.marketCap && ` Market cap: ${stock.marketCap}.`}
      </div>
    </div>
  );
}
