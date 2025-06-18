"use client";

import { useState } from "react";
import { Download, X, Calendar, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

interface ImageGalleryProps {
  images: Array<{
    id: string;
    image_url: string;
    alt_text?: string;
    created_at: string;
    messages?: {
      conversation_id: string;
      conversations?: {
        title?: string;
      };
    };
  }>;
}

interface ImageModalProps {
  image: {
    id: string;
    image_url: string;
    alt_text?: string;
    created_at: string;
    messages?: {
      conversation_id: string;
      conversations?: {
        title?: string;
      };
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

const ImageModal = ({ image, isOpen, onClose }: ImageModalProps) => {
  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(image.image_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${image.alt_text || 'generated-image'}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const conversationTitle = image.messages?.conversations?.title || 'Untitled Conversation';

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-50">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10 z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="absolute top-6 right-20 p-3 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10 z-10"
      >
        <Download className="w-6 h-6" />
      </button>

      {/* Image container */}
      <div className="relative max-w-[95vw] max-h-[95vh] flex flex-col">
        {/* Image */}
        <div className="flex-1 flex items-center justify-center p-4">
          <img
            src={image.image_url}
            alt={image.alt_text || 'Generated image'}
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTZMMTMuNTg1OCA2LjQxNDIxQzE0LjM2NjggNS42MzMxNyAxNS42MzMyIDUuNjMzMTcgMTYuNDE0MiA2LjQxNDIxTDIwIDE0TTEyIDlIOS4wMUMxMC42OTI5IDkuMDAwNzMgMTIgMTAuMzA3NCAxMiAxMlYxMk0xMiA5VjEyTTEyIDlDMTIgNy4zNDMxNSAxMC42NTY5IDYgOSA2UzYgNy4zNDMxNSA2IDlTNy4zNDMxNSAxMiA9IDEySDEyTTIwIDEyVjE4QTIgMiAwIDAxMTggMjBINkEyIDIgMCAwMTQgMThWOEEyIDIgMCAwMTYgNkgxMkEyIDIgMCAwMTE0IDhWMTJIMjBaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
            }}
          />
        </div>

        {/* Image info */}
        <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-md rounded-xl p-4 text-white">
          <h3 className="text-lg font-semibold mb-2 truncate">
            {image.alt_text || 'Generated Image'}
          </h3>
          <div className="flex items-center gap-6 text-sm text-white/80">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(image.created_at).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </span>
            <span className="flex items-center gap-2 truncate">
              <MessageSquare className="w-4 h-4" />
              <span className="truncate">{conversationTitle}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ImageGallery = ({ images }: ImageGalleryProps) => {
  const [selectedImage, setSelectedImage] = useState<typeof images[0] | null>(null);

  if (images.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-6">
          <svg
            className="w-12 h-12 text-slate-400 dark:text-slate-500"
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
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
          No images yet
        </h3>
        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
          Images you generate in conversations will appear here. Start a conversation and ask for an image to see them here.
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {images.map((image) => {
          const conversationTitle = image.messages?.conversations?.title || 'Untitled Conversation';
          
          return (
            <div
              key={image.id}
              className="group relative break-inside-avoid cursor-pointer"
              onClick={() => setSelectedImage(image)}
            >
              {/* Image container with masonry layout */}
              <div className="relative overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                <img
                  src={image.image_url}
                  alt={image.alt_text || 'Generated image'}
                  className="w-full object-cover transition-all duration-700 group-hover:brightness-75"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1zbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgMTZMMTMuNTg1OCA2LjQxNDIxQzE0LjM2NjggNS42MzMxNyAxNS42MzMyIDUuNjMzMTcgMTYuNDE0MiA2LjQxNDIxTDIwIDE0TTEyIDlIOS4wMUMxMC42OTI5IDkuMDAwNzMgMTIgMTAuMzA3NCAxMiAxMlYxMk0xMiA5VjEyTTEyIDlDMTIgNy4zNDMxNSAxMC42NTY5IDYgOSA2UzYgNy4zNDMxNSA2IDlTNy4zNDMxNSAxMiA5IDEySDEyTTIwIDEyVjE4QTIgMiAwIDAxMTggMjBINkEyIDIgMCAwMTQgMThWOEEyIDIgMCAwMTYgNkgxMkEyIDIgMCAwMTE0IDhWMTJIMjBaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                  }}
                />
                
                {/* Subtle hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                
                {/* Image info on hover */}
                <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                    <h4 className="font-medium text-slate-900 dark:text-white text-sm line-clamp-2 mb-2">
                      {image.alt_text || 'Generated Image'}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(image.created_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="truncate ml-2 max-w-24" title={conversationTitle}>
                        {conversationTitle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subtle glow effect on hover */}
                <div className="absolute inset-0 rounded-2xl ring-1 ring-transparent group-hover:ring-blue-500/20 group-hover:shadow-lg group-hover:shadow-blue-500/10 transition-all duration-500" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Full-screen Modal */}
      <ImageModal
        image={selectedImage!}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
};

export default ImageGallery;