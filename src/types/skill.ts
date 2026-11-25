export type SkillScope = 'PLATFORM' | 'WORKSPACE' | 'PERSONAL';
export type SkillCategory = 'INSTRUCTION' | 'TOOL' | 'WORKFLOW';
export type SkillStatus = 'ACTIVE' | 'ARCHIVED';
export type SkillVersionStatus = 'DRAFT' | 'PUBLISHED' | 'DEPRECATED' | 'REVOKED';

export interface SkillVersionDTO {
  id: string;
  skillId: string;
  versionNumber: number;
  status: SkillVersionStatus;
  summary: string;
  instructions: string;
  inputSchema?: Record<string, unknown> | null;
  requiredCapabilities: string[];
  permittedToolKeys: string[];
  workflowDefinition?: Record<string, unknown> | null;
  settingsSchema?: Record<string, unknown> | null;
  configHash: string;
  publishedAt: string | null;
  publishedByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkillDTO {
  id: string;
  scope: SkillScope;
  workspaceId: string | null;
  createdByUserId: string;
  ownerUserId: string;
  key: string;
  name: string;
  description: string | null;
  category: SkillCategory;
  activeVersionId: string | null;
  status: SkillStatus;
  versions?: SkillVersionDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSkillDTO {
  key: string;
  name: string;
  description?: string;
  scope?: SkillScope;
  category?: SkillCategory;
  summary: string;
  instructions: string;
  inputSchema?: Record<string, unknown>;
  requiredCapabilities?: string[];
  permittedToolKeys?: string[];
  workflowDefinition?: Record<string, unknown>;
  settingsSchema?: Record<string, unknown>;
}

export interface UpdateSkillDTO {
  name?: string;
  description?: string | null;
  summary?: string;
  instructions?: string;
  inputSchema?: Record<string, unknown> | null;
  requiredCapabilities?: string[];
  permittedToolKeys?: string[];
  workflowDefinition?: Record<string, unknown> | null;
  settingsSchema?: Record<string, unknown> | null;
}

export interface SkillValidationResult {
  valid: boolean;
  versionId: string;
  errors: string[];
  warnings: string[];
}
