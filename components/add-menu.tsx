"use client";

import { useRef, useEffect } from "react";
import { Image, FileText } from "lucide-react";

interface AddMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
}

export default function AddMenu({ isOpen, onClose, onFileSelect, buttonRef }: AddMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef]);

  if (!isOpen) return null;

  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleDocumentClick = () => {
    documentInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
      onClose();
    }
  };

  return (
    <>
      <div 
        ref={menuRef}
        className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[200px] z-50"
      >
        <button
          onClick={handleImageClick}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm"
        >
          <Image className="w-5 h-5 text-gray-500" />
          <span className="text-gray-700 font-medium">Add Image</span>
        </button>
        
        <button
          onClick={handleDocumentClick}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors text-sm"
        >
          <FileText className="w-5 h-5 text-gray-500" />
          <span className="text-gray-700 font-medium">Add Document</span>
        </button>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
}
