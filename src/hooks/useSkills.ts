import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { skillApi } from '../api';
import type {
  SkillScope,
  SkillCategory,
  CreateSkillDTO,
  UpdateSkillDTO,
} from '../types';

export const skillKeys = {
  all: ['skills'] as const,
  list: (params?: { scope?: SkillScope; category?: SkillCategory }) =>
    ['skills', 'list', params] as const,
  detail: (skillId: string) => ['skills', skillId] as const,
  versions: (skillId: string) => ['skills', skillId, 'versions'] as const,
};

export function useSkills(params?: { scope?: SkillScope; category?: SkillCategory }) {
  return useQuery({
    queryKey: skillKeys.list(params),
    queryFn: () => skillApi.list(params),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

export function useSkill(skillId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: skillKeys.detail(skillId || ''),
    queryFn: () => skillApi.getById(skillId!),
    enabled: Boolean(skillId) && enabled,
    staleTime: 10_000,
  });
}

export function useSkillVersions(skillId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: skillKeys.versions(skillId || ''),
    queryFn: () => skillApi.listVersions(skillId!),
    enabled: Boolean(skillId) && enabled,
    staleTime: 10_000,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSkillDTO) => skillApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.all });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ skillId, dto }: { skillId: string; dto: UpdateSkillDTO }) =>
      skillApi.update(skillId, dto),
    onSuccess: (_, { skillId }) => {
      queryClient.invalidateQueries({ queryKey: skillKeys.all });
      queryClient.invalidateQueries({ queryKey: skillKeys.detail(skillId) });
      queryClient.invalidateQueries({ queryKey: skillKeys.versions(skillId) });
    },
  });
}

export function useArchiveSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => skillApi.archive(skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.all });
    },
  });
}

export function useValidateSkill() {
  return useMutation({
    mutationFn: (skillId: string) => skillApi.validate(skillId),
  });
}

export function usePublishSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skillId: string) => skillApi.publish(skillId),
    onSuccess: (_, skillId) => {
      queryClient.invalidateQueries({ queryKey: skillKeys.all });
      queryClient.invalidateQueries({ queryKey: skillKeys.detail(skillId) });
      queryClient.invalidateQueries({ queryKey: skillKeys.versions(skillId) });
    },
  });
}

export function useTestSkill() {
  return useMutation({
    mutationFn: ({ skillId, prompt }: { skillId: string; prompt: string }) =>
      skillApi.test(skillId, prompt),
  });
}
