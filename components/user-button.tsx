"use client";

import * as React from "react";
import { User, Settings, LogOut, Crown, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import Link from "next/link";

interface UserData {
  name?: string;
  email?: string;
  avatarUrl?: string;
}

interface UserButtonProps {
  isPro?: boolean;
}

export function UserButton({ isPro = false }: UserButtonProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleSignIn = () => {
    router.push("/login");
  };

  const userData: UserData = React.useMemo(() => {
    if (!user) return {};

    return {
      name:
        user.user_metadata?.full_name ||
        user.email?.split("@")[0] ||
        "User",
      email: user.email || "",
      avatarUrl: user.user_metadata?.avatar_url,
    };
  }, [user]);

  if (loading) {
    return (
      <Button
        variant="ghost"
        className="w-full h-auto p-3 justify-start gap-3"
        disabled
      >
        <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
        </div>
      </Button>
    );
  }

  if (!user) {
    return (
      <Button
        onClick={handleSignIn}
        variant="ghost"
        className="w-full h-auto p-3 justify-start gap-3 hover:bg-sidebar-accent"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          <LogIn className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <span className="text-sm font-medium text-sidebar-foreground">
            Sign In
          </span>
          <span className="text-xs text-sidebar-foreground/70 truncate block">
            Access your chats
          </span>
        </div>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto p-3 justify-start gap-3 hover:bg-sidebar-accent"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {userData.avatarUrl ? (
                <img
                  src={userData.avatarUrl}
                  alt={userData.name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                (userData.name || "U").charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {userData.name || "User"}
                </span>
                {isPro && (
                  <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />
                )}
              </div>
              <span className="text-xs text-sidebar-foreground/70 truncate block">
                {isPro ? "Pro" : "Free"}
              </span>
            </div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem>
          <Link href="/settings" className="flex items-center gap-2 w-full">
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        {!isPro && (
          <DropdownMenuItem>
            <Crown className="mr-2 h-4 w-4" />
            <span>Upgrade to Pro</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
