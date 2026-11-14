import React, { memo } from 'react';
import { Activity } from 'lucide-react';
import { Button } from '../ui/button';
import StatusBadge from '../ui/StatusBadge';
import Skeleton from '../ui/Skeleton';
import {
  formatDate,
  formatDuration,
  formatBytes,
  getStatusBadgeVariant,
} from '../../utils/helpers';
import type { CrawlRun } from '../../types';

export const CrawlRunRow: React.FC<{ run: CrawlRun }> = memo(({ run }) => {
  const startedTime = run.startedAt || run.createdAt;
  const duration = run.completedAt
    ? formatDuration(startedTime, run.completedAt)
    : run.status === 'RUNNING'
    ? formatDuration(startedTime)
    : null;

  return (
    <tr className="hover:bg-muted/30 transition-colors">
      <td className="px-4 py-3.5 whitespace-nowrap min-w-[190px]">
        <StatusBadge
          status={run.status}
          variant={getStatusBadgeVariant(run.status)}
        />
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap min-w-[160px] font-mono text-foreground">
        {run.fetchedPages} / {run.totalPages || run.discoveredPages}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap min-w-[130px] font-mono text-foreground">
        {run.embeddedChunks}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap min-w-[120px] font-mono text-foreground">
        {formatBytes(run.storageUsedBytes)}
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap min-w-[190px] text-muted-foreground text-xs">
        <div>{formatDate(startedTime)}</div>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap min-w-[190px] text-muted-foreground text-xs">
        <div>
          {run.completedAt
            ? formatDate(run.completedAt)
            : run.status === 'RUNNING'
            ? 'In progress'
            : '-'}
        </div>
        {duration && (
          <div className="text-[11px] text-muted-foreground/75 font-mono">
            {run.status === 'RUNNING' ? `elapsed: ${duration}` : `took ${duration}`}
          </div>
        )}
      </td>
    </tr>
  );
});
CrawlRunRow.displayName = 'CrawlRunRow';

export interface CrawlRunsSectionProps {
  runs: CrawlRun[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const CrawlRunsSection: React.FC<CrawlRunsSectionProps> = memo(({
  runs,
  isLoading,
  onRefresh,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Crawl Run History
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
        >
          Refresh
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-xs min-w-[980px]">
          <thead className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
            <tr>
              <th className="px-4 py-3 whitespace-nowrap min-w-[190px]">Status</th>
              <th className="px-4 py-3 whitespace-nowrap min-w-[160px]">Pages (Fetched / Total)</th>
              <th className="px-4 py-3 whitespace-nowrap min-w-[130px]">Embedded Chunks</th>
              <th className="px-4 py-3 whitespace-nowrap min-w-[120px]">Storage Used</th>
              <th className="px-4 py-3 whitespace-nowrap min-w-[190px]">Started</th>
              <th className="px-4 py-3 whitespace-nowrap min-w-[190px]">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && runs.length === 0 ? (
              [...Array(3)].map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5 min-w-[190px]">
                    <Skeleton className="h-5 w-28 rounded-full" />
                  </td>
                  <td className="px-4 py-3.5 min-w-[160px]">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-3.5 min-w-[130px]">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-4 py-3.5 min-w-[120px]">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-4 py-3.5 min-w-[190px]">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-3.5 min-w-[190px]">
                    <Skeleton className="h-4 w-32" />
                  </td>
                </tr>
              ))
            ) : runs.length > 0 ? (
              runs.map((run) => (
                <CrawlRunRow key={run.id} run={run} />
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-xs text-muted-foreground">
                  No crawl runs found. Click "Start Crawl" above to begin your first indexing run.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

CrawlRunsSection.displayName = 'CrawlRunsSection';
export default CrawlRunsSection;
