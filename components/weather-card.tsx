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
      return <Sun className="h-10 w-10 text-amber-400" fill="currentColor" />;
    }
    if (lowerCondition.includes("rain") || lowerCondition.includes("shower")) {
      return <CloudRain className="h-10 w-10 text-blue-400" />;
    }
    if (lowerCondition.includes("snow")) {
      return <Snow className="h-10 w-10 text-slate-300" />;
    }
    if (lowerCondition.includes("cloud")) {
      return <Cloud className="h-10 w-10 text-slate-400" fill="currentColor" />;
    }
    return <Sun className="h-10 w-10 text-amber-400" fill="currentColor" />;
  };

  const getCardTheme = (condition: string) => {
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes("sun") || lowerCondition.includes("clear")) {
      return {
        bg: "bg-white dark:bg-slate-900",
        border: "border-amber-100 dark:border-amber-900/30",
        accent: "bg-amber-50 dark:bg-amber-950/20",
      };
    }
    if (lowerCondition.includes("rain") || lowerCondition.includes("shower")) {
      return {
        bg: "bg-white dark:bg-slate-900",
        border: "border-blue-100 dark:border-blue-900/30",
        accent: "bg-blue-50 dark:bg-blue-950/20",
      };
    }
    if (lowerCondition.includes("snow")) {
      return {
        bg: "bg-white dark:bg-slate-900",
        border: "border-slate-100 dark:border-slate-800/50",
        accent: "bg-slate-50 dark:bg-slate-800/30",
      };
    }
    if (lowerCondition.includes("cloud")) {
      return {
        bg: "bg-white dark:bg-slate-900",
        border: "border-slate-200 dark:border-slate-700/50",
        accent: "bg-slate-50 dark:bg-slate-800/30",
      };
    }
    return {
      bg: "bg-white dark:bg-slate-900",
      border: "border-amber-100 dark:border-amber-900/30",
      accent: "bg-amber-50 dark:bg-amber-950/20",
    };
  };

  const theme = getCardTheme(data.condition);

  return (
    <div
      className={`w-full max-w-sm ${theme.bg} ${theme.border} border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200`}
    >
      {/* Header Section */}
      <div className={`${theme.accent} px-6 py-5 rounded-t-2xl`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
              {data.location}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 capitalize mt-0.5">
              {data.condition}
            </p>
          </div>
          {getWeatherIcon(data.condition)}
        </div>
      </div>

      {/* Content Section */}
      <div className="px-6 py-6">
        {/* Temperature */}
        <div className="mb-6">
          <span className="text-4xl font-light text-slate-900 dark:text-slate-100">
            {data.temperature}°
          </span>
        </div>

        {/* Weather Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Droplets className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Humidity
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {data.humidity}%
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Wind className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Wind
              </span>
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {data.windSpeed} km/h
            </p>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {data.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
