import React, { memo } from 'react';
import { FileText, Layers, HardDrive, Clock } from 'lucide-react';
import StatCard from '../ui/StatCard';
import { formatBytes } from '../../utils/helpers';
import type { CrawlerMetricsResponse } from '../../types';

export interface CrawlerMetricsGridProps {
  metrics?: CrawlerMetricsResponse;
  isLoading?: boolean;
  fallbackPages?: number;
  fallbackRuns?: number;
}

export const CrawlerMetricsGrid: React.FC<CrawlerMetricsGridProps> = memo(({
  metrics,
  isLoading = false,
  fallbackPages = 0,
  fallbackRuns = 0,
}) => {
  const isPendingFirstLoad = isLoading && !metrics;

  const totalPages = metrics?.totalPages ?? fallbackPages;
  const totalChunks = metrics?.totalChunks ?? 0;
  const totalRuns = metrics?.totalRuns ?? fallbackRuns;
  const storageUsageBytes = metrics?.storage?.currentUsageBytes ?? metrics?.totalBytes ?? 0;
  const storagePercentage = metrics?.storage?.usagePercentage;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Pages */}
      <StatCard
        title="Total Pages"
        icon={<FileText className="h-4 w-4" />}
        value={totalPages}
        subtext="pages crawled"
        isLoading={isPendingFirstLoad}
      />

      {/* Vector Chunks */}
      <StatCard
        title="Vector Chunks"
        icon={<Layers className="h-4 w-4" />}
        value={totalChunks}
        subtext="embedded & stored"
        isLoading={isPendingFirstLoad}
      />

      {/* Storage Usage */}
      <StatCard
        title="Storage Usage"
        icon={<HardDrive className="h-4 w-4" />}
        value={formatBytes(storageUsageBytes)}
        subtext={
          typeof storagePercentage === 'number'
            ? `(${storagePercentage.toFixed(1)}%)`
            : undefined
        }
        isLoading={isPendingFirstLoad}
        progressBar={
          typeof storagePercentage === 'number'
            ? {
                value: storagePercentage,
                isDestructive: storagePercentage > 85,
              }
            : undefined
        }
      />

      {/* Crawl Runs */}
      <StatCard
        title="Crawl Runs"
        icon={<Clock className="h-4 w-4" />}
        value={totalRuns}
        subtext={metrics?.lastRunStatus ? `(Last: ${metrics.lastRunStatus})` : undefined}
        isLoading={isPendingFirstLoad}
      />
    </div>
  );
});

CrawlerMetricsGrid.displayName = 'CrawlerMetricsGrid';
export default CrawlerMetricsGrid;

