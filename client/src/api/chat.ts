import apiClient from "./client";
import type { ChatRequestBody, ChatResponse, ChatThread } from "../types";

export const chatApi = {
  /**
   * Send a prompt to the backend agent.
   * If chatId is omitted, a new UUID will be generated and returned in ChatResponse.
   * If chatId is provided, it resumes that existing conversation thread in LangChain and MongoDB.
   */
  sendMessage: async (data: ChatRequestBody): Promise<ChatResponse> => {
    return apiClient.post<ChatResponse>("/chat", data);
  },

  /**
   * Fetch complete chat thread & messages via GET /api/chat/:chatId
   */
  getChatById: async (chatId: string): Promise<ChatThread> => {
    return apiClient.get<ChatThread>(`/chat/${chatId}`);
  },

  getConversationList: async () => {
    return apiClient.get<ChatThread[]>(`/chat`);
  },

  /**
   * Delete a chat thread by chatId via DELETE /api/chat/:chatId
   */
  deleteChat: async (chatId: string): Promise<{ success: boolean; message: string; chatId: string }> => {
    return apiClient.delete(`/chat/${chatId}`);
  },
};

export default chatApi;
