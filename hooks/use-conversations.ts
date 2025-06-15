import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './use-auth';

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false); // Add flag to prevent repeated calls
  
  // Use the shared auth hook
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  const fetchConversations = useCallback(async () => {
    // Don't fetch if not authenticated, already loading, or already fetched
    if (!isAuthenticated || loading || hasFetched) {
      return;
    }
    
    // CRITICAL FIX: Global request deduplication for conversations fetch
    const requestKey = 'conversations_fetch_request';
    if ((window as any)[requestKey]) {
      console.log('Conversations fetch already in progress, skipping duplicate request');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Mark request as in progress globally
      (window as any)[requestKey] = {
        timestamp: Date.now(),
        type: 'fetch_conversations'
      };
      
      const response = await fetch('/api/conversations', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.status === 401) {
        // User is not authenticated, clear conversations and stop trying
        setConversations([]);
        setHasFetched(true); // Mark as fetched to prevent retries
        setError('Authentication required');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch conversations`);
      }
      
      const data = await response.json();
      setConversations(data.conversations || []);
      setHasFetched(true); // Mark as successfully fetched
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch conversations');
      setConversations([]);
      setHasFetched(true); // Mark as fetched even on error to prevent infinite retries
    } finally {
      setLoading(false);
      // Clear the global request lock
      delete (window as any)[requestKey];
    }
  }, [isAuthenticated, loading, hasFetched]);

  // Clear conversations and reset fetch flag when user logs out
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      setConversations([]);
      setLoading(false);
      setHasFetched(false); // Reset fetch flag when user logs out
      setError(null);
    }
  }, [isAuthenticated, authLoading]);

  // Only fetch conversations when user becomes authenticated and we haven't fetched yet
  useEffect(() => {
    if (isAuthenticated && !authLoading && !hasFetched && !loading) {
      fetchConversations();
    }
  }, [isAuthenticated, authLoading, hasFetched, loading, fetchConversations]);

  const createConversation = async (title: string, initialMessage?: string) => {
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
          initialMessage // Add initialMessage support
        }),
      });

      if (response.status === 401) {
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create conversation');
      }

      const data = await response.json();
      
      // Add the new conversation to the list
      setConversations(prev => [data.conversation, ...prev]);
      
      return data.conversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
      throw err;
    }
  };

  const deleteConversation = async (id: string) => {
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
        throw new Error('Failed to delete conversation');
      }

      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== id));
    } catch (err) {
      console.error('Error deleting conversation:', err);
      throw err;
    }
  };

  const updateConversationTitle = async (id: string, title: string) => {
    if (!isAuthenticated) {
      throw new Error('Authentication required');
    }
    
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      });

      if (response.status === 401) {
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        throw new Error('Failed to update conversation title');
      }

      // Update local state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === id ? { ...conv, title } : conv
        )
      );
    } catch (err) {
      console.error('Error updating conversation title:', err);
      throw err;
    }
  };

  // Function to manually refresh conversations
  const refreshConversations = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Refreshing conversations...');
      
      const response = await fetch('/api/conversations', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
      
      if (response.status === 401) {
        setConversations([]);
        setError('Authentication required');
        return;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to refresh conversations`);
      }
      
      const data = await response.json();
      const newConversations = data.conversations || [];
      
      console.log('Fetched conversations:', newConversations.length);
      setConversations(newConversations);
      
    } catch (err) {
      console.error('Error refreshing conversations:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh conversations');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  return {
    conversations,
    loading,
    error,
    fetchConversations,
    createConversation,
    deleteConversation,
    updateConversationTitle,
    refreshConversations,
    isAuthenticated,
    user,
  };
}