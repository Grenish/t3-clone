import { ExternalLink, Clock, Globe, Search } from "lucide-react";
import { useTheme } from "@/util/theme-switcher";

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
              className={`inline-flex items-center font-medium text-sm mx-0.5 hover:underline ${
                isDarkMode 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-blue-600 hover:text-blue-800'
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
              <div key={source.id} className="flex items-start gap-2 text-sm">
                <span className={`font-medium min-w-[24px] ${
                  isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>[{source.id}]</span>
                <div className="flex-1 min-w-0">
                  <a
                    href={source.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-medium line-clamp-1 hover:underline ${
                      isDarkMode 
                        ? 'text-blue-400 hover:text-blue-300' 
                        : 'text-blue-600 hover:text-blue-800'
                    }`}
                  >
                    {source.title}
                  </a>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-xs ${
                      isDarkMode ? 'text-green-400' : 'text-green-700'
                    }`}>{source.displayLink}</span>
                    <ExternalLink className={`w-3 h-3 ${
                      isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
