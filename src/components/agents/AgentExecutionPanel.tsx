import React from 'react';
import {
  Activity,
  BookOpen,
  CheckCircle2,
  Cpu,
  Loader2,
  ShieldAlert,
  Sparkles,
  Wrench,
  XCircle,
} from 'lucide-react';
import { Badge } from '../ui/badge';

export type PlaygroundActivityType =
  | 'skill_load'
  | 'searching_kb'
  | 'tool_start'
  | 'tool_end'
  | 'approval_required'
  | 'generating'
  | 'completed'
  | 'failed';

export interface PlaygroundActivityEvent {
  id: string;
  type: PlaygroundActivityType;
  label: string;
  detail?: string;
  timestamp: string;
}

export interface AgentExecutionPanelProps {
  agentName: string;
  modelLabel: string;
  isPublished: boolean;
  kbNames: string[];
  skillCount: number;
  toolCount: number;
  events: PlaygroundActivityEvent[];
  isRunning: boolean;
}

export const AgentExecutionPanel: React.FC<AgentExecutionPanelProps> = ({
  agentName,
  modelLabel,
  isPublished,
  kbNames,
  skillCount,
  toolCount,
  events,
  isRunning,
}) => {
  const renderIcon = (type: PlaygroundActivityType) => {
    switch (type) {
      case 'skill_load':
        return <Sparkles className="h-3.5 w-3.5 text-violet-500" />;
      case 'searching_kb':
        return <BookOpen className="h-3.5 w-3.5 text-blue-500" />;
      case 'tool_start':
      case 'tool_end':
        return <Wrench className="h-3.5 w-3.5 text-amber-500" />;
      case 'approval_required':
        return <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />;
      case 'generating':
        return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
      case 'completed':
        return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />;
      case 'failed':
        return <XCircle className="h-3.5 w-3.5 text-destructive" />;
    }
  };

  return (
    <aside className="flex flex-col gap-4 h-full">
      {/* Configuration Summary */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Configuration
          </h3>
          <Badge variant={isPublished ? 'default' : 'secondary'} className="text-[10px]">
            {isPublished ? 'Published' : 'Draft'}
          </Badge>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Agent</span>
            <span className="font-medium text-foreground truncate">{agentName}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Cpu className="h-3 w-3" /> Model
            </span>
            <span className="font-mono text-[11px] text-foreground truncate">
              {modelLabel}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-muted-foreground">
              <BookOpen className="h-3 w-3" /> Knowledge
            </span>
            <span className="font-medium text-foreground">
              {kbNames.length === 0 ? 'None' : `${kbNames.length} connected`}
            </span>
          </div>
          {kbNames.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {kbNames.map((kb) => (
                <Badge key={kb} variant="outline" className="text-[10px] font-normal">
                  {kb}
                </Badge>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Sparkles className="h-3 w-3" /> Skills
            </span>
            <span className="font-medium text-foreground">{skillCount}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Wrench className="h-3 w-3" /> Enabled Tools
            </span>
            <span className="font-medium text-foreground">{toolCount}</span>
          </div>
        </div>
      </div>

      {/* Execution Activity Timeline */}
      <div className="flex-1 rounded-xl border border-border bg-card p-4 flex flex-col min-h-[260px]">
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-border/60">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-primary" />
            Execution Activity
          </div>
          {isRunning && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
        </div>

        <div className="flex-1 overflow-y-auto pt-3 space-y-2.5">
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              Send a message to observe skill loading, knowledge retrieval, and tool
              executions.
            </p>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                className="flex items-start gap-2.5 rounded-lg bg-muted/40 p-2.5 text-xs"
              >
                <div className="mt-0.5 shrink-0">{renderIcon(ev.type)}</div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-foreground">{ev.label}</div>
                  {ev.detail && (
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      {ev.detail}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

export default AgentExecutionPanel;
