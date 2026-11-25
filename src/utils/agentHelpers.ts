import type { AgentDTO, AgentVersionDTO, ModelProvider } from '../types';

export interface AuthPermissionContext {
  userId: string | null;
  orgId: string | null;
  orgRole: string | null;
  isOrganization: boolean;
}

/**
 * Determines whether the current user can edit/manage/publish an agent
 * based on visibility and Clerk organization role.
 */
export function canManageAgent(agent: AgentDTO | null | undefined, auth: AuthPermissionContext): boolean {
  if (!agent) return true;
  if (agent.visibility === 'PERSONAL') {
    if (!auth.userId) return true; // fallback when Clerk is unconfigured
    return agent.ownerUserId === auth.userId || agent.createdByUserId === auth.userId;
  }
  // WORKSPACE visibility
  if (!auth.isOrganization) return true;
  const role = (auth.orgRole || '').toLowerCase();
  return (
    role === 'org:admin' ||
    role === 'admin' ||
    role === 'org:editor' ||
    role === 'editor' ||
    agent.ownerUserId === auth.userId
  );
}

/**
 * Extracts the latest draft or active version from an AgentDTO.
 */
export function getLatestDraftVersion(agent: AgentDTO): AgentVersionDTO | undefined {
  if (!agent.versions?.length) return undefined;
  return (
    agent.versions.find((v) => v.status === 'DRAFT' || v.status === 'VALIDATED') ||
    agent.versions.find((v) => v.id === agent.activeVersionId) ||
    agent.versions[0]
  );
}

/**
 * Extracts the currently published/active version from an AgentDTO.
 */
export function getPublishedVersion(agent: AgentDTO): AgentVersionDTO | undefined {
  if (!agent.versions?.length) return undefined;
  if (agent.activeVersionId) {
    const active = agent.versions.find((v) => v.id === agent.activeVersionId);
    if (active) return active;
  }
  return agent.versions.find((v) => v.status === 'PUBLISHED');
}

/**
 * Resolves display model label for an agent without hardcoding model lists.
 */
export function getAgentModelLabel(agent: AgentDTO): string {
  const version = getLatestDraftVersion(agent) || getPublishedVersion(agent);
  const provider =
    version?.provider ||
    (agent.draftConfig?.provider as ModelProvider | null | undefined) ||
    null;
  const model =
    version?.model ||
    (agent.draftConfig?.model as string | null | undefined) ||
    null;

  if (provider && model) return `${provider} / ${model}`;
  if (model) return model;
  if (provider) return `${provider} (default)`;
  return 'Workspace default';
}

const AVATAR_PALETTES = [
  'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
  'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
];

export function getAgentAvatarPalette(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}
