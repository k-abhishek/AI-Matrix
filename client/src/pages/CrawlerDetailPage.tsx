import React, { useState, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  useCrawler,
  useCrawlerMetrics,
  useCrawlRuns,
  useTriggerCrawl,
  useCancelCrawl,
} from '../hooks/useKnowledgeBase';
import ErrorMessage from '../components/ui/ErrorMessage';
import CrawlerHeader from '../components/crawler/CrawlerHeader';
import CrawlerMetricsGrid from '../components/crawler/CrawlerMetricsGrid';
import CrawlerConfigCard from '../components/crawler/CrawlerConfigCard';
import DataBreakdownCard from '../components/crawler/DataBreakdownCard';
import CrawlRunsSection from '../components/crawler/CrawlRunsSection';
import CrawlerDetailSkeleton from '../components/crawler/CrawlerDetailSkeleton';

export const CrawlerDetailPage: React.FC = () => {
  const { crawlerId } = useParams<{ crawlerId: string }>();
  const id = crawlerId || '';

  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Initial crawler fetch with staleTime caching
  const {
    data: crawler,
    isLoading: isCrawlerLoading,
    error: crawlerError,
    refetch: refetchCrawler,
  } = useCrawler(id);

  // Crawl runs query
  const {
    data: runsData,
    isLoading: isRunsLoading,
    refetch: refetchRuns,
  } = useCrawlRuns({ crawlerId: id, limit: 10 });

  // Determine whether any crawl is actively running
  const isRunning = useMemo(() => {
    return Boolean(
      crawler?.isRunning ||
      runsData?.runs?.some((run) => run.status === 'RUNNING' || run.status === 'PENDING')
    );
  }, [crawler?.isRunning, runsData?.runs]);

  // Polling for crawler metrics:
  // - Polls every 3s (3000ms) when a crawl is actively running for live progress
  // - Polls every 10s (10000ms) when idle to keep metrics fresh
  const {
    data: metrics,
    isLoading: isMetricsLoading,
    refetch: refetchMetrics,
  } = useCrawlerMetrics(id, {
    refetchInterval: isRunning ? 3000 : 10000,
  });

  const triggerCrawl = useTriggerCrawl();
  const cancelCrawl = useCancelCrawl();

  const handleTriggerCrawl = useCallback(
    async (full = false) => {
      setActionMessage(null);
      try {
        await triggerCrawl.mutateAsync({ id, full });
        setActionMessage(
          full ? 'Full re-crawl triggered successfully!' : 'Incremental crawl started!'
        );
        refetchCrawler();
        refetchMetrics();
        refetchRuns();
      } catch (err: any) {
        setActionMessage(`Failed to trigger crawl: ${err?.message || 'Unknown error'}`);
      }
    },
    [id, triggerCrawl, refetchCrawler, refetchMetrics, refetchRuns]
  );

  const handleCancelCrawl = useCallback(async () => {
    setActionMessage(null);
    try {
      await cancelCrawl.mutateAsync(id);
      setActionMessage('Crawl cancellation requested.');
      refetchCrawler();
      refetchMetrics();
      refetchRuns();
    } catch (err: any) {
      setActionMessage(`Failed to cancel crawl: ${err?.message || 'Unknown error'}`);
    }
  }, [id, cancelCrawl, refetchCrawler, refetchMetrics, refetchRuns]);

  const handleRefreshRuns = useCallback(() => {
    refetchRuns();
  }, [refetchRuns]);

  const runsList = useMemo(() => runsData?.runs ?? [], [runsData?.runs]);
  const pageBreakdownList = useMemo(() => metrics?.pageBreakdown, [metrics?.pageBreakdown]);

  // Initial loading state uses full-page skeleton to prevent Cumulative Layout Shift (CLS)
  if (isCrawlerLoading) {
    return <CrawlerDetailSkeleton />;
  }

  if (crawlerError || !crawler) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-4">
        <Link
          to="/knowledge-base"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Knowledge Base
        </Link>
        <ErrorMessage
          message={crawlerError ? (crawlerError as Error).message : 'Crawler not found'}
        />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full">
      {/* Top Header & Actions */}
      <CrawlerHeader
        name={crawler.name}
        id={crawler.id}
        createdAt={crawler.createdAt}
        enabled={crawler.enabled}
        isRunning={isRunning}
        isTriggerPending={triggerCrawl.isPending}
        isCancelPending={cancelCrawl.isPending}
        actionMessage={actionMessage}
        onTriggerCrawl={handleTriggerCrawl}
        onCancelCrawl={handleCancelCrawl}
      />

      {/* Metric Highlights Grid */}
      <CrawlerMetricsGrid
        metrics={metrics}
        isLoading={isMetricsLoading}
        fallbackPages={crawler._count?.crawledPages}
        fallbackRuns={crawler._count?.crawlRuns}
      />

      {/* Configuration & Data Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CrawlerConfigCard
          sitemapUrl={crawler.sitemapUrl}
          baseUrl={crawler.baseUrl}
          allowedHosts={crawler.allowedHosts}
          settings={crawler.settings}
        />

        <DataBreakdownCard
          pageBreakdown={pageBreakdownList}
          isLoading={isMetricsLoading}
        />
      </div>

      {/* Crawl Run History */}
      <CrawlRunsSection
        runs={runsList}
        isLoading={isRunsLoading}
        onRefresh={handleRefreshRuns}
      />
    </div>
  );
};

export default CrawlerDetailPage;
