import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { crawlerApi, crawlRunApi } from '../api/knowledgeBase';
import type {
  CreateCrawlerDto,
  UpdateCrawlerDto,
  PageStatus,
} from '../types';

// Query Keys
export const knowledgeBaseKeys = {
  allCrawlers: ['crawlers'] as const,
  crawler: (id: string) => ['crawlers', id] as const,
  crawlerMetrics: (id: string) => ['crawlers', id, 'metrics'] as const,
  allRuns: (params?: { crawlerId?: string; page?: number; limit?: number }) =>
    ['crawl-runs', params] as const,
  run: (runId: string) => ['crawl-runs', runId] as const,
  runProgress: (runId: string) => ['crawl-runs', runId, 'progress'] as const,
  runPages: (runId: string, params?: { status?: PageStatus; page?: number; limit?: number }) =>
    ['crawl-runs', runId, 'pages', params] as const,
};

// ============================================================================
// Crawler Hooks
// ============================================================================

export function useCrawlers(options?: { staleTime?: number }) {
  return useQuery({
    queryKey: knowledgeBaseKeys.allCrawlers,
    queryFn: () => crawlerApi.getAll(),
    staleTime: options?.staleTime ?? 15_000,
    placeholderData: keepPreviousData,
  });
}

export function useCrawler(
  id: string,
  options?: {
    refetchInterval?: number | false | ((query: any) => number | false);
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery({
    queryKey: knowledgeBaseKeys.crawler(id),
    queryFn: () => crawlerApi.getById(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime ?? 15_000,
    placeholderData: keepPreviousData,
  });
}

export function useCrawlerMetrics(
  id: string,
  options?: {
    refetchInterval?: number | false | ((query: any) => number | false);
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery({
    queryKey: knowledgeBaseKeys.crawlerMetrics(id),
    queryFn: () => crawlerApi.getMetrics(id),
    enabled: Boolean(id) && (options?.enabled ?? true),
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime ?? 5_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateCrawler() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateCrawlerDto) => crawlerApi.create(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.allCrawlers });
    },
  });
}

export function useUpdateCrawler() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateCrawlerDto }) =>
      crawlerApi.update(id, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.allCrawlers });
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.crawler(id) });
    },
  });
}

export function useDeleteCrawler() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crawlerApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.allCrawlers });
    },
  });
}

export function useTriggerCrawl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, full = false }: { id: string; full?: boolean }) =>
      full ? crawlerApi.triggerFullCrawl(id) : crawlerApi.triggerCrawl(id),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.allRuns() });
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.crawler(id) });
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.crawlerMetrics(id) });
    },
  });
}

export function useCancelCrawl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => crawlerApi.cancelCrawl(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.allRuns() });
      queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.crawler(id) });
    },
  });
}

// ============================================================================
// Crawl Run Hooks
// ============================================================================

export function useCrawlRuns(
  params?: { crawlerId?: string; page?: number; limit?: number },
  options?: {
    refetchInterval?: number | false | ((query: any) => number | false);
    enabled?: boolean;
    staleTime?: number;
  }
) {
  return useQuery({
    queryKey: knowledgeBaseKeys.allRuns(params),
    queryFn: () => crawlRunApi.getRuns(params),
    enabled: options?.enabled ?? true,
    refetchInterval: options?.refetchInterval,
    staleTime: options?.staleTime ?? 10_000,
    placeholderData: keepPreviousData,
  });
}

export function useCrawlRun(runId: string) {
  return useQuery({
    queryKey: knowledgeBaseKeys.run(runId),
    queryFn: () => crawlRunApi.getById(runId),
    enabled: Boolean(runId),
  });
}

export function useCrawlProgress(runId: string, enabled = true, refetchInterval = 2000) {
  return useQuery({
    queryKey: knowledgeBaseKeys.runProgress(runId),
    queryFn: () => crawlRunApi.getProgress(runId),
    enabled: Boolean(runId) && enabled,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
        return false;
      }
      return refetchInterval;
    },
  });
}

export function useCrawlPages(
  runId: string,
  params?: { status?: PageStatus; page?: number; limit?: number }
) {
  return useQuery({
    queryKey: knowledgeBaseKeys.runPages(runId, params),
    queryFn: () => crawlRunApi.getPages(runId, params),
    enabled: Boolean(runId),
  });
}

