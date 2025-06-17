"use client";

import { FileText, Image, Download, ExternalLink } from "lucide-react";
import { useTheme } from "@/util/theme-provider";

interface FileAttachmentProps {
  filename: string;
  fileType: string;
  size?: number;
  documentUrl?: string;
  isLoading?: boolean;
}

export default function FileAttachment({ 
  filename, 
  fileType, 
  size, 
  documentUrl,
  isLoading = false 
}: FileAttachmentProps) {
  const { isDarkMode } = useTheme();

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = () => {
    if (fileType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const getDisplayName = () => {
    if (filename.length > 25) {
      const parts = filename.split('.');
      const extension = parts.pop();
      const name = parts.join('.');
      return `${name.substring(0, 20)}...${extension ? `.${extension}` : ''}`;
    }
    return filename;
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (documentUrl) {
      if (fileType.startsWith('image/')) {
        // For images, open in a new tab
        window.open(documentUrl, '_blank');
      } else {
        // For other files, try to view directly
        window.open(documentUrl, '_blank');
      }
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-all hover:scale-105 max-w-xs ${
        isDarkMode
          ? "bg-gray-700/60 border-gray-600 hover:bg-gray-700"
          : "bg-gray-50 border-gray-200 hover:bg-gray-100"
      } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <div className={`flex-shrink-0 ${
        isDarkMode ? "text-gray-400" : "text-gray-500"
      }`}>
        {getFileIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium truncate ${
          isDarkMode ? "text-gray-300" : "text-gray-700"
        }`}>
          {getDisplayName()}
        </div>
        {size && (
          <div className={`text-xs ${
            isDarkMode ? "text-gray-500" : "text-gray-500"
          }`}>
            {formatFileSize(size)}
          </div>
        )}
      </div>

      {documentUrl && !isLoading && (
        <div className="flex items-center gap-1">
          {fileType.startsWith('image/') ? (
            <button
              onClick={handleView}
              className={`p-1 rounded hover:scale-110 transition-transform ${
                isDarkMode
                  ? "text-gray-400 hover:text-blue-400"
                  : "text-gray-500 hover:text-blue-600"
              }`}
              title="View image"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          ) : (
            <button
              onClick={handleDownload}
              className={`p-1 rounded hover:scale-110 transition-transform ${
                isDarkMode
                  ? "text-gray-400 hover:text-blue-400"
                  : "text-gray-500 hover:text-blue-600"
              }`}
              title="Open file"
            >
              <Download className="w-3 h-3" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}