"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Cpu, Zap, Brain, Sparkles, Check } from "lucide-react";
import { useTheme } from "@/util/theme-provider";

interface ModelOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  speed: "Fast" | "Balanced" | "Advanced";
  recommended?: boolean;
}

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  className?: string;
  size?: "sm" | "default" | "lg";
}

const modelOptions: ModelOption[] = [
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Latest model with fast responses and multimodal capabilities",
    icon: <Zap className="w-4 h-4" />,
    speed: "Fast",
    recommended: true,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "Most capable model for complex reasoning tasks",
    icon: <Brain className="w-4 h-4" />,
    speed: "Advanced",
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description: "Balanced performance and speed for general tasks",
    icon: <Cpu className="w-4 h-4" />,
    speed: "Balanced",
  },
  {
    id: "gemini-1.5-flash-8b",
    name: "Gemini 1.5 Flash-8B",
    description: "Lightweight model for quick responses",
    icon: <Sparkles className="w-4 h-4" />,
    speed: "Fast",
  },
  {
    id: "gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash (Thinking)",
    description: "Advanced reasoning model that shows its thinking process",
    icon: <Brain className="w-4 h-4" />,
    speed: "Advanced",
  },
];

export default function ModelSelector({ 
  selectedModel, 
  onModelChange, 
  className = "",
  size = "default" 
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isDarkMode } = useTheme();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = modelOptions.find(option => option.id === selectedModel) || modelOptions[0];

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      
      const dropdownHeight = 300; // Approximate dropdown height
      const spaceBelow = viewport.height - buttonRect.bottom;
      const spaceAbove = buttonRect.top;
      
      // Enhanced positioning logic for mobile and desktop
      if (isMobile) {
        // On mobile, prefer positioning that keeps dropdown in viewport
        if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
        
        // Adjust dropdown positioning for mobile
        const dropdown = dropdownRef.current;
        if (dropdown) {
          const dropdownRect = dropdown.getBoundingClientRect();
          
          // Ensure dropdown doesn't overflow horizontally on mobile
          if (buttonRect.left + dropdownRect.width > viewport.width) {
            dropdown.style.right = '0';
            dropdown.style.left = 'auto';
          } else {
            dropdown.style.left = '0';
            dropdown.style.right = 'auto';
          }
        }
      } else {
        // Desktop positioning
        setOpenUpward(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);
      }
    }
  }, [isOpen, isMobile]);

  const handleModelSelect = (modelId: string) => {
    onModelChange(modelId);
    setIsOpen(false);
  };

  const getSizeClasses = () => {
    if (isMobile) {
      // Mobile-specific sizing
      switch (size) {
        case "sm":
          return "text-xs px-2 py-1.5";
        case "lg":
          return "text-sm px-3 py-2.5";
        default:
          return "text-xs px-2.5 py-2";
      }
    }
    
    // Desktop sizing
    switch (size) {
      case "sm":
        return "text-sm px-3 py-2";
      case "lg":
        return "text-base px-4 py-3";
      default:
        return "text-sm px-3 py-2.5";
    }
  };

  const getButtonWidth = () => {
    if (isMobile) {
      return size === "sm" ? "min-w-32" : "min-w-36";
    }
    return "min-w-48";
  };

  const getDropdownWidth = () => {
    if (isMobile) {
      return "w-72 max-w-[calc(100vw-2rem)]";
    }
    return "w-80";
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between rounded-lg border transition-all duration-200 
          ${getButtonWidth()} ${getSizeClasses()}
          ${isDarkMode
            ? "bg-gray-900 border-gray-700 hover:border-gray-600 text-gray-100"
            : "bg-white border-gray-300 hover:border-gray-400 text-gray-900"
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
          active:scale-95 touch-manipulation
        `}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <div className={`${isDarkMode ? "text-gray-400" : "text-gray-600"} flex-shrink-0`}>
            {selectedOption.icon}
          </div>
          <div className="flex flex-col items-start min-w-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <span className="font-medium truncate">{selectedOption.name}</span>
            </div>
            {!isMobile && size !== "sm" && (
              <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"} truncate max-w-44`}>
                {selectedOption.speed} • {selectedOption.description}
              </span>
            )}
            {isMobile && (
              <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-500"} truncate max-w-28`}>
                {selectedOption.speed}
              </span>
            )}
          </div>
        </div>
        <ChevronDown 
          className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-200 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          } ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} 
        />
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={`
            absolute ${openUpward ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 
            ${getDropdownWidth()} rounded-lg border shadow-lg z-50 max-h-72 overflow-y-auto
            ${isDarkMode
              ? "bg-gray-900 border-gray-700"
              : "bg-white border-gray-300"
            }
            ${isMobile ? 'shadow-2xl' : ''}
          `}
        >
          <div className="py-1">
            {modelOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => handleModelSelect(option.id)}
                className={`
                  w-full text-left px-3 py-2.5 sm:py-3 transition-colors duration-150 flex items-center gap-2 sm:gap-3
                  touch-manipulation active:scale-95
                  ${selectedModel === option.id
                    ? isDarkMode
                      ? "bg-blue-900/20 text-blue-400"
                      : "bg-blue-50 text-blue-600"
                    : isDarkMode
                    ? "hover:bg-gray-800 text-gray-100 active:bg-gray-700"
                    : "hover:bg-gray-50 text-gray-900 active:bg-gray-100"
                  }
                `}
              >
                <div className={`${
                  selectedModel === option.id 
                    ? isDarkMode ? "text-blue-400" : "text-blue-600"
                    : isDarkMode ? "text-gray-500" : "text-gray-500"
                } flex-shrink-0`}>
                  {option.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm sm:text-base truncate">{option.name}</span>
                  </div>
                  <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"} truncate`}>
                    {option.speed} • {isMobile ? option.description.substring(0, 40) + '...' : option.description}
                  </p>
                </div>
                {selectedModel === option.id && (
                  <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}