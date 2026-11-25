import React from 'react';
import { Sliders } from 'lucide-react';
import Card from '../../ui/Card';
import { Input } from '../../ui/input';
import type { AgentExecutionPolicy } from '../../../types';

export interface AgentAdvancedConfigProps {
  maxIterations: number;
  timeoutMs: number;
  executionPolicy: AgentExecutionPolicy;
  disabled?: boolean;
  onChange: (updates: {
    maxIterations?: number;
    timeoutMs?: number;
    executionPolicy?: AgentExecutionPolicy;
  }) => void;
}

export const AgentAdvancedConfig: React.FC<AgentAdvancedConfigProps> = ({
  maxIterations,
  timeoutMs,
  executionPolicy,
  disabled = false,
  onChange,
}) => {
  return (
    <Card className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/60">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Sliders className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Advanced Configuration</h2>
          <p className="text-xs text-muted-foreground">
            Fine-tune execution limits, timeouts, and tool approval policies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="agent-max-iterations"
            className="block text-xs font-semibold text-foreground mb-1.5"
          >
            Maximum Agent Iterations
          </label>
          <Input
            id="agent-max-iterations"
            type="number"
            min={1}
            max={50}
            value={maxIterations}
            disabled={disabled}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!Number.isNaN(val)) {
                onChange({ maxIterations: Math.min(50, Math.max(1, val)) });
              }
            }}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Maximum reasoning/tool-call steps per turn (default: 10).
          </p>
        </div>

        <div>
          <label
            htmlFor="agent-timeout-ms"
            className="block text-xs font-semibold text-foreground mb-1.5"
          >
            Execution Timeout (seconds)
          </label>
          <Input
            id="agent-timeout-ms"
            type="number"
            min={5}
            max={300}
            value={Math.round(timeoutMs / 1000)}
            disabled={disabled}
            onChange={(e) => {
              const secs = parseInt(e.target.value, 10);
              if (!Number.isNaN(secs)) {
                onChange({ timeoutMs: Math.min(300, Math.max(5, secs)) * 1000 });
              }
            }}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Maximum time allowed for a single agent run before timing out.
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-start justify-between gap-4 rounded-xl border border-border p-3.5 cursor-pointer">
          <div>
            <div className="text-xs font-semibold text-foreground">
              Require human approval for all tool calls
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Pause execution and ask the user to approve before invoking any external tool.
            </p>
          </div>
          <input
            type="checkbox"
            checked={Boolean(executionPolicy.requireApprovalForAllTools)}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                executionPolicy: {
                  ...executionPolicy,
                  requireApprovalForAllTools: e.target.checked,
                },
              })
            }
            className="h-4 w-4 accent-primary mt-0.5"
          />
        </label>

        <label className="flex items-start justify-between gap-4 rounded-xl border border-border p-3.5 cursor-pointer">
          <div>
            <div className="text-xs font-semibold text-foreground">
              Allow web search fallback
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Permit fallback to web search when connected knowledge bases lack relevant
              context.
            </p>
          </div>
          <input
            type="checkbox"
            checked={Boolean(executionPolicy.allowWebSearchFallback)}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                executionPolicy: {
                  ...executionPolicy,
                  allowWebSearchFallback: e.target.checked,
                },
              })
            }
            className="h-4 w-4 accent-primary mt-0.5"
          />
        </label>
      </div>
    </Card>
  );
};

export default AgentAdvancedConfig;
