import React from 'react';
import {
  Bot,
  BookOpen,
  Sparkles,
  Play,
  Pencil,
  Copy,
  Archive,
  Lock,
  Users,
  Clock,
  Cpu,
} from 'lucide-react';
import Card from '../ui/Card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { formatDate } from '../../utils/helpers';
import {
  getAgentAvatarPalette,
  getAgentModelLabel,
} from '../../utils/agentHelpers';
import type { AgentDTO } from '../../types';

export interface AgentCardProps {
  agent: AgentDTO;
  canManage: boolean;
  onOpenPlayground: (agent: AgentDTO) => void;
  onEdit: (agent: AgentDTO) => void;
  onDuplicate: (agent: AgentDTO) => void;
  onArchive: (agent: AgentDTO) => void;
  isDuplicating?: boolean;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  canManage,
  onOpenPlayground,
  onEdit,
  onDuplicate,
  onArchive,
  isDuplicating = false,
}) => {
  const isPublished = Boolean(agent.activeVersionId);
  const isArchived = agent.status === 'ARCHIVED';
  const modelLabel = getAgentModelLabel(agent);
  const palette = getAgentAvatarPalette(agent.id || agent.name);

  // Read counts if backend includes _count or relation arrays
  const extended = agent as AgentDTO & {
    _count?: { knowledgeBases?: number; skills?: number };
    knowledgeBases?: unknown[];
    skills?: unknown[];
  };
  const kbCount = extended._count?.knowledgeBases ?? extended.knowledgeBases?.length ?? 0;
  const skillCount = extended._count?.skills ?? extended.skills?.length ?? 0;

  return (
    <Card className="flex flex-col justify-between p-5 transition-all hover:shadow-md hover:border-primary/40">
      <div className="space-y-3.5">
        {/* Top Row: Avatar + Name + Badges */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${palette}`}
            >
              <Bot className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3
                onClick={() => (canManage ? onEdit(agent) : onOpenPlayground(agent))}
                className="font-semibold text-sm text-foreground hover:text-primary cursor-pointer truncate transition-colors"
              >
                {agent.name}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 font-medium gap-1"
                >
                  {agent.visibility === 'WORKSPACE' ? (
                    <Users className="h-2.5 w-2.5" />
                  ) : (
                    <Lock className="h-2.5 w-2.5" />
                  )}
                  {agent.visibility}
                </Badge>
                {isArchived ? (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Archived
                  </Badge>
                ) : isPublished ? (
                  <Badge
                    variant="default"
                    className="text-[10px] px-1.5 py-0 bg-emerald-600 hover:bg-emerald-600/90 text-white"
                  >
                    Published
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Draft
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem] leading-relaxed">
          {agent.description || 'No description provided.'}
        </p>

        {/* Metadata Summary */}
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-2.5 text-xs">
          <div className="min-w-0">
            <span className="flex items-center gap-1 text-[10px] uppercase font-semibold text-muted-foreground">
              <Cpu className="h-3 w-3 shrink-0" />
              Model
            </span>
            <span
              className="block truncate font-medium text-foreground mt-0.5"
              title={modelLabel}
            >
              {modelLabel}
            </span>
          </div>
          <div className="text-center">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold text-muted-foreground">
              <BookOpen className="h-3 w-3 shrink-0" />
              KBs
            </span>
            <span className="block font-bold text-foreground font-mono mt-0.5">
              {kbCount}
            </span>
          </div>
          <div className="text-center">
            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-semibold text-muted-foreground">
              <Sparkles className="h-3 w-3 shrink-0" />
              Skills
            </span>
            <span className="block font-bold text-foreground font-mono mt-0.5">
              {skillCount}
            </span>
          </div>
        </div>
      </div>

      {/* Footer: Timestamp & Actions */}
      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
          <Clock className="h-3 w-3 shrink-0" />
          {formatDate(agent.updatedAt)}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onOpenPlayground(agent)}
            title="Open in Playground"
            aria-label={`Open ${agent.name} in Playground`}
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            Open
          </Button>
          {canManage && !isArchived && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onEdit(agent)}
                title="Edit agent"
                aria-label={`Edit ${agent.name}`}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onDuplicate(agent)}
                disabled={isDuplicating}
                title="Duplicate agent"
                aria-label={`Duplicate ${agent.name}`}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onArchive(agent)}
                title="Archive agent"
                aria-label={`Archive ${agent.name}`}
              >
                <Archive className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AgentCard;
