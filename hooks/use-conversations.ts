import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';
import { useEffect, useCallback } from 'react';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface ConversationsStore {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  hasFetched: boolean;
  
  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  removeConversation: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setHasFetched: (hasFetched: boolean) => void;
  reset: () => void;
}

// Create Zustand store
const useConversationsStore = create<ConversationsStore>((set, get) => ({
  conversations: [],
  loading: false,
  error: null,
  hasFetched: false,
  
  setConversations: (conversations) => set({ conversations }),
  
  addConversation: (conversation) => set((state) => ({
    conversations: [conversation, ...state.conversations]
  })),
  
  updateConversation: (id, updates) => set((state) => ({
    conversations: state.conversations.map(conv => 
      conv.id === id ? { ...conv, ...updates } : conv
    )
  })),
  
  removeConversation: (id) => set((state) => ({
    conversations: state.conversations.filter(conv => conv.id !== id)
  })),
  
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setHasFetched: (hasFetched) => set({ hasFetched }),
  
  reset: () => set({
    conversations: [],
    loading: false,
    error: null,
    hasFetched: false
  })
}));

export function useConversations() {
  const store = useConversationsStore();
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // Reset store when user logs out
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      store.reset();
    }
  }, [isAuthenticated, authLoading, store.reset]);

  // FIXED: Stable fetch function using useCallback
  const fetchConversations = useCallback(async () => {
    // Use getState() to get fresh state instead of stale closure
    const currentState = useConversationsStore.getState();
    
    if (!isAuthenticated || currentState.loading || currentState.hasFetched) {
      return;
    }
    
    // FIXED: Remove window-based request tracking which was causing issues
    const requestKey = `conversations_fetch_${Date.now()}`;
    
    try {
      store.setLoading(true);
      store.setError(null);
      
      console.log('🔥 Fetching conversations...');
      
      const response = await fetch('/api/conversations', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.status === 401) {
        store.setConversations([]);
        store.setHasFetched(true);
        store.setError('Authentication required');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch conversations`);
      }
      
      const data = await response.json();
      store.setConversations(data.conversations || []);
      store.setHasFetched(true);
      console.log('🔥 Successfully fetched', (data.conversations || []).length, 'conversations');
    } catch (err) {
      console.error('Error fetching conversations:', err);
      store.setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
      store.setConversations([]);
      store.setHasFetched(true);
    } finally {
      store.setLoading(false);
    }
  }, [isAuthenticated, store]);

  // FIXED: Auto-fetch when authenticated - only run once per auth state change
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      // Simple timeout to avoid running multiple times in the same render cycle
      const timeoutId = setTimeout(() => {
        const currentState = useConversationsStore.getState();
        if (!currentState.hasFetched && !currentState.loading) {
          console.log('Auto-fetching conversations after login...');
          fetchConversations();
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isAuthenticated, authLoading, fetchConversations]);

  // FIXED: Stable create conversation function
  const createConversation = useCallback(async (title: string, initialMessage?: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }
    
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          title,
          initialMessage
        }),
      });

      if (response.status === 401) {
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to create conversation`);
      }

      const data = await response.json();
      
      // Add to store immediately for optimistic updates
      store.addConversation(data.conversation);
      
      return data.conversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }, [isAuthenticated, store]);

  // FIXED: Stable delete conversation function
  const deleteConversation = useCallback(async (id: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }

    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.status === 401) {
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to delete conversation`);
      }

      // Remove from store immediately for optimistic updates
      store.removeConversation(id);
      
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }, [isAuthenticated, store]);

  // FIXED: Stable refresh function
  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated) {
      store.setConversations([]);
      store.setError('Authentication required');
      return;
    }

    try {
      store.setLoading(true);
      store.setError(null);
      
      const response = await fetch('/api/conversations', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      if (response.status === 401) {
        store.setConversations([]);
        store.setError('Authentication required');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to refresh conversations`);
      }
      
      const data = await response.json();
      const newConversations = data.conversations || [];
      
      console.log('Refreshed conversations:', newConversations.length);
      store.setConversations(newConversations);
      
    } catch (err) {
      console.error('Error refreshing conversations:', err);
      store.setError(err instanceof Error ? err.message : 'Failed to refresh conversations');
    } finally {
      store.setLoading(false);
    }
  }, [isAuthenticated, store]);

  return {
    conversations: store.conversations,
    loading: store.loading,
    error: store.error,
    isAuthenticated,
    createConversation,
    deleteConversation,
    refreshConversations,
    fetchConversations, // Expose for manual calls if needed
    // Store methods for external components
    setConversations: store.setConversations,
    addConversation: store.addConversation,
    updateConversation: store.updateConversation,
    removeConversation: store.removeConversation,
  };
}