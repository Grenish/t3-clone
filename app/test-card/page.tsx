import ImageLoadingCard from "@/components/cards/image-loading-card";
import MediaRecommendationCard from "@/components/cards/media-recommendation-card";
import ProductCard from "@/components/cards/product-card";
import StockCard from "@/components/cards/stock-card";
import { WeatherCard } from "@/components/cards/weather-card";

export default function TestCard() {
  const sampleWeatherData = {
    location: "New York",
    temperature: 22,
    condition: "Cloud",
    humidity: 65,
    windSpeed: 12,
    description: "A beautiful sunny day with clear skies",
  };

  const sampleProductData = {
    id: "1",
    title: "Apple iPhone 15 Pro Max 256GB - Natural Titanium",
    price: 1199.99,
    originalPrice: 1299.99,
    currency: "$",
    rating: 4.7,
    reviewCount: 2847,
    imageUrl:
      "https://images.unsplash.com/photo-1611791484670-ce19b801d192?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTZ8fGlwaG9uZXxlbnwwfHwwfHx8MA%3D%3D",
    imageAlt: "iPhone 15 Pro Max",
    platform: "amazon" as const,
    discount: 8,
  };

  const sampleStockData = {
    name: "Apple Inc.",
    ticker: "AAPL",
    price: 175.64,
    change: -1.23,
    changePercent: -0.7,
    exchange: "NASDAQ",
    currency: "USD",
    chartData: [180, 178, 176, 175.64, 174, 175.2, 175.64],
    volume: 45234567,
    marketCap: "2.7T",
    dayRange: { low: 174.32, high: 177.89 },
    peRatio: 28.45,
    dividendYield: 0.52,
    sector: "Technology",
  };

  const sampleMediaRecommendation = {
    title: "Stranger Things",
    genre: "Sci-Fi, Horror",
    platform: "Netflix",
    rating: 4.8,
    duration: "3 Seasons",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/7/78/Stranger_Things_season_4.jpg",
    type: "tv" as const,
  };

  const sampleTravelSuggestion = {
    destination: "Bali, Indonesia",
    description: "Experience the serene beaches and vibrant culture of Bali.",
    imageUrl:
      "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-1.2.1&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=60",
    weather: "Tropical",
    bestTime: "April to October",
    avgCost: "$1200 per week",
    flightDuration: "18 hours",
  };

  return (
    <div className="w-full h-screen p-8">
      <div className="h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="border border-gray-300 rounded-lg p-6 flex items-center justify-center">
          <WeatherCard data={sampleWeatherData} />
        </div>
        <div className="border border-gray-300 rounded-lg p-6 flex items-center justify-center">
          <ProductCard {...sampleProductData} />
        </div>
        <div className="border border-gray-300 rounded-lg p-6 flex items-center justify-center">
          <StockCard stock={sampleStockData} />
        </div>
        <div className="border border-gray-300 rounded-lg p-6 flex items-center justify-center">
          <ImageLoadingCard />
        </div>
        <div className="border border-gray-300 rounded-lg p-6 flex items-center justify-center">
          <MediaRecommendationCard {...sampleMediaRecommendation} />
        </div>
      </div>
    </div>
  );
}
