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
    <div className="relative group">
      <div
        className={`px-4 py-2 text-sm font-mono rounded-t-lg border-b flex justify-between items-center ${
          isDarkMode
            ? "bg-gray-800 text-gray-300 border-gray-700"
            : "bg-gray-100 text-gray-700 border-gray-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`uppercase tracking-wide text-xs font-semibold ${
              isDarkMode ? "text-gray-400" : "text-gray-500"
            }`}
          >
            {language}
          </span>
          {filename && (
            <>
              <span
                className={
                  isDarkMode ? "text-gray-500" : "text-gray-400"
                }
              >
                •
              </span>
              <span>{filename}</span>
            </>
          )}
        </div>
      </div>
      <div className="relative">
        <button
          onClick={copyToClipboard}
          className={`absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded z-10 ${
            isDarkMode
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300"
          }`}
        >
          {copied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
        <SyntaxHighlighter
          language={language}
          style={isDarkMode ? oneDark : oneLight}
          customStyle={{
            margin: 0,
            borderRadius: "0 0 0.5rem 0.5rem",
            fontSize: "0.875rem",
            lineHeight: "1.5",
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
