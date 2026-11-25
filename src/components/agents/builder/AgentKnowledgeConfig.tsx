import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Trash2,
  CheckCircle2,
  Globe,
  Building2,
  SlidersHorizontal,
} from 'lucide-react';
import Card from '../../ui/Card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Badge } from '../../ui/badge';
import Skeleton from '../../ui/Skeleton';
import ErrorMessage from '../../ui/ErrorMessage';
import type { AgentKnowledgeBaseDTO, KnowledgeBaseDTO } from '../../../types';

export interface PendingKbBinding {
  knowledgeBaseId: string;
  retrievalConfig?: { topK?: number; scoreThreshold?: number };
  isEnabled: boolean;
}

export interface AgentKnowledgeConfigProps {
  accessibleKbs: KnowledgeBaseDTO[];
  isLoadingKbs: boolean;
  kbsError: unknown;
  onRetryKbs: () => void;
  attachedBindings: Array<AgentKnowledgeBaseDTO | PendingKbBinding>;
  disabled?: boolean;
  isMutating?: boolean;
  onAttach: (kb: KnowledgeBaseDTO, retrievalConfig?: { topK?: number; scoreThreshold?: number }) => void;
  onDetach: (knowledgeBaseId: string) => void;
  onUpdateRetrieval?: (
    knowledgeBaseId: string,
    retrievalConfig: { topK?: number; scoreThreshold?: number }
  ) => void;
}

export const AgentKnowledgeConfig: React.FC<AgentKnowledgeConfigProps> = ({
  accessibleKbs,
  isLoadingKbs,
  kbsError,
  onRetryKbs,
  attachedBindings,
  disabled = false,
  isMutating = false,
  onAttach,
  onDetach,
  onUpdateRetrieval,
}) => {
  const [showBrowser, setShowBrowser] = useState(attachedBindings.length > 0);
  const [searchQuery, setSearchQuery] = useState('');

  const attachedIds = useMemo(
    () => new Set(attachedBindings.map((b) => b.knowledgeBaseId)),
    [attachedBindings]
  );

  const kbById = useMemo(() => {
    const map = new Map<string, KnowledgeBaseDTO>();
    accessibleKbs.forEach((kb) => map.set(kb.id, kb));
    return map;
  }, [accessibleKbs]);

  const filteredAvailableKbs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return accessibleKbs.filter((kb) => {
      if (kb.status === 'ARCHIVED') return false;
      if (!q) return true;
      return (
        kb.name.toLowerCase().includes(q) ||
        (kb.description || '').toLowerCase().includes(q)
      );
    });
  }, [accessibleKbs, searchQuery]);

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Knowledge Bases</h2>
              <Badge variant="outline" className="text-[10px]">
                Optional
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Connect zero, one, or multiple knowledge bases for grounded retrieval.
            </p>
          </div>
        </div>

        {!showBrowser && !disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowBrowser(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Connect Knowledge Base
          </Button>
        )}
      </div>

      {/* Empty State when 0 KBs connected */}
      {attachedBindings.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/20 p-6 text-center space-y-3">
          <BookOpen className="h-7 w-7 text-muted-foreground mx-auto" />
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            No knowledge base connected. Your agent can still answer using its instructions,
            model capabilities and enabled tools.
          </p>
          {!showBrowser && !disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowBrowser(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Connect Knowledge Base
            </Button>
          )}
        </div>
      )}

      {/* Connected Knowledge Bases */}
      {attachedBindings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Connected ({attachedBindings.length})
          </h3>
          <div className="space-y-2.5">
            {attachedBindings.map((binding) => {
              const kb = kbById.get(binding.knowledgeBaseId);
              const retrieval = (binding.retrievalConfig || {}) as {
                topK?: number;
                scoreThreshold?: number;
              };
              const topK = retrieval.topK ?? kb?.retrievalDefaults?.topK ?? 5;
              const scoreThreshold =
                retrieval.scoreThreshold ?? kb?.retrievalDefaults?.scoreThreshold ?? 0.5;

              return (
                <div
                  key={binding.knowledgeBaseId}
                  className="rounded-xl border border-border bg-background p-3.5 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {kb?.name || 'Knowledge Base'}
                        </span>
                        {kb && (
                          <>
                            <Badge variant="outline" className="text-[10px] gap-1">
                              {kb.scope === 'PLATFORM' ? (
                                <Globe className="h-2.5 w-2.5" />
                              ) : (
                                <Building2 className="h-2.5 w-2.5" />
                              )}
                              {kb.scope}
                            </Badge>
                            <Badge
                              variant={kb.status === 'ACTIVE' ? 'default' : 'secondary'}
                              className={`text-[10px] ${
                                kb.status === 'ACTIVE'
                                  ? 'bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                  : ''
                              }`}
                            >
                              {kb.status === 'ACTIVE' ? 'Ready' : kb.status}
                            </Badge>
                          </>
                        )}
                      </div>
                      {kb?.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {kb.description}
                        </p>
                      )}
                      {kb?._count && (
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {kb._count.documents} documents · {kb._count.crawlers} sources
                        </p>
                      )}
                    </div>

                    {!disabled && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => onDetach(binding.knowledgeBaseId)}
                        disabled={isMutating}
                        aria-label={`Remove ${kb?.name || 'knowledge base'}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Retrieval Settings */}
                  {onUpdateRetrieval && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/50">
                      <div>
                        <label className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground mb-1">
                          <SlidersHorizontal className="h-3 w-3" />
                          Retrieval Limit (Top K)
                        </label>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          value={topK}
                          disabled={disabled || isMutating}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!Number.isNaN(val)) {
                              onUpdateRetrieval(binding.knowledgeBaseId, {
                                ...retrieval,
                                topK: Math.min(20, Math.max(1, val)),
                              });
                            }
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                          Minimum Relevance Score (0–1)
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={1}
                          step={0.05}
                          value={scoreThreshold}
                          disabled={disabled || isMutating}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!Number.isNaN(val)) {
                              onUpdateRetrieval(binding.knowledgeBaseId, {
                                ...retrieval,
                                scoreThreshold: Math.min(1, Math.max(0, val)),
                              });
                            }
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available Knowledge Bases Browser */}
      {showBrowser && !disabled && (
        <div className="space-y-3 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Available Knowledge Bases
            </h3>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search knowledge bases..."
                className="h-8 pl-8 text-xs"
              />
            </div>
          </div>

          {isLoadingKbs ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : kbsError ? (
            <ErrorMessage
              title="Failed to load knowledge bases"
              message={
                kbsError instanceof Error
                  ? kbsError.message
                  : 'Unable to fetch accessible knowledge bases.'
              }
              onRetry={onRetryKbs}
            />
          ) : filteredAvailableKbs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No accessible knowledge bases match your search.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-64 overflow-y-auto pr-1">
              {filteredAvailableKbs.map((kb) => {
                const isAttached = attachedIds.has(kb.id);
                return (
                  <div
                    key={kb.id}
                    className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-colors ${
                      isAttached
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border hover:bg-muted/30'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground truncate">
                          {kb.name}
                        </span>
                        <Badge variant="outline" className="text-[9px] px-1 py-0">
                          {kb.scope}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {kb.description || 'No description'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant={isAttached ? 'secondary' : 'outline'}
                      className="h-7 px-2.5 text-xs shrink-0"
                      disabled={isMutating}
                      onClick={() =>
                        isAttached
                          ? onDetach(kb.id)
                          : onAttach(kb, kb.retrievalDefaults || undefined)
                      }
                    >
                      {isAttached ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 mr-1 text-emerald-600" />
                          Connected
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-1" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default AgentKnowledgeConfig;
