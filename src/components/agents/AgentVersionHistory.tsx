import React from 'react';
import { History, RotateCcw, Ban, CheckCircle2, Clock } from 'lucide-react';
import Card from '../ui/Card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import Skeleton from '../ui/Skeleton';
import ErrorMessage from '../ui/ErrorMessage';
import { formatDate } from '../../utils/helpers';
import type { AgentVersionDTO } from '../../types';

export interface AgentVersionHistoryProps {
  versions: AgentVersionDTO[];
  activeVersionId: string | null;
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  canManage: boolean;
  isMutating?: boolean;
  onRollback: (versionId: string) => void;
  onRevoke: (versionId: string) => void;
}

export const AgentVersionHistory: React.FC<AgentVersionHistoryProps> = ({
  versions,
  activeVersionId,
  isLoading,
  error,
  onRetry,
  canManage,
  isMutating = false,
  onRollback,
  onRevoke,
}) => {
  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-3 pb-4 border-b border-border/60">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
          <History className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Version History</h2>
          <p className="text-xs text-muted-foreground">
            Published versions are immutable. Existing conversations remain pinned to their
            original version.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2.5">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : error ? (
        <ErrorMessage
          title="Failed to load version history"
          message={error instanceof Error ? error.message : 'Unable to fetch versions.'}
          onRetry={onRetry}
        />
      ) : versions.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          No versions recorded yet. Save a draft or publish to create a version.
        </p>
      ) : (
        <div className="space-y-2.5">
          {versions.map((ver) => {
            const isActive = ver.id === activeVersionId;
            const canRollback =
              canManage &&
              !isActive &&
              (ver.status === 'PUBLISHED' || ver.status === 'DEPRECATED');
            const canRevoke =
              canManage && (ver.status === 'PUBLISHED' || ver.status === 'DEPRECATED');

            return (
              <div
                key={ver.id}
                className={`rounded-xl border p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActive ? 'border-primary/50 bg-primary/5' : 'border-border'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-foreground font-mono">
                      v{ver.versionNumber}
                    </span>
                    <Badge
                      variant={
                        ver.status === 'PUBLISHED'
                          ? 'default'
                          : ver.status === 'REVOKED'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="text-[10px]"
                    >
                      {ver.status}
                    </Badge>
                    {isActive && (
                      <Badge
                        variant="outline"
                        className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 gap-1"
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Active
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {ver.publishedAt
                        ? `Published ${formatDate(ver.publishedAt)}`
                        : `Updated ${formatDate(ver.updatedAt)}`}
                    </span>
                    {ver.publishedByUserId && (
                      <span className="truncate">By: {ver.publishedByUserId}</span>
                    )}
                    {ver.provider && (
                      <span className="font-mono">
                        {ver.provider}
                        {ver.model ? ` / ${ver.model}` : ''}
                      </span>
                    )}
                  </div>

                  {ver.revokedReason && (
                    <p className="text-[11px] text-destructive">
                      Revoked: {ver.revokedReason}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {canRollback && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2.5 text-xs"
                      disabled={isMutating}
                      onClick={() => onRollback(ver.id)}
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Rollback
                    </Button>
                  )}
                  {canRevoke && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2.5 text-xs text-muted-foreground hover:text-destructive"
                      disabled={isMutating}
                      onClick={() => onRevoke(ver.id)}
                    >
                      <Ban className="h-3 w-3 mr-1" />
                      Revoke
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default AgentVersionHistory;
