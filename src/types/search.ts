export interface SearchResultItemMetadata {
  crawlerId?: string;
  pageId?: string;
  url?: string;
  title?: string;
  chunkIndex?: number;
  contentHash?: string;
  crawledAt?: string;
  [key: string]: unknown;
}

export interface SearchResultItem {
  id: string;
  score: number;
  content: string;
  metadata: SearchResultItemMetadata;
}

export interface SearchResponseData {
  query: string;
  total: number;
  page: number;
  limit: number;
  results: SearchResultItem[];
}

export interface SearchApiResponse {
  success: boolean;
  data: SearchResponseData;
}

export interface SearchFilters {
  scoreThreshold?: number;
  crawlerId?: string;
  knowledgeBaseId?: string;
  scope?: 'PLATFORM' | 'WORKSPACE';
  sortBy?: "relevance" | "date";
}

export interface SearchQueryParams extends SearchFilters {
  query: string;
  limit?: number;
  page?: number;
}
