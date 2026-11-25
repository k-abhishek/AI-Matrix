import { create } from 'zustand';
import type { ChatMessage, ChatThread, StatusStep } from '../types';
import { chatApi } from '../api/chat';

export interface ChatState {
  chatList: ChatThread[];
  isLoadingChatList: boolean;
  currentChatId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchChatList: () => Promise<void>;
  setChatList: (chats: ChatThread[]) => void;
  addChat: (chat: ChatThread) => void;
  removeChat: (chatId: string) => void;
  deleteChat: (chatId: string) => Promise<boolean>;
  updateChat: (chatId: string, updates: Partial<ChatThread>) => void;
  setCurrentChatId: (chatId: string | null) => void;
  setCurrentChat: (chatId: string | null, messages?: ChatMessage[]) => void;
  clearCurrentChat: () => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  appendStreamChunk: (chunk: string) => void;
  updateLastMessage: (updates: Partial<ChatMessage>) => void;
  addStatusStep: (
    taskName: string,
    status?: StatusStep['status'],
    detail?: string
  ) => void;
  completeStatusSteps: (finalStatus?: 'completed' | 'error') => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chatList: [],
  isLoadingChatList: false,
  currentChatId: null,
  messages: [],
  isLoading: false,
  error: null,

  fetchChatList: async () => {
    try {
      set({ isLoadingChatList: true });
      const chats = await chatApi.getConversationList();
      if (chats) {
        set({ chatList: chats });
      }
    } catch (err) {
      console.error('Failed to fetch conversation list:', err);
    } finally {
      set({ isLoadingChatList: false });
    }
  },

  setChatList: (chats) => set({ chatList: chats }),

  addChat: (chat) =>
    set((state) => ({
      chatList: [chat, ...state.chatList.filter((c) => c.chatId !== chat.chatId)],
    })),

  removeChat: (chatId) =>
    set((state) => ({
      chatList: state.chatList.filter((c) => c.chatId !== chatId),
      currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
      messages: state.currentChatId === chatId ? [] : state.messages,
    })),

  deleteChat: async (chatId) => {
    try {
      await chatApi.deleteChat(chatId);
      set((state) => ({
        chatList: state.chatList.filter((c) => c.chatId !== chatId),
        currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
        messages: state.currentChatId === chatId ? [] : state.messages,
      }));
      return true;
    } catch (err) {
      console.error('Failed to delete chat thread:', err);
      return false;
    }
  },

  updateChat: (chatId, updates) =>
    set((state) => ({
      chatList: state.chatList.map((c) =>
        c.chatId === chatId ? { ...c, ...updates } : c
      ),
    })),

  setCurrentChatId: (chatId) =>
    set((state) => {
      if (chatId === state.currentChatId) return state;
      return {
        currentChatId: chatId,
        messages: chatId ? state.messages : [],
        error: null,
      };
    }),

  setCurrentChat: (chatId, messages = []) =>
    set({
      currentChatId: chatId,
      messages: chatId ? messages : [],
      error: null,
    }),

  clearCurrentChat: () =>
    set({
      currentChatId: null,
      messages: [],
      error: null,
    }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  appendStreamChunk: (chunk: string) =>
    set((state) => {
      if (state.messages.length === 0) return state;
      const lastIndex = state.messages.length - 1;
      const last = state.messages[lastIndex];
      const updatedMessages = [...state.messages];
      updatedMessages[lastIndex] = {
        ...last,
        content: (last.content || "") + chunk,
      };
      return { messages: updatedMessages };
    }),

  updateLastMessage: (updates: Partial<ChatMessage>) =>
    set((state) => {
      if (state.messages.length === 0) return state;
      const lastIndex = state.messages.length - 1;
      const last = state.messages[lastIndex];
      const updatedMessages = [...state.messages];
      updatedMessages[lastIndex] = {
        ...last,
        ...updates,
      };
      return { messages: updatedMessages };
    }),

  addStatusStep: (
    taskName: string,
    status: StatusStep['status'] = 'in_progress',
    detail?: string
  ) =>
    set((state) => {
      if (state.messages.length === 0) return state;
      const lastIndex = state.messages.length - 1;
      const last = state.messages[lastIndex];
      if (last.role !== 'assistant') return state;

      const existing = last.statusSteps || [];
      const lastStep = existing[existing.length - 1];

      // Avoid duplicating consecutive identical in-progress step
      if (
        lastStep &&
        lastStep.taskName === taskName &&
        lastStep.status === 'in_progress' &&
        status === 'in_progress'
      ) {
        if (detail && detail !== lastStep.detail) {
          const updatedSteps = [...existing];
          updatedSteps[existing.length - 1] = { ...lastStep, detail };
          const updatedMessages = [...state.messages];
          updatedMessages[lastIndex] = { ...last, statusSteps: updatedSteps };
          return { messages: updatedMessages };
        }
        return state;
      }

      const settled = existing.map((s) =>
        s.status === 'in_progress' ? { ...s, status: 'completed' as const } : s
      );
      const nextStep: StatusStep = {
        id: `${Date.now()}-${settled.length}`,
        taskName,
        status,
        detail,
      };

      const updatedMessages = [...state.messages];
      updatedMessages[lastIndex] = {
        ...last,
        statusSteps: [...settled, nextStep],
      };
      return { messages: updatedMessages };
    }),

  completeStatusSteps: (finalStatus: 'completed' | 'error' = 'completed') =>
    set((state) => {
      if (state.messages.length === 0) return state;
      const lastIndex = state.messages.length - 1;
      const last = state.messages[lastIndex];
      if (!last.statusSteps || last.statusSteps.length === 0) return state;

      const updatedSteps = last.statusSteps.map((s) =>
        s.status === 'in_progress' ? { ...s, status: finalStatus } : s
      );
      const updatedMessages = [...state.messages];
      updatedMessages[lastIndex] = { ...last, statusSteps: updatedSteps };
      return { messages: updatedMessages };
    }),

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () =>
    set({
      chatList: [],
      isLoadingChatList: false,
      currentChatId: null,
      messages: [],
      isLoading: false,
      error: null,
    }),
}));

export default useChatStore;

