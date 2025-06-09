'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface ImageLoadingCardProps {
  loadingText?: string;
  currentStep?: number;
  totalSteps?: number;
  className?: string;
  width?: string | number;
  height?: string | number;
}

export default function ImageLoadingCard({
  loadingText = "Generating Image",
  currentStep,
  totalSteps,
  className = "",
  width = "100%",
  height = "300px"
}: ImageLoadingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const wave1Ref = useRef<HTMLDivElement>(null);
  const wave2Ref = useRef<HTMLDivElement>(null);
  const wave3Ref = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLSpanElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);

    if (!cardRef.current || !wave1Ref.current || !wave2Ref.current || !wave3Ref.current) return;

    if (!mediaQuery.matches) {
      const holo1Tl = gsap.timeline({ repeat: -1 });
      holo1Tl.to(wave1Ref.current, {
        duration: 4,
        rotation: 360,
        scaleX: 1.2,
        scaleY: 0.8,
        ease: "sine.inOut"
      })
      .to(wave1Ref.current, {
        duration: 4,
        rotation: 720,
        scaleX: 0.9,
        scaleY: 1.3,
        ease: "sine.inOut"
      });

      const holo2Tl = gsap.timeline({ repeat: -1, delay: 1.5 });
      holo2Tl.to(wave2Ref.current, {
        duration: 6,
        rotation: -270,
        x: "30%",
        y: "-20%",
        scale: 1.4,
        ease: "sine.inOut"
      })
      .to(wave2Ref.current, {
        duration: 6,
        rotation: -540,
        x: "-30%",
        y: "20%",
        scale: 0.8,
        ease: "sine.inOut"
      })
      .to(wave2Ref.current, {
        duration: 6,
        rotation: -810,
        x: "0%",
        y: "0%",
        scale: 1.1,
        ease: "sine.inOut"
      });

      const holo3Tl = gsap.timeline({ repeat: -1, delay: 3 });
      holo3Tl.to(wave3Ref.current, {
        duration: 8,
        rotation: 180,
        skewX: 15,
        skewY: -5,
        scale: 1.5,
        ease: "sine.inOut"
      })
      .to(wave3Ref.current, {
        duration: 8,
        rotation: 360,
        skewX: -10,
        skewY: 8,
        scale: 0.7,
        ease: "sine.inOut"
      })
      .to(wave3Ref.current, {
        duration: 8,
        rotation: 540,
        skewX: 0,
        skewY: 0,
        scale: 1,
        ease: "sine.inOut"
      });

      gsap.to(cardRef.current, {
        duration: 5,
        y: -6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      if (dotsRef.current) {
        gsap.to(dotsRef.current, {
          duration: 2.5,
          opacity: 0.4,
          scale: 0.9,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut"
        });
      }

      return () => {
        holo1Tl.kill();
        holo2Tl.kill();
        holo3Tl.kill();
        gsap.killTweensOf(cardRef.current);
        gsap.killTweensOf(dotsRef.current);
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else {
      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden rounded-3xl shadow-xl backdrop-blur-sm ${className}`}
      style={{ width, height }}
      role="status"
      aria-live="polite"
      aria-label={`${loadingText} ${currentStep && totalSteps ? `Step ${currentStep} of ${totalSteps}` : ''}`}
    >
      <div 
        className="absolute inset-0 opacity-85"
        style={{
          background: "linear-gradient(135deg, #fdf2f8, #e0e7ff, #f0f9ff, #faf5ff, #fdf2f8)",
          backgroundSize: "400% 400%",
          animation: prefersReducedMotion ? 'none' : 'gradient-shift 12s ease-in-out infinite'
        }}
      />
      
      <div
        ref={wave1Ref}
        className="absolute inset-0 opacity-70"
        style={{
          background: "conic-gradient(from 45deg, transparent 10%, rgba(251, 207, 232, 0.6) 25%, rgba(196, 181, 253, 0.5) 40%, rgba(165, 243, 252, 0.6) 55%, rgba(255, 255, 255, 0.4) 70%, transparent 85%)",
          filter: "blur(2px)",
          mixBlendMode: "soft-light"
        }}
      />
      
      <div
        ref={wave2Ref}
        className="absolute inset-0 opacity-45"
        style={{
          background: "radial-gradient(ellipse 120% 80% at 60% 40%, rgba(251, 207, 232, 0.7) 0%, rgba(196, 181, 253, 0.5) 30%, rgba(165, 243, 252, 0.6) 60%, transparent 85%)",
          filter: "blur(3px)",
          mixBlendMode: "multiply"
        }}
      />
      
      <div
        ref={wave3Ref}
        className="absolute inset-0 opacity-35"
        style={{
          background: "linear-gradient(120deg, rgba(255, 255, 255, 0.8) 0%, rgba(251, 207, 232, 0.6) 25%, rgba(196, 181, 253, 0.5) 50%, rgba(165, 243, 252, 0.6) 75%, rgba(255, 255, 255, 0.4) 100%)",
          filter: "blur(4px)",
          mixBlendMode: "overlay"
        }}
      />
      
      <div 
        className="absolute inset-0 opacity-25"
        style={{
          background: "linear-gradient(60deg, transparent 20%, rgba(255, 255, 255, 0.9) 45%, rgba(251, 207, 232, 0.3) 55%, transparent 80%)",
          mixBlendMode: "soft-light"
        }}
      />
      
      <div className="relative z-10 flex h-full flex-col items-center justify-center p-8 text-center backdrop-blur-md bg-white/5 rounded-3xl border border-white/30">
        <h3 className="mb-4 text-2xl font-extralight tracking-wide drop-shadow-sm text-slate-700">
          {loadingText}
          <span ref={dotsRef} className="ml-1 inline-block text-slate-600">...</span>
        </h3>
        
        {currentStep && totalSteps && (
          <div className="w-full max-w-sm">
            <div className="mb-4 flex justify-between text-sm font-light text-slate-600">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/40 shadow-inner backdrop-blur-sm border border-white/40">
              <div
                className="h-full transition-all duration-1000 ease-out rounded-full"
                style={{ 
                  width: `${(currentStep / totalSteps) * 100}%`,
                  background: "linear-gradient(90deg, rgba(251, 207, 232, 0.9), rgba(196, 181, 253, 0.8), rgba(165, 243, 252, 0.9))",
                  boxShadow: "0 0 8px rgba(251, 207, 232, 0.5)"
                }}
              />
            </div>
          </div>
        )}
        
        <p className="mt-8 text-sm font-light text-slate-500 tracking-wide">
          Crafting your vision...
        </p>
      </div>
      
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: "linear-gradient(75deg, transparent 0%, rgba(255,255,255,0.4) 20%, rgba(251, 207, 232, 0.3) 40%, rgba(196, 181, 253, 0.2) 60%, rgba(165, 243, 252, 0.3) 80%, transparent 100%)",
          animation: prefersReducedMotion 
            ? 'none' 
            : 'holographic-shimmer 8s ease-in-out infinite'
        }}
      />

      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          25% { background-position: 100% 50%; }
          50% { background-position: 50% 100%; }
          75% { background-position: 100% 0%; }
        }
        
        @keyframes holographic-spin {
          from { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.05); }
          to { transform: rotate(360deg) scale(1); }
        }
        
        @keyframes text-shimmer {
          0%, 100% { background-position: 0% 50%; }
          33% { background-position: 100% 50%; }
          66% { background-position: 50% 100%; }
        }
        
        @keyframes holographic-shimmer {
          0% { transform: translateX(-120%) rotate(-15deg) scale(0.8); }
          50% { transform: translateX(120%) rotate(15deg) scale(1.1); }
          100% { transform: translateX(-120%) rotate(-15deg) scale(0.8); }
        }
      `}</style>
    </div>
  );
}
