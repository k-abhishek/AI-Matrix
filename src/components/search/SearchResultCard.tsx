import React from "react";
import { motion } from "motion/react";
import { FileText } from "lucide-react";
import type { SearchResultItem } from "../../types";
import { cn } from "../../utils/cn";

interface SearchResultCardProps {
  result: SearchResultItem;
  index: number;
}

export const SearchResultCard: React.FC<SearchResultCardProps> = ({
  result,
  index,
}) => {
  const { content, metadata } = result;

  const getHostname = (urlStr?: string) => {
    if (!urlStr) return null;
    try {
      return new URL(urlStr).hostname;
    } catch {
      return urlStr;
    }
  };

  const displayTitle =
    metadata.title?.trim() ||
    getHostname(metadata.url) ||
    `Result #${index + 1}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.05, 0.4),
        ease: "easeOut",
      }}
      whileHover={{ y: -2 }}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5 text-card-foreground shadow-sm transition-shadow hover:shadow-md hover:border-border",
      )}
    >
      {/* Header: Title & Crawler info */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {metadata.url ? (
              <a
                href={metadata.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 hover:underline"
              >
                <span>{displayTitle}</span>
              </a>
            ) : (
              displayTitle
            )}
          </h3>
          {metadata.crawlerId && (
            <span className="inline-flex items-center gap-1 mt-2 text-muted-foreground">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px] truncate max-w-[120px]">
                Crawler: {metadata.crawlerId.slice(-6)}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Content Snippet */}
      <div className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
        {content}
      </div>
    </motion.article>
  );
};

export default SearchResultCard;
