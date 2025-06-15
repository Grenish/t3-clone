import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface ConversationState {
  currentConversationId: string;
  conversationExists: boolean;
  isCreatingConversation: boolean;
  titleGenerated: boolean;
  conversationTitle: string;
  
  // Actions
  setCurrentConversationId: (id: string) => void;
  setConversationExists: (exists: boolean) => void;
  setIsCreatingConversation: (creating: boolean) => void;
  setTitleGenerated: (generated: boolean) => void;
  setConversationTitle: (title: string) => void;
  
  // Reset function
  resetConversation: () => void;
}

export const useConversationStore = create<ConversationState>()(
  subscribeWithSelector((set, get) => ({
    currentConversationId: '',
    conversationExists: false,
    isCreatingConversation: false,
    titleGenerated: false,
    conversationTitle: 'New Chat',
    
    setCurrentConversationId: (id: string) => {
      console.log('🔥 Zustand: Setting conversation ID:', id);
      set({ currentConversationId: id });
    },
    
    setConversationExists: (exists: boolean) => {
      console.log('🔥 Zustand: Setting conversation exists:', exists);
      set({ conversationExists: exists });
    },
    
    setIsCreatingConversation: (creating: boolean) => {
      console.log('🔥 Zustand: Setting creating conversation:', creating);
      set({ isCreatingConversation: creating });
    },
    
    setTitleGenerated: (generated: boolean) => {
      console.log('🔥 Zustand: Setting title generated:', generated);
      set({ titleGenerated: generated });
    },
    
    setConversationTitle: (title: string) => {
      console.log('🔥 Zustand: Setting conversation title:', title);
      set({ conversationTitle: title });
    },
    
    resetConversation: () => {
      console.log('🔥 Zustand: Resetting conversation state');
      set({
        currentConversationId: '',
        conversationExists: false,
        isCreatingConversation: false,
        titleGenerated: false,
        conversationTitle: 'New Chat',
      });
    },
  }))
);