import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnowIcon as Snow,
  Wind,
  Thermometer,
  Droplets,
} from "lucide-react";

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  description: string;
}

interface WeatherCardProps {
  data: WeatherData;
}

export function WeatherCard({ data }: WeatherCardProps) {
  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("sun") || lowerCondition.includes("clear")) {
      return <Sun className="h-8 w-8 text-yellow-500" />;
    }
    if (lowerCondition.includes("rain") || lowerCondition.includes("shower")) {
      return <CloudRain className="h-8 w-8 text-blue-500" />;
    }
    if (lowerCondition.includes("snow")) {
      return <Snow className="h-8 w-8 text-blue-200" />;
    }
    if (lowerCondition.includes("cloud")) {
      return <Cloud className="h-8 w-8 text-gray-500" />;
    }
    return <Sun className="h-8 w-8 text-yellow-500" />;
  };

  return (
    <div className="w-full max-w-sm bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg shadow-md">
      <div className="p-6 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-blue-900 dark:text-blue-100">
            {data.location}
          </span>
          {getWeatherIcon(data.condition)}
        </div>
      </div>
      <div className="px-6 pb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Thermometer className="h-5 w-5 text-red-500" />
            <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {data.temperature}°C
            </span>
          </div>
          <span className="text-sm font-medium text-blue-700 dark:text-blue-300 capitalize">
            {data.condition}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Droplets className="h-4 w-4 text-blue-600" />
            <span className="text-blue-800 dark:text-blue-200">
              {data.humidity}% Humidity
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Wind className="h-4 w-4 text-blue-600" />
            <span className="text-blue-800 dark:text-blue-200">
              {data.windSpeed} km/h
            </span>
          </div>
        </div>

        {data.description && (
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
            {data.description}
          </p>
        )}
      </div>
    </div>
  );
}
