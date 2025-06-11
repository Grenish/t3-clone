"use client";

import { useState } from "react";
import { useTheme } from "@/util/theme-switcher";

const promptSuggestions = {
  Generate: [
    "Generate code for data processing",
    "Generate product development ideas",
    "Generate market research summary",
    "Generate user engagement report",
  ],
  Create: [
    "Create mobile app design",
    "Create Q4 business plan",
    "Create marketing campaign content",
    "Create team workflow automation",
  ],
  Draft: [
    "Draft stakeholder email",
    "Draft project proposal",
    "Draft customer response",
    "Draft API documentation",
  ],
  "Create Image": [
    "Create futuristic city skyline",
    "Create mountain landscape scene",
    "Create urban street at night",
    "Create cozy coffee shop interior",
  ]
};

interface PromptBoxProps {
  onPromptsChange: (prompts: string[]) => void;
}

export default function PromptBox({ onPromptsChange }: PromptBoxProps) {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const { isDarkMode } = useTheme();

  const handlePromptClick = (prompt: string) => {
    const newSelection = selectedPrompt === prompt ? null : prompt;
    setSelectedPrompt(newSelection);
    
    if (newSelection) {
      onPromptsChange(promptSuggestions[newSelection as keyof typeof promptSuggestions]);
    } else {
      onPromptsChange([]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="flex flex-wrap gap-2 sm:gap-3 lg:gap-4 justify-center mb-6 sm:mb-8">
        {Object.keys(promptSuggestions).map((prompt) => (
          <button
            key={prompt}
            onClick={() => handlePromptClick(prompt)}
            className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-3 cursor-pointer rounded-full text-xs font-medium transition-all duration-200 ${
              selectedPrompt === prompt
                ? isDarkMode
                  ? "bg-blue-600 text-white"
                  : "bg-black text-white"
                : isDarkMode
                ? "bg-gray-700/50 text-gray-300 hover:bg-gray-600/50 hover:text-gray-100"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
