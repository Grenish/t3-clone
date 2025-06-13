"use client";

import { useState, useRef, useEffect } from "react";
import { Cloud, User, ChevronRight, Globe } from "lucide-react";

interface ToolsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onToolSelect: (tool: string, persona?: string) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

export default function ToolsMenu({
  isOpen,
  onClose,
  onToolSelect,
  buttonRef,
}: ToolsMenuProps) {
  const [showPersonas, setShowPersonas] = useState(false);
  const [personaPosition, setPersonaPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const personaButtonRef = useRef<HTMLButtonElement>(null);
  const personaMenuRef = useRef<HTMLDivElement>(null);

  const personas = ["Taylor Swift", "Sundar Pichai", "Elon Musk", "Bill Gates", "Theo"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        personaMenuRef.current &&
        !personaMenuRef.current.contains(event.target as Node)
      ) {
        onClose();
        setShowPersonas(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      setShowPersonas(false);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  const handleToolClick = (tool: string) => {
    if (tool === "Persona") {
      if (personaButtonRef.current) {
        const rect = personaButtonRef.current.getBoundingClientRect();
        const menuRect = menuRef.current?.getBoundingClientRect();
        if (menuRect) {
          const submenuWidth = 160;
          const submenuHeight = personas.length * 41; // More accurate height calculation
          const viewportWidth = window.innerWidth;
          const viewportHeight = window.innerHeight;

          let left = menuRect.width - 2;
          let top = rect.top - menuRect.top;

          // Check if submenu would overflow right side
          if (menuRect.left + left + submenuWidth > viewportWidth) {
            left = -submenuWidth + 2;
          }

          // Check if submenu would overflow bottom
          const submenuBottomPosition = rect.bottom + submenuHeight;
          if (submenuBottomPosition > viewportHeight) {
            // Move submenu up so it fits within viewport
            const adjustmentNeeded = submenuBottomPosition - viewportHeight + 20; // 20px buffer
            top = top - adjustmentNeeded;

            // Ensure submenu doesn't go above viewport top
            const submenuTopPosition = rect.top + top;
            if (submenuTopPosition < 20) {
              top = 20 - rect.top;
            }
          }

          setPersonaPosition({ top, left });
        }
      }
      setShowPersonas(true);
    } else {
      onToolSelect(tool);
      onClose();
    }
  };

  const handlePersonaClick = (persona: string) => {
    onToolSelect("Persona", persona);
    onClose();
    setShowPersonas(false);
  };

  const handlePersonaMouseLeave = (event: React.MouseEvent) => {
    const relatedTarget = event.relatedTarget as Element;
    if (
      !personaButtonRef.current?.contains(relatedTarget) &&
      !personaMenuRef.current?.contains(relatedTarget)
    ) {
      setTimeout(() => setShowPersonas(false), 100); // Added small delay
    }
  };

  const handlePersonaButtonMouseLeave = (event: React.MouseEvent) => {
    const relatedTarget = event.relatedTarget as Element;
    if (!personaMenuRef.current?.contains(relatedTarget)) {
      setTimeout(() => setShowPersonas(false), 100); // Reduced delay from 150 to 100
    }
  };

  return (
    <div
      ref={menuRef}
      className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[180px] z-50"
    >
      <button
        onClick={() => handleToolClick("Web Search")}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
      >
        <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          Web Search
        </span>
      </button>

      <button
        onClick={() => handleToolClick("Weather")}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
      >
        <Cloud className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          Weather
        </span>
      </button>

      <button
        ref={personaButtonRef}
        onMouseEnter={() => handleToolClick("Persona")}
        onMouseLeave={handlePersonaButtonMouseLeave}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm relative"
      >
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            Persona
          </span>
        </div>
        <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
      </button>

      {showPersonas && (
        <div
          ref={personaMenuRef}
          className="absolute bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px] z-60"
          style={{
            top: personaPosition.top,
            left: personaPosition.left,
          }}
          onMouseLeave={handlePersonaMouseLeave}
        >
          {personas.map((persona) => (
            <button
              key={persona}
              onClick={() => handlePersonaClick(persona)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
            >
              <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-medium text-xs">
                {persona.charAt(0)}
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {persona}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
