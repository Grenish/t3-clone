"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function GradientBall() {
  const gradientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gradientRef.current) {
      const tl = gsap.timeline();

      tl.to(gradientRef.current, {
        backgroundPosition: "0 100%",
        duration: 8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      })
        .to(
          gradientRef.current,
          {
            rotation: 360,
            duration: 12,
            ease: "none",
            repeat: -1,
          },
          0
        )
        .to(
          gradientRef.current,
          {
            scale: 1.1,
            duration: 4,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            repeatDelay: 0,
          },
          2
        );
    }
  }, []);

  return (
    <div
      ref={gradientRef}
      className="w-16 h-16 sm:w-20 sm:h-20 rounded-full opacity-80 dark:opacity-90"
      style={{
        backgroundImage:
          "linear-gradient(45deg, hsl(240, 100%, 70%), hsl(320, 100%, 80%), hsl(60, 100%, 85%), hsl(180, 100%, 75%))",
        backgroundSize: "300% 300%",
        backgroundPosition: "0 0",
        // filter: "blur(0.5px)",
      }}
    />
  );
}
