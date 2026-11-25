import type { ApprovalRequiredPayload, ConnectionIssuePayload } from './run';

export type MessageRole = 'user' | 'assistant' | 'tool' | 'system';

export interface IChatCitation {
  index?: number;
  pageId?: string;
  crawlerId?: string;
  url: string;
  title?: string;
  score?: number;
  snippet?: string;
}

export interface IToolCall {
  name: string;
  taskName?: string;
  args?: Record<string, any>;
  output?: any;
  toolCallId?: string;
}

export interface IStatusStep {
  id: string;
  taskName: string;
  status: 'in_progress' | 'completed' | 'error';
  detail?: string;
}

export interface IChatMessage {
  _id?: string;
  role: MessageRole;
  content: string;
  statusSteps?: IStatusStep[];
  toolCalls?: IToolCall[];
  citations?: IChatCitation[];
  approval?: ApprovalRequiredPayload;
  connectionIssue?: ConnectionIssuePayload;
  createdAt?: string | Date;
}

export interface IChatThread {
  _id?: string;
  chatId: string;
  workspaceId?: string;
  userId?: string;
  agentId?: string | null;
  agentVersionId?: string | null;
  status?: 'ACTIVE' | 'ARCHIVED';
  title?: string;
  messages: IChatMessage[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface InitChatRequestBody {
  prompt: string;
  agentId?: string;
}

export interface InitChatResponse {
  chatId: string;
  agentId?: string | null;
  agentVersionId?: string | null;
  title?: string;
}

export interface ChatRequestBody {
  prompt: string;
  chatId?: string;
  agentId?: string;
  connectionIds?: string[];
}

export interface ChatResponse {
  chatId: string;
  message: string;
  toolCalls?: IToolCall[];
  citations?: IChatCitation[];
}

export interface GetMessagesBody {
  chatId: string;
}

// Friendly type aliases without the 'I' prefix
export type StatusStep = IStatusStep;
export type ToolCall = IToolCall;
export type ChatCitation = IChatCitation;
export type ChatMessage = IChatMessage;
export type ChatThread = IChatThread;

