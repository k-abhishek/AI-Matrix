import React, { memo } from 'react';
import { Globe, ExternalLink } from 'lucide-react';
import Card from '../ui/Card';
import type { CrawlerSettings } from '../../types';

export interface CrawlerConfigCardProps {
  sitemapUrl: string;
  baseUrl?: string;
  allowedHosts?: string[];
  settings?: CrawlerSettings;
}

export const CrawlerConfigCard: React.FC<CrawlerConfigCardProps> = memo(({
  sitemapUrl,
  baseUrl,
  allowedHosts,
  settings,
}) => {
  return (
    <Card className="lg:col-span-2 p-6 space-y-4">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Globe className="h-4 w-4 text-primary" />
        Target Configuration
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-1">
          <span className="font-semibold text-muted-foreground">Sitemap URL</span>
          <a
            href={sitemapUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-primary hover:underline font-mono break-all"
          >
            {sitemapUrl}
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>

        <div className="space-y-1">
          <span className="font-semibold text-muted-foreground">Base URL</span>
          <span className="block font-mono text-foreground break-all">
            {baseUrl || 'Auto-derived from Sitemap'}
          </span>
        </div>

        <div className="space-y-1">
          <span className="font-semibold text-muted-foreground">Allowed Hosts</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {allowedHosts && allowedHosts.length > 0 ? (
              allowedHosts.map((host) => (
                <span
                  key={host}
                  className="rounded bg-muted px-2 py-0.5 font-mono text-[11px] text-foreground"
                >
                  {host}
                </span>
              ))
            ) : (
              <span className="text-muted-foreground">Any host on base domain</span>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <span className="font-semibold text-muted-foreground">Crawl Limits</span>
          <p className="text-foreground">
            Max pages: {settings?.maxPages ?? 1000} | Concurrency:{' '}
            {settings?.maxConcurrency ?? 3} | Delay:{' '}
            {settings?.requestDelayMs ?? 500}ms
          </p>
        </div>
      </div>
    </Card>
  );
});

CrawlerConfigCard.displayName = 'CrawlerConfigCard';
export default CrawlerConfigCard;

