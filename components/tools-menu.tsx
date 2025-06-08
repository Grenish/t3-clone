"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Cloud, User, ChevronRight } from "lucide-react";

interface ToolsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onToolSelect: (tool: string, persona?: string) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

export default function ToolsMenu({ isOpen, onClose, onToolSelect, buttonRef }: ToolsMenuProps) {
  const [showPersonas, setShowPersonas] = useState(false);
  const [personaPosition, setPersonaPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const personaButtonRef = useRef<HTMLButtonElement>(null);

  const personas = ["MrBeast", "Taylor Swift", "Donald Trump", "Sundar Pichai"];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        onClose();
        setShowPersonas(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
          setPersonaPosition({
            top: rect.top - menuRect.top,
            left: menuRect.width
          });
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

  const handlePersonaMouseLeave = () => {
    setShowPersonas(false);
  };

  return (
    <div 
      ref={menuRef}
      className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[200px] z-50"
    >
      <button
        onClick={() => handleToolClick("Search Web")}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm"
      >
        <Search className="w-5 h-5 text-gray-500" />
        <span className="text-gray-700 font-medium">Search Web</span>
      </button>
      
      <button
        onClick={() => handleToolClick("Weather")}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm"
      >
        <Cloud className="w-5 h-5 text-gray-500" />
        <span className="text-gray-700 font-medium">Weather</span>
      </button>
      
      <button
        ref={personaButtonRef}
        onMouseEnter={() => handleToolClick("Persona")}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm relative"
      >
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-gray-500" />
          <span className="text-gray-700 font-medium">Persona</span>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </button>

      {showPersonas && (
        <div 
          className="absolute bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[180px] z-60"
          style={{
            top: personaPosition.top,
            left: personaPosition.left
          }}
          onMouseLeave={handlePersonaMouseLeave}
        >
          {personas.map((persona) => (
            <button
              key={persona}
              onClick={() => handlePersonaClick(persona)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm"
            >
              <User className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700 font-medium">{persona}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
