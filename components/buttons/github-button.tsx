"use client";

import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface GitHubButtonProps {
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export function GitHubButton({ onError, disabled, className }: GitHubButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleGitHubAuth = async () => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        onError?.(error.message);
        setLoading(false);
      }
    } catch (err) {
      onError?.("An unexpected error occurred");
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      type="button"
      className={className}
      onClick={handleGitHubAuth}
      disabled={disabled || loading}
    >
      <Github className="size-4" />
      {loading ? "Connecting..." : "Continue with GitHub"}
    </Button>
  );
}
