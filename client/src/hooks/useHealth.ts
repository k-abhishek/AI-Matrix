import { useQuery } from '@tanstack/react-query';
import { systemApi } from '../api/knowledgeBase';
import type { HealthCheckResponse } from '../types';

export function useHealth() {
  const { data, isLoading, isFetching, error, refetch } = useQuery<HealthCheckResponse, Error>({
    queryKey: ['system', 'health'],
    queryFn: () => systemApi.getHealth(),
  });

  return {
    health: data ?? null,
    loading: isLoading || isFetching,
    error: error ? error.message : null,
    refetch,
  };
}

export default useHealth;
