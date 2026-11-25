import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Cpu,
  BookOpen,
  Sparkles,
  Wrench,
  Brain,
  Sliders,
  History,
  Save,
  Play,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { toast } from '../components/ui/sonner';
import AgentBasicInfo from '../components/agents/builder/AgentBasicInfo';
import AgentModelConfig from '../components/agents/builder/AgentModelConfig';
import AgentKnowledgeConfig, {
  type PendingKbBinding,
} from '../components/agents/builder/AgentKnowledgeConfig';
import AgentSkillConfig from '../components/agents/builder/AgentSkillConfig';
import AgentToolConfig from '../components/agents/builder/AgentToolConfig';
import AgentMemoryConfig from '../components/agents/builder/AgentMemoryConfig';
import AgentAdvancedConfig from '../components/agents/builder/AgentAdvancedConfig';
import AgentPublishDialog from '../components/agents/AgentPublishDialog';
import AgentVersionHistory from '../components/agents/AgentVersionHistory';
import {
  useAgent,
  useCreateAgent,
  useUpdateAgent,
  useValidateAgent,
  usePublishAgent,
  useRollbackAgent,
  useRevokeAgentVersion,
  useAgentVersions,
  useAgentKnowledgeBases,
  useAccessibleKnowledgeBases,
  useAttachAgentKnowledgeBase,
  useDetachAgentKnowledgeBase,
  useAgentSkills,
  useAttachAgentSkill,
  useDetachAgentSkill,
  useAgentToolGrants,
  useCreateAgentToolGrant,
  useUpdateAgentToolGrant,
  useDeleteAgentToolGrant,
} from '../hooks/useAgents';
import { useSkills } from '../hooks/useSkills';
import { useAuthContext } from '../context/AuthContext';
import { canManageAgent, getLatestDraftVersion } from '../utils/agentHelpers';
import type {
  AgentExecutionPolicy,
  AgentMemoryConfig as AgentMemoryConfigType,
  AgentValidationResult,
  AgentVisibility,
  KnowledgeBaseDTO,
  ModelProvider,
  SkillDTO,
} from '../types';

type BuilderSection =
  | 'basic'
  | 'model'
  | 'knowledge'
  | 'skills'
  | 'tools'
  | 'memory'
  | 'advanced'
  | 'versions';

const NAV_ITEMS: Array<{
  id: BuilderSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  editOnly?: boolean;
}> = [
  { id: 'basic', label: 'Basic Info', icon: Bot },
  { id: 'model', label: 'Model', icon: Cpu },
  { id: 'knowledge', label: 'Knowledge', icon: BookOpen },
  { id: 'skills', label: 'Skills', icon: Sparkles },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'advanced', label: 'Advanced', icon: Sliders },
  { id: 'versions', label: 'Versions', icon: History, editOnly: true },
];

export const AgentBuilderPage: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const isNew = !agentId;
  const navigate = useNavigate();
  const auth = useAuthContext();

  const [activeSection, setActiveSection] = useState<BuilderSection>('basic');
  const [isDirty, setIsDirty] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemInstructions, setSystemInstructions] = useState(
    'You are a helpful AI assistant.'
  );
  const [visibility, setVisibility] = useState<AgentVisibility>('PERSONAL');
  const [provider, setProvider] = useState<ModelProvider | null>(null);
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState<number | null>(null);
  const [maxIterations, setMaxIterations] = useState(10);
  const [timeoutMs, setTimeoutMs] = useState(60_000);
  const [memoryConfig, setMemoryConfig] = useState<AgentMemoryConfigType>({
    withinThreadEnabled: true,
    longTermMemoryEnabled: false,
  });
  const [executionPolicy, setExecutionPolicy] = useState<AgentExecutionPolicy>({
    requireApprovalForAllTools: false,
    allowWebSearchFallback: false,
  });

  // Pending associations for unsaved new agents
  const [pendingKbs, setPendingKbs] = useState<PendingKbBinding[]>([]);
  const [pendingSkills, setPendingSkills] = useState<
    Array<{ skillId: string; skillVersionId: string | null }>
  >([]);

  // Publish modal state
  const [publishOpen, setPublishOpen] = useState(false);
  const [validationResult, setValidationResult] = useState<AgentValidationResult | null>(
    null
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  // Server queries
  const {
    data: agent,
    isLoading: isLoadingAgent,
    error: agentError,
    refetch: refetchAgent,
  } = useAgent(agentId, !isNew);

  const {
    data: versions = [],
    isLoading: isLoadingVersions,
    error: versionsError,
    refetch: refetchVersions,
  } = useAgentVersions(agentId, !isNew && activeSection === 'versions');

  const { data: attachedKbs = [] } = useAgentKnowledgeBases(agentId, !isNew);
  const {
    data: accessibleKbs = [],
    isLoading: isLoadingKbs,
    error: kbsError,
    refetch: refetchKbs,
  } = useAccessibleKnowledgeBases();

  const { data: attachedSkills = [] } = useAgentSkills(agentId, !isNew);
  const {
    data: allSkills = [],
    isLoading: isLoadingSkills,
    error: skillsError,
    refetch: refetchSkills,
  } = useSkills();

  const { data: toolGrants = [], isLoading: isLoadingGrants } = useAgentToolGrants(
    agentId,
    !isNew
  );

  // Mutations
  const createMutation = useCreateAgent();
  const updateMutation = useUpdateAgent();
  const validateMutation = useValidateAgent();
  const publishMutation = usePublishAgent();
  const rollbackMutation = useRollbackAgent();
  const revokeMutation = useRevokeAgentVersion();
  const attachKbMutation = useAttachAgentKnowledgeBase();
  const detachKbMutation = useDetachAgentKnowledgeBase();
  const attachSkillMutation = useAttachAgentSkill();
  const detachSkillMutation = useDetachAgentSkill();
  const createGrantMutation = useCreateAgentToolGrant();
  const updateGrantMutation = useUpdateAgentToolGrant();
  const deleteGrantMutation = useDeleteAgentToolGrant();

  const canManage = isNew ? true : canManageAgent(agent, auth);

  // Hydrate form from fetched agent
  useEffect(() => {
    if (!agent) return;
    const draft = getLatestDraftVersion(agent);
    setName(agent.name);
    setDescription(agent.description || '');
    setVisibility(agent.visibility);
    setSystemInstructions(
      draft?.systemInstructions ||
        (agent.draftConfig?.systemInstructions as string) ||
        'You are a helpful AI assistant.'
    );
    setProvider(
      draft?.provider ?? (agent.draftConfig?.provider as ModelProvider | null) ?? null
    );
    setModel(draft?.model ?? (agent.draftConfig?.model as string) ?? '');
    setTemperature(draft?.temperature ?? 0.7);
    setMaxTokens(draft?.maxTokens ?? null);
    setMaxIterations(draft?.maxIterations ?? 10);
    setTimeoutMs(draft?.timeoutMs ?? 60_000);
    setMemoryConfig(
      draft?.memoryConfig || {
        withinThreadEnabled: true,
        longTermMemoryEnabled: false,
      }
    );
    setExecutionPolicy(
      draft?.executionPolicy || {
        requireApprovalForAllTools: false,
        allowWebSearchFallback: false,
      }
    );
    setIsDirty(false);
  }, [agent]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!isDirty) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const markDirty = () => setIsDirty(true);

  const handleSaveDraft = async (): Promise<string | null> => {
    if (!name.trim()) {
      toast.error('Agent name is required.');
      setActiveSection('basic');
      return null;
    }

    try {
      if (isNew) {
        const res = await createMutation.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          visibility,
          systemInstructions: systemInstructions.trim() || 'You are a helpful AI assistant.',
          provider,
          model: model.trim() || null,
          temperature,
          maxTokens,
          maxIterations,
          timeoutMs,
          memoryConfig,
          executionPolicy,
        });

        // Attach any pending KBs or skills selected before creation
        for (const kb of pendingKbs) {
          await attachKbMutation.mutateAsync({
            agentId: res.agent.id,
            body: {
              knowledgeBaseId: kb.knowledgeBaseId,
              retrievalConfig: kb.retrievalConfig,
              isEnabled: kb.isEnabled,
            },
          });
        }
        for (const sk of pendingSkills) {
          await attachSkillMutation.mutateAsync({
            agentId: res.agent.id,
            body: { skillId: sk.skillId },
          });
        }

        setIsDirty(false);
        toast.success('Agent draft created');
        navigate(`/agents/${res.agent.id}`, { replace: true });
        return res.agent.id;
      } else if (agentId) {
        await updateMutation.mutateAsync({
          agentId,
          dto: {
            name: name.trim(),
            description: description.trim() || null,
            visibility,
            systemInstructions: systemInstructions.trim(),
            provider,
            model: model.trim() || null,
            temperature,
            maxTokens,
            maxIterations,
            timeoutMs,
            memoryConfig,
            executionPolicy,
          },
        });
        setIsDirty(false);
        toast.success('Draft saved');
        return agentId;
      }
      return null;
    } catch (err) {
      toast.error('Failed to save agent', {
        description: err instanceof Error ? err.message : 'Please check your configuration.',
      });
      return null;
    }
  };

  const handleOpenPublish = async () => {
    let targetId = agentId;
    if (isNew || isDirty) {
      const savedId = await handleSaveDraft();
      if (!savedId) return;
      targetId = savedId;
    }
    if (!targetId) return;

    setPublishOpen(true);
    setValidationResult(null);
    setValidationError(null);

    try {
      const result = await validateMutation.mutateAsync(targetId);
      setValidationResult(result);
    } catch (err) {
      setValidationError(
        err instanceof Error ? err.message : 'Failed to validate agent.'
      );
    }
  };

  const handleConfirmPublish = async () => {
    if (!agentId) return;
    try {
      const res = await publishMutation.mutateAsync(agentId);
      toast.success('Agent published', {
        description: `Version v${res.publishedVersion.versionNumber} is now live.`,
      });
      setPublishOpen(false);
    } catch (err) {
      toast.error('Publish failed', {
        description: err instanceof Error ? err.message : 'Unable to publish agent.',
      });
    }
  };

  const handleAttachKb = async (
    kb: KnowledgeBaseDTO,
    retrievalConfig?: { topK?: number; scoreThreshold?: number }
  ) => {
    if (isNew) {
      setPendingKbs((prev) =>
        prev.some((p) => p.knowledgeBaseId === kb.id)
          ? prev
          : [...prev, { knowledgeBaseId: kb.id, retrievalConfig, isEnabled: true }]
      );
      markDirty();
      return;
    }
    if (!agentId) return;
    try {
      await attachKbMutation.mutateAsync({
        agentId,
        body: { knowledgeBaseId: kb.id, retrievalConfig, isEnabled: true },
      });
      toast.success(`Connected "${kb.name}"`);
    } catch (err) {
      toast.error('Failed to connect knowledge base', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleDetachKb = async (knowledgeBaseId: string) => {
    if (isNew) {
      setPendingKbs((prev) => prev.filter((p) => p.knowledgeBaseId !== knowledgeBaseId));
      return;
    }
    if (!agentId) return;
    try {
      await detachKbMutation.mutateAsync({ agentId, kbId: knowledgeBaseId });
      toast.success('Knowledge base disconnected');
    } catch (err) {
      toast.error('Failed to disconnect knowledge base', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleUpdateKbRetrieval = async (
    knowledgeBaseId: string,
    retrievalConfig: { topK?: number; scoreThreshold?: number }
  ) => {
    if (isNew) {
      setPendingKbs((prev) =>
        prev.map((p) =>
          p.knowledgeBaseId === knowledgeBaseId ? { ...p, retrievalConfig } : p
        )
      );
      return;
    }
    if (!agentId) return;
    try {
      await attachKbMutation.mutateAsync({
        agentId,
        body: { knowledgeBaseId, retrievalConfig, isEnabled: true },
      });
    } catch (err) {
      toast.error('Failed to update retrieval settings', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleAttachSkill = async (skill: SkillDTO) => {
    if (isNew) {
      setPendingSkills((prev) =>
        prev.some((s) => s.skillId === skill.id)
          ? prev
          : [...prev, { skillId: skill.id, skillVersionId: skill.activeVersionId }]
      );
      markDirty();
      return;
    }
    if (!agentId) return;
    try {
      await attachSkillMutation.mutateAsync({
        agentId,
        body: { skillId: skill.id },
      });
      toast.success(`Attached "${skill.name}"`);
    } catch (err) {
      toast.error('Failed to attach skill', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleDetachSkill = async (skillId: string) => {
    if (isNew) {
      setPendingSkills((prev) => prev.filter((s) => s.skillId !== skillId));
      return;
    }
    if (!agentId) return;
    try {
      await detachSkillMutation.mutateAsync({ agentId, skillId });
      toast.success('Skill detached');
    } catch (err) {
      toast.error('Failed to detach skill', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.editOnly || !isNew),
    [isNew]
  );

  if (!isNew && isLoadingAgent) {
    return (
      <div className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-96 md:col-span-3 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!isNew && agentError) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
        <ErrorMessage
          title="Failed to load agent"
          message={agentError instanceof Error ? agentError.message : 'Agent not found.'}
          onRetry={() => refetchAgent()}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate('/agents')}
            aria-label="Back to Agents"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground truncate">
                {isNew ? 'Create Agent' : agent?.name || 'Edit Agent'}
              </h1>
              {!isNew && (
                <Badge variant={agent?.activeVersionId ? 'default' : 'secondary'}>
                  {agent?.activeVersionId ? 'Published' : 'Draft'}
                </Badge>
              )}
              {isDirty && (
                <Badge variant="outline" className="text-[10px] text-amber-600">
                  Unsaved changes
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isNew
                ? 'Configure instructions, model, optional knowledge, skills, and tools.'
                : 'Editing updates the agent draft. Publish when ready to make changes live.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {!isNew && agentId && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/agents/${agentId}/playground`)}
            >
              <Play className="h-3.5 w-3.5" />
              Playground
            </Button>
          )}
          {canManage && (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSaveDraft}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Save Draft
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleOpenPublish}
                disabled={isSaving}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Validate & Publish
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Left Navigation + Main Configuration Panel */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <aside
          aria-label="Agent configuration sections"
          className="md:col-span-3 flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 md:sticky md:top-6"
        >
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </aside>

        <div className="md:col-span-9 space-y-6">
          {activeSection === 'basic' && (
            <AgentBasicInfo
              name={name}
              description={description}
              systemInstructions={systemInstructions}
              visibility={visibility}
              isOrganization={auth.isOrganization}
              disabled={!canManage}
              onChange={(updates) => {
                if (updates.name !== undefined) setName(updates.name);
                if (updates.description !== undefined) setDescription(updates.description);
                if (updates.systemInstructions !== undefined)
                  setSystemInstructions(updates.systemInstructions);
                if (updates.visibility !== undefined) setVisibility(updates.visibility);
                markDirty();
              }}
            />
          )}

          {activeSection === 'model' && (
            <AgentModelConfig
              provider={provider}
              model={model}
              temperature={temperature}
              maxTokens={maxTokens}
              disabled={!canManage}
              onChange={(updates) => {
                if (updates.provider !== undefined) setProvider(updates.provider);
                if (updates.model !== undefined) setModel(updates.model);
                if (updates.temperature !== undefined) setTemperature(updates.temperature);
                if (updates.maxTokens !== undefined) setMaxTokens(updates.maxTokens);
                markDirty();
              }}
            />
          )}

          {activeSection === 'knowledge' && (
            <AgentKnowledgeConfig
              accessibleKbs={accessibleKbs}
              isLoadingKbs={isLoadingKbs}
              kbsError={kbsError}
              onRetryKbs={() => refetchKbs()}
              attachedBindings={isNew ? pendingKbs : attachedKbs}
              disabled={!canManage}
              isMutating={attachKbMutation.isPending || detachKbMutation.isPending}
              onAttach={handleAttachKb}
              onDetach={handleDetachKb}
              onUpdateRetrieval={handleUpdateKbRetrieval}
            />
          )}

          {activeSection === 'skills' && (
            <AgentSkillConfig
              skills={allSkills}
              isLoadingSkills={isLoadingSkills}
              skillsError={skillsError}
              onRetrySkills={() => refetchSkills()}
              attachedSkills={isNew ? pendingSkills : attachedSkills}
              disabled={!canManage}
              isMutating={attachSkillMutation.isPending || detachSkillMutation.isPending}
              onAttach={handleAttachSkill}
              onDetach={handleDetachSkill}
            />
          )}

          {activeSection === 'tools' && (
            <AgentToolConfig
              agentId={agentId}
              grants={toolGrants}
              isLoadingGrants={isLoadingGrants}
              disabled={!canManage}
              isMutating={
                createGrantMutation.isPending ||
                updateGrantMutation.isPending ||
                deleteGrantMutation.isPending
              }
              onCreateGrant={(dto) => {
                if (!agentId) return;
                createGrantMutation.mutate(
                  { agentId, dto },
                  {
                    onSuccess: () => toast.success('Tool grant enabled'),
                    onError: (err) =>
                      toast.error('Failed to enable tool', {
                        description: err instanceof Error ? err.message : undefined,
                      }),
                  }
                );
              }}
              onUpdateGrant={(grantId, dto) => {
                if (!agentId) return;
                updateGrantMutation.mutate({ agentId, grantId, dto });
              }}
              onDeleteGrant={(grantId) => {
                if (!agentId) return;
                deleteGrantMutation.mutate(
                  { agentId, grantId },
                  {
                    onSuccess: () => toast.success('Tool grant removed'),
                  }
                );
              }}
            />
          )}

          {activeSection === 'memory' && (
            <AgentMemoryConfig
              memoryConfig={memoryConfig}
              disabled={!canManage}
              onChange={(next) => {
                setMemoryConfig(next);
                markDirty();
              }}
            />
          )}

          {activeSection === 'advanced' && (
            <AgentAdvancedConfig
              maxIterations={maxIterations}
              timeoutMs={timeoutMs}
              executionPolicy={executionPolicy}
              disabled={!canManage}
              onChange={(updates) => {
                if (updates.maxIterations !== undefined)
                  setMaxIterations(updates.maxIterations);
                if (updates.timeoutMs !== undefined) setTimeoutMs(updates.timeoutMs);
                if (updates.executionPolicy !== undefined)
                  setExecutionPolicy(updates.executionPolicy);
                markDirty();
              }}
            />
          )}

          {activeSection === 'versions' && !isNew && (
            <AgentVersionHistory
              versions={versions}
              activeVersionId={agent?.activeVersionId ?? null}
              isLoading={isLoadingVersions}
              error={versionsError}
              onRetry={() => refetchVersions()}
              canManage={canManage}
              isMutating={rollbackMutation.isPending || revokeMutation.isPending}
              onRollback={(targetVersionId) => {
                if (!agentId) return;
                rollbackMutation.mutate(
                  { agentId, targetVersionId },
                  {
                    onSuccess: (res) =>
                      toast.success(`Rolled back to v${res.activeVersion.versionNumber}`),
                    onError: (err) =>
                      toast.error('Rollback failed', {
                        description: err instanceof Error ? err.message : undefined,
                      }),
                  }
                );
              }}
              onRevoke={(versionId) => {
                if (!agentId) return;
                revokeMutation.mutate(
                  { agentId, versionId },
                  {
                    onSuccess: () => toast.success('Version revoked'),
                    onError: (err) =>
                      toast.error('Revoke failed', {
                        description: err instanceof Error ? err.message : undefined,
                      }),
                  }
                );
              }}
            />
          )}
        </div>
      </div>

      <AgentPublishDialog
        open={publishOpen}
        onOpenChange={setPublishOpen}
        agentName={name || 'Agent'}
        validation={validationResult}
        isValidating={validateMutation.isPending}
        isPublishing={publishMutation.isPending}
        validationError={validationError}
        onPublish={handleConfirmPublish}
      />
    </div>
  );
};

export default AgentBuilderPage;
