"use client";

import * as React from "react";
import {
  Plus,
  Search,
  MessageSquare,
  Clock,
  MoreHorizontal,
  Trash2,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserButton } from "@/components/user-button";
import { Limiter } from "@/components/limiter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const chatHistory: Array<{
  id: string;
  title: string;
  timestamp: string;
}> = [];

export function AppSidebar() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Sidebar className="border-r border-sidebar-border/50">
      <SidebarHeader className="border-b border-sidebar-border/50 px-4 py-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">T3</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-sidebar-foreground">
              T3 Chat
            </h1>
            <p className="text-xs text-sidebar-foreground/60">
              AI Assistant Clone
            </p>
          </div>
        </div>
        <Button
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sidebar-foreground/50" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-sidebar-accent/50 border-sidebar-border/50 focus:bg-background transition-colors"
                />
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            Recent
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    <SidebarMenuButton asChild className="group">
                      <a
                        href={`/c/${chat.id}`}
                        className="flex items-center gap-3 p-2 mx-2 rounded-lg hover:bg-sidebar-accent/80 transition-all duration-200"
                      >
                        <div className="w-2 h-2 rounded-full bg-sidebar-foreground/20 group-hover:bg-primary/60 transition-colors" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-sidebar-foreground truncate block leading-tight">
                            {chat.title}
                          </span>
                          <span className="text-xs text-sidebar-foreground/60 mt-0.5 block">
                            {chat.timestamp}
                          </span>
                        </div>
                      </a>
                    </SidebarMenuButton>
                    <SidebarMenuAction className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                          >
                            <MoreHorizontal className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="mr-2 h-3 w-3" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-4 py-8 text-center">
                  <MessageSquare className="w-8 h-8 text-sidebar-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-sidebar-foreground/60">
                    {searchQuery
                      ? "No conversations found"
                      : "No conversations yet"}
                  </p>
                  <p className="text-xs text-sidebar-foreground/40 mt-1">
                    {searchQuery
                      ? "Try a different search term"
                      : "Start a new chat to begin"}
                  </p>
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/50">
        <Limiter className="border-b border-sidebar-border/50" />
        <div className="p-3">
          <UserButton isPro={true} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
