import { ExternalLink, Clock, Globe, Search } from "lucide-react";

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
  if (data.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-2xl">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <Search className="w-5 h-5" />
          <span className="font-medium">Search Error</span>
        </div>
        <p className="text-red-600 text-sm">{data.error}</p>
      </div>
    );
  }

  if (!data.sources || data.sources.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-2xl">
        <div className="flex items-center gap-2 text-gray-700 mb-2">
          <Search className="w-5 h-5" />
          <span className="font-medium">No Results Found</span>
        </div>
        <p className="text-gray-600 text-sm">No results found for "{data.query}"</p>
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
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm mx-0.5 hover:underline"
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
    <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-2xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-gray-900">Web Search</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{data.searchTime.toFixed(2)}s</span>
          </div>
          <span>{data.totalResults.toLocaleString()} results</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-600 mb-3">
          Search query: <span className="font-medium text-gray-900">"{data.query}"</span>
        </p>
        
        {/* Summary */}
        <div className="prose prose-sm max-w-none">
          <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
            {renderSummaryWithCitations(data.summary)}
          </div>
        </div>
      </div>

      {/* Sources */}
      {data.sources.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Sources:</h4>
          <div className="space-y-2">
            {data.sources.map((source) => (
              <div key={source.id} className="flex items-start gap-2 text-sm">
                <span className="text-blue-600 font-medium min-w-[24px]">[{source.id}]</span>
                <div className="flex-1 min-w-0">
                  <a
                    href={source.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium line-clamp-1"
                  >
                    {source.title}
                  </a>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-green-700 text-xs">{source.displayLink}</span>
                    <ExternalLink className="w-3 h-3 text-gray-400" />
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
