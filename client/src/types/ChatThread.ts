export type MessageRole = 'user' | 'assistant' | 'tool' | 'system';

export interface IToolCall {
  name: string;
  args?: Record<string, any>;
  output?: any;
  toolCallId?: string;
}

export interface IChatMessage {
  _id?: string;
  role: MessageRole;
  content: string;
  toolCalls?: IToolCall[];
  createdAt?: string | Date;
}

export interface IChatThread {
  _id?: string;
  chatId: string;
  title?: string;
  messages: IChatMessage[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ChatRequestBody {
  prompt: string;
  chatId?: string;
}

export interface ChatResponse {
  chatId: string;
  message: string;
  toolCalls?: IToolCall[];
}

export interface GetMessagesBody {
  chatId: string;
}

// Friendly type aliases without the 'I' prefix
export type ToolCall = IToolCall;
export type ChatMessage = IChatMessage;
export type ChatThread = IChatThread;

