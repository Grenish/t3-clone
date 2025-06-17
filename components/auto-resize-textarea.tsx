"use client";

import { useRef, useEffect, useState } from "react";

interface AutoResizeTextareaProps {
  placeholder?: string;
  className?: string;
  onChange?: (value: string) => void;
  onSubmit?: () => void;
  value?: string;
}

export default function AutoResizeTextarea({
  placeholder = "Type your message here...",
  className = "",
  onChange,
  onSubmit,
  value,
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = "auto";

      const newHeight = textarea.scrollHeight;
      // Responsive max heights based on viewport
      const maxHeight = isMobile ? 120 : 200; // Smaller on mobile for better UX
      const minHeight = isMobile ? 44 : 50; // Minimum height

      // Ensure minimum height is respected
      const finalHeight = Math.max(minHeight, newHeight);

      if (finalHeight <= maxHeight) {
        textarea.style.height = `${finalHeight}px`;
        textarea.style.overflowY = "hidden";
      } else {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = "auto";
      }
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value, isMobile]); // Re-adjust when mobile state changes

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enhanced keyboard handling for mobile
    if (e.key === "Enter") {
      // On mobile, require explicit send button tap for better UX
      if (!isMobile && !e.shiftKey) {
        e.preventDefault();
        onSubmit?.();
      }
      // On desktop, maintain existing behavior (Enter to send, Shift+Enter for new line)
      // On mobile, always allow new line with Enter key
    }
  };

  // Get responsive styling
  const getResponsiveClasses = () => {
    const baseClasses = "w-full resize-none rounded-lg outline-none border-none";

    if (isMobile) {
      return `${baseClasses} text-base leading-relaxed px-3 py-3 min-h-[44px] max-h-[120px]`;
    }

    return `${baseClasses} text-sm leading-normal px-4 py-3 min-h-[50px] max-h-[200px]`;
  };

  // Responsive placeholder text
  const getPlaceholder = () => {
    if (isMobile) {
      return placeholder.length > 30 ? "Type your message..." : placeholder;
    }
    return placeholder;
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={getPlaceholder()}
      className={`${getResponsiveClasses()} ${className}`}
      rows={1}
      // Enhanced mobile attributes
      autoCapitalize="sentences"
      autoCorrect="on"
      spellCheck="true"
      // Prevent zoom on iOS when focusing input
      style={{ fontSize: isMobile ? "16px" : undefined }}
      // Improve touch experience
      data-gramm="false" // Disable Grammarly overlay on mobile
      data-gramm_editor="false"
    />
  );
}
