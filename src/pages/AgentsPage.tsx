import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, Search, X, ArrowUpDown } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from '../components/ui/sonner';
import AgentCard from '../components/agents/AgentCard';
import {
  useAgents,
  useArchiveAgent,
  useDuplicateAgent,
} from '../hooks/useAgents';
import { useAuthContext } from '../context/AuthContext';
import { canManageAgent } from '../utils/agentHelpers';
import type { AgentDTO, AgentStatus, AgentVisibility } from '../types';

type SortOption = 'updated_desc' | 'name_asc' | 'name_desc';

export const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const auth = useAuthContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'ALL' | AgentVisibility>('ALL');
  const [statusFilter, setStatusFilter] = useState<AgentStatus>('ACTIVE');
  const [sortBy, setSortBy] = useState<SortOption>('updated_desc');
  const [agentToArchive, setAgentToArchive] = useState<AgentDTO | null>(null);

  const {
    data: agents = [],
    isLoading,
    error,
    refetch,
  } = useAgents({
    status: statusFilter,
    visibility: visibilityFilter === 'ALL' ? undefined : visibilityFilter,
  });

  const duplicateMutation = useDuplicateAgent();
  const archiveMutation = useArchiveAgent();

  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = agents.filter((agent) => {
      if (!q) return true;
      return (
        agent.name.toLowerCase().includes(q) ||
        (agent.description || '').toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [agents, searchQuery, sortBy]);

  const handleDuplicate = async (agent: AgentDTO) => {
    try {
      const res = await duplicateMutation.mutateAsync(agent.id);
      toast.success('Agent duplicated', {
        description: `Created "${res.agent.name}" as a new draft.`,
      });
      navigate(`/agents/${res.agent.id}`);
    } catch (err) {
      toast.error('Failed to duplicate agent', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  const handleConfirmArchive = async () => {
    if (!agentToArchive) return;
    try {
      await archiveMutation.mutateAsync(agentToArchive.id);
      toast.success('Agent archived', {
        description: `"${agentToArchive.name}" has been archived.`,
      });
      setAgentToArchive(null);
    } catch (err) {
      toast.error('Failed to archive agent', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      <PageHeader
        icon={Bot}
        eyebrow="Agent Studio"
        title="Agents"
        description="Create and manage AI agents tailored to your workflows."
        actions={
          <Button onClick={() => navigate('/agents/new')}>
            <Plus className="h-4 w-4" />
            Create Agent
          </Button>
        }
      />

      {/* Search, Filters & Sort Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents by name or description..."
            aria-label="Search agents"
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Visibility filter */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            {(['ALL', 'PERSONAL', 'WORKSPACE'] as const).map((vis) => (
              <button
                key={vis}
                type="button"
                onClick={() => setVisibilityFilter(vis)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  visibilityFilter === vis
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {vis === 'ALL' ? 'All' : vis === 'PERSONAL' ? 'Personal' : 'Workspace'}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs">
            {(['ACTIVE', 'ARCHIVED'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {status === 'ACTIVE' ? 'Active' : 'Archived'}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-xs">
            <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              aria-label="Sort agents"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-foreground outline-none cursor-pointer"
            >
              <option value="updated_desc">Last updated</option>
              <option value="name_asc">Name (A–Z)</option>
              <option value="name_desc">Name (Z–A)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorMessage
          title="Failed to load agents"
          message={error instanceof Error ? error.message : 'Unable to fetch agents.'}
          onRetry={() => refetch()}
        />
      ) : filteredAgents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 py-16 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
            <Bot className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            {searchQuery || visibilityFilter !== 'ALL' || statusFilter === 'ARCHIVED'
              ? 'No matching agents found'
              : 'No agents yet'}
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-md">
            {searchQuery || visibilityFilter !== 'ALL'
              ? 'Try adjusting your search query or filters.'
              : 'Create your first AI agent with custom instructions, optional knowledge bases, skills, and authorized tools.'}
          </p>
          {!searchQuery && statusFilter === 'ACTIVE' && (
            <Button className="mt-5" onClick={() => navigate('/agents/new')}>
              <Plus className="h-4 w-4" />
              Create Agent
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              canManage={canManageAgent(agent, auth)}
              onOpenPlayground={(a) => navigate(`/agents/${a.id}/playground`)}
              onEdit={(a) => navigate(`/agents/${a.id}`)}
              onDuplicate={handleDuplicate}
              onArchive={(a) => setAgentToArchive(a)}
              isDuplicating={duplicateMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Archive Confirmation Dialog */}
      <Dialog
        open={Boolean(agentToArchive)}
        onOpenChange={(open) => {
          if (!open) setAgentToArchive(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Agent</DialogTitle>
            <DialogDescription>
              Are you sure you want to archive{' '}
              <span className="font-semibold text-foreground">{agentToArchive?.name}</span>?
              Archived agents are hidden from active selection, while existing conversations
              remain readable.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAgentToArchive(null)}
              disabled={archiveMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmArchive}
              disabled={archiveMutation.isPending}
            >
              {archiveMutation.isPending ? 'Archiving...' : 'Archive Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentsPage;
