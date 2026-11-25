import type { ConnectionScope } from './agent';

export type AgentRunStatus =
  | 'RUNNING'
  | 'WAITING_APPROVAL'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type AgentExecutionEventType =
  | 'LLM_START'
  | 'LLM_END'
  | 'SKILL_LOAD'
  | 'KB_RETRIEVAL'
  | 'TOOL_START'
  | 'TOOL_END'
  | 'APPROVAL_REQUIRED'
  | 'ERROR';

export type AgentApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export type AgentStatusPhase =
  | 'thinking'
  | 'searching_kb'
  | 'running_tool'
  | 'loading_skill';

export interface AgentRunDTO {
  runId: string;
  workspaceId: string;
  userId: string;
  chatId: string;
  agentId: string;
  agentVersionId: string;
  status: AgentRunStatus;
  provider?: string;
  modelName?: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  durationMs?: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface AgentExecutionEventDTO {
  runId: string;
  workspaceId: string;
  seq: number;
  eventType: AgentExecutionEventType;
  payload?: Record<string, unknown>;
  timestamp: string;
}

export interface AgentApprovalDTO {
  id: string;
  workspaceId: string;
  runId: string;
  conversationId: string;
  agentVersionId: string;
  userId: string;
  toolName: string;
  connectionId: string | null;
  interruptId: string | null;
  parameters?: Record<string, unknown> | null;
  status: AgentApprovalStatus;
  resolvedByUserId: string | null;
  resolvedAt: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequiredPayload {
  approvalId: string;
  runId: string;
  toolName: string;
  parameters: Record<string, unknown>;
  expiresAt: string;
  status?: AgentApprovalStatus;
}

export interface ConnectionIssuePayload {
  code: 'CONNECTION_REQUIRED' | 'CONNECTION_EXPIRED';
  connectorKey: string;
  connectionScope: ConnectionScope;
  message: string;
}

export interface SkillLoadPayload {
  skillKey: string;
  skillName: string;
}
