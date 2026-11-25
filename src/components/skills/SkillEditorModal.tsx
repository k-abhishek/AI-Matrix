import React, { useEffect, useState } from 'react';
import { Sparkles, Play, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { toast } from '../ui/sonner';
import {
  useCreateSkill,
  useUpdateSkill,
  usePublishSkill,
  useTestSkill,
} from '../../hooks/useSkills';
import type { SkillDTO, SkillScope } from '../../types';

export interface SkillEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: SkillDTO | null;
  onSaved?: (skill: SkillDTO) => void;
}

function slugifyKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
}

export const SkillEditorModal: React.FC<SkillEditorModalProps> = ({
  open,
  onOpenChange,
  skill,
  onSaved,
}) => {
  const isEditing = Boolean(skill);
  const latestVersion = skill?.versions?.[0];

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState('');
  const [summary, setSummary] = useState('');
  const [instructions, setInstructions] = useState('');
  const [scope, setScope] = useState<SkillScope>('PERSONAL');
  const [inputSchemaText, setInputSchemaText] = useState('');
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const [savedSkillId, setSavedSkillId] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState('');
  const [testOutput, setTestOutput] = useState<string | null>(null);

  const createMutation = useCreateSkill();
  const updateMutation = useUpdateSkill();
  const publishMutation = usePublishSkill();
  const testMutation = useTestSkill();

  useEffect(() => {
    if (!open) return;
    if (skill) {
      setName(skill.name);
      setKey(skill.key);
      setKeyTouched(true);
      setDescription(skill.description || '');
      setSummary(latestVersion?.summary || skill.description || '');
      setInstructions(latestVersion?.instructions || '');
      setScope(skill.scope === 'WORKSPACE' ? 'WORKSPACE' : 'PERSONAL');
      setInputSchemaText(
        latestVersion?.inputSchema ? JSON.stringify(latestVersion.inputSchema, null, 2) : ''
      );
      setSavedSkillId(skill.id);
    } else {
      setName('');
      setKey('');
      setKeyTouched(false);
      setDescription('');
      setSummary('');
      setInstructions('');
      setScope('PERSONAL');
      setInputSchemaText('');
      setSavedSkillId(null);
    }
    setSchemaError(null);
    setTestPrompt('');
    setTestOutput(null);
  }, [open, skill, latestVersion]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !keyTouched) {
      setKey(slugifyKey(val));
    }
  };

  const parseInputSchema = (): Record<string, unknown> | undefined => {
    const trimmed = inputSchemaText.trim();
    if (!trimmed) {
      setSchemaError(null);
      return undefined;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setSchemaError('Input schema must be a JSON object.');
        return undefined;
      }
      setSchemaError(null);
      return parsed as Record<string, unknown>;
    } catch {
      setSchemaError('Invalid JSON in input schema.');
      return undefined;
    }
  };

  const handleSave = async (publishAfterSave = false) => {
    if (!name.trim() || !instructions.trim()) {
      toast.error('Skill name and instructions are required.');
      return;
    }
    if (inputSchemaText.trim() && !parseInputSchema()) {
      return;
    }
    const parsedSchema = parseInputSchema();

    try {
      let currentSkill: SkillDTO;
      if (isEditing && skill) {
        const res = await updateMutation.mutateAsync({
          skillId: skill.id,
          dto: {
            name: name.trim(),
            description: description.trim() || null,
            summary: summary.trim() || description.trim() || name.trim(),
            instructions: instructions.trim(),
            inputSchema: parsedSchema ?? null,
          },
        });
        currentSkill = res.skill;
      } else {
        const res = await createMutation.mutateAsync({
          key: key.trim() || slugifyKey(name),
          name: name.trim(),
          description: description.trim() || undefined,
          scope,
          category: 'INSTRUCTION',
          summary: summary.trim() || description.trim() || name.trim(),
          instructions: instructions.trim(),
          inputSchema: parsedSchema,
        });
        currentSkill = res.skill;
        setSavedSkillId(currentSkill.id);
      }

      if (publishAfterSave) {
        const pubRes = await publishMutation.mutateAsync(currentSkill.id);
        currentSkill = pubRes.skill;
        toast.success('Custom skill published', {
          description: `"${currentSkill.name}" is ready to attach to agents.`,
        });
      } else {
        toast.success(isEditing ? 'Skill updated' : 'Custom skill saved as draft');
      }

      onSaved?.(currentSkill);
      if (publishAfterSave) {
        onOpenChange(false);
      }
    } catch (err) {
      toast.error('Failed to save skill', {
        description: err instanceof Error ? err.message : 'Please check your inputs.',
      });
    }
  };

  const handleTest = async () => {
    const targetId = savedSkillId || skill?.id;
    if (!targetId) {
      toast.error('Save the skill first before testing.');
      return;
    }
    if (!testPrompt.trim()) {
      toast.error('Enter a test prompt.');
      return;
    }
    try {
      const result = await testMutation.mutateAsync({
        skillId: targetId,
        prompt: testPrompt.trim(),
      });
      setTestOutput(
        typeof result === 'string' ? result : JSON.stringify(result, null, 2)
      );
    } catch (err) {
      toast.error('Skill test failed', {
        description: err instanceof Error ? err.message : 'Unable to test skill.',
      });
    }
  };

  const isBusy =
    createMutation.isPending ||
    updateMutation.isPending ||
    publishMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <DialogTitle>
              {isEditing ? `Edit Skill: ${skill?.name}` : 'Create Custom Skill'}
            </DialogTitle>
            <Badge variant="outline" className="text-[10px]">
              INSTRUCTION
            </Badge>
          </div>
          <DialogDescription>
            Create a reusable instruction-based skill that can be attached across multiple
            agents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="skill-name"
                className="block text-xs font-semibold text-foreground mb-1"
              >
                Skill Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="skill-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., SEO Content Writer"
                disabled={isBusy}
              />
            </div>

            <div>
              <label
                htmlFor="skill-key"
                className="block text-xs font-semibold text-foreground mb-1"
              >
                Skill Key
              </label>
              <Input
                id="skill-key"
                value={key}
                onChange={(e) => {
                  setKeyTouched(true);
                  setKey(e.target.value);
                }}
                placeholder="seo_content_writer"
                disabled={isEditing || isBusy}
                className="font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="skill-description"
                className="block text-xs font-semibold text-foreground mb-1"
              >
                Description
              </label>
              <Input
                id="skill-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What this skill helps the agent accomplish"
                disabled={isBusy}
              />
            </div>

            <div>
              <label
                htmlFor="skill-visibility"
                className="block text-xs font-semibold text-foreground mb-1"
              >
                Visibility
              </label>
              <select
                id="skill-visibility"
                value={scope}
                disabled={isEditing || isBusy}
                onChange={(e) => setScope(e.target.value as SkillScope)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              >
                <option value="PERSONAL">PERSONAL (Only me)</option>
                <option value="WORKSPACE">WORKSPACE (Shared with team)</option>
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="skill-instructions"
              className="block text-xs font-semibold text-foreground mb-1"
            >
              Skill Instructions <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="skill-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Step-by-step procedures, formatting rules, and domain expertise..."
              rows={6}
              disabled={isBusy}
              className="font-mono text-xs leading-relaxed"
            />
          </div>

          <div>
            <label
              htmlFor="skill-input-schema"
              className="block text-xs font-semibold text-foreground mb-1"
            >
              Optional Input Schema (JSON)
            </label>
            <Textarea
              id="skill-input-schema"
              value={inputSchemaText}
              onChange={(e) => {
                setInputSchemaText(e.target.value);
                setSchemaError(null);
              }}
              placeholder='{"type": "object", "properties": {"topic": {"type": "string"}}}'
              rows={3}
              disabled={isBusy}
              className="font-mono text-xs"
            />
            {schemaError && (
              <p className="mt-1 text-xs text-destructive">{schemaError}</p>
            )}
          </div>

          {/* Independent Skill Testing */}
          <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Test Skill</span>
              {!savedSkillId && (
                <span className="text-[11px] text-muted-foreground">
                  Save draft first to enable testing
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter a sample prompt to test this skill..."
                disabled={!savedSkillId || testMutation.isPending}
                className="h-8 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleTest}
                disabled={!savedSkillId || testMutation.isPending}
              >
                {testMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Test
              </Button>
            </div>
            {testOutput && (
              <pre className="text-[11px] bg-background border border-border rounded-lg p-2.5 overflow-x-auto max-h-40 whitespace-pre-wrap">
                {testOutput}
              </pre>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSave(false)}
            disabled={isBusy}
          >
            {isBusy ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isBusy}
          >
            <CheckCircle2 className="h-4 w-4" />
            Save & Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SkillEditorModal;
