import { Search, Clock, ExternalLink } from "lucide-react";
import { useTheme } from "@/util/theme-provider";

interface WebSearchSource {
  id: number;
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

interface WebSearchCardProps {
  data: {
    query: string;
    summary: string;
    sources: WebSearchSource[];
    totalResults: number;
    searchTime: number;
    error?: string | null;
  };
}

export default function WebSearchCard({ data }: WebSearchCardProps) {
  const { isDarkMode } = useTheme();

  if (data.error) {
    return (
      <div className={`border rounded-lg p-4 max-w-2xl ${
        isDarkMode 
          ? 'bg-red-900/20 border-red-800' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className={`flex items-center gap-2 mb-2 ${
          isDarkMode ? 'text-red-400' : 'text-red-700'
        }`}>
          <Search className="w-5 h-5" />
          <span className="font-medium">Search Error</span>
        </div>
        <p className={`text-sm ${
          isDarkMode ? 'text-red-300' : 'text-red-600'
        }`}>{data.error}</p>
      </div>
    );
  }

  if (!data.sources || data.sources.length === 0) {
    return (
      <div className={`border rounded-lg p-4 max-w-2xl ${
        isDarkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-gray-50 border-gray-200'
      }`}>
        <div className={`flex items-center gap-2 mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <Search className="w-5 h-5" />
          <span className="font-medium">No Results Found</span>
        </div>
        <p className={`text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>No results found for "{data.query}"</p>
      </div>
    );
  }

  // Function to render summary with clickable citations
  const renderSummaryWithCitations = (summary: string) => {
    const parts = summary.split(/(\[\d+\])/g);
    
    return parts.map((part, index) => {
      const citationMatch = part.match(/\[(\d+)\]/);
      if (citationMatch) {
        const citationNum = parseInt(citationMatch[1]);
        const source = data.sources.find(s => s.id === citationNum);
        
        if (source) {
          return (
            <a
              key={index}
              href={source.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center px-1 py-0.5 mx-0.5 rounded text-xs font-medium transition-colors ${
                isDarkMode
                  ? 'bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
              title={source.title}
            >
              [{citationNum}]
            </a>
          );
        }
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`border rounded-lg p-4 max-w-2xl shadow-sm ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className={`w-5 h-5 ${
            isDarkMode ? 'text-blue-400' : 'text-blue-600'
          }`} />
          <span className={`font-medium ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>Web Search</span>
        </div>
        <div className={`flex items-center gap-3 text-xs ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{data.searchTime.toFixed(2)}s</span>
          </div>
          <span>{data.totalResults.toLocaleString()} results</span>
        </div>
      </div>

      <div className="mb-4">
        <p className={`text-sm mb-3 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Search query: <span className={`font-medium ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>"{data.query}"</span>
        </p>
        
        {/* Summary */}
        <div className="prose prose-sm max-w-none">
          <div className={`leading-relaxed whitespace-pre-wrap ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            {renderSummaryWithCitations(data.summary)}
          </div>
        </div>
      </div>

      {/* Sources */}
      {data.sources.length > 0 && (
        <div className={`border-t pt-4 ${
          isDarkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <h4 className={`text-sm font-medium mb-3 ${
            isDarkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>Sources:</h4>
          <div className="space-y-2">
            {data.sources.map((source) => (
              <div
                key={source.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors hover:border-opacity-50 ${
                  isDarkMode
                    ? 'border-gray-700 hover:bg-gray-750'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span className={`flex-shrink-0 w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {source.id}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h5 className={`text-sm font-medium line-clamp-2 ${
                        isDarkMode ? 'text-gray-100' : 'text-gray-900'
                      }`}>
                        {source.title}
                      </h5>
                      <p className={`text-xs mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {source.displayLink}
                      </p>
                    </div>
                    <a
                      href={source.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex-shrink-0 p-1 transition-colors ${
                        isDarkMode
                          ? 'text-gray-500 hover:text-gray-300'
                          : 'text-gray-400 hover:text-gray-600'
                      }`}
                      title="Open link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className={`text-sm mt-2 line-clamp-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    {source.snippet}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
