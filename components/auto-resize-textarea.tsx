"use client";

import { useRef, useEffect } from "react";

interface AutoResizeTextareaProps {
  placeholder?: string;
  className?: string;
  onChange?: (value: string) => void;
  value?: string;
}

export default function AutoResizeTextarea({
  placeholder = "Type your message here...",
  className = "",
  onChange,
  value,
}: AutoResizeTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    adjustHeight();
    onChange?.(e.target.value);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={`w-full text-sm resize-none overflow-hidden min-h-[50px] max-h-[200px] rounded-lg outline-none border-none ${className}`}
      rows={1}
    />
  );
}
