"use client";

import { useState } from "react";
import GradientBall from "@/components/gradient-ball";
import PromptBox from "@/components/prompt-box";
import TimeGreetings from "@/components/time-greetings";
import { ChevronRight } from "lucide-react";

export default function Home() {
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);

  const defaultPromptSuggestions = [
    "What is AI and how does it work?",
    "Can you explain the concept of machine learning?",
    "What is fastest AI inference?",
    "How can I use AI in my business?",
  ];

  const displayedSuggestions =
    selectedPrompts.length > 0 ? selectedPrompts : defaultPromptSuggestions;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center ">
      <GradientBall />
      <div className="mt-5 text-center">
        <TimeGreetings
          user="John"
          className="text-3xl font-semibold opacity-80"
        />
        <h2 className="text-3xl font-semibold mt-2">
          How can I help you today?
        </h2>
      </div>
      <div className="mt-8">
        <PromptBox onPromptsChange={setSelectedPrompts} />
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayedSuggestions.map((suggestion, index) => (
              <button
                key={index}
                className="text-left p-4 cursor-pointer rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all duration-200 group"
              >
                <div className="flex items-start justify-between">
                  <span className="text-gray-800 text-xs leading-relaxed pr-3">
                    {suggestion}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full mt-20">
        <div className="w-1/2 p-2 bg-rose-500 mx-auto"></div>
      </div>
    </div>
  );
}
