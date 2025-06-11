import { ExternalLink, Search, Clock } from "lucide-react";
import { useTheme } from "@/util/theme-switcher";

interface Citation {
  title: string;
  url: string;
  source: string;
  snippet: string;
  image?: string;
}

interface CitationCardProps {
  query: string;
  citations: Citation[];
  totalResults?: number;
  searchTime?: number;
  searchType?: "general" | "products" | "recommendations";
}

export default function CitationCard({
  query,
  citations,
  totalResults,
  searchTime,
  searchType = "general",
}: CitationCardProps) {
  const { isDarkMode } = useTheme();

  const getSearchTypeLabel = () => {
    switch (searchType) {
      case "products":
        return "Product Search";
      case "recommendations":
        return "Recommendation Search";
      default:
        return "Web Search";
    }
  };

  const getSearchTypeColor = () => {
    switch (searchType) {
      case "products":
        return "bg-green-50 text-green-700 border-green-200";
      case "recommendations":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  return (
    <div
      className={`rounded-xl border shadow-sm overflow-hidden ${
        isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
      }`}
    >
      {/* Header */}
      <div
        className={`px-4 py-3 border-b ${
          isDarkMode ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search
              className={`w-4 h-4 ${
                isDarkMode ? "text-gray-400" : "text-gray-600"
              }`}
            />
            <span
              className={`text-sm font-medium ${
                isDarkMode ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Search Results
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getSearchTypeColor()}`}
            >
              {getSearchTypeLabel()}
            </span>
          </div>
          {searchTime && (
            <div
              className={`flex items-center gap-1 text-xs ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              <Clock className="w-3 h-3" />
              {searchTime.toFixed(2)}s
            </div>
          )}
        </div>
        <p
          className={`text-sm mt-1 ${
            isDarkMode ? "text-gray-300" : "text-gray-600"
          }`}
        >
          Query: <span className="font-medium">"{query}"</span>
          {totalResults && (
            <span
              className={`ml-2 ${
                isDarkMode ? "text-gray-400" : "text-gray-500"
              }`}
            >
              ({totalResults.toLocaleString()} results)
            </span>
          )}
        </p>
      </div>

      {/* Citations */}
      <div className="p-4">
        <div className="space-y-3">
          {citations.map((citation, index) => (
            <div
              key={index}
              className={`flex gap-3 p-3 rounded-lg border transition-colors ${
                isDarkMode
                  ? "border-gray-700 hover:border-gray-600"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              {citation.image && (
                <div className="flex-shrink-0">
                  <img
                    src={citation.image || "/placeholder.svg"}
                    alt=""
                    className={`w-12 h-12 rounded-lg object-cover ${
                      isDarkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm font-medium line-clamp-2 leading-tight ${
                        isDarkMode ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      {citation.title}
                    </h3>
                    <p
                      className={`text-xs mt-1 ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {citation.source}
                    </p>
                  </div>
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex-shrink-0 p-1 transition-colors ${
                      isDarkMode
                        ? "text-gray-500 hover:text-gray-300"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                    title="Open link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p
                  className={`text-sm mt-2 line-clamp-2 leading-relaxed ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {citation.snippet}
                </p>
              </div>
            </div>
          ))}
        </div>

        {citations.length === 0 && (
          <div
            className={`text-center py-8 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No search results found</p>
          </div>
        )}
      </div>
    </div>
  );
}
