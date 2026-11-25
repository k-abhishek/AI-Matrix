import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  Pencil,
  Workflow,
  Wrench,
  FileText,
} from 'lucide-react';
import Card from '../../ui/Card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import Skeleton from '../../ui/Skeleton';
import ErrorMessage from '../../ui/ErrorMessage';
import SkillEditorModal from '../../skills/SkillEditorModal';
import type { AgentSkillDTO, SkillCategory, SkillDTO, SkillScope } from '../../../types';

export interface AgentSkillConfigProps {
  skills: SkillDTO[];
  isLoadingSkills: boolean;
  skillsError: unknown;
  onRetrySkills: () => void;
  attachedSkills: Array<Pick<AgentSkillDTO, 'skillId' | 'skillVersionId'>>;
  disabled?: boolean;
  isMutating?: boolean;
  onAttach: (skill: SkillDTO) => void;
  onDetach: (skillId: string) => void;
  onSkillCreated?: (skill: SkillDTO) => void;
}

const SCOPE_TABS: Array<{ id: SkillScope; label: string }> = [
  { id: 'PLATFORM', label: 'Platform Skills' },
  { id: 'WORKSPACE', label: 'Workspace Skills' },
  { id: 'PERSONAL', label: 'My Skills' },
];

export const AgentSkillConfig: React.FC<AgentSkillConfigProps> = ({
  skills,
  isLoadingSkills,
  skillsError,
  onRetrySkills,
  attachedSkills,
  disabled = false,
  isMutating = false,
  onAttach,
  onDetach,
  onSkillCreated,
}) => {
  const [activeScope, setActiveScope] = useState<SkillScope>('PLATFORM');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | SkillCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillDTO | null>(null);

  const attachedIds = useMemo(
    () => new Set(attachedSkills.map((s) => s.skillId)),
    [attachedSkills]
  );

  const filteredSkills = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return skills.filter((s) => {
      if (s.status === 'ARCHIVED') return false;
      if (s.scope !== activeScope) return false;
      if (categoryFilter !== 'ALL' && s.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q) ||
        s.key.toLowerCase().includes(q)
      );
    });
  }, [skills, activeScope, categoryFilter, searchQuery]);

  const countsByScope = useMemo(() => {
    const counts: Record<SkillScope, number> = {
      PLATFORM: 0,
      WORKSPACE: 0,
      PERSONAL: 0,
    };
    skills.forEach((s) => {
      if (s.status !== 'ARCHIVED') {
        counts[s.scope] = (counts[s.scope] || 0) + 1;
      }
    });
    return counts;
  }, [skills]);

  const renderCategoryIcon = (category: SkillCategory) => {
    if (category === 'TOOL') return <Wrench className="h-3 w-3" />;
    if (category === 'WORKFLOW') return <Workflow className="h-3 w-3" />;
    return <FileText className="h-3 w-3" />;
  };

  return (
    <Card className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Skills</h2>
              <Badge variant="secondary" className="text-[10px]">
                {attachedSkills.length} selected
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Attach reusable instruction and tool skills, or create custom skills.
            </p>
          </div>
        </div>

        {!disabled && (
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditingSkill(null);
              setEditorOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            Create Custom Skill
          </Button>
        )}
      </div>

      {/* Scope Tabs + Search + Category Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Skill categories"
          className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs"
        >
          {SCOPE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeScope === tab.id}
              onClick={() => setActiveScope(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
                activeScope === tab.id
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {countsByScope[tab.id]}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search skills..."
              className="h-8 pl-8 text-xs"
            />
          </div>

          <select
            aria-label="Filter by skill type"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'ALL' | SkillCategory)}
            className="h-8 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="ALL">All Types</option>
            <option value="INSTRUCTION">Instruction</option>
            <option value="TOOL">Tool</option>
            <option value="WORKFLOW">Workflow (Future)</option>
          </select>
        </div>
      </div>

      {/* Skills Grid */}
      {isLoadingSkills ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : skillsError ? (
        <ErrorMessage
          title="Failed to load skills"
          message={
            skillsError instanceof Error ? skillsError.message : 'Unable to fetch skills.'
          }
          onRetry={onRetrySkills}
        />
      ) : filteredSkills.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-2">
          <Sparkles className="h-6 w-6 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground">
            No skills found in {SCOPE_TABS.find((t) => t.id === activeScope)?.label}.
          </p>
          {activeScope === 'PERSONAL' && !disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditingSkill(null);
                setEditorOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
              Create Custom Skill
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSkills.map((skill) => {
            const isSelected = attachedIds.has(skill.id);
            const latestVer = skill.versions?.[0];
            const isWorkflowFuture = skill.category === 'WORKFLOW';
            const requiredCaps = latestVer?.requiredCapabilities || [];

            return (
              <div
                key={skill.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-all ${
                  isSelected
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {skill.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0">
                          {renderCategoryIcon(skill.category)}
                          {skill.category}
                        </Badge>
                        {latestVer && (
                          <span className="text-[10px] font-mono text-muted-foreground">
                            v{latestVer.versionNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {skill.description || latestVer?.summary || 'No description'}
                      </p>
                    </div>
                  </div>

                  {requiredCaps.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {requiredCaps.map((cap) => (
                        <Badge
                          key={cap}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 font-normal"
                        >
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between gap-2">
                  {skill.scope !== 'PLATFORM' && !disabled ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setEditingSkill(skill);
                        setEditorOpen(true);
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      {isWorkflowFuture ? 'Future capability' : 'Managed skill'}
                    </span>
                  )}

                  {!disabled && (
                    <Button
                      type="button"
                      size="sm"
                      variant={isSelected ? 'secondary' : 'outline'}
                      className="h-7 px-2.5 text-xs"
                      disabled={isMutating || (isWorkflowFuture && !isSelected)}
                      onClick={() => (isSelected ? onDetach(skill.id) : onAttach(skill))}
                    >
                      {isSelected ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                          Selected
                        </>
                      ) : isWorkflowFuture ? (
                        'Coming Soon'
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Attach
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SkillEditorModal
        open={editorOpen}
        onOpenChange={setEditorOpen}
        skill={editingSkill}
        onSaved={(saved) => {
          onSkillCreated?.(saved);
          if (!editingSkill && saved.activeVersionId && !attachedIds.has(saved.id)) {
            onAttach(saved);
          }
        }}
      />
    </Card>
  );
};

export default AgentSkillConfig;
