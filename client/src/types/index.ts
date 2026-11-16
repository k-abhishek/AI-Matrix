export * from './knowledgeBase';
export * from './ChatThread';
export * from './search';

// Retained for backward compatibility
export type HealthData = {
  status: string;
  uptime: number;
  timestamp: string;
  environment?: string;
};

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';
