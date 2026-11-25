import apiClient from './client';
import type {
  ApiResponse,
  AgentDTO,
  AgentVersionDTO,
  AgentValidationResult,
  CreateAgentDTO,
  UpdateAgentDTO,
  AgentKnowledgeBaseDTO,
  AgentSkillDTO,
  AgentToolGrantDTO,
  CreateAgentToolGrantDTO,
  UpdateAgentToolGrantDTO,
  AgentVisibility,
  AgentStatus,
} from '../types';

export const agentApi = {
  list: async (params?: { status?: AgentStatus; visibility?: AgentVisibility }): Promise<AgentDTO[]> => {
    const res = await apiClient.get<ApiResponse<AgentDTO[]>>('/agents', { params });
    return res.data || [];
  },

  getById: async (agentId: string): Promise<AgentDTO> => {
    const res = await apiClient.get<ApiResponse<AgentDTO>>(`/agents/${agentId}`);
    return res.data!;
  },

  create: async (dto: CreateAgentDTO): Promise<{ agent: AgentDTO; draftVersion: AgentVersionDTO }> => {
    const res = await apiClient.post<ApiResponse<{ agent: AgentDTO; draftVersion: AgentVersionDTO }>>(
      '/agents',
      dto
    );
    return res.data!;
  },

  update: async (
    agentId: string,
    dto: UpdateAgentDTO
  ): Promise<{ agent: AgentDTO; draftVersion: AgentVersionDTO | null }> => {
    const res = await apiClient.patch<
      ApiResponse<{ agent: AgentDTO; draftVersion: AgentVersionDTO | null }>
    >(`/agents/${agentId}`, dto);
    return res.data!;
  },

  archive: async (agentId: string): Promise<AgentDTO> => {
    const res = await apiClient.delete<ApiResponse<AgentDTO>>(`/agents/${agentId}`);
    return res.data!;
  },

  duplicate: async (
    agentId: string
  ): Promise<{ agent: AgentDTO; draftVersion: AgentVersionDTO }> => {
    const res = await apiClient.post<ApiResponse<{ agent: AgentDTO; draftVersion: AgentVersionDTO }>>(
      `/agents/${agentId}/duplicate`
    );
    return res.data!;
  },

  validate: async (agentId: string): Promise<AgentValidationResult> => {
    const res = await apiClient.post<ApiResponse<AgentValidationResult>>(`/agents/${agentId}/validate`);
    return res.data!;
  },

  publish: async (
    agentId: string
  ): Promise<{ agent: AgentDTO; publishedVersion: AgentVersionDTO }> => {
    const res = await apiClient.post<ApiResponse<{ agent: AgentDTO; publishedVersion: AgentVersionDTO }>>(
      `/agents/${agentId}/publish`
    );
    return res.data!;
  },

  rollback: async (
    agentId: string,
    targetVersionId: string
  ): Promise<{ agent: AgentDTO; activeVersion: AgentVersionDTO }> => {
    const res = await apiClient.post<ApiResponse<{ agent: AgentDTO; activeVersion: AgentVersionDTO }>>(
      `/agents/${agentId}/rollback`,
      { targetVersionId }
    );
    return res.data!;
  },

  revokeVersion: async (
    agentId: string,
    versionId: string,
    reason?: string
  ): Promise<AgentVersionDTO> => {
    const res = await apiClient.post<ApiResponse<AgentVersionDTO>>(
      `/agents/${agentId}/versions/${versionId}/revoke`,
      { reason }
    );
    return res.data!;
  },

  listVersions: async (agentId: string): Promise<AgentVersionDTO[]> => {
    const res = await apiClient.get<ApiResponse<AgentVersionDTO[]>>(`/agents/${agentId}/versions`);
    return res.data || [];
  },

  // Knowledge Base bindings
  listKnowledgeBases: async (agentId: string): Promise<AgentKnowledgeBaseDTO[]> => {
    const res = await apiClient.get<ApiResponse<AgentKnowledgeBaseDTO[]>>(
      `/agents/${agentId}/knowledge-bases`
    );
    return res.data || [];
  },

  attachKnowledgeBase: async (
    agentId: string,
    body: { knowledgeBaseId: string; retrievalConfig?: Record<string, unknown>; isEnabled?: boolean }
  ): Promise<AgentKnowledgeBaseDTO> => {
    const res = await apiClient.post<ApiResponse<AgentKnowledgeBaseDTO>>(
      `/agents/${agentId}/knowledge-bases`,
      body
    );
    return res.data!;
  },

  detachKnowledgeBase: async (agentId: string, kbId: string): Promise<void> => {
    await apiClient.delete(`/agents/${agentId}/knowledge-bases/${kbId}`);
  },

  // Skill bindings
  listSkills: async (agentId: string): Promise<AgentSkillDTO[]> => {
    const res = await apiClient.get<ApiResponse<AgentSkillDTO[]>>(`/agents/${agentId}/skills`);
    return res.data || [];
  },

  attachSkill: async (
    agentId: string,
    body: { skillId: string; priority?: number; settingsOverride?: Record<string, unknown> }
  ): Promise<AgentSkillDTO> => {
    const res = await apiClient.post<ApiResponse<AgentSkillDTO>>(`/agents/${agentId}/skills`, body);
    return res.data!;
  },

  detachSkill: async (agentId: string, skillId: string): Promise<void> => {
    await apiClient.delete(`/agents/${agentId}/skills/${skillId}`);
  },

  // Tool Grants
  listToolGrants: async (agentId: string): Promise<AgentToolGrantDTO[]> => {
    const res = await apiClient.get<ApiResponse<AgentToolGrantDTO[]>>(
      `/agents/${agentId}/tool-grants`
    );
    return res.data || [];
  },

  createToolGrant: async (
    agentId: string,
    dto: CreateAgentToolGrantDTO
  ): Promise<AgentToolGrantDTO> => {
    const res = await apiClient.post<ApiResponse<AgentToolGrantDTO>>(
      `/agents/${agentId}/tool-grants`,
      dto
    );
    return res.data!;
  },

  updateToolGrant: async (
    agentId: string,
    grantId: string,
    dto: UpdateAgentToolGrantDTO
  ): Promise<AgentToolGrantDTO> => {
    const res = await apiClient.patch<ApiResponse<AgentToolGrantDTO>>(
      `/agents/${agentId}/tool-grants/${grantId}`,
      dto
    );
    return res.data!;
  },

  deleteToolGrant: async (agentId: string, grantId: string): Promise<void> => {
    await apiClient.delete(`/agents/${agentId}/tool-grants/${grantId}`);
  },
};

export default agentApi;
