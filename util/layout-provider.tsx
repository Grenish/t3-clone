"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

type LayoutType = "default" | "rework";

interface LayoutContextType {
  currentLayout: LayoutType;
  setLayout: (layout: LayoutType) => void;
  toggleLayout: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const [currentLayout, setCurrentLayout] = useState<LayoutType>("rework");
  const [isInitialized, setIsInitialized] = useState(false);

  // Load layout preference from localStorage on mount
  useEffect(() => {
    const savedLayout = localStorage.getItem("preferredLayout") as LayoutType;
    if (savedLayout && (savedLayout === "default" || savedLayout === "rework")) {
      setCurrentLayout(savedLayout);
    }
    setIsInitialized(true);
  }, []);

  const setLayout = (layout: LayoutType) => {
    setCurrentLayout(layout);
    localStorage.setItem("preferredLayout", layout);
  };

  const toggleLayout = () => {
    const newLayout = currentLayout === "default" ? "rework" : "default";
    setLayout(newLayout);
  };

  // Don't render children until layout is initialized to prevent flash
  if (!isInitialized) {
    return null;
  }

  return (
    <LayoutContext.Provider value={{ currentLayout, setLayout, toggleLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
}
