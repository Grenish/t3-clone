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
  SidebarHeader,
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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export function AppSidebar() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [realtimeStatus, setRealtimeStatus] = React.useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const router = useRouter();
  const {
    conversations,
    loading,
    error,
    createConversation,
    deleteConversation,
    refreshConversations,
    isAuthenticated,
    setConversations,
    addConversation,
    updateConversation,
    removeConversation,
  } = useConversations();
  
  // Create Supabase client for realtime subscriptions
  const supabase = React.useMemo(() => createClientComponentClient(), []);

  const filteredHistory = React.useMemo(() => 
    conversations.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase())
    ), [conversations, searchQuery]);

  // FIXED: Stable realtime subscription setup with useCallback
  const setupRealtimeSubscription = React.useCallback(() => {
    if (!isAuthenticated) {
      setRealtimeStatus('disconnected');
      return null;
    }
    
    setRealtimeStatus('connecting');
    
    // Subscribe to conversation changes in realtime
    const conversationChannel = supabase
      .channel('conversations_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('🔄 Realtime conversation change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newConversation = payload.new as any;
            addConversation(newConversation);
          } else if (payload.eventType === 'UPDATE') {
            const updatedConversation = payload.new as any;
            updateConversation(updatedConversation.id, updatedConversation);
          } else if (payload.eventType === 'DELETE') {
            const deletedConversation = payload.old as any;
            removeConversation(deletedConversation.id);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          console.log('🟢 Sidebar subscribed to realtime updates');
        } else if (status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected');
          console.log('🔴 Sidebar realtime subscription error');
        }
      });
    
    return conversationChannel;
  }, [isAuthenticated, supabase, addConversation, updateConversation, removeConversation]);

  // Set up Supabase realtime subscriptions
  React.useEffect(() => {
    const channel = setupRealtimeSubscription();
    
    // Clean up subscription on unmount
    return () => {
      if (channel) {
        console.log('🧹 Cleaning up sidebar realtime subscription');
        supabase.removeChannel(channel);
        setRealtimeStatus('disconnected');
      }
    };
  }, [setupRealtimeSubscription, supabase]);

  // FIXED: Stable event handlers using useCallback
  const handleConversationUpdate = React.useCallback((event: CustomEvent) => {
    const { id, title } = event.detail;
    console.log('📻 Legacy conversation update event:', { id, title });
    updateConversation(id, { title });
  }, [updateConversation]);

  const handleNewConversation = React.useCallback((event: CustomEvent) => {
    const conversation = event.detail;
    console.log('📻 Legacy new conversation event:', conversation);
    addConversation(conversation);
  }, [addConversation]);

  // Legacy event listener for backward compatibility with chat pages
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('conversationUpdated', handleConversationUpdate as EventListener);
      window.addEventListener('newConversationCreated', handleNewConversation as EventListener);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('conversationUpdated', handleConversationUpdate as EventListener);
        window.removeEventListener('newConversationCreated', handleNewConversation as EventListener);
      }
    };
  }, [handleConversationUpdate, handleNewConversation]);

  // FIXED: Simplified fallback polling - only when needed
  React.useEffect(() => {
    if (!isAuthenticated) return;

    // Fallback refresh every 2 minutes (120000ms) ONLY when realtime is disconnected
    const interval = setInterval(() => {
      if (realtimeStatus === 'disconnected') {
        console.log('⚠️ Realtime disconnected, falling back to polling');
        refreshConversations();
      }
    }, 120000); // 2 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, realtimeStatus, refreshConversations]);

  // FIXED: Stable handlers using useCallback
  const handleRefresh = React.useCallback(() => {
    console.log('🔄 Manual refresh requested');
    refreshConversations();
  }, [refreshConversations]);

  const handleDeleteConversation = React.useCallback(async (conversationId: string) => {
    try {
      await deleteConversation(conversationId);
      console.log('✅ Successfully deleted conversation:', conversationId);
    } catch (error) {
      console.error('❌ Failed to delete conversation:', error);
    }
  }, [deleteConversation]);

  const handleCreateNewConversation = React.useCallback(async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      const newConversation = await createConversation('New Chat');
      router.push(`/c/${newConversation.id}`);
    } catch (error) {
      console.error('Failed to create new conversation:', error);
    }
  }, [isAuthenticated, createConversation, router]);

  // Optimized conversation grouping with memoization
  const groupedConversations = React.useMemo(() => {
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

    filteredHistory.forEach((conversation) => {
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
  }, [filteredHistory]);

  // Optimized timestamp formatting with memoization
  const formatTimestamp = React.useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, []);

  const handleNewChat = async () => {
    router.push("/");
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (confirm("Are you sure you want to delete this conversation?")) {
      try {
        await deleteConversation(chatId);
        // Refresh immediately after deletion
        setTimeout(() => refreshConversations(), 100);
      } catch (error) {
        console.error("Failed to delete chat:", error);
        if (error instanceof Error && error.message === "Authentication required") {
          router.push("/login");
        }
      }
    }
  };

  // Memoized ConversationGroup component for better performance
  const ConversationGroup = React.memo(({ title, conversations, icon: Icon }: { 
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
  });

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
                      {/* Realtime status indicator */}
                      <div className="ml-1.5 flex items-center" title={`Realtime ${realtimeStatus}`}>
                        {realtimeStatus === 'connected' && (
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                        )}
                        {realtimeStatus === 'connecting' && (
                          <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                        )}
                        {realtimeStatus === 'disconnected' && (
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={handleRefresh}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-sidebar-accent/30"
                      title="Refresh conversations"
                    >
                      <RefreshCw className="h-3 w-3 text-sidebar-foreground/50" />
                    </Button>
                  </div>
                  
                  <ConversationGroup title="Today" conversations={groupedConversations.today} icon={Calendar} />
                  <ConversationGroup title="Yesterday" conversations={groupedConversations.yesterday} icon={Clock} />
                  <ConversationGroup title="Last 7 days" conversations={groupedConversations.lastWeek} icon={History} />
                  <ConversationGroup title="Last 30 days" conversations={groupedConversations.lastMonth} icon={History} />
                  <ConversationGroup title="Older" conversations={groupedConversations.older} icon={History} />
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
