import React from "react";
import { motion } from "motion/react";
import { ExternalLink, Calendar, Hash, FileText } from "lucide-react";
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
  const { score, content, metadata } = result;

  const displayTitle =
    metadata.title?.trim() ||
    (metadata.url ? new URL(metadata.url).hostname : `Result #${index + 1}`);

  // const formattedScore = Math.round(score * 100);

  // Score color intensity
  // const getScoreBadgeClass = (s: number) => {
  //   if (s >= 80)
  //     return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
  //   if (s >= 65)
  //     return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  //   return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
  // };

  // const formattedDate = metadata.crawledAt
  //   ? new Date(metadata.crawledAt).toLocaleDateString(undefined, {
  //       year: "numeric",
  //       month: "short",
  //       day: "numeric",
  //     })
  //   : null;

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
      {/* Header: Title, URL and Match Score */}
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
                {/* <ExternalLink className="h-3.5 w-3.5 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0" /> */}
              </a>
            ) : (
              displayTitle
            )}
          </h3>
          {metadata.crawlerId && (
            <span className="inline-flex items-center gap-1 mt-2">
              <FileText className="h-3.5 w-3.5" />
              <span className="font-mono text-[11px] truncate max-w-[120px]">
                Crawler: {metadata.crawlerId.slice(-6)}
              </span>
            </span>
          )}

          {/* {metadata.url && (
            <p className="mt-0.5 text-xs text-muted-foreground truncate font-mono">
              {metadata.url}
            </p>
          )} */}
        </div>

        {/* Score Badge */}
        {/* <span
          className={cn(
            "flex-shrink-0 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide",
            getScoreBadgeClass(formattedScore)
          )}
          title={`Semantic relevance score: ${(score * 100).toFixed(1)}%`}
        >
          {formattedScore}% match
        </span> */}
      </div>

      {/* Content Snippet */}
      <div className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
        {content}
      </div>

      {/* Metadata Badges Footer */}
      {/* <div className="mt-1 flex flex-wrap items-center gap-3 pt-2 border-t border-border/40 text-xs text-muted-foreground">
        {metadata.chunkIndex !== undefined && (
          <span className="inline-flex items-center gap-1">
            <Hash className="h-3.5 w-3.5" />
            <span>Chunk {metadata.chunkIndex + 1}</span>
          </span>
        )}

        {formattedDate && (
          <span className="inline-flex items-center gap-1 ml-auto">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formattedDate}</span>
          </span>
        )}
      </div> */}
    </motion.article>
  );
};

export default SearchResultCard;
