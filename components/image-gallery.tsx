"use client";

import { useState } from "react";
import { Download, Eye, Calendar, MessageSquare, X } from "lucide-react";

interface ImageGalleryProps {
  images: Array<{
    id: string;
    file_name: string;
    url: string;
    created_at: string;
    conversation_title: string;
    conversation_id?: string;
  }>;
}

interface ImageModalProps {
  image: {
    id: string;
    file_name: string;
    url: string;
    created_at: string;
    conversation_title: string;
    conversation_id?: string;
  };
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal = ({ image, isOpen, onClose }: ImageModalProps) => {
  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.file_name || 'generated-image'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-full bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
              {image.file_name}
            </h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(image.created_at).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-4 h-4" />
                {image.conversation_title}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="p-4">
          <img
            src={image.url}
            alt={image.file_name}
            className="max-w-full max-h-[70vh] object-contain mx-auto rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTZMMTMuNTg1OCA2LjQxNDIxQzE0LjM2NjggNS42MzMxNyAxNS42MzMyIDUuNjMzMTcgMTYuNDE0MiA2LjQxNDIxTDIwIDE0TTEyIDlIOS4wMUMxMC42OTI5IDkuMDAwNzMgMTIgMTAuMzA3NCAxMiAxMlYxMk0xMiA5VjEyTTEyIDlDMTIgNy4zNDMxNSAxMC42NTY5IDYgOSA2UzYgNy4zNDMxNSA2IDlTNy4zNDMxNSAxMiA5IDEySDEyTTIwIDEyVjE4QTIgMiAwIDAxMTggMjBINkEyIDIgMCAwMTQgMThWOEEyIDIgMCAwMTYgNkgxMkEyIDIgMCAwMTE0IDhWMTJIMjBaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
            }}
          />
        </div>
      </div>
    </div>
  );
};

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<typeof images[0] | null>(null);

  const handleDownload = async (image: typeof images[0], e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.file_name || 'generated-image'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg
            className="w-16 h-16 mx-auto"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V5a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No images generated yet
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          When you generate images in your conversations, they'll appear here for easy viewing and downloading.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
            onClick={() => setSelectedImage(image)}
          >
            {/* Image */}
            <div className="aspect-square relative overflow-hidden">
              <img
                src={image.url}
                alt={image.file_name}
                className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTZMMTMuNTg1OCA2LjQxNDIxQzE0LjM2NjggNS42MzMxNyAxNS42MzMyIDUuNjMzMTcgMTYuNDE0MiA2LjQxNDIxTDIwIDE0TTEyIDlIOS4wMUMxMC42OTI5IDkuMDAwNzMgMTIgMTAuMzA3NCAxMiAxMlYxMk0xMiA5VjEyTTEyIDlDMTIgNy4zNDMxNSAxMC42NTY5IDYgOSA2UzYgNy4zNDMxNSA2IDlTNy4zNDMxNSAxMiA5IDEySDEyTTIwIDEyVjE4QTIgMiAwIDAxMTggMjBINkEyIDIgMCAwMTQgMThWOEEyIDIgMCAwMTYgNkgxMkEyIDIgMCAwMTE0IDhWMTJIMjBaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                }}
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImage(image);
                    }}
                    className="p-2 bg-white/90 hover:bg-white text-gray-800 rounded-full transition-colors"
                    title="View full size"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDownload(image, e)}
                    className="p-2 bg-white/90 hover:bg-white text-gray-800 rounded-full transition-colors"
                    title="Download image"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Image Info */}
            <div className="p-3">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                {image.file_name}
              </h4>
              <div className="flex items-center justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{new Date(image.created_at).toLocaleDateString()}</span>
                <span className="truncate ml-2 max-w-20">
                  {image.conversation_title}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <ImageModal
        image={selectedImage!}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
};

export default ImageGallery;