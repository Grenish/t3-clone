"use client";

import { useRef, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Image, FileText, Loader2 } from "lucide-react";

interface AddMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  buttonRef: React.RefObject<HTMLButtonElement>;
  showIconOnly?: boolean;
  isUploading?: boolean;
}

export default function AddMenu({ 
  isOpen, 
  onClose, 
  onFileSelect, 
  buttonRef, 
  showIconOnly = false,
  isUploading = false 
}: AddMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Enhanced click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen && !isUploading) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen, onClose, buttonRef, isUploading]);

  // Calculate menu position
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const button = buttonRef.current;
      const buttonRect = button.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };

      const menuWidth = isMobile ? 180 : 200;
      const menuHeight = 100; // Approximate height for 2 menu items
      
      let left = buttonRect.left;
      let top = buttonRect.top - menuHeight - 4; // Position above button with small gap

      // Adjust horizontal position if menu would overflow
      if (left + menuWidth > viewport.width - 16) {
        left = viewport.width - menuWidth - 16;
      }
      if (left < 16) {
        left = 16;
      }

      // If not enough space above, position below
      if (top < 16) {
        top = buttonRect.bottom + 4; // Position below with small gap
      }

      // If still overflows below, try to fit within viewport
      if (top + menuHeight > viewport.height - 16) {
        // Center vertically if neither above nor below works
        top = Math.max(16, (viewport.height - menuHeight) / 2);
      }

      setMenuPosition({ top, left });
    }
  }, [isOpen, isMobile, buttonRef]);

  const handleImageClick = () => {
    if (isUploading) return;
    imageInputRef.current?.click();
  };

  const handleDocumentClick = () => {
    if (isUploading) return;
    documentInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && !isUploading) {
      // Validate file size (max 100MB for documents, 50MB for images)
      const maxSize = file.type.startsWith('image/') ? 50 * 1024 * 1024 : 100 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File size too large. Maximum allowed: ${maxSize / (1024 * 1024)}MB`);
        return;
      }

      onFileSelect(file);
      onClose();
    }
    // Reset the input value so the same file can be selected again
    event.target.value = '';
  };

  if (!isOpen) return null;

  const menuContent = (
    <>
      <div 
        ref={menuRef}
        className={`fixed bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-[9999] ${
          isMobile ? 'w-44' : 'w-48'
        } ${isUploading ? 'pointer-events-none opacity-75' : ''}`}
        style={{
          top: menuPosition.top,
          left: menuPosition.left,
        }}
      >
        {isUploading && (
          <div className="px-4 py-2.5 text-center">
            <div className="flex items-center gap-2 justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">Uploading...</span>
            </div>
          </div>
        )}
        
        {!isUploading && (
          <>
            <button
              onClick={handleImageClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm active:bg-gray-100 dark:active:bg-gray-700"
            >
              <Image className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              {!showIconOnly && <span className="text-gray-700 dark:text-gray-300 font-medium">Add Image</span>}
            </button>
            
            <button
              onClick={handleDocumentClick}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm active:bg-gray-100 dark:active:bg-gray-700"
            >
              <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
              {!showIconOnly && <span className="text-gray-700 dark:text-gray-300 font-medium">Add Document</span>}
            </button>
          </>
        )}
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
      
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.md,.json,.csv"
        onChange={handleFileChange}
        className="hidden"
        disabled={isUploading}
      />
    </>
  );

  // Use portal to render menu at document.body level
  return typeof window !== 'undefined' ? createPortal(menuContent, document.body) : null;
}
