import React, { memo } from 'react';
import Card from './Card';
import Skeleton from './Skeleton';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  title: string;
  icon: React.ReactNode;
  value?: React.ReactNode;
  subtext?: React.ReactNode;
  isLoading?: boolean;
  progressBar?: {
    value: number;
    max?: number;
    isDestructive?: boolean;
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = memo(({
  title,
  icon,
  value,
  subtext,
  isLoading = false,
  progressBar,
  className,
}) => {
  return (
    <Card className={cn('p-5 flex flex-col justify-between min-h-[122px]', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
          {icon}
        </div>
      </div>

      <div className="mt-2">
        {isLoading ? (
          <Skeleton className="h-7 w-24 my-1" />
        ) : (
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-2xl font-bold tracking-tight text-foreground font-mono">
              {value}
            </span>
            {subtext && (
              <span className="text-[11px] text-muted-foreground">
                {subtext}
              </span>
            )}
          </div>
        )}

        {/* Progress bar with preserved layout height */}
        <div className="mt-2.5 h-1.5 w-full bg-muted rounded-full overflow-hidden">
          {progressBar && !isLoading && (
            <div
              className={cn(
                'h-full rounded-full transition-all duration-300',
                progressBar.isDestructive ? 'bg-destructive' : 'bg-primary'
              )}
              style={{
                width: `${Math.min(Math.max(progressBar.value, 0), progressBar.max ?? 100)}%`,
              }}
            />
          )}
        </div>
      </div>
    </Card>
  );
});

StatCard.displayName = 'StatCard';
export default StatCard;

