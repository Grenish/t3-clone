import ProductCard from "@/components/product-card";
import { WeatherCard } from "@/components/weather-card";

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

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center ">
      {/* <WeatherCard data={sampleWeatherData} /> */}
      <ProductCard {...sampleProductData} />
    </div>
  );
}

