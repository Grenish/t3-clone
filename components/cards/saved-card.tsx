interface SavedCardProps {
  memoryKey: string;
  memoryValue: string;
  memoryType?: string;
  message?: string;
}

export default function SavedCard({ 
  memoryKey, 
  memoryValue, 
  memoryType = "custom",
  message = "I'll remember that for our future conversations!"
}: SavedCardProps) {
  return (
    <div className="border rounded-lg p-4 max-w-2xl bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <p className="text-blue-800 dark:text-blue-200 text-sm font-medium mb-1">
            Memory Saved
          </p>
          <p className="text-blue-700 dark:text-blue-300 text-sm">
            {message}
          </p>
          <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
            <span className="font-medium">Remembered:</span> {memoryValue}
          </div>
        </div>
      </div>
    </div>
  );
}
