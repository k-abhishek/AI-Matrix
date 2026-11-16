import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { AlertCircle, RefreshCw, Sparkles, Inbox } from "lucide-react";
import PromptInput, { PromptMode } from "../components/PromptInput";
import SearchResultCard from "../components/search/SearchResultCard";
import SearchFiltersBar from "../components/search/SearchFiltersBar";
import { searchApi } from "../api";
import { useChatStore } from "../store";
import type { SearchResultItem, SearchFilters } from "../types";

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCurrentChat } = useChatStore();

  const queryParam = searchParams.get("q") || "";
  const [inputVal, setInputVal] = useState(queryParam);
  const [currentMode, setCurrentMode] = useState<PromptMode>("search");

  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Filters scope state
  const [filters, setFilters] = useState<SearchFilters>({
    scoreThreshold: 0.5,
    sortBy: "relevance",
  });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Sync input value whenever url queryParam changes
  useEffect(() => {
    setInputVal(queryParam);
  }, [queryParam]);

  // Execute search when queryParam changes
  const performSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setResults([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await searchApi.search({ query: trimmed, limit: 20 });
      setResults(data.results || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to execute search";
      setError(msg);
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (queryParam) {
      performSearch(queryParam);
    } else {
      setResults([]);
    }
  }, [queryParam, performSearch]);

  // Handle submit from PromptInput
  const handleSubmit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (currentMode === "chat") {
      clearCurrentChat();
      navigate("/chat", { state: { initialPrompt: trimmed } });
    } else {
      setSearchParams({ q: trimmed });
    }
  };

  // Filter & sort results in client (scope for current & future filters)
  const filteredResults = useMemo(() => {
    let list = [...results];

    // Filter by threshold
    if (filters.scoreThreshold && filters.scoreThreshold > 0.5) {
      list = list.filter((r) => r.score >= (filters.scoreThreshold ?? 0.5));
    }

    // Sort
    if (filters.sortBy === "date") {
      list.sort((a, b) => {
        const timeA = a.metadata.crawledAt ? new Date(a.metadata.crawledAt).getTime() : 0;
        const timeB = b.metadata.crawledAt ? new Date(b.metadata.crawledAt).getTime() : 0;
        return timeB - timeA;
      });
    } else {
      // Relevance
      list.sort((a, b) => b.score - a.score);
    }

    return list;
  }, [results, filters]);

  return (
    <div className="flex flex-1 flex-col w-full h-full min-h-0 overflow-y-auto">
      {/* Top Floating / Sticky Header with animated input */}
      <div className="sticky top-0 z-20 w-full bg-background/95 backdrop-blur border-b border-border/40 py-4 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-3">
          <motion.div
            layoutId="shared-prompt-input"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full"
          >
            <PromptInput
              value={inputVal}
              mode={currentMode}
              onModeChange={(m) => setCurrentMode(m)}
              onChange={(val) => setInputVal(val)}
              onSubmit={handleSubmit}
              placeholder="Search crawled knowledge base..."
              className="border border-input/60 bg-background shadow-xs hover:border-input transition-colors"
            />
          </motion.div>

          {/* Filters Bar & Result Counter */}
          {/* {queryParam && !isLoading && !error && (
            <SearchFiltersBar
              filters={filters}
              onChange={setFilters}
              isOpen={isFiltersOpen}
              onToggle={() => setIsFiltersOpen((prev) => !prev)}
              totalResults={filteredResults.length}
            />
          )} */}
        </div>
      </div>

      {/* Main Results Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6">
        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between p-4 rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive text-sm"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => performSearch(queryParam)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-xs font-medium"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </button>
          </motion.div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="flex flex-col gap-4">
            <div className="h-4 w-44 rounded bg-muted animate-pulse mb-2" />
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 p-5 rounded-2xl border border-border/40 bg-card/60 animate-pulse"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 w-1/3 rounded bg-muted" />
                  <div className="h-5 w-16 rounded-full bg-muted" />
                </div>
                <div className="space-y-2">
                  <div className="h-3.5 w-full rounded bg-muted/80" />
                  <div className="h-3.5 w-5/6 rounded bg-muted/70" />
                  <div className="h-3.5 w-4/6 rounded bg-muted/60" />
                </div>
                <div className="h-3 w-1/4 rounded bg-muted/50 pt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Results List with Motion Animation */}
        {!isLoading && !error && queryParam && filteredResults.length > 0 && (
          <motion.div
            key={queryParam}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.06,
                },
              },
            }}
            className="flex flex-col gap-4"
          >
            <AnimatePresence mode="popLayout">
              {filteredResults.map((result, idx) => (
                <SearchResultCard
                  key={result.id || `${result.metadata.url}-${result.metadata.chunkIndex}-${idx}`}
                  result={result}
                  index={idx}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State when searched but no results */}
        {!isLoading && !error && queryParam && filteredResults.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center py-16 px-4 rounded-3xl border border-dashed border-border/60 bg-muted/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/80 text-muted-foreground mb-4">
              <Inbox className="h-6 w-6" />
            </div>
            <h3 className="text-base font-medium text-foreground">No matches found</h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              We couldn&apos;t find any indexed knowledge chunks matching &quot;{queryParam}&quot;.
              Try adjusting your query or score filter.
            </p>
          </motion.div>
        )}

        {/* Initial Prompt State when no query is present */}
        {!isLoading && !error && !queryParam && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center py-24 text-muted-foreground"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
              <Sparkles className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-medium text-foreground">Semantic Search</h2>
            <p className="mt-1 text-sm max-w-md">
              Search through crawled websites and documentation indexed in your Qdrant vector database.
            </p>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default SearchPage;
