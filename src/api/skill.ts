import apiClient from './client';
import type {
  ApiResponse,
  SkillDTO,
  SkillVersionDTO,
  SkillValidationResult,
  CreateSkillDTO,
  UpdateSkillDTO,
  SkillScope,
  SkillCategory,
} from '../types';

export const skillApi = {
  list: async (params?: { scope?: SkillScope; category?: SkillCategory }): Promise<SkillDTO[]> => {
    const res = await apiClient.get<ApiResponse<SkillDTO[]>>('/skills', { params });
    return res.data || [];
  },

  getById: async (skillId: string): Promise<SkillDTO> => {
    const res = await apiClient.get<ApiResponse<SkillDTO>>(`/skills/${skillId}`);
    return res.data!;
  },

  create: async (
    dto: CreateSkillDTO
  ): Promise<{ skill: SkillDTO; draftVersion: SkillVersionDTO }> => {
    const res = await apiClient.post<ApiResponse<{ skill: SkillDTO; draftVersion: SkillVersionDTO }>>(
      '/skills',
      dto
    );
    return res.data!;
  },

  update: async (
    skillId: string,
    dto: UpdateSkillDTO
  ): Promise<{ skill: SkillDTO; draftVersion: SkillVersionDTO }> => {
    const res = await apiClient.patch<
      ApiResponse<{ skill: SkillDTO; draftVersion: SkillVersionDTO }>
    >(`/skills/${skillId}`, dto);
    return res.data!;
  },

  archive: async (skillId: string): Promise<SkillDTO> => {
    const res = await apiClient.delete<ApiResponse<SkillDTO>>(`/skills/${skillId}`);
    return res.data!;
  },

  listVersions: async (skillId: string): Promise<SkillVersionDTO[]> => {
    const res = await apiClient.get<ApiResponse<SkillVersionDTO[]>>(`/skills/${skillId}/versions`);
    return res.data || [];
  },

  validate: async (skillId: string): Promise<SkillValidationResult> => {
    const res = await apiClient.post<ApiResponse<SkillValidationResult>>(
      `/skills/${skillId}/validate`
    );
    return res.data!;
  },

  publish: async (
    skillId: string
  ): Promise<{ skill: SkillDTO; publishedVersion: SkillVersionDTO }> => {
    const res = await apiClient.post<
      ApiResponse<{ skill: SkillDTO; publishedVersion: SkillVersionDTO }>
    >(`/skills/${skillId}/publish`);
    return res.data!;
  },

  test: async (skillId: string, prompt: string): Promise<unknown> => {
    const res = await apiClient.post<ApiResponse<unknown>>(`/skills/${skillId}/test`, { prompt });
    return res.data;
  },
};

export default skillApi;
