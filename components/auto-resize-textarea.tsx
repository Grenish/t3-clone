"use client";

import { useRef, useEffect } from "react";

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

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const newHeight = textarea.scrollHeight;
      const maxHeight = 200; // Match the max-h-[200px] value

      if (newHeight <= maxHeight) {
        textarea.style.height = `${newHeight}px`;
        textarea.style.overflowY = "hidden";
      } else {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = "auto";
      }
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.();
    }
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`w-full text-sm resize-none min-h-[50px] max-h-[200px] rounded-lg outline-none border-none ${className}`}
      rows={1}
    />
  );
}
