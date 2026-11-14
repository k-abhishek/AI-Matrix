import React, { memo } from 'react';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';

export const CrawlerDetailSkeleton: React.FC = memo(() => {
  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 max-w-6xl mx-auto w-full animate-in fade-in duration-300">
      {/* Top Breadcrumb & Action Banner Skeleton */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-56 md:w-72" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
      </div>

      {/* 4 Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-5 flex flex-col justify-between min-h-[122px]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <div className="space-y-1.5 mt-2">
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-28" />
            </div>
            <div className="mt-2.5 h-1.5 w-full bg-muted/40 rounded-full overflow-hidden" />
          </Card>
        ))}
      </div>

      {/* Configuration & Breakdown Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 space-y-5 min-h-[220px]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 space-y-5 min-h-[220px]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-36" />
          </div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1 border-b border-border last:border-none"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Run History Table Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded" />
            <Skeleton className="h-5 w-44" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-xs min-w-[980px]">
            <thead className="border-b border-border bg-muted/50 text-muted-foreground font-semibold">
              <tr>
                <th className="px-4 py-3 min-w-[190px]">Status</th>
                <th className="px-4 py-3 min-w-[160px]">Pages (Fetched / Total)</th>
                <th className="px-4 py-3 min-w-[130px]">Embedded Chunks</th>
                <th className="px-4 py-3 min-w-[120px]">Storage Used</th>
                <th className="px-4 py-3 min-w-[190px]">Started</th>
                <th className="px-4 py-3 min-w-[190px]">Completed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...Array(4)].map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3.5 min-w-[190px]">
                    <Skeleton className="h-5 w-28 rounded-full" />
                  </td>
                  <td className="px-4 py-3.5 min-w-[160px]">
                    <Skeleton className="h-4 w-24" />
                  </td>
                  <td className="px-4 py-3.5 min-w-[130px]">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-4 py-3.5 min-w-[120px]">
                    <Skeleton className="h-4 w-20" />
                  </td>
                  <td className="px-4 py-3.5 min-w-[190px]">
                    <Skeleton className="h-4 w-32" />
                  </td>
                  <td className="px-4 py-3.5 min-w-[190px]">
                    <Skeleton className="h-4 w-32" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

CrawlerDetailSkeleton.displayName = 'CrawlerDetailSkeleton';
export default CrawlerDetailSkeleton;

