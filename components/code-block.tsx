"use client";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Copy, Check } from "lucide-react";
import { useState } from "react";
import { useTheme } from "../util/theme-provider";

interface CodeBlockProps {
  language: string;
  code: string;
  filename?: string;
}

export function CodeBlock({ language, code, filename }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const { isDarkMode } = useTheme();

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div className="relative group w-full max-w-full overflow-hidden">
      <div
        className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-mono rounded-t-lg border-b flex justify-between items-center ${
          isDarkMode
            ? "bg-gray-800 text-gray-300 border-gray-700"
            : "bg-gray-100 text-gray-700 border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <span
            className={`uppercase tracking-wide text-xs font-semibold flex-shrink-0 ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {language}
          </span>
          {filename && (
            <>
              <span
                className={`flex-shrink-0 ${
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }`}
              >
                •
              </span>
              <span className="truncate text-xs sm:text-sm">{filename}</span>
            </>
          )}
        </div>
        <button
          onClick={copyToClipboard}
          className={`flex-shrink-0 p-1.5 sm:p-2 rounded transition-colors ${
            isDarkMode
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
          }`}
        >
          {copied ? (
            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : (
            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
        </button>
      </div>
      <div className="relative overflow-hidden">
        <div className="overflow-x-auto">
          <SyntaxHighlighter
            language={language}
            style={isDarkMode ? oneDark : oneLight}
            customStyle={{
              margin: 0,
              borderRadius: "0 0 0.5rem 0.5rem",
              fontSize: "0.75rem",
              lineHeight: "1.4",
              minWidth: "100%",
            }}
            className="text-xs sm:text-sm"
            wrapLines={true}
            wrapLongLines={true}
          >
            {code}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
