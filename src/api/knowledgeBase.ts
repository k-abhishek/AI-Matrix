import apiClient from './client';
import type {
  ApiResponse,
  KnowledgeBaseDTO,
  KnowledgeDocumentDTO,
  CreateKnowledgeBaseDTO,
  IngestTextDocumentDTO,
  Crawler,
  CreateCrawlerDto,
  UpdateCrawlerDto,
  StartCrawlResponse,
  CrawlerMetricsResponse,
  CrawlRun,
  PaginationMeta,
  ProgressSummary,
  CrawlRunPageItem,
  PageStatus,
  HealthCheckResponse,
  ReadinessResponse,
} from '../types';

// ============================================================================
// Knowledge Base Endpoints
// ============================================================================

export const kbApi = {
  create: async (dto: CreateKnowledgeBaseDTO): Promise<KnowledgeBaseDTO> => {
    const res = await apiClient.post<ApiResponse<KnowledgeBaseDTO>>('/knowledge-bases', dto);
    return res.data!;
  },

  list: async (): Promise<KnowledgeBaseDTO[]> => {
    const res = await apiClient.get<ApiResponse<KnowledgeBaseDTO[]>>('/knowledge-bases');
    return res.data || [];
  },

  getById: async (kbId: string): Promise<KnowledgeBaseDTO> => {
    const res = await apiClient.get<ApiResponse<KnowledgeBaseDTO>>(`/knowledge-bases/${kbId}`);
    return res.data!;
  },

  update: async (
    kbId: string,
    dto: Partial<CreateKnowledgeBaseDTO>
  ): Promise<KnowledgeBaseDTO> => {
    const res = await apiClient.patch<ApiResponse<KnowledgeBaseDTO>>(
      `/knowledge-bases/${kbId}`,
      dto
    );
    return res.data!;
  },

  archive: async (kbId: string): Promise<void> => {
    await apiClient.delete(`/knowledge-bases/${kbId}`);
  },

  listDocuments: async (kbId: string): Promise<KnowledgeDocumentDTO[]> => {
    const res = await apiClient.get<ApiResponse<KnowledgeDocumentDTO[]>>(
      `/knowledge-bases/${kbId}/documents`
    );
    return res.data || [];
  },

  ingestText: async (
    kbId: string,
    dto: IngestTextDocumentDTO
  ): Promise<KnowledgeDocumentDTO> => {
    const res = await apiClient.post<ApiResponse<KnowledgeDocumentDTO>>(
      `/knowledge-bases/${kbId}/documents`,
      dto
    );
    return res.data!;
  },

  deleteDocument: async (kbId: string, docId: string): Promise<void> => {
    await apiClient.delete(`/knowledge-bases/${kbId}/documents/${docId}`);
  },

  testRetrieval: async (
    kbId: string,
    body: { query: string; topK?: number; scoreThreshold?: number; metadataFilters?: Record<string, unknown> }
  ): Promise<unknown> => {
    const res = await apiClient.post<ApiResponse<unknown>>(
      `/knowledge-bases/${kbId}/test-retrieval`,
      body
    );
    return res.data;
  },
};

// ============================================================================
// Crawler Endpoints
// ============================================================================

export const crawlerApi = {
  /** Create a new crawler */
  create: async (dto: CreateCrawlerDto): Promise<Crawler> => {
    const res = await apiClient.post<ApiResponse<Crawler>>('/crawlers', dto);
    return res.data!;
  },

  /** List all crawlers */
  getAll: async (): Promise<Crawler[]> => {
    const res = await apiClient.get<ApiResponse<Crawler[]>>('/crawlers');
    return res.data!;
  },

  /** Get single crawler by ID */
  getById: async (id: string): Promise<Crawler> => {
    const res = await apiClient.get<ApiResponse<Crawler>>(`/crawlers/${id}`);
    return res.data!;
  },

  /** Update crawler settings */
  update: async (id: string, dto: UpdateCrawlerDto): Promise<Crawler> => {
    const res = await apiClient.patch<ApiResponse<Crawler>>(`/crawlers/${id}`, dto);
    return res.data!;
  },

  /** Delete crawler & its Qdrant points */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/crawlers/${id}`);
  },

  /** Trigger incremental in-process crawl */
  triggerCrawl: async (id: string): Promise<StartCrawlResponse> => {
    return apiClient.post<StartCrawlResponse>(`/crawlers/${id}/crawl`);
  },

  /** Trigger full in-process crawl (forces re-embedding) */
  triggerFullCrawl: async (id: string): Promise<StartCrawlResponse> => {
    return apiClient.post<StartCrawlResponse>(`/crawlers/${id}/crawl/full`);
  },

  /** Cancel an in-flight crawl */
  cancelCrawl: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.post<{ success: boolean; message: string }>(`/crawlers/${id}/cancel`);
  },

  /** Get crawler statistics & Qdrant storage usage */
  getMetrics: async (crawlerId: string): Promise<CrawlerMetricsResponse> => {
    const res = await apiClient.get<ApiResponse<CrawlerMetricsResponse>>(`/crawlers/${crawlerId}/metrics`);
    return res.data!;
  },
};

// ============================================================================
// Crawl Run Endpoints
// ============================================================================

export const crawlRunApi = {
  /** List historical crawl runs with pagination */
  getRuns: async (params?: {
    crawlerId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    runs: CrawlRun[];
    pagination: PaginationMeta;
  }> => {
    const res = await apiClient.get<ApiResponse<{ runs: CrawlRun[]; pagination: PaginationMeta }>>(
      '/crawl-runs',
      { params }
    );
    return res.data!;
  },

  /** Get metadata of a single crawl run */
  getById: async (runId: string): Promise<CrawlRun> => {
    const res = await apiClient.get<ApiResponse<CrawlRun>>(`/crawl-runs/${runId}`);
    return res.data!;
  },

  /** Polling endpoint: Get real-time progress, counters & storage budget */
  getProgress: async (runId: string): Promise<ProgressSummary> => {
    return apiClient.get<ProgressSummary>(`/crawl-runs/${runId}/progress`);
  },

  /** Get paginated page-by-page crawl results and errors */
  getPages: async (
    runId: string,
    params?: { status?: PageStatus; page?: number; limit?: number }
  ): Promise<{ pages: CrawlRunPageItem[]; pagination: PaginationMeta }> => {
    const res = await apiClient.get<ApiResponse<{ pages: CrawlRunPageItem[]; pagination: PaginationMeta }>>(
      `/crawl-runs/${runId}/pages`,
      { params }
    );
    return res.data!;
  },
};

// ============================================================================
// System Endpoints
// ============================================================================

export const systemApi = {
  /** Liveness check */
  getHealth: async (): Promise<HealthCheckResponse> => {
    return apiClient.get<HealthCheckResponse>('/health');
  },

  /** Readiness check (PostgreSQL + Qdrant connectivity) */
  getReadiness: async (): Promise<ReadinessResponse> => {
    return apiClient.get<ReadinessResponse>('/ready');
  },
};

export default {
  crawler: crawlerApi,
  crawlRun: crawlRunApi,
  system: systemApi,
};

