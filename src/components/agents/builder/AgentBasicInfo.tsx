import React from 'react';
import { Bot, Lock, Users, Info } from 'lucide-react';
import Card from '../../ui/Card';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { getAgentAvatarPalette } from '../../../utils/agentHelpers';
import type { AgentVisibility } from '../../../types';

export interface AgentBasicInfoProps {
  name: string;
  description: string;
  systemInstructions: string;
  visibility: AgentVisibility;
  isOrganization: boolean;
  disabled?: boolean;
  onChange: (updates: {
    name?: string;
    description?: string;
    systemInstructions?: string;
    visibility?: AgentVisibility;
  }) => void;
}

export const AgentBasicInfo: React.FC<AgentBasicInfoProps> = ({
  name,
  description,
  systemInstructions,
  visibility,
  isOrganization,
  disabled = false,
  onChange,
}) => {
  const palette = getAgentAvatarPalette(name || 'new-agent');

  return (
    <Card className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/60">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${palette}`}
        >
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Basic Information</h2>
          <p className="text-xs text-muted-foreground">
            Define your agent&apos;s identity, core instructions, and access visibility.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="agent-name"
            className="block text-xs font-semibold text-foreground mb-1.5"
          >
            Agent Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="agent-name"
            value={name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g., Customer Support Specialist"
            disabled={disabled}
            required
          />
        </div>

        <div>
          <label
            htmlFor="agent-description"
            className="block text-xs font-semibold text-foreground mb-1.5"
          >
            Description
          </label>
          <Input
            id="agent-description"
            value={description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Briefly describe what this agent does and when to use it"
            disabled={disabled}
          />
        </div>

        <div>
          <label
            htmlFor="agent-instructions"
            className="block text-xs font-semibold text-foreground mb-1.5"
          >
            System Instructions <span className="text-destructive">*</span>
          </label>
          <Textarea
            id="agent-instructions"
            value={systemInstructions}
            onChange={(e) => onChange({ systemInstructions: e.target.value })}
            placeholder="You are a helpful AI assistant. Follow these guidelines..."
            rows={7}
            disabled={disabled}
            className="font-mono text-xs leading-relaxed"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Clear, specific instructions improve reliability. You can also attach reusable
            skills for specialized procedures.
          </p>
        </div>

        <div>
          <span className="block text-xs font-semibold text-foreground mb-2">
            Visibility
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ visibility: 'PERSONAL' })}
              className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                visibility === 'PERSONAL'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-border/80 hover:bg-muted/30'
              } disabled:opacity-60`}
            >
              <Lock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-foreground">PERSONAL</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Only you can access, edit, and run this agent within your active workspace.
                </p>
              </div>
            </button>

            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange({ visibility: 'WORKSPACE' })}
              className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                visibility === 'WORKSPACE'
                  ? 'border-primary bg-primary/5 ring-1 ring-primary'
                  : 'border-border hover:border-border/80 hover:bg-muted/30'
              } disabled:opacity-60`}
            >
              <Users className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-foreground">WORKSPACE</div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Shared with authorized organization members. Published versions can be run by
                  workspace members.
                </p>
              </div>
            </button>
          </div>

          {visibility === 'WORKSPACE' && !isOrganization && (
            <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
              <Info className="h-4 w-4 shrink-0" />
              <span>
                You are currently in a personal account context. Switch to a Clerk
                organization to collaborate on workspace agents with team members.
              </span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default AgentBasicInfo;
