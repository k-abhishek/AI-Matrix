import React from "react";
import { motion } from "motion/react";
import { SlidersHorizontal, ArrowUpDown, ShieldCheck } from "lucide-react";
import type { SearchFilters } from "../../types";
import { cn } from "../../utils/cn";

interface SearchFiltersBarProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
  isOpen: boolean;
  onToggle: () => void;
  totalResults?: number;
}

export const SearchFiltersBar: React.FC<SearchFiltersBarProps> = ({
  filters,
  onChange,
  isOpen,
  onToggle,
  totalResults,
}) => {
  const thresholdOptions = [
    { label: "All matches (50%+)", value: 0.5 },
    { label: "Good match (70%+)", value: 0.7 },
    { label: "High match (80%+)", value: 0.8 },
  ];

  const sortOptions = [
    { label: "Relevance", value: "relevance" as const },
    { label: "Newest", value: "date" as const },
  ];

  const hasActiveFilters =
    (filters.scoreThreshold && filters.scoreThreshold > 0.5) ||
    filters.sortBy !== "relevance";

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">
          {totalResults !== undefined ? `${totalResults} result${totalResults === 1 ? "" : "s"} found` : ""}
        </span>

        {/* Filters Toggle Button */}
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-colors outline-none",
            isOpen || hasActiveFilters
              ? "border-primary/40 bg-primary/10 text-primary font-medium"
              : "border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground"
          )}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filters</span>
          {hasActiveFilters && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {/* Expandable Filter Scope Container with Motion */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl border border-border/60 bg-muted/30 text-xs">
            {/* Score Threshold Filter */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                <ShieldCheck className="h-3.5 w-3.5" />
                Score:
              </span>
              <div className="inline-flex rounded-lg border border-border/50 bg-background/50 p-0.5">
                {thresholdOptions.map((opt) => {
                  const isSelected = (filters.scoreThreshold ?? 0.5) === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onChange({ ...filters, scoreThreshold: opt.value })}
                      className={cn(
                        "px-2.5 py-1 rounded-md transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground font-medium shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                <ArrowUpDown className="h-3.5 w-3.5" />
                Sort:
              </span>
              <div className="inline-flex rounded-lg border border-border/50 bg-background/50 p-0.5">
                {sortOptions.map((opt) => {
                  const isSelected = (filters.sortBy ?? "relevance") === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onChange({ ...filters, sortBy: opt.value })}
                      className={cn(
                        "px-2.5 py-1 rounded-md transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground font-medium shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SearchFiltersBar;
