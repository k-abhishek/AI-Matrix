// ============================================================================
// Core TypeScript Types & Models for Knowledge Base / Crawler
// ============================================================================

export type CrawlRunStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'INTERRUPTED';

export type PageStatus =
  | 'DISCOVERED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'FETCHED'
  | 'SKIPPED'
  | 'FAILED'
  | 'COMPLETED';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

// ----------------------------------------------------------------------------
// Crawler Models & DTOs
// ----------------------------------------------------------------------------

export interface CrawlerSettings {
  maxPages: number;
  maxConcurrency: number;
  requestTimeoutMs: number;
  requestDelayMs: number;
}

export type KnowledgeScope = 'PLATFORM' | 'WORKSPACE';
export type KnowledgeBaseStatus = 'ACTIVE' | 'ARCHIVED' | 'QUARANTINED';
export type KnowledgeSourceType = 'CRAWLER_PAGE' | 'FILE' | 'TEXT';
export type KnowledgeDocumentStatus = 'INDEXING' | 'ACTIVE' | 'FAILED' | 'QUARANTINED';

export interface KnowledgeBaseDTO {
  id: string;
  scope: KnowledgeScope;
  workspaceId: string | null;
  ownerUserId: string;
  name: string;
  description: string | null;
  qdrantCollection: string;
  retrievalDefaults?: {
    topK?: number;
    scoreThreshold?: number;
  } | null;
  status: KnowledgeBaseStatus;
  createdAt: string;
  updatedAt: string;
  _count?: {
    documents: number;
    crawlers: number;
  };
}

export interface KnowledgeDocumentDTO {
  id: string;
  knowledgeBaseId: string;
  workspaceId: string | null;
  sourceType: KnowledgeSourceType;
  sourceRefId: string | null;
  title: string;
  uri: string | null;
  contentHash: string;
  chunkCount: number;
  status: KnowledgeDocumentStatus;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeBaseDTO {
  name: string;
  description?: string;
  retrievalDefaults?: {
    topK?: number;
    scoreThreshold?: number;
  };
}

export interface IngestTextDocumentDTO {
  title: string;
  content: string;
  uri?: string;
  metadata?: Record<string, unknown>;
}

export interface Crawler {
  id: string;
  name: string;
  sitemapUrl: string;
  baseUrl: string;
  allowedHosts: string[];
  includePatterns: string[];
  excludePatterns: string[];
  settings?: CrawlerSettings;
  enabled: boolean;
  isRunning: boolean;
  scope?: KnowledgeScope;
  workspaceId?: string | null;
  knowledgeBaseId?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    crawlRuns: number;
    crawledPages: number;
  };
}

export interface CreateCrawlerDto {
  name: string;
  sitemapUrl: string;
  baseUrl?: string;
  allowedHosts?: string[];
  includePatterns?: string[];
  excludePatterns?: string[];
  maxPages?: number;
  maxConcurrency?: number;
  requestTimeoutMs?: number;
  requestDelayMs?: number;
  enabled?: boolean;
  knowledgeBaseId?: string;
}

export interface UpdateCrawlerDto extends Partial<CreateCrawlerDto> {}

export interface StartCrawlResponse {
  success: boolean;
  message: string;
  crawlRunId: string;
  status: 'RUNNING';
}

// ----------------------------------------------------------------------------
// Crawl Run & Progress Polling Models
// ----------------------------------------------------------------------------

export interface CrawlRun {
  id: string;
  crawlerId: string;
  status: CrawlRunStatus;
  totalPages: number;
  discoveredPages: number;
  queuedPages: number;
  processingPages: number;
  fetchedPages: number;
  cleanedPages: number;
  skippedPages: number;
  failedPages: number;
  totalChunks: number;
  embeddedChunks: number;
  storedChunks: number;
  storageUsedBytes: number;
  averageFetchTimeMs: number;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  crawler?: Pick<Crawler, 'id' | 'name' | 'sitemapUrl' | 'baseUrl'>;
}

export interface ProgressSummary {
  crawlRunId: string;
  crawlerId: string;
  status: CrawlRunStatus;
  progressPercentage: number;
  progress: {
    totalPages: number;
    discoveredPages: number;
    queuedPages: number;
    processingPages: number;
    fetchedPages: number;
    cleanedPages: number;
    skippedPages: number;
    failedPages: number;
    totalChunks: number;
    embeddedChunks: number;
    storedChunks: number;
  };
  metrics: {
    averageFetchTimeMs: number;
    totalFetchedBytes: number;
    storageUsedBytes: number;
    storageBudgetBytes: number;
    storageUsagePercentage: number;
    storageUsageSource: 'ESTIMATED' | 'QDRANT_REPORTED';
  };
  timestamps: {
    createdAt: string;
    startedAt: string | null;
    completedAt: string | null;
  };
  errors: Array<{ url: string; error: string; timestamp?: string }>;
}

export interface CrawlRunPageItem {
  id: string;
  crawlRunId: string;
  url: string;
  status: PageStatus;
  httpStatus?: number | null;
  fetchDurationMs?: number | null;
  contentBytes: number;
  chunksCount: number;
  errorMessage?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrawlerMetricsResponse {
  crawlerId: string;
  totalPages: number;
  totalChunks: number;
  totalBytes: number;
  totalRuns: number;
  lastRunStatus: CrawlRunStatus | null;
  lastCrawledAt: string | null;
  pageBreakdown: Array<{
    status: PageStatus;
    count: number;
  }>;
  storage: {
    totalBudgetBytes: number;
    stopThresholdPercent: number;
    stopThresholdBytes: number;
    currentUsageBytes: number;
    usagePercentage: number;
    usageSource: 'ESTIMATED' | 'QDRANT_REPORTED';
    isThresholdReached: boolean;
    availableBytes: number;
  };
}

export interface HealthCheckResponse {
  status: string;
  uptime: number;
  timestamp: string;
  environment?: string;
}

export interface ReadinessResponse {
  status: 'ready' | 'not_ready';
  checks: {
    database: 'up' | 'down';
    qdrant: 'up' | 'down';
  };
  timestamp: string;
}

