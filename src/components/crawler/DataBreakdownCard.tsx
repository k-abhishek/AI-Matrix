import React, { memo } from 'react';
import { Database, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import type { PageStatus } from '../../types';

export interface DataBreakdownCardProps {
  pageBreakdown?: Array<{ status: PageStatus; count: number }>;
  isLoading?: boolean;
}

export const DataBreakdownCard: React.FC<DataBreakdownCardProps> = memo(({
  pageBreakdown,
  isLoading = false,
}) => {
  return (
    <Card className="p-6 space-y-4">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Database className="h-4 w-4 text-primary" />
        Data Breakdown
      </h2>

      {isLoading && !pageBreakdown ? (
        <div className="space-y-3 py-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1 border-b border-border last:border-none"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-10" />
            </div>
          ))}
        </div>
      ) : pageBreakdown && pageBreakdown.length > 0 ? (
        <div className="space-y-2.5">
          {pageBreakdown.map((item) => (
            <div
              key={item.status}
              className="flex items-center justify-between text-xs py-1 border-b border-border last:border-none"
            >
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                {item.status === 'COMPLETED' ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : item.status === 'FAILED' ? (
                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                )}
                {item.status}
              </span>
              <span className="font-semibold text-foreground font-mono">{item.count}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground py-6 text-center">
          No pages catalogued yet. Start a crawl to ingest data.
        </div>
      )}
    </Card>
  );
});

DataBreakdownCard.displayName = 'DataBreakdownCard';
export default DataBreakdownCard;

