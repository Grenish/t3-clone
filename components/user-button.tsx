"use client";

import * as React from "react";
import { User, Settings, LogOut, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserButtonProps {
  name?: string;
  email?: string;
  isPro?: boolean;
  avatarUrl?: string;
}

export function UserButton({ 
  name = "John Doe", 
  email = "john@example.com", 
  isPro = false,
  avatarUrl 
}: UserButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full h-auto p-3 justify-start gap-3 hover:bg-sidebar-accent"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={name} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-sidebar-foreground truncate">
                  {name}
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
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        {!isPro && (
          <DropdownMenuItem>
            <Crown className="mr-2 h-4 w-4" />
            <span>Upgrade to Pro</span>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
