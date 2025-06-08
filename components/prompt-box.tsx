"use client";

import { useState } from "react";

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
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex gap-4 justify-center mb-8">
        {Object.keys(promptSuggestions).map((prompt) => (
          <button
            key={prompt}
            onClick={() => handlePromptClick(prompt)}
            className={`px-8 py-3 cursor-pointer rounded-full text-xs font-medium transition-all duration-200 ${
              selectedPrompt === prompt
                ? "bg-black text-white"
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
