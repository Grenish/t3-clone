"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Zap, Crown } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface LimiterProps {
  className?: string;
}

export function Limiter({ className }: LimiterProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isPro, setIsPro] = useState(false);
  // Disabled - always show 0 usage
  const [apiUsage] = useState(0);
  const [maxLimit, setMaxLimit] = useState(5);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const authenticated = !!user;
      setIsAuthenticated(authenticated);
      
      const isProUser = user?.user_metadata?.is_pro || false;
      setIsPro(isProUser);
      
      // Set limits based on user type (for display only)
      let limit = 5; // Guest users
      if (authenticated) {
        limit = isProUser ? 50 : 20; // Pro users get 50, regular users get 20
      }
      setMaxLimit(limit);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAuth();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Disabled functions - always allow API calls
  const incrementUsage = () => {
    // Disabled - do nothing
  };

  const canMakeApiCall = () => {
    // Disabled - always return true
    return true;
  };

  // Expose disabled functions globally
  useEffect(() => {
    (window as any).incrementApiUsage = incrementUsage;
    (window as any).canMakeApiCall = canMakeApiCall;
  }, []);

  const progressPercentage = 0; // Always 0 when disabled
  const isNearLimit = false;
  const isAtLimit = false;

  if (isAuthenticated === null) {
    return null; // Loading
  }

  return (
    <div className={`p-3 space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isPro ? (
            <Crown className="w-4 h-4 text-yellow-500" />
          ) : isAuthenticated ? (
            <Zap className="w-4 h-4 text-blue-500" />
          ) : (
            <Zap className="w-4 h-4 text-gray-500" />
          )}
          <span className="text-sm font-medium text-sidebar-foreground">
            API Usage
          </span>
        </div>
        <Badge 
          variant="outline"
          className="text-xs"
        >
          {apiUsage}/{maxLimit}
        </Badge>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={progressPercentage} 
          className="h-2"
        />
        
        <div className="flex items-center justify-between text-xs text-sidebar-foreground/60">
          <span>
            {isPro ? "Pro user" : isAuthenticated ? "Logged in user" : "Guest user"}
          </span>
          <span className="text-xs text-sidebar-foreground/40">
            Limiter disabled
          </span>
        </div>
        
        {!isAuthenticated && (
          <div className="text-xs text-sidebar-foreground/60">
            Sign in to get 20 daily requests
          </div>
        )}
        
        {isAuthenticated && !isPro && (
          <div className="text-xs text-sidebar-foreground/60">
            Upgrade to Pro for 50 daily requests
          </div>
        )}
      </div>
    </div>
  );
}
