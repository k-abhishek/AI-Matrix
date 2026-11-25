import React from 'react';
import { Cpu, Info } from 'lucide-react';
import Card from '../../ui/Card';
import { Input } from '../../ui/input';
import type { ModelProvider } from '../../../types';

const SUPPORTED_PROVIDERS: Array<{ value: ModelProvider; label: string }> = [
  { value: 'google', label: 'Google (Gemini)' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'groq', label: 'Groq' },
];

export interface AgentModelConfigProps {
  provider: ModelProvider | null;
  model: string;
  temperature: number;
  maxTokens: number | null;
  disabled?: boolean;
  onChange: (updates: {
    provider?: ModelProvider | null;
    model?: string;
    temperature?: number;
    maxTokens?: number | null;
  }) => void;
}

export const AgentModelConfig: React.FC<AgentModelConfigProps> = ({
  provider,
  model,
  temperature,
  maxTokens,
  disabled = false,
  onChange,
}) => {
  return (
    <Card className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-border/60">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Model Configuration</h2>
          <p className="text-xs text-muted-foreground">
            Choose the LLM provider, model identifier, and sampling parameters.
          </p>
        </div>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        <span>
          Leave provider or model blank to use your workspace default model, or specify a
          supported provider and model identifier below.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="agent-provider"
            className="block text-xs font-semibold text-foreground mb-1.5"
          >
            LLM Provider
          </label>
          <select
            id="agent-provider"
            value={provider || ''}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                provider: e.target.value ? (e.target.value as ModelProvider) : null,
              })
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          >
            <option value="">Workspace default</option>
            {SUPPORTED_PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="agent-model"
            className="block text-xs font-semibold text-foreground mb-1.5"
          >
            Model Identifier
          </label>
          <Input
            id="agent-model"
            value={model}
            onChange={(e) => onChange({ model: e.target.value })}
            placeholder="Workspace default (or enter model ID)"
            disabled={disabled}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="agent-temperature"
              className="text-xs font-semibold text-foreground"
            >
              Temperature
            </label>
            <span className="text-xs font-mono text-muted-foreground">
              {temperature.toFixed(1)}
            </span>
          </div>
          <input
            id="agent-temperature"
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={temperature}
            disabled={disabled}
            onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
            className="w-full accent-primary cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0.0 (Deterministic)</span>
            <span>1.0 (Balanced)</span>
            <span>2.0 (Creative)</span>
          </div>
        </div>

        <div>
          <label
            htmlFor="agent-max-tokens"
            className="block text-xs font-semibold text-foreground mb-1.5"
          >
            Maximum Output Tokens
          </label>
          <Input
            id="agent-max-tokens"
            type="number"
            min={1}
            max={128000}
            value={maxTokens ?? ''}
            onChange={(e) =>
              onChange({
                maxTokens: e.target.value ? Math.max(1, parseInt(e.target.value, 10)) : null,
              })
            }
            placeholder="Provider default"
            disabled={disabled}
          />
          <p className="mt-1 text-[11px] text-muted-foreground">
            Leave empty to use the model&apos;s default output token limit.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AgentModelConfig;
