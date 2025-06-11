'use client';

import React, { useState, useRef } from 'react';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { gsap } from 'gsap';
import { useTheme } from '@/util/theme-switcher';

type Theme = 'light' | 'dark' | 'system' | 'dynamic';

interface ThemeOption {
  value: Theme;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const themeOptions: ThemeOption[] = [
  { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" />, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" />, color: 'text-slate-600 dark:text-slate-300', bgColor: 'bg-slate-200 dark:bg-slate-700' },
  { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" />, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  { value: 'dynamic', label: 'Dynamic', icon: <Palette className="w-4 h-4" />, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
];

export default function ThemeSwitch() {
  const { theme: currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const trayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const labelsRef = useRef<(HTMLSpanElement | null)[]>([]);
  const mouseTrackingRef = useRef<number | null>(null);
  const isMouseInsideRef = useRef(false);

  const openTray = () => {
    if (!trayRef.current) return;
    
    setIsOpen(true);
    
    // Set initial state for smooth animation
    gsap.set(optionsRef.current.filter(Boolean), { 
      opacity: 0, 
      scale: 0.5,
      y: 20 
    });
    gsap.set(labelsRef.current.filter(Boolean), { 
      opacity: 0, 
      y: -10 
    });
    
    // Animate tray expansion with smoother easing
    gsap.to(trayRef.current, {
      width: '240px', // Fixed width for smoother animation
      duration: 0.8,
      ease: 'power4.out',
    });
    
    // Animate options appearing with improved timing
    gsap.to(optionsRef.current.filter(Boolean), {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.08,
      delay: 0.3,
      ease: 'back.out(1.4)'
    });
    
    // Animate labels appearing after tray opens
    gsap.to(labelsRef.current.filter(Boolean), {
      opacity: 1,
      y: 0,
      duration: 0.4,
      delay: 0.6,
      stagger: 0.05,
      ease: 'power3.out'
    });
  };

  const closeTray = () => {
    if (!trayRef.current) return;
    
    // Animate labels disappearing first
    gsap.to(labelsRef.current.filter(Boolean), {
      opacity: 0,
      y: -10,
      duration: 0.2,
      ease: 'power3.in'
    });
    
    // Animate options disappearing
    gsap.to(optionsRef.current.filter(Boolean), {
      opacity: 0,
      scale: 0.5,
      y: 20,
      duration: 0.3,
      stagger: 0.03,
      delay: 0.1,
      ease: 'power3.in'
    });
    
    // Animate tray collapse with smoother timing
    gsap.to(trayRef.current, {
      width: '50px',
      duration: 0.6,
      delay: 0.2,
      ease: 'power4.in',
      onComplete: () => setIsOpen(false)
    });
  };

  const handleThemeChange = (theme: Theme) => {
    setTheme(theme);
    closeTray();
  };

  const handleMouseEnter = (index: number) => {
    if (!isOpen) return;
    isMouseInsideRef.current = true;
  };

  const handleMouseLeave = (index: number) => {
    // Don't reset here to avoid conflicts
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isOpen || !isMouseInsideRef.current) return;
    
    // Simple throttling without canceling previous frames
    if (mouseTrackingRef.current) return;
    
    mouseTrackingRef.current = requestAnimationFrame(() => {
      mouseTrackingRef.current = null;
      
      const mouseX = event.clientX;
      
      optionsRef.current.forEach((button) => {
        if (!button) return;
        
        const rect = button.getBoundingClientRect();
        const buttonCenter = rect.left + rect.width / 2;
        const distance = Math.abs(mouseX - buttonCenter);
        
        // Simplified scaling calculation
        let scale = 1;
        const maxDistance = 80;
        
        if (distance < maxDistance) {
          const factor = (maxDistance - distance) / maxDistance;
          scale = 1 + (factor * 0.3); // Max scale of 1.3
        }
        
        // Use GSAP.set for immediate, non-conflicting updates
        gsap.set(button, { 
          scale: scale,
          force3D: true // Hardware acceleration
        });
      });
    });
  };

  const handleContainerMouseLeave = () => {
    if (!isOpen) return;
    
    isMouseInsideRef.current = false;
    
    // Cancel any pending animation frame
    if (mouseTrackingRef.current) {
      cancelAnimationFrame(mouseTrackingRef.current);
      mouseTrackingRef.current = null;
    }
    
    // Reset all scales with a single smooth animation
    gsap.to(optionsRef.current.filter(Boolean), {
      scale: 1,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: 'auto'
    });
  };

  const currentOption = themeOptions.find(option => option.value === currentTheme) || themeOptions[0];

  return (
    <div className="relative flex items-center justify-center">
      {/* Labels positioned above the tray */}
      {isOpen && (
        <div className="absolute -top-8 left-0 right-0 flex justify-center">
          <div className="flex gap-2" style={{ width: '240px' }}>
            {themeOptions.map((option, index) => (
              <div key={`label-${option.value}`} className="flex-1 flex justify-center">
                <span 
                  ref={el => { labelsRef.current[index] = el; }}
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
        style={{ width: '50px', transition: 'none' }} // Remove CSS transition to let GSAP handle it
      >
        {!isOpen ? (
          // Single icon when closed
          <button
            onClick={openTray}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-200 hover:scale-110 active:scale-95 ${currentOption.bgColor}`}
          >
            <div className={currentOption.color}>
              {currentOption.icon}
            </div>
          </button>
        ) : (
          // All options when open
          <div 
            className="flex items-center justify-between w-full px-0.5"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleContainerMouseLeave}
            onMouseEnter={() => { isMouseInsideRef.current = true; }}
          >
            {themeOptions.map((option, index) => (
              <button
                key={option.value}
                ref={el => { optionsRef.current[index] = el; }}
                onClick={() => handleThemeChange(option.value)}
                onMouseEnter={() => handleMouseEnter(index)}
                className={`w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transform-gpu ${
                  currentTheme === option.value 
                    ? option.bgColor + ' ring-2 ring-blue-400 dark:ring-blue-500 shadow-lg'
                    : option.bgColor + ' hover:shadow-md'
                }`}
              >
                <div className={option.color}>
                  {option.icon}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Overlay to close tray when clicking outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[-1]" 
          onClick={closeTray}
        />
      )}
    </div>
  );
}
