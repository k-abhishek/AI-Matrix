import React, { useState } from 'react';
import useHealth from '../hooks/useHealth';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorMessage from './ui/ErrorMessage';
import HealthCard from './HealthCard';
import { Button } from './ui/button';
import { formatDate } from '../utils/helpers';

const ApiStatus: React.FC = () => {
  const { health, loading, error, refetch } = useHealth();
  const [lastFetched, setLastFetched] = useState<string>(new Date().toISOString());

  const handleRefresh = () => {
    setLastFetched(new Date().toISOString());
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Last fetched: <span className="font-medium text-gray-700">{formatDate(lastFetched)}</span>
        </p>
        <Button
          onClick={handleRefresh}
          disabled={loading}
          size="sm"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="border-white border-t-primary-200" />
              Refreshing…
            </>
          ) : (
            <>
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H5.498a.75.75 0 00-.75.75v3.433a.75.75 0 001.5 0v-1.73l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V3.738a.75.75 0 00-1.5 0v1.73l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h3.433a.75.75 0 00.53-.219z"
                  clipRule="evenodd"
                />
              </svg>
              Refresh
            </>
          )}
        </Button>
      </div>

      {loading && !health && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {error && !loading && (
        <ErrorMessage message={error} onRetry={handleRefresh} />
      )}

      {health && !error && (
        <HealthCard health={health} />
      )}
    </div>
  );
};

export default ApiStatus;
