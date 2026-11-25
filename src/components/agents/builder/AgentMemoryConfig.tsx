import React from 'react';
import { Brain, HelpCircle, Lock } from 'lucide-react';
import Card from '../../ui/Card';
import { Badge } from '../../ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../ui/tooltip';
import type { AgentMemoryConfig as AgentMemoryConfigType } from '../../../types';

export interface AgentMemoryConfigProps {
  memoryConfig: AgentMemoryConfigType;
  disabled?: boolean;
  onChange: (next: AgentMemoryConfigType) => void;
}

export const AgentMemoryConfig: React.FC<AgentMemoryConfigProps> = ({
  memoryConfig,
  disabled = false,
  onChange,
}) => {
  return (
    <Card className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/60">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Memory Configuration</h2>
          <p className="text-xs text-muted-foreground">
            Control how the agent retains context during conversations.
          </p>
        </div>
      </div>

      {/* Within-thread Memory */}
      <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              Within-thread conversation memory
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="About within-thread memory"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  When enabled, the agent retains relevant context across turns within the same
                  ongoing conversation thread.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className="text-xs text-muted-foreground">
            Maintains context and message history within an active conversation thread.
          </p>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
          <input
            type="checkbox"
            aria-label="Enable within-thread conversation memory"
            checked={memoryConfig.withinThreadEnabled}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...memoryConfig,
                withinThreadEnabled: e.target.checked,
              })
            }
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-muted rounded-full peer peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4 border border-border" />
        </label>
      </div>

      {/* Cross-thread Semantic Memory (Future Capability — Read-only Notice) */}
      <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 space-y-2 opacity-80">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold text-foreground">
              Long-term cross-thread semantic memory
            </span>
          </div>
          <Badge variant="outline" className="text-[10px]">
            Planned Capability
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cross-thread memory (remembering user preferences and facts across separate
          conversations, isolated by workspace, user, and agent) is planned for a future
          release and is not currently active.
        </p>
      </div>
    </Card>
  );
};

export default AgentMemoryConfig;
