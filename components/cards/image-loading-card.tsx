"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { gsap } from "gsap";

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
  success,
}: ImageLoadingCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const wave1Ref = useRef<HTMLDivElement>(null);
  const wave2Ref = useRef<HTMLDivElement>(null);
  const wave3Ref = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLSpanElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    // Prevent body scroll when fullscreen is open
    if (showFullscreen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    }

    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showFullscreen) {
        setShowFullscreen(false);
      }
    };

    if (showFullscreen) {
      document.addEventListener("keydown", handleEscape);
    }

    // Only animate when generating
    if (
      isGenerating &&
      !prefersReducedMotion &&
      cardRef.current &&
      wave1Ref.current &&
      wave2Ref.current &&
      wave3Ref.current
    ) {
      const holo1Tl = gsap.timeline({ repeat: -1 });
      holo1Tl
        .to(wave1Ref.current, {
          duration: 4,
          rotation: 360,
          scaleX: 1.2,
          scaleY: 0.8,
          ease: "sine.inOut",
        })
        .to(wave1Ref.current, {
          duration: 4,
          rotation: 720,
          scaleX: 0.9,
          scaleY: 1.3,
          ease: "sine.inOut",
        });

      const holo2Tl = gsap.timeline({ repeat: -1, delay: 1.5 });
      holo2Tl
        .to(wave2Ref.current, {
          duration: 6,
          rotation: -270,
          x: "30%",
          y: "-20%",
          scale: 1.4,
          ease: "sine.inOut",
        })
        .to(wave2Ref.current, {
          duration: 6,
          rotation: -540,
          x: "-30%",
          y: "20%",
          scale: 0.8,
          ease: "sine.inOut",
        })
        .to(wave2Ref.current, {
          duration: 6,
          rotation: -810,
          x: "0%",
          y: "0%",
          scale: 1.1,
          ease: "sine.inOut",
        });

      const holo3Tl = gsap.timeline({ repeat: -1, delay: 3 });
      holo3Tl
        .to(wave3Ref.current, {
          duration: 8,
          rotation: 180,
          skewX: 15,
          skewY: -5,
          scale: 1.5,
          ease: "sine.inOut",
        })
        .to(wave3Ref.current, {
          duration: 8,
          rotation: 360,
          skewX: -10,
          skewY: 8,
          scale: 0.7,
          ease: "sine.inOut",
        })
        .to(wave3Ref.current, {
          duration: 8,
          rotation: 540,
          skewX: 0,
          skewY: 0,
          scale: 1,
          ease: "sine.inOut",
        });

      gsap.to(cardRef.current, {
        duration: 5,
        y: -6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      if (dotsRef.current) {
        gsap.to(dotsRef.current, {
          duration: 2.5,
          opacity: 0.4,
          scale: 0.9,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      }

      return () => {
        holo1Tl.kill();
        holo2Tl.kill();
        holo3Tl.kill();
        gsap.killTweensOf(cardRef.current);
        gsap.killTweensOf(dotsRef.current);
        mediaQuery.removeEventListener("change", handleChange);
        document.removeEventListener("keydown", handleEscape);
        // Reset body scroll
        document.body.style.overflow = "unset";
        document.documentElement.style.overflow = "unset";
      };
    } else {
      return () => {
        mediaQuery.removeEventListener("change", handleChange);
        document.removeEventListener("keydown", handleEscape);
        // Reset body scroll
        document.body.style.overflow = "unset";
        document.documentElement.style.overflow = "unset";
      };
    }
  }, [isGenerating, prefersReducedMotion, showFullscreen]);

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
      height: Math.round(adaptiveHeight),
    });
  };

  // Calculate container dimensions
  const getContainerDimensions = () => {
    if (imageDimensions && imageUrl && !isGenerating) {
      // Make dimensions responsive
      const maxWidth = Math.min(imageDimensions.width, window.innerWidth - 32); // Account for padding
      const aspectRatio = imageDimensions.height / imageDimensions.width;
      const responsiveHeight = maxWidth * aspectRatio;
      
      return {
        width: maxWidth,
        height: responsiveHeight + (prompt ? 64 : 0), // Add space for prompt header
      };
    }

    // Default responsive dimensions for loading and error states
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 400;
    const defaultWidth = Math.min(400, viewportWidth - 32);
    const defaultHeight = Math.min(400, (viewportWidth - 32) * 0.75); // 4:3 aspect ratio
    
    return {
      width: defaultWidth,
      height: defaultHeight,
    };
  };

  const containerDimensions = getContainerDimensions();

  if (isGenerating) {
    return (
      <div
        ref={cardRef}
        className={`relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-white ${className} w-full max-w-full`}
        style={{
          width: '100%',
          maxWidth: containerDimensions.width,
          height: containerDimensions.height,
          minHeight: '200px', // Ensure minimum height on mobile
        }}
        role="status"
        aria-live="polite"
        aria-label={`${loadingText} ${
          currentStep && totalSteps
            ? `Step ${currentStep} of ${totalSteps}`
            : ""
        }`}
      >
        {/* Prompt Header */}
        {prompt && (
          <div className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-2xl">
            <h3 className="font-semibold text-xs sm:text-sm">Image Generation</h3>
            <p className="text-xs opacity-90 mt-1 line-clamp-2 hidden sm:block">{prompt}</p>
            <p className="text-xs opacity-90 mt-1 line-clamp-1 sm:hidden">{prompt}</p>
          </div>
        )}

        {/* Animated Background for Loading */}
        <div
          className="absolute inset-0 opacity-85"
          style={{
            background:
              "linear-gradient(135deg, #fdf2f8, #e0e7ff, #f0f9ff, #faf5ff, #fdf2f8)",
            backgroundSize: "400% 400%",
            animation: prefersReducedMotion
              ? "none"
              : "gradient-shift 12s ease-in-out infinite",
          }}
        />

        <div
          ref={wave1Ref}
          className="absolute inset-0 opacity-70"
          style={{
            background:
              "conic-gradient(from 45deg, transparent 10%, rgba(251, 207, 232, 0.6) 25%, rgba(196, 181, 253, 0.5) 40%, rgba(165, 243, 252, 0.6) 55%, rgba(255, 255, 255, 0.4) 70%, transparent 85%)",
            filter: "blur(2px)",
            mixBlendMode: "soft-light",
          }}
        />

        <div
          ref={wave2Ref}
          className="absolute inset-0 opacity-45"
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 60% 40%, rgba(251, 207, 232, 0.7) 0%, rgba(196, 181, 253, 0.5) 30%, rgba(165, 243, 252, 0.6) 60%, transparent 85%)",
            filter: "blur(3px)",
            mixBlendMode: "multiply",
          }}
        />

        <div
          ref={wave3Ref}
          className="absolute inset-0 opacity-35"
          style={{
            background:
              "linear-gradient(120deg, rgba(255, 255, 255, 0.8) 0%, rgba(251, 207, 232, 0.6) 25%, rgba(196, 181, 253, 0.5) 50%, rgba(165, 243, 252, 0.6) 75%, rgba(255, 255, 255, 0.4) 100%)",
            filter: "blur(4px)",
            mixBlendMode: "overlay",
          }}
        />

        {/* Loading Content */}
        <div
          className={`relative z-10 flex h-full flex-col items-center justify-center p-4 sm:p-8 text-center ${
            prompt ? "pt-16 sm:pt-24" : ""
          }`}
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/30 w-full max-w-sm">
            <h3 className="mb-3 sm:mb-4 text-lg sm:text-2xl font-extralight tracking-wide text-slate-700">
              {loadingText}
              <span ref={dotsRef} className="ml-1 inline-block text-slate-600">
                ...
              </span>
            </h3>

            {currentStep && totalSteps && (
              <div className="w-full">
                <div className="mb-3 sm:mb-4 flex justify-between text-xs sm:text-sm font-light text-slate-600">
                  <span>
                    Step {currentStep} of {totalSteps}
                  </span>
                  <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/40 shadow-inner backdrop-blur-sm border border-white/40">
                  <div
                    className="h-full transition-all duration-1000 ease-out rounded-full"
                    style={{
                      width: `${(currentStep / totalSteps) * 100}%`,
                      background:
                        "linear-gradient(90deg, rgba(251, 207, 232, 0.9), rgba(196, 181, 253, 0.8), rgba(165, 243, 252, 0.9))",
                      boxShadow: "0 0 8px rgba(251, 207, 232, 0.5)",
                    }}
                  />
                </div>
              </div>
            )}

            <p className="mt-4 sm:mt-6 text-xs sm:text-sm font-light text-slate-500 tracking-wide">
              Crafting your vision...
            </p>
          </div>
        </div>

        <style jsx>{`
          @keyframes gradient-shift {
            0%,
            100% {
              background-position: 0% 50%;
            }
            25% {
              background-position: 100% 50%;
            }
            50% {
              background-position: 50% 100%;
            }
            75% {
              background-position: 100% 0%;
            }
          }
        `}</style>
      </div>
    );
  }

  // Error State
  if (error || imageLoadError) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl shadow-lg border border-red-200 bg-red-50 ${className} w-full max-w-full`}
        style={{
          width: '100%',
          maxWidth: containerDimensions.width,
          height: containerDimensions.height,
          minHeight: '200px',
        }}
      >
        {prompt && (
          <div className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-t-2xl">
            <h3 className="font-semibold text-xs sm:text-sm">Image Generation Failed</h3>
            <p className="text-xs opacity-90 mt-1 line-clamp-2 hidden sm:block">{prompt}</p>
            <p className="text-xs opacity-90 mt-1 line-clamp-1 sm:hidden">{prompt}</p>
          </div>
        )}

        <div
          className={`flex h-full items-center justify-center p-4 sm:p-8 ${
            prompt ? "pt-16 sm:pt-24" : ""
          }`}
        >
          <div className="text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-12 h-12 sm:w-16 sm:h-16"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="text-red-700 text-base sm:text-lg font-medium mb-2">
              Failed to generate image
            </p>
            <p className="text-red-600 text-xs sm:text-sm">
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
        className={`relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-white ${className} w-full max-w-full`}
        style={{
          width: '100%',
          maxWidth: containerDimensions.width,
          height: containerDimensions.height,
          minHeight: '200px',
        }}
      >
        {prompt && (
          <div className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-2xl">
            <h3 className="font-semibold text-xs sm:text-sm">
              Image Generated Successfully
            </h3>
            <p className="text-xs opacity-90 mt-1 line-clamp-2 hidden sm:block">{prompt}</p>
            <p className="text-xs opacity-90 mt-1 line-clamp-1 sm:hidden">{prompt}</p>
          </div>
        )}

        <div className={`relative h-full ${prompt ? "pt-12 sm:pt-16" : ""}`}>
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
              style={{ borderRadius: prompt ? "0 0 1rem 1rem" : "1rem" }}
            />

            {/* Hover Overlay */}
            <div
              className="absolute inset-0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center"
              style={{ borderRadius: prompt ? "0 0 1rem 1rem" : "1rem" }}
            >
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-center">
                <svg
                  className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                  />
                </svg>
                <p className="text-xs sm:text-sm font-medium">Click to view fullscreen</p>
              </div>
            </div>
          </div>

          {/* Action Buttons Overlay */}
          <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadImage();
              }}
              className="bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-200 hover:border-gray-300 text-gray-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 shadow-lg"
              title="Download image"
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="hidden sm:inline">Download</span>
            </button>
          </div>
        </div>

        {/* Fullscreen Modal */}
        {showFullscreen &&
          imageUrl &&
          mounted &&
          createPortal(
            <div
              className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center p-2 sm:p-4"
              style={{
                zIndex: 999999,
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100vw",
                height: "100vh",
              }}
              onClick={() => setShowFullscreen(false)}
            >
              <div
                className="relative w-full h-full flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={imageUrl}
                  alt={prompt || "Generated image"}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                  onError={handleImageError}
                  style={{
                    maxWidth: "95vw",
                    maxHeight: "95vh",
                    objectFit: "contain",
                  }}
                />

                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullscreen(false);
                  }}
                  className="absolute top-2 sm:top-4 right-2 sm:right-4 text-white bg-black/50 hover:bg-black/70 p-2 sm:p-3 rounded-full transition-colors duration-200 backdrop-blur-sm border border-white/20 z-10"
                  title="Close fullscreen (ESC)"
                >
                  <svg
                    className="w-5 h-5 sm:w-6 sm:h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                {/* Prompt Display */}
                {prompt && (
                  <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 right-2 sm:right-4 bg-black/70 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center max-w-4xl mx-auto">
                    <p className="text-white text-xs sm:text-sm leading-relaxed">
                      {prompt}
                    </p>
                  </div>
                )}

                {/* Download Button in Fullscreen */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadImage();
                  }}
                  className="absolute top-2 sm:top-4 left-2 sm:left-4 bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2"
                  title="Download image"
                >
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Download</span>
                </button>

                {/* Instructions */}
                <div className="absolute top-2 sm:top-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-white text-xs sm:text-sm">
                  <span className="hidden sm:inline">Press ESC or click outside to close</span>
                  <span className="sm:hidden">Tap outside to close</span>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-gray-100 ${className} w-full max-w-full`}
      style={{
        width: '100%',
        maxWidth: containerDimensions.width,
        height: containerDimensions.height,
        minHeight: '200px',
      }}
    >
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500 text-base sm:text-lg">No image generated</p>
      </div>
    </div>
  );
}
