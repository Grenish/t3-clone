import { ExternalLink, Search, Clock } from "lucide-react";

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
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-900">
              Search Results
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded-full border ${getSearchTypeColor()}`}
            >
              {getSearchTypeLabel()}
            </span>
          </div>
          {searchTime && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              {searchTime.toFixed(2)}s
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Query: <span className="font-medium">"{query}"</span>
          {totalResults && (
            <span className="ml-2 text-gray-500">
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
              className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
            >
              {citation.image && (
                <div className="flex-shrink-0">
                  <img
                    src={citation.image || "/placeholder.svg"}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight">
                      {citation.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {citation.source}
                    </p>
                  </div>
                  <a
                    href={citation.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Open link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                  {citation.snippet}
                </p>
              </div>
            </div>
          ))}
        </div>

        {citations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No search results found</p>
          </div>
        )}
      </div>
    </div>
  );
}
