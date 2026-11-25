export type AgentVisibility = 'PERSONAL' | 'WORKSPACE';
export type AgentStatus = 'ACTIVE' | 'ARCHIVED';
export type AgentVersionStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'PUBLISHED'
  | 'DEPRECATED'
  | 'REVOKED';

export type ModelProvider = 'google' | 'groq' | 'openai' | 'anthropic';

export type CapabilityType = 'BUILTIN' | 'CONNECTOR' | 'MCP';
export type ConnectionScope = 'WORKSPACE_SHARED' | 'USER_DELEGATED';

export interface AgentMemoryConfig {
  withinThreadEnabled: boolean;
  longTermMemoryEnabled: boolean;
  maxContextTokens?: number;
}

export interface AgentExecutionPolicy {
  requireApprovalForAllTools?: boolean;
  allowWebSearchFallback?: boolean;
}

export interface AgentVersionDTO {
  id: string;
  agentId: string;
  versionNumber: number;
  status: AgentVersionStatus;
  configHash: string;
  systemInstructions: string;
  provider: ModelProvider | null;
  model: string | null;
  temperature: number;
  maxTokens: number | null;
  maxIterations: number;
  timeoutMs: number;
  memoryConfig: AgentMemoryConfig | null;
  executionPolicy: AgentExecutionPolicy | null;
  publishedAt: string | null;
  publishedByUserId: string | null;
  revokedAt: string | null;
  revokedByUserId?: string | null;
  revokedReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AgentDTO {
  id: string;
  workspaceId: string;
  createdByUserId: string;
  ownerUserId: string;
  visibility: AgentVisibility;
  name: string;
  description: string | null;
  slug: string;
  status: AgentStatus;
  activeVersionId: string | null;
  draftConfig?: Record<string, unknown> | null;
  versions?: AgentVersionDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentDraftConfigInput {
  systemInstructions?: string;
  provider?: ModelProvider | null;
  model?: string | null;
  temperature?: number;
  maxTokens?: number | null;
  maxIterations?: number;
  timeoutMs?: number;
  memoryConfig?: AgentMemoryConfig | null;
  executionPolicy?: AgentExecutionPolicy | null;
}

export interface CreateAgentDTO extends AgentDraftConfigInput {
  name: string;
  description?: string;
  visibility?: AgentVisibility;
  systemInstructions: string;
}

export interface UpdateAgentDTO extends AgentDraftConfigInput {
  name?: string;
  description?: string | null;
  visibility?: AgentVisibility;
}

export interface AgentValidationResult {
  valid: boolean;
  versionId: string;
  errors: string[];
  warnings: string[];
}

export interface AgentToolGrantDTO {
  id: string;
  agentId: string;
  agentVersionId: string | null;
  workspaceId: string;
  capabilityType: CapabilityType;
  toolKey: string;
  connectionScope: ConnectionScope;
  connectionId: string | null;
  allowedToolNames: string[];
  requiresApproval: boolean;
  isEnabled: boolean;
  constraints?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAgentToolGrantDTO {
  capabilityType: CapabilityType;
  toolKey: string;
  connectionScope?: ConnectionScope;
  connectionId?: string | null;
  allowedToolNames?: string[];
  requiresApproval?: boolean;
  isEnabled?: boolean;
  constraints?: Record<string, unknown>;
}

export interface UpdateAgentToolGrantDTO {
  connectionScope?: ConnectionScope;
  connectionId?: string | null;
  allowedToolNames?: string[];
  requiresApproval?: boolean;
  isEnabled?: boolean;
  constraints?: Record<string, unknown> | null;
}

export interface AgentKnowledgeBaseDTO {
  id: string;
  agentId: string;
  agentVersionId: string | null;
  knowledgeBaseId: string;
  retrievalConfig?: Record<string, unknown> | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AgentSkillDTO {
  id: string;
  agentId: string;
  agentVersionId: string | null;
  skillId: string;
  skillVersionId: string | null;
  isEnabled: boolean;
  priority: number;
  settingsOverride?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}
