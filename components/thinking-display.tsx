"use client";

import { useState } from "react";
import { useTheme } from "@/util/theme-provider";
import { ChevronDown, ChevronRight, Brain, Eye, EyeOff } from "lucide-react";

interface ThinkingDisplayProps {
  thinking: string;
  isStreaming?: boolean;
}

export default function ThinkingDisplay({ thinking, isStreaming = false }: ThinkingDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isDarkMode } = useTheme();

  // FIXED: Enhanced thinking content parsing for different formats
  let displayThinking = thinking;
  if (thinking && typeof thinking === 'string') {
    try {
      // Check if it's JSON that needs parsing
      if (thinking.startsWith('{') || thinking.startsWith('[')) {
        const parsed = JSON.parse(thinking);
        
        // Handle different JSON structures from Gemini
        if (parsed.text) {
          displayThinking = parsed.text;
        } else if (parsed.content) {
          displayThinking = parsed.content;
        } else if (parsed.stepType && parsed.text) {
          // Handle Gemini's step format
          displayThinking = parsed.text;
        } else if (Array.isArray(parsed)) {
          displayThinking = parsed.map(item => 
            typeof item === 'string' ? item : (item.text || item.content || JSON.stringify(item, null, 2))
          ).join('\n\n');
        } else {
          // Format as readable JSON
          displayThinking = JSON.stringify(parsed, null, 2);
        }
      }
    } catch (e) {
      // If parsing fails, use original string
      displayThinking = thinking;
    }
  }

  // Ensure we have valid content to display
  if (!displayThinking || typeof displayThinking !== 'string' || displayThinking.trim() === '') {
    console.log('📝 ThinkingDisplay: No valid content to display:', { thinking, displayThinking });
    return null;
  }

  console.log('📝 ThinkingDisplay: Rendering thinking content:', displayThinking.substring(0, 100) + '...');

  return (
    <div className={`mb-4 border rounded-lg overflow-hidden ${
      isDarkMode 
        ? "bg-purple-900/20 border-purple-800/50" 
        : "bg-purple-50 border-purple-200"
    }`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full p-3 flex items-center gap-2 text-left transition-colors ${
          isDarkMode
            ? "hover:bg-purple-800/30 text-purple-300"
            : "hover:bg-purple-100 text-purple-700"
        }`}
      >
        <Brain className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-sm font-medium">
          {isStreaming ? "Thinking..." : "View Thinking Process"}
        </span>
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <Eye className="w-4 h-4" />
          ) : (
            <EyeOff className="w-4 h-4" />
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
      </button>
      
      {isExpanded && (
        <div className={`border-t p-4 ${
          isDarkMode 
            ? "bg-purple-900/10 border-purple-800/30" 
            : "bg-purple-25 border-purple-150"
        }`}>
          <div className={`text-sm leading-relaxed whitespace-pre-wrap ${
            isDarkMode ? "text-purple-200" : "text-purple-800"
          }`}>
            {displayThinking}
            {isStreaming && (
              <span className={`inline-block w-2 h-4 ml-1 animate-pulse ${
                isDarkMode ? "bg-purple-400" : "bg-purple-600"
              }`} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
