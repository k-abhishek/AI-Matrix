import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, RotateCw, Ban, Calendar, Activity } from 'lucide-react';
import { Button } from '../ui/button';
import StatusBadge from '../ui/StatusBadge';
import { formatDate } from '../../utils/helpers';

interface ActionControlsProps {
  isRunning: boolean;
  isTriggerPending: boolean;
  isCancelPending: boolean;
  onTriggerCrawl: (full?: boolean) => void;
  onCancelCrawl: () => void;
}

export const ActionControls: React.FC<ActionControlsProps> = memo(({
  isRunning,
  isTriggerPending,
  isCancelPending,
  onTriggerCrawl,
  onCancelCrawl,
}) => {
  if (isRunning) {
    return (
      <Button
        variant="destructive"
        size="sm"
        onClick={onCancelCrawl}
        disabled={isCancelPending}
      >
        <Ban className="h-3.5 w-3.5" />
        Cancel Crawl
      </Button>
    );
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => onTriggerCrawl(false)}
        disabled={isTriggerPending}
      >
        <Play className="h-3.5 w-3.5" />
        Start Crawl
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onTriggerCrawl(true)}
        disabled={isTriggerPending}
        title="Forces re-extracting, chunking and embedding all pages"
      >
        <RotateCw className="h-3.5 w-3.5" />
        Full Re-crawl
      </Button>
    </>
  );
});
ActionControls.displayName = 'ActionControls';

export interface CrawlerHeaderProps {
  name: string;
  id: string;
  createdAt: string;
  enabled: boolean;
  isRunning: boolean;
  isTriggerPending: boolean;
  isCancelPending: boolean;
  actionMessage?: string | null;
  onTriggerCrawl: (full?: boolean) => void;
  onCancelCrawl: () => void;
}

export const CrawlerHeader: React.FC<CrawlerHeaderProps> = memo(({
  name,
  id,
  createdAt,
  enabled,
  isRunning,
  isTriggerPending,
  isCancelPending,
  actionMessage,
  onTriggerCrawl,
  onCancelCrawl,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            to="/knowledge-base"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Knowledge Base
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              {name}
            </h1>
            <StatusBadge
              status={isRunning ? 'RUNNING' : enabled ? 'ACTIVE' : 'DISABLED'}
              variant={isRunning ? 'info' : enabled ? 'success' : 'warning'}
            />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-2">
            <span>
              ID: <code className="bg-muted px-1.5 py-0.5 rounded text-[11px] font-mono">{id}</code>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created {formatDate(createdAt)}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ActionControls
            isRunning={isRunning}
            isTriggerPending={isTriggerPending}
            isCancelPending={isCancelPending}
            onTriggerCrawl={onTriggerCrawl}
            onCancelCrawl={onCancelCrawl}
          />
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-lg bg-muted/60 border border-border p-3 text-xs text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}
    </div>
  );
});

CrawlerHeader.displayName = 'CrawlerHeader';
export default CrawlerHeader;

