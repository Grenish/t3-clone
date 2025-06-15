"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import ThemeSwitch from "@/components/theme-switch";
import { ErrorBoundary } from "react-error-boundary";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

// Error fallback component for HMR issues
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  // Auto-retry after HMR issues
  if (error.message.includes("module factory is not available") || 
      error.message.includes("HMR update")) {
    setTimeout(resetErrorBoundary, 100);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Refreshing after module update...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-600 mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/signup") || pathname?.startsWith("/settings");

  if (isAuthRoute) {
    return <>{children}</>;
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        console.error("ConditionalLayout error:", error);
      }}
      onReset={() => {
        // Force a re-render to recover from HMR issues
        window.location.reload();
      }}
    >
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-screen">
          <SidebarTrigger className="absolute z-50 top-5 ml-5 cursor-e-resize" size={"icon"}/>
          <div className="fixed top-4 right-4 z-50">
            <ThemeSwitch />
          </div>
          {children}
        </main>
      </SidebarProvider>
    </ErrorBoundary>
  );
}
