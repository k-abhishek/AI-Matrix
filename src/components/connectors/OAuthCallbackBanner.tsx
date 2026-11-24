import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from '../ui/sonner';
import { useDiscoverTools } from '../../hooks/useConnectors';

/**
 * OAuthCallbackBanner / OAuthCallbackHandler
 * Intercepts OAuth callback URL query parameters (?connectionId=...&status=success|error)
 * and displays feedback using the shadcn Sonner toast component while triggering tool discovery.
 */
export const OAuthCallbackBanner: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const discoverMutation = useDiscoverTools();

  useEffect(() => {
    const connId = searchParams.get('connectionId');
    const status = searchParams.get('status');
    const errorMessage = searchParams.get('error') || searchParams.get('message');

    if (!connId && !status) return;

    if (status === 'success' && connId) {
      // Trigger tool discovery and track progress using toast.promise
      toast.promise(discoverMutation.mutateAsync(connId), {
        loading: 'Connection authenticated! Synchronizing and discovering remote tools...',
        success: 'Connection authenticated! Tools have been discovered and are ready to use.',
        error: (err: any) =>
          `Connection authenticated, but tool discovery failed: ${err?.message || 'Unknown error'}`,
      });
    } else if (status === 'error') {
      toast.error('Authentication Failed', {
        description: errorMessage || 'Could not complete OAuth connection. Please try again.',
      });
    }

    // Clean up query parameters smoothly from the URL without triggering a page reload
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('connectionId');
    newParams.delete('status');
    newParams.delete('error');
    newParams.delete('message');
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams, discoverMutation]);

  // Headless component: feedback is presented via the toast notification
  return null;
};

export default OAuthCallbackBanner;
