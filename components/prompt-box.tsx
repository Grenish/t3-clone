"use client";

import { useState } from "react";
import { useTheme } from "@/util/theme-provider";

const promptSuggestions = {
  Ask: [
    "Explain this code snippet step-by-step",
    "What's the best tech stack for a real-time chat app?",
    "Summarize this article in under 100 words",
    "Compare Firebase vs Supabase for authentication",
  ],
  
  Code: [
    "Generate a REST API using Express and MongoDB",
    "Convert this JavaScript to TypeScript",
    "Debug this React component for infinite re-render",
    "Write a function to validate user input in a form",
  ],
  
  Write: [
    "Draft a polite client follow-up email",
    "Write a product description for a smart home device",
    "Create a blog outline about Next.js performance tips",
    "Generate terms and conditions for a SaaS product",
  ],
  
  Design: [
    "Create a modern hero section for a tech startup site",
    "Generate a dark-themed dashboard UI layout",
    "Design a pricing card component with Tailwind CSS",
    "Create a minimal portfolio layout using Flexbox",
  ],
  
  Visualize: [
    "Create a high-tech AI lab scene with holograms",
    "Visualize a fantasy castle at sunset",
    "Design an urban rooftop view with neon signs",
    "Create a futuristic control panel UI",
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
