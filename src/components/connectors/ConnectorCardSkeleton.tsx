import React from 'react';

/**
 * Placeholder skeleton for a connector or connection card while data loads.
 */
const ConnectorCardSkeleton: React.FC = () => (
  <div className="rounded-2xl border border-border/50 bg-card/70 p-4 animate-pulse space-y-3">
    {/* Header row */}
    <div className="flex items-center gap-3">
      <div className="h-10 w-10 rounded-xl bg-muted/60 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 w-32 rounded-md bg-muted/60" />
        <div className="h-2.5 w-20 rounded-md bg-muted/40" />
      </div>
      <div className="h-8 w-20 rounded-lg bg-muted/40" />
    </div>
    {/* Description lines */}
    <div className="space-y-1.5">
      <div className="h-2.5 w-full rounded-md bg-muted/40" />
      <div className="h-2.5 w-4/5 rounded-md bg-muted/40" />
    </div>
    {/* Footer pills */}
    <div className="flex gap-1.5 pt-1">
      <div className="h-5 w-16 rounded-md bg-muted/40" />
      <div className="h-5 w-16 rounded-md bg-muted/40" />
    </div>
  </div>
);

export default ConnectorCardSkeleton;
