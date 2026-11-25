import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from '@tanstack/react-query';
import { agentApi, kbApi, runApi } from '../api';
import type {
  AgentStatus,
  AgentVisibility,
  CreateAgentDTO,
  UpdateAgentDTO,
  CreateAgentToolGrantDTO,
  UpdateAgentToolGrantDTO,
} from '../types';

export const agentKeys = {
  all: ['agents'] as const,
  list: (params?: { status?: AgentStatus; visibility?: AgentVisibility }) =>
    ['agents', 'list', params] as const,
  detail: (agentId: string) => ['agents', agentId] as const,
  versions: (agentId: string) => ['agents', agentId, 'versions'] as const,
  knowledgeBases: (agentId: string) => ['agents', agentId, 'knowledge-bases'] as const,
  skills: (agentId: string) => ['agents', agentId, 'skills'] as const,
  toolGrants: (agentId: string) => ['agents', agentId, 'tool-grants'] as const,
  runs: (agentId: string, chatId?: string) => ['agents', agentId, 'runs', chatId] as const,
  runDetail: (runId: string) => ['agents', 'runs', runId] as const,
  accessibleKbs: ['knowledge-bases', 'accessible'] as const,
};

export function useAgents(params?: { status?: AgentStatus; visibility?: AgentVisibility }) {
  return useQuery({
    queryKey: agentKeys.list(params),
    queryFn: () => agentApi.list(params),
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}

export function useAgent(agentId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: agentKeys.detail(agentId || ''),
    queryFn: () => agentApi.getById(agentId!),
    enabled: Boolean(agentId) && enabled,
    staleTime: 10_000,
  });
}

export function useAgentVersions(agentId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: agentKeys.versions(agentId || ''),
    queryFn: () => agentApi.listVersions(agentId!),
    enabled: Boolean(agentId) && enabled,
    staleTime: 10_000,
  });
}

export function useAgentKnowledgeBases(agentId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: agentKeys.knowledgeBases(agentId || ''),
    queryFn: () => agentApi.listKnowledgeBases(agentId!),
    enabled: Boolean(agentId) && enabled,
    staleTime: 10_000,
  });
}

export function useAccessibleKnowledgeBases(enabled = true) {
  return useQuery({
    queryKey: agentKeys.accessibleKbs,
    queryFn: () => kbApi.list(),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useAgentSkills(agentId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: agentKeys.skills(agentId || ''),
    queryFn: () => agentApi.listSkills(agentId!),
    enabled: Boolean(agentId) && enabled,
    staleTime: 10_000,
  });
}

export function useAgentToolGrants(agentId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: agentKeys.toolGrants(agentId || ''),
    queryFn: () => agentApi.listToolGrants(agentId!),
    enabled: Boolean(agentId) && enabled,
    staleTime: 10_000,
  });
}

export function useAgentRuns(agentId: string | undefined, chatId?: string, enabled = true) {
  return useQuery({
    queryKey: agentKeys.runs(agentId || '', chatId),
    queryFn: () => runApi.listAgentRuns(agentId!, chatId),
    enabled: Boolean(agentId) && enabled,
    staleTime: 5_000,
  });
}

export function useInspectRun(runId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: agentKeys.runDetail(runId || ''),
    queryFn: () => runApi.inspectRun(runId!),
    enabled: Boolean(runId) && enabled,
    staleTime: 5_000,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAgentDTO) => agentApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, dto }: { agentId: string; dto: UpdateAgentDTO }) =>
      agentApi.update(agentId, dto),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.versions(agentId) });
    },
  });
}

export function useArchiveAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => agentApi.archive(agentId),
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
    },
  });
}

export function useDuplicateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => agentApi.duplicate(agentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
}

export function useValidateAgent() {
  return useMutation({
    mutationFn: (agentId: string) => agentApi.validate(agentId),
  });
}

export function usePublishAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => agentApi.publish(agentId),
    onSuccess: (_, agentId) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.versions(agentId) });
    },
  });
}

export function useRollbackAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, targetVersionId }: { agentId: string; targetVersionId: string }) =>
      agentApi.rollback(agentId, targetVersionId),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.versions(agentId) });
    },
  });
}

export function useRevokeAgentVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      versionId,
      reason,
    }: {
      agentId: string;
      versionId: string;
      reason?: string;
    }) => agentApi.revokeVersion(agentId, versionId, reason),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.versions(agentId) });
    },
  });
}

export function useAttachAgentKnowledgeBase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      body,
    }: {
      agentId: string;
      body: { knowledgeBaseId: string; retrievalConfig?: Record<string, unknown>; isEnabled?: boolean };
    }) => agentApi.attachKnowledgeBase(agentId, body),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.knowledgeBases(agentId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
    },
  });
}

export function useDetachAgentKnowledgeBase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, kbId }: { agentId: string; kbId: string }) =>
      agentApi.detachKnowledgeBase(agentId, kbId),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.knowledgeBases(agentId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
    },
  });
}

export function useAttachAgentSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      body,
    }: {
      agentId: string;
      body: { skillId: string; priority?: number; settingsOverride?: Record<string, unknown> };
    }) => agentApi.attachSkill(agentId, body),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.skills(agentId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
    },
  });
}

export function useDetachAgentSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, skillId }: { agentId: string; skillId: string }) =>
      agentApi.detachSkill(agentId, skillId),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.skills(agentId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
    },
  });
}

export function useCreateAgentToolGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, dto }: { agentId: string; dto: CreateAgentToolGrantDTO }) =>
      agentApi.createToolGrant(agentId, dto),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.toolGrants(agentId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
    },
  });
}

export function useUpdateAgentToolGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      agentId,
      grantId,
      dto,
    }: {
      agentId: string;
      grantId: string;
      dto: UpdateAgentToolGrantDTO;
    }) => agentApi.updateToolGrant(agentId, grantId, dto),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.toolGrants(agentId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
    },
  });
}

export function useDeleteAgentToolGrant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, grantId }: { agentId: string; grantId: string }) =>
      agentApi.deleteToolGrant(agentId, grantId),
    onSuccess: (_, { agentId }) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.toolGrants(agentId) });
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
    },
  });
}
