"use client";

import React, { useState, useRef } from "react";
import { LayoutGrid, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { useLayout } from "@/util/layout-provider";
import { useTheme } from "@/util/theme-provider";
import { usePathname } from "next/navigation";

type LayoutType = "default" | "rework";

interface LayoutOption {
  value: LayoutType;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const layoutOptions: LayoutOption[] = [
  {
    value: "default",
    label: "Default",
    icon: <LayoutGrid className="w-4 h-4" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/30",
  },
  {
    value: "rework",
    label: "Rework",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/30",
  },
];

export default function LayoutSwitch() {
  const { currentLayout, setLayout } = useLayout();
  const { isDarkMode } = useTheme();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const trayRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const labelsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const mouseTrackingRef = useRef<number | null>(null);
  const isMouseInsideRef = useRef(false);

  const openTray = () => {
    if (!trayRef.current) return;

    setIsOpen(true);

    gsap.set(optionsRef.current.filter(Boolean), {
      opacity: 0,
      scale: 0.5,
      y: 20,
    });
    gsap.set(labelsRef.current.filter(Boolean), {
      opacity: 0,
      y: -10,
    });

    gsap.to(trayRef.current, {
      width: "140px",
      duration: 0.8,
      ease: "power4.out",
    });

    gsap.to(optionsRef.current.filter(Boolean), {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.08,
      delay: 0.3,
      ease: "back.out(1.4)",
    });

    gsap.to(labelsRef.current.filter(Boolean), {
      opacity: 1,
      y: 0,
      duration: 0.4,
      delay: 0.6,
      stagger: 0.05,
      ease: "power3.out",
    });
  };

  const closeTray = () => {
    if (!trayRef.current) return;

    gsap.to(labelsRef.current.filter(Boolean), {
      opacity: 0,
      y: -10,
      duration: 0.2,
      ease: "power3.in",
    });

    gsap.to(optionsRef.current.filter(Boolean), {
      opacity: 0,
      scale: 0.5,
      y: 20,
      duration: 0.3,
      stagger: 0.03,
      delay: 0.1,
      ease: "power3.in",
    });

    gsap.to(trayRef.current, {
      width: "50px",
      duration: 0.6,
      delay: 0.2,
      ease: "power4.in",
      onComplete: () => setIsOpen(false),
    });
  };

  const handleLayoutChange = (layout: LayoutType) => {
    setLayout(layout);
    closeTray();
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isOpen || !isMouseInsideRef.current) return;

    if (mouseTrackingRef.current) return;

    mouseTrackingRef.current = requestAnimationFrame(() => {
      mouseTrackingRef.current = null;

      const mouseX = event.clientX;

      optionsRef.current.forEach((button) => {
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const buttonCenter = rect.left + rect.width / 2;
        const distance = Math.abs(mouseX - buttonCenter);

        let scale = 1;
        const maxDistance = 60;

        if (distance < maxDistance) {
          const factor = (maxDistance - distance) / maxDistance;
          scale = 1 + factor * 0.3;
        }

        gsap.set(button, {
          scale: scale,
          force3D: true,
        });
      });
    });
  };

  const handleContainerMouseLeave = () => {
    if (!isOpen) return;

    isMouseInsideRef.current = false;

    if (mouseTrackingRef.current) {
      cancelAnimationFrame(mouseTrackingRef.current);
      mouseTrackingRef.current = null;
    }

    gsap.to(optionsRef.current.filter(Boolean), {
      scale: 1,
      duration: 0.4,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const currentOption =
    layoutOptions.find((option) => option.value === currentLayout) ||
    layoutOptions[0];

  // Hide layout switch on chat pages
  if (pathname?.startsWith("/c/")) {
    return null;
  }

  return (
    <div className="fixed top-20 right-4 z-50">
      <div className="relative flex items-center justify-center">
        {isOpen && (
          <div className="absolute -top-8 left-0 right-0 flex justify-center">
            <div className="flex gap-2" style={{ width: "140px" }}>
              {layoutOptions.map((option, index) => (
                <div key={`label-${option.value}`} className="flex-1 flex justify-center">
                  <span
                    ref={(el) => {
                      labelsRef.current[index] = el;
                    }}
                    className="text-xs font-medium text-gray-600 dark:text-gray-400 whitespace-nowrap"
                  >
                    {option.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div
          ref={trayRef}
          className="flex items-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/60 dark:border-gray-700/60 p-1.5 overflow-hidden"
          style={{ width: "50px", transition: "none" }}
        >
          {!isOpen ? (
            <button
              onClick={openTray}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 ${currentOption.bgColor}`}
            >
              <div className={currentOption.color}>{currentOption.icon}</div>
            </button>
          ) : (
            <div
              className="flex items-center justify-between w-full px-0.5"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleContainerMouseLeave}
              onMouseEnter={() => {
                isMouseInsideRef.current = true;
              }}
            >
              {layoutOptions.map((option, index) => (
                <button
                  key={option.value}
                  ref={(el) => {
                    optionsRef.current[index] = el;
                  }}
                  onClick={() => handleLayoutChange(option.value)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transform-gpu ${
                    currentLayout === option.value
                      ? option.bgColor +
                        " ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg"
                      : option.bgColor + " hover:shadow-md"
                  }`}
                >
                  <div className={option.color}>{option.icon}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {isOpen && (
          <div
            className="fixed inset-0 z-[-1]"
            onClick={closeTray}
          />
        )}
      </div>
    </div>
  );
}
