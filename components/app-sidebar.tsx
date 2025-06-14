"use client";

import * as React from "react";
import {
  Plus,
  Search,
  MessageSquare,
  Clock,
  MoreHorizontal,
  Trash2,
  Loader2,
  RefreshCw,
  Calendar,
  History,
} from "lucide-react";
import { useRouter } from "next/navigation";

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
import { useConversations } from "@/hooks/use-conversations";

export function AppSidebar() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const router = useRouter();
  const {
    conversations,
    loading,
    error,
    createConversation,
    deleteConversation,
    refreshConversations,
    isAuthenticated,
  } = useConversations();

  const filteredHistory = conversations.filter((chat) =>
    chat.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group conversations by time periods
  const groupConversationsByTime = (conversations: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setDate(lastMonth.getDate() - 30);

    const groups = {
      today: [] as any[],
      yesterday: [] as any[],
      lastWeek: [] as any[],
      lastMonth: [] as any[],
      older: [] as any[],
    };

    conversations.forEach((conversation) => {
      const date = new Date(conversation.updated_at);
      if (date >= today) {
        groups.today.push(conversation);
      } else if (date >= yesterday) {
        groups.yesterday.push(conversation);
      } else if (date >= lastWeek) {
        groups.lastWeek.push(conversation);
      } else if (date >= lastMonth) {
        groups.lastMonth.push(conversation);
      } else {
        groups.older.push(conversation);
      }
    });

    return groups;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleNewChat = async () => {
    router.push("/");
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm("Are you sure you want to delete this conversation?")) {
      try {
        await deleteConversation(chatId);
      } catch (error) {
        console.error("Failed to delete chat:", error);
        if (error instanceof Error && error.message === "Authentication required") {
          router.push("/login");
        }
      }
    }
  };

  const handleRefresh = () => {
    console.log("Refreshing conversations...");
    refreshConversations();
  };

  const ConversationGroup = ({ title, conversations, icon: Icon }: { 
    title: string; 
    conversations: any[]; 
    icon: React.ElementType;
  }) => {
    if (conversations.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 px-2 py-1 mb-1">
          <Icon className="w-3 h-3 text-sidebar-foreground/50" />
          <span className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wide">
            {title}
          </span>
          <div className="flex-1 h-px bg-sidebar-border/20 ml-1" />
          <span className="text-xs text-sidebar-foreground/40">
            {conversations.length}
          </span>
        </div>
        <div className="space-y-0.5">
          {conversations.map((chat) => (
            <div key={chat.id} className="group relative">
              <a
                href={`/c/${chat.id}`}
                className="flex items-center gap-2 p-2 mx-1 rounded-lg hover:bg-sidebar-accent/50 transition-all duration-150 border border-transparent hover:border-sidebar-border/10"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 group-hover:bg-emerald-500 transition-colors flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-sidebar-foreground truncate leading-4 mb-0.5">
                    {chat.title}
                  </div>
                  <div className="text-xs text-sidebar-foreground/40 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTimestamp(chat.updated_at)}
                  </div>
                </div>
              </a>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-6 w-6 hover:bg-sidebar-accent rounded-md flex items-center justify-center transition-colors">
                      <MoreHorizontal className="h-3 w-3 text-sidebar-foreground/50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="start" className="w-40">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive text-sm"
                      onClick={(e) => handleDeleteChat(chat.id, e)}
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <Sidebar className="border-r border-sidebar-border/20">
        <SidebarHeader className="border-b border-sidebar-border/20 px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-sm">T3</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-sidebar-foreground">
                  T3 Chat
                </h1>
                <p className="text-xs text-sidebar-foreground/50">
                  AI Assistant
                </p>
              </div>
            </div>
            <Button
              onClick={handleNewChat}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-sidebar-accent/50 rounded-lg"
            >
              <Plus className="w-4 h-4 text-sidebar-foreground/70" />
            </Button>
          </div>
          <div className="flex items-center justify-center py-6">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-sidebar-foreground/50" />
              <p className="text-xs text-sidebar-foreground/50">Initializing...</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-2">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-sidebar-accent/30 flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="w-5 h-5 text-sidebar-foreground/30" />
              </div>
              <p className="text-xs text-sidebar-foreground/50">Loading conversations...</p>
            </div>
          </div>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border/20">
          <Limiter className="border-b border-sidebar-border/20" />
        </SidebarFooter>
      </Sidebar>
    );
  }

  return (
    <Sidebar className="border-r border-sidebar-border/20">
      <SidebarHeader className="border-b border-sidebar-border/20 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-sm">T3</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">
                T3 Chat
              </h1>
              <p className="text-xs text-sidebar-foreground/50">
                AI Assistant
              </p>
            </div>
          </div>
          <Button
            onClick={handleNewChat}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-sidebar-accent/50 rounded-lg transition-colors"
            title="New Chat"
          >
            <Plus className="w-4 h-4 text-sidebar-foreground/70" />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        {/* Only show search and conversations for authenticated users */}
        {isAuthenticated && (
          <>
            <div className="px-2 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-sidebar-foreground/40" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-8 bg-sidebar-accent/20 border-sidebar-border/30 focus:bg-background transition-all duration-150 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="px-1">
              {loading ? (
                <div className="text-center py-8">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-6 h-6 text-sidebar-foreground/30 animate-spin" />
                    <div>
                      <p className="text-xs font-medium text-sidebar-foreground/60 mb-1">
                        Loading conversations
                      </p>
                      <p className="text-xs text-sidebar-foreground/40">
                        Please wait...
                      </p>
                    </div>
                  </div>
                </div>
              ) : error ? (
                <div className="text-center py-8 px-3">
                  <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-red-500" />
                  </div>
                  <h3 className="text-xs font-semibold text-sidebar-foreground mb-1">
                    Failed to load
                  </h3>
                  <p className="text-xs text-sidebar-foreground/50 mb-3 leading-relaxed">
                    {error}
                  </p>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="sm"
                    className="h-7 px-3 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              ) : filteredHistory.length > 0 ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between px-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <History className="w-3.5 h-3.5 text-sidebar-foreground/50" />
                      <span className="text-xs font-medium text-sidebar-foreground/70">
                        History
                      </span>
                    </div>
                    <Button
                      onClick={handleRefresh}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-sidebar-accent/30"
                    >
                      <RefreshCw className="h-3 w-3 text-sidebar-foreground/50" />
                    </Button>
                  </div>
                  
                  {(() => {
                    const groups = groupConversationsByTime(filteredHistory);
                    return (
                      <>
                        <ConversationGroup title="Today" conversations={groups.today} icon={Calendar} />
                        <ConversationGroup title="Yesterday" conversations={groups.yesterday} icon={Clock} />
                        <ConversationGroup title="Last 7 days" conversations={groups.lastWeek} icon={History} />
                        <ConversationGroup title="Last 30 days" conversations={groups.lastMonth} icon={History} />
                        <ConversationGroup title="Older" conversations={groups.older} icon={History} />
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 px-3">
                  <div className="w-12 h-12 rounded-full bg-sidebar-accent/20 flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-sidebar-foreground/30" />
                  </div>
                  <h3 className="text-xs font-semibold text-sidebar-foreground mb-1">
                    {searchQuery ? "No matches" : "No conversations"}
                  </h3>
                  <p className="text-xs text-sidebar-foreground/50 mb-3 leading-relaxed max-w-40 mx-auto">
                    {searchQuery
                      ? "Try different search terms"
                      : "Start chatting to see your history"}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={handleNewChat}
                      variant="outline"
                      size="sm"
                      className="h-7 px-3 text-xs"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Start Chat
                    </Button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {/* Show sign-in prompt for unauthenticated users */}
        {!isAuthenticated && (
          <div className="text-center py-8 px-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-sm font-semibold text-sidebar-foreground mb-2">
              Welcome to T3 Chat
            </h3>
            <p className="text-xs text-sidebar-foreground/60 mb-4 leading-relaxed">
              Sign in to access your conversation history and preferences.
            </p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-sm hover:shadow-md transition-all duration-150 h-8 text-xs"
              size="sm"
            >
              Get Started
            </Button>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border/20">
        <Limiter className="border-b border-sidebar-border/20" />
        <div className="p-3">
          <UserButton isPro={true} />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
