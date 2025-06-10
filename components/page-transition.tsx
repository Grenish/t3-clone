"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface PageTransitionProps {
  children: React.ReactNode;
  skipAnimation?: boolean;
}

export default function PageTransition({ 
  children, 
  skipAnimation = false 
}: PageTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || skipAnimation) return;

    // Simple fade in for initial page load
    gsap.fromTo(
      containerRef.current,
      { opacity: 0 },
      {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out",
      }
    );
  }, [skipAnimation]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full"
      style={{ opacity: skipAnimation ? 1 : undefined }}
    >
      {children}
    </div>
  );
}
