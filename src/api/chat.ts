import apiClient from './client';
import { openSseStream, type StreamChatCallbacks } from './run';
import type {
  ApiResponse,
  ChatRequestBody,
  ChatThread,
  InitChatRequestBody,
  InitChatResponse,
} from '../types';

export type { StreamChatCallbacks };

export const chatApi = {
  /**
   * Non-blocking thread initialization (Option A):
   * Creates ChatThread + persists initial user prompt and immediately returns chatId.
   */
  initChat: async (data: InitChatRequestBody): Promise<InitChatResponse> => {
    const res = await apiClient.post<InitChatResponse | ApiResponse<InitChatResponse>>(
      '/chat',
      data
    );
    if (res && typeof res === 'object' && 'data' in res && res.data) {
      return res.data;
    }
    return res as InitChatResponse;
  },

  /**
   * Stream response for an already-initialized chatId (e.g. after HomePage -> /chat/:chatId).
   */
  streamByChatId: async (
    chatId: string,
    callbacks: StreamChatCallbacks,
    signal?: AbortSignal
  ): Promise<void> => {
    await openSseStream(`/chat/${chatId}/stream`, { method: 'GET' }, callbacks, signal);
  },

  /**
   * Stream a subsequent conversational turn via POST /api/chat/stream.
   */
  streamMessage: async (
    data: ChatRequestBody,
    callbacks: StreamChatCallbacks,
    signal?: AbortSignal
  ): Promise<void> => {
    await openSseStream('/chat/stream', { method: 'POST', body: data }, callbacks, signal);
  },

  /**
   * Fetch complete chat thread & messages via GET /api/chat/:chatId
   */
  getChatById: async (chatId: string): Promise<ChatThread> => {
    return apiClient.get<ChatThread>(`/chat/${chatId}`);
  },

  getConversationList: async () => {
    return apiClient.get<ChatThread[]>('/chat');
  },

  /**
   * Delete a chat thread by chatId via DELETE /api/chat/:chatId
   */
  deleteChat: async (
    chatId: string
  ): Promise<{ success: boolean; message: string; chatId: string }> => {
    return apiClient.delete(`/chat/${chatId}`);
  },
};

export default chatApi;
