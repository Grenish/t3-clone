"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { Cloud, User, ChevronRight, Globe } from "lucide-react";

interface ToolsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onToolSelect: (tool: { tool?: string; persona?: string }) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
  showIconOnly?: boolean;
}

export default function ToolsMenu({
  isOpen,
  onClose,
  onToolSelect,
  buttonRef,
  showIconOnly = false,
}: ToolsMenuProps) {
  const [showPersonas, setShowPersonas] = useState(false);
  const [personaPosition, setPersonaPosition] = useState({ top: 0, left: 0 });
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const personaButtonRef = useRef<HTMLButtonElement>(null);
  const personaMenuRef = useRef<HTMLDivElement>(null);

  const personas = [
    "Taylor Swift",
    "Sundar Pichai",
    "Elon Musk",
    "Bill Gates",
    "Theo",
  ];

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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

    const handleTouchOutside = (event: TouchEvent) => {
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
      document.addEventListener("touchstart", handleTouchOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleTouchOutside);
      setShowPersonas(false);
    };
  }, [isOpen, onClose, buttonRef]);

  // Calculate main menu position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const button = buttonRef.current;
      const buttonRect = button.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      const menuWidth = isMobile ? 160 : 200;
      const menuHeight = 100; // Approximate height for 2 menu items

      let left = buttonRect.left;
      let top = buttonRect.top - menuHeight - 4; // Position above button with small gap

      // Adjust horizontal position if menu would overflow
      if (left + menuWidth > viewport.width - 16) {
        left = viewport.width - menuWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }

      // If not enough space above, position below
      if (top < 16) {
        top = buttonRect.bottom + 4; // Position below with small gap
      }

      // If still overflows below, try to fit within viewport
      if (top + menuHeight > viewport.height - 16) {
        // Center vertically if neither above nor below works
        top = Math.max(16, (viewport.height - menuHeight) / 2);
      }

      setMenuPosition({ top, left });
    }
  }, [isOpen, isMobile, buttonRef]);

  if (!isOpen) return null;

  const handleToolClick = (tool: string) => {
    if (tool === "Persona") {
      if (personaButtonRef.current && menuRef.current) {
        const rect = personaButtonRef.current.getBoundingClientRect();
        const menuRect = menuRef.current.getBoundingClientRect();
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };

        const submenuWidth = isMobile ? 140 : 180;
        const submenuHeight = personas.length * (isMobile ? 40 : 45);

        let left = rect.right + 2
        let top = rect.top;

        if (left + submenuWidth > viewport.width - 16) {
          left = rect.left - submenuWidth - 2;
        }

        if (top + submenuHeight > viewport.height - 16) {
          top = viewport.height - submenuHeight - 16;
        }
        if (top < 16) {
          top = 16;
        }

        if (isMobile) {
          const spaceBelow = viewport.height - menuRect.bottom;
          if (spaceBelow >= submenuHeight + 20) {
            top = menuRect.bottom + 2;
            left = Math.max(
              16,
              Math.min(menuRect.left, viewport.width - submenuWidth - 16)
            );
          } else {
            left = Math.max(
              16,
              Math.min(rect.right + 2, viewport.width - submenuWidth - 16)
            );
            top = Math.max(
              16,
              Math.min(rect.top, viewport.height - submenuHeight - 16)
            );
          }
        }

        setPersonaPosition({ top, left });
      }
      setShowPersonas(true);
    } else {
      onToolSelect({ tool });
      onClose();
    }
  };

  const handlePersonaClick = (persona: string) => {
    onToolSelect({ persona });
    onClose();
    setShowPersonas(false);
  };

  const handlePersonaMouseLeave = (event: React.MouseEvent) => {
    // Only hide on desktop - mobile uses click/touch
    if (window.innerWidth >= 640) {
      const relatedTarget = event.relatedTarget as Element;
      if (
        !personaButtonRef.current?.contains(relatedTarget) &&
        !personaMenuRef.current?.contains(relatedTarget)
      ) {
        setTimeout(() => setShowPersonas(false), 100);
      }
    }
  };

  const handlePersonaButtonMouseLeave = (event: React.MouseEvent) => {
    // Only hide on desktop - mobile uses click/touch
    if (window.innerWidth >= 640) {
      const relatedTarget = event.relatedTarget as Element;
      if (!personaMenuRef.current?.contains(relatedTarget)) {
        setTimeout(() => setShowPersonas(false), 100);
      }
    }
  };

  // Function to get persona initials
  const getPersonaInitials = (persona: string) => {
    return persona
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2);
  };

  const menuContent = (
    <>
      <div
        ref={menuRef}
        className={`fixed bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-[9999] ${
          isMobile ? "w-40" : "w-48"
        }`}
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
        }}
      >
        <button
          onClick={() => handleToolClick("Web Search")}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm active:bg-gray-100 dark:active:bg-gray-700"
        >
          <Globe className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
          {!showIconOnly && (
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Web Search
            </span>
          )}
        </button>

        <button
          ref={personaButtonRef}
          onMouseEnter={() =>
            window.innerWidth >= 640 && handleToolClick("Persona")
          }
          onClick={() => window.innerWidth < 640 && handleToolClick("Persona")}
          onMouseLeave={handlePersonaButtonMouseLeave}
          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm relative active:bg-gray-100 dark:active:bg-gray-700"
        >
          <div className="flex items-center gap-3 min-w-0">
            <User className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            {!showIconOnly && (
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Persona
              </span>
            )}
          </div>
          {!showIconOnly && (
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          )}
        </button>
      </div>

      {showPersonas && (
        <div
          ref={personaMenuRef}
          className={`fixed bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-[9999] ${
            isMobile ? "w-36" : "w-44"
          }`}
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
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm active:bg-gray-100 dark:active:bg-gray-700"
            >
              <div className="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 font-medium text-xs flex-shrink-0">
                {getPersonaInitials(persona)}
              </div>
              <span className="text-gray-700 dark:text-gray-300 font-medium text-sm truncate">
                {persona}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  );

  // Use portal to render menu at document.body level
  return typeof window !== "undefined" ? createPortal(menuContent, document.body) : null;
}
