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
  prompt?: string;
  imageUrl?: string | null;
  isGenerating?: boolean;
  error?: string;
  success?: boolean;
}

export default function ImageLoadingCard({
  loadingText = "Generating Image",
  currentStep,
  totalSteps,
  className = "",
  width = "100%",
  height = "400px",
  prompt,
  imageUrl,
  isGenerating,
  error,
  success
}: ImageLoadingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const wave1Ref = useRef<HTMLDivElement>(null);
  const wave2Ref = useRef<HTMLDivElement>(null);
  const wave3Ref = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLSpanElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{width: number; height: number} | null>(null);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);

    // Only animate when generating
    if (isGenerating && !prefersReducedMotion && cardRef.current && wave1Ref.current && wave2Ref.current && wave3Ref.current) {
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
  }, [isGenerating, prefersReducedMotion]);

  const downloadImage = async () => {
    if (!imageUrl) return;

    try {
      const a = document.createElement("a");
      a.href = imageUrl;
      a.download = `generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to download image:", error);
    }
  };

  const handleImageError = () => {
    console.error("Image failed to load:", imageUrl);
    setImageLoadError(true);
  };

  const handleImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    console.log("Image loaded successfully");
    setImageLoadError(false);
    
    const img = event.currentTarget;
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;
    
    // Calculate adaptive dimensions with constraints
    const maxWidth = 600; // Maximum width for the card
    const maxHeight = 600; // Maximum height for the card
    const minWidth = 300; // Minimum width for the card
    const minHeight = 200; // Minimum height for the card
    
    let adaptiveWidth = naturalWidth;
    let adaptiveHeight = naturalHeight;
    
    // Scale down if image is too large
    if (naturalWidth > maxWidth || naturalHeight > maxHeight) {
      const widthRatio = maxWidth / naturalWidth;
      const heightRatio = maxHeight / naturalHeight;
      const scaleRatio = Math.min(widthRatio, heightRatio);
      
      adaptiveWidth = naturalWidth * scaleRatio;
      adaptiveHeight = naturalHeight * scaleRatio;
    }
    
    // Ensure minimum dimensions
    if (adaptiveWidth < minWidth) {
      const scaleRatio = minWidth / adaptiveWidth;
      adaptiveWidth = minWidth;
      adaptiveHeight = adaptiveHeight * scaleRatio;
    }
    
    if (adaptiveHeight < minHeight) {
      const scaleRatio = minHeight / adaptiveHeight;
      adaptiveHeight = minHeight;
      adaptiveWidth = adaptiveWidth * scaleRatio;
    }
    
    setImageDimensions({
      width: Math.round(adaptiveWidth),
      height: Math.round(adaptiveHeight)
    });
  };

  // Calculate container dimensions
  const getContainerDimensions = () => {
    if (imageDimensions && imageUrl && !isGenerating) {
      return {
        width: imageDimensions.width,
        height: imageDimensions.height + (prompt ? 64 : 0) // Add space for prompt header
      };
    }
    
    // Default dimensions for loading and error states
    return {
      width: typeof width === 'number' ? width : 400,
      height: typeof height === 'number' ? height : 400
    };
  };

  const containerDimensions = getContainerDimensions();

  if (isGenerating) {
    return (
      <div
        ref={cardRef}
        className={`relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-white ${className}`}
        style={{ 
          width: containerDimensions.width,
          height: containerDimensions.height,
          maxWidth: '100%' // Ensure it doesn't overflow container
        }}
        role="status"
        aria-live="polite"
        aria-label={`${loadingText} ${currentStep && totalSteps ? `Step ${currentStep} of ${totalSteps}` : ''}`}
      >
        {/* Prompt Header */}
        {prompt && (
          <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-2xl">
            <h3 className="font-semibold text-sm">Image Generation</h3>
            <p className="text-xs opacity-90 mt-1 line-clamp-2">{prompt}</p>
          </div>
        )}

        {/* Animated Background for Loading */}
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

        {/* Loading Content */}
        <div className={`relative z-10 flex h-full flex-col items-center justify-center p-8 text-center ${prompt ? 'pt-24' : ''}`}>
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-6 border border-white/30">
            <h3 className="mb-4 text-2xl font-extralight tracking-wide text-slate-700">
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
            
            <p className="mt-6 text-sm font-light text-slate-500 tracking-wide">
              Crafting your vision...
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            25% { background-position: 100% 50%; }
            50% { background-position: 50% 100%; }
            75% { background-position: 100% 0%; }
          }
        `}</style>
      </div>
    );
  }

  // Error State
  if (error || imageLoadError) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl shadow-lg border border-red-200 bg-red-50 ${className}`}
        style={{ 
          width: containerDimensions.width,
          height: containerDimensions.height,
          maxWidth: '100%'
        }}
      >
        {prompt && (
          <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-2xl">
            <h3 className="font-semibold text-sm">Image Generation Failed</h3>
            <p className="text-xs opacity-90 mt-1 line-clamp-2">{prompt}</p>
          </div>
        )}
        
        <div className={`flex h-full items-center justify-center p-8 ${prompt ? 'pt-24' : ''}`}>
          <div className="text-center">
            <div className="w-16 h-16 text-red-500 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-red-700 text-lg font-medium mb-2">
              Failed to generate image
            </p>
            <p className="text-red-600 text-sm">
              {error || "Image failed to load"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Generated Image State
  if (imageUrl) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-white ${className}`}
        style={{ 
          width: containerDimensions.width,
          height: containerDimensions.height,
          maxWidth: '100%'
        }}
      >
        {prompt && (
          <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-2xl">
            <h3 className="font-semibold text-sm">Image Generated Successfully</h3>
            <p className="text-xs opacity-90 mt-1 line-clamp-2">{prompt}</p>
          </div>
        )}

        <div className={`relative h-full ${prompt ? 'pt-16' : ''}`}>
          {/* Main Image Display */}
          <div 
            className="relative cursor-pointer group h-full"
            onClick={() => setShowFullscreen(true)}
          >
            <img
              src={imageUrl}
              alt={prompt || "Generated image"}
              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
              onError={handleImageError}
              onLoad={handleImageLoad}
              style={{ borderRadius: prompt ? '0 0 1rem 1rem' : '1rem' }}
            />
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center" style={{ borderRadius: prompt ? '0 0 1rem 1rem' : '1rem' }}>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <p className="text-sm font-medium">Click to view fullscreen</p>
              </div>
            </div>
          </div>

          {/* Action Buttons Overlay */}
          <div className="absolute bottom-4 right-4 flex gap-2">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                downloadImage();
              }}
              className="bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 shadow-lg"
              title="Download image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download
            </button>
          </div>
        </div>

        {/* Fullscreen Modal */}
        {showFullscreen && (
          <div 
            className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center p-4" 
            onClick={() => setShowFullscreen(false)}
          >
            <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
              <img
                src={imageUrl}
                alt={prompt || "Generated image"}
                className="max-w-full max-h-full object-contain rounded-lg"
                onError={handleImageError}
                onClick={(e) => e.stopPropagation()}
              />
              
              {/* Close Button */}
              <button
                onClick={() => setShowFullscreen(false)}
                className="absolute top-6 right-6 text-white bg-black/50 hover:bg-black/70 p-3 rounded-full transition-colors z-10"
                title="Close fullscreen"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              {/* Prompt Display */}
              {prompt && (
                <div className="absolute bottom-6 left-6 right-6 bg-black/70 backdrop-blur-sm rounded-lg p-4 text-center">
                  <p className="text-white text-sm">{prompt}</p>
                </div>
              )}

              {/* Download Button in Fullscreen */}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage();
                }}
                className="absolute top-6 left-6 bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2"
                title="Download image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Placeholder State
  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-gray-100 ${className}`}
      style={{ 
        width: containerDimensions.width,
        height: containerDimensions.height,
        maxWidth: '100%'
      }}
    >
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500 text-lg">No image generated</p>
      </div>
    </div>
  );
}
