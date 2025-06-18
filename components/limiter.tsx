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
  const [apiUsage, setApiUsage] = useState(0);
  const [maxLimit, setMaxLimit] = useState(5);
  const [userId, setUserId] = useState<string | null>(null);

  // Get storage key based on user type
  const getStorageKey = () => {
    if (userId) {
      return `api_usage_${userId}`;
    }
    return "api_usage_guest";
  };

  // Get today's date string for daily reset
  const getTodayString = () => {
    return new Date().toDateString();
  };

  // Load usage from localStorage
  const loadUsage = () => {
    try {
      const storageKey = getStorageKey();
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        // Check if it's a new day
        if (data.date === getTodayString()) {
          setApiUsage(data.usage || 0);
        } else {
          // Reset for new day
          setApiUsage(0);
          saveUsage(0);
        }
      } else {
        setApiUsage(0);
      }
    } catch (error) {
      console.error("Error loading API usage:", error);
      setApiUsage(0);
    }
  };

  // Save usage to localStorage
  const saveUsage = (usage: number) => {
    try {
      const storageKey = getStorageKey();
      const data = {
        usage,
        date: getTodayString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error("Error saving API usage:", error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const authenticated = !!user;
      setIsAuthenticated(authenticated);
      setUserId(user?.id || null);

      const isProUser = user?.user_metadata?.is_pro || false;
      setIsPro(isProUser);

      // Set limits based on user type
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

  // Load usage when user or auth state changes
  useEffect(() => {
    if (isAuthenticated !== null) {
      loadUsage();
    }
  }, [isAuthenticated, userId]);

  // Increment usage function
  const incrementUsage = () => {
    const newUsage = apiUsage + 1;
    setApiUsage(newUsage);
    saveUsage(newUsage);
  };

  // Check if user can make API call
  const canMakeApiCall = () => {
    return apiUsage < maxLimit;
  };

  // Expose functions globally
  useEffect(() => {
    (window as any).incrementApiUsage = incrementUsage;
    (window as any).canMakeApiCall = canMakeApiCall;
  }, [apiUsage, maxLimit]);

  const progressPercentage = (apiUsage / maxLimit) * 100;
  const isNearLimit = progressPercentage >= 80;
  const isAtLimit = apiUsage >= maxLimit;

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
          variant={
            isAtLimit
              ? "destructive"
              : isNearLimit
              ? "default"
              : "outline"
          }
          className="text-xs"
        >
          {apiUsage}/{maxLimit}
        </Badge>
      </div>

      <div className="space-y-2">
        <Progress
          value={progressPercentage}
          className={`h-2 ${
            isAtLimit
              ? "bg-red-100 dark:bg-red-900/20"
              : isNearLimit
              ? "bg-yellow-100 dark:bg-yellow-900/20"
              : ""
          }`}
        />

        <div className="flex items-center justify-between text-xs text-sidebar-foreground/60">
          <span>
            {isPro
              ? "Pro user"
              : isAuthenticated
              ? "Logged in user"
              : "Guest user"}
          </span>
          {isAtLimit ? (
            <span className="text-xs text-red-500 dark:text-red-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Limit reached
            </span>
          ) : isNearLimit ? (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">
              {maxLimit - apiUsage} left
            </span>
          ) : (
            <span className="text-xs text-green-600 dark:text-green-400">
              {maxLimit - apiUsage} remaining
            </span>
          )}
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

        {isAtLimit && (
          <div className="text-xs text-red-500 dark:text-red-400">
            Daily limit reached.{" "}
            {isAuthenticated
              ? isPro
                ? "Contact support for assistance."
                : "Upgrade to Pro for more requests."
              : "Sign in for more requests."}
          </div>
        )}
      </div>
    </div>
  );
}
