import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Layers, Plug, Plus, Search, X } from 'lucide-react';
import { toast } from '../components/ui/sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import PageHeader from '../components/ui/PageHeader';
import AnimatedTabs, { TabItem } from '../components/connectors/AnimatedTabs';
import ConnectorCard from '../components/connectors/ConnectorCard';
import ConnectionCard from '../components/connectors/ConnectionCard';
import ConnectorCardSkeleton from '../components/connectors/ConnectorCardSkeleton';
import CreateConnectionModal from '../components/connectors/CreateConnectionModal';
import ToolExplorerModal from '../components/connectors/ToolExplorerModal';
import {
  useConnectorCatalog,
  useConnections,
  useTestConnection,
  useDiscoverTools,
  useDeleteConnection,
} from '../hooks/useConnectors';
import { getFriendlyErrorMessage, DEFAULT_TAB, type ConnectorTab } from '../constants/connectorErrors';
import type { ConnectorDefinition, ConnectorConnection } from '../types';

// ── Tab spec ───────────────────────────────────────────────────────────────

const VALID_TABS: ConnectorTab[] = ['connectors', 'connections'];

function isValidTab(value: string | null): value is ConnectorTab {
  return value !== null && (VALID_TABS as string[]).includes(value);
}

// ── Page ───────────────────────────────────────────────────────────────────

export const ConnectorPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL-driven tab ────────────────────────────────────────────────────
  const tabParam = searchParams.get('tab');
  const activeTab: ConnectorTab = isValidTab(tabParam) ? tabParam : DEFAULT_TAB;

  const setActiveTab = useCallback(
    (tab: ConnectorTab) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      }, { replace: false });
    },
    [setSearchParams],
  );

  // ── Type filter ───────────────────────────────────────────────────────
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modal state ───────────────────────────────────────────────────────
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorDefinition | null>(null);
  const [isToolExplorerOpen, setIsToolExplorerOpen] = useState(false);
  const [activeConnectionForTools, setActiveConnectionForTools] =
    useState<ConnectorConnection | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────
  const {
    data: catalog = [],
    isLoading: isLoadingCatalog,
    error: catalogError,
    refetch: refetchCatalog,
  } = useConnectorCatalog();

  const {
    data: connections = [],
    isLoading: isLoadingConnections,
    error: connectionsError,
    refetch: refetchConnections,
  } = useConnections();

  const testMutation = useTestConnection();
  const discoverMutation = useDiscoverTools();
  const deleteMutation = useDeleteConnection();

  // ── OAuth return handling ─────────────────────────────────────────────
  useEffect(() => {
    const status = searchParams.get('status');
    const connectionId = searchParams.get('connectionId');
    const errorCode = searchParams.get('code');

    if (!status) return;

    const isSuccess = status === 'success' && Boolean(connectionId);

    // Strip OAuth params (and switch to connections tab on success) in a single
    // replace update so a second setSearchParams call doesn't restore stale params.
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('status');
        next.delete('connectionId');
        next.delete('code');
        if (isSuccess) {
          next.set('tab', 'connections');
        }
        return next;
      },
      { replace: true },
    );

    if (isSuccess && connectionId) {
      toast.success('Connected successfully!', {
        description: 'OAuth authorisation complete. Discovering tools…',
      });
      refetchConnections();
      discoverMutation.mutate(connectionId, {
        onSuccess: (result) => {
          toast.success('Tools discovered', {
            description: `${result.toolsCount} tools are now available.`,
          });
        },
        onError: () => {
          toast.warning('OAuth succeeded, but tool discovery failed.', {
            description: 'Open the connection and click Sync to retry.',
          });
        },
      });
    } else if (status === 'error') {
      // Never render raw URL value – map code to safe static message
      const message = getFriendlyErrorMessage(errorCode);
      toast.error('OAuth authorisation failed', { description: message });
    }
    // discoverMutation intentionally excluded from deps — we only want this on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Connection counts per connector key ───────────────────────────────
  const connectionCountsByKey = useMemo(() => {
    const map: Record<string, number> = {};
    connections.forEach((conn) => {
      const key = conn.connectorDefinition?.key;
      if (key) map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [connections]);

  // ── Filtered catalog ──────────────────────────────────────────────────
  const filteredCatalog = useMemo(() => {
    return catalog.filter((item) => {
      const matchesType = typeFilter === 'ALL' || item.type === typeFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [catalog, typeFilter, searchQuery]);

  // ── Filtered connections ──────────────────────────────────────────────
  const filteredConnections = useMemo(() => {
    return connections.filter((conn) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        conn.name.toLowerCase().includes(q) ||
        (conn.connectorDefinition?.name ?? '').toLowerCase().includes(q) ||
        (conn.baseUrl ?? '').toLowerCase().includes(q)
      );
    });
  }, [connections, searchQuery]);

  // ── Handlers ──────────────────────────────────────────────────────────
  const handleOpenConnect = (connector: ConnectorDefinition) => {
    setSelectedConnector(connector);
    setIsCreateOpen(true);
  };

  const handleOpenCustomCreate = () => {
    setSelectedConnector(null);
    setIsCreateOpen(true);
  };

  const handleInspectTools = (conn: ConnectorConnection) => {
    setActiveConnectionForTools(conn);
    setIsToolExplorerOpen(true);
  };

  const handleReconnect = (conn: ConnectorConnection) => {
    const def = conn.connectorDefinition ?? null;
    setSelectedConnector(def);
    setIsCreateOpen(true);
  };

  const handleConnectSuccess = useCallback(
    (connectorName: string, toolsCount?: number) => {
      toast.success(
        toolsCount != null
          ? `Connected to ${connectorName}! Discovered ${toolsCount} tools.`
          : `Connected to ${connectorName}!`,
      );
      setActiveTab('connections');
      refetchConnections();
    },
    [setActiveTab, refetchConnections],
  );

  // ── Tab definitions ───────────────────────────────────────────────────
  const mainTabs: TabItem[] = [
    { id: 'connectors', label: 'Connectors', icon: <Layers className="h-3.5 w-3.5" /> },
    { id: 'connections', label: 'My Connections', icon: <Plug className="h-3.5 w-3.5" /> },
  ];

  const categoryFilterTabs: TabItem[] = [
    { id: 'ALL', label: 'All Types' },
    { id: 'MCP', label: 'MCP Servers' },
    { id: 'NATIVE', label: 'Native Apps' },
    { id: 'CUSTOM_REST', label: 'Custom REST' },
  ];

  // ── Redirect /connectors → /connector (handled in routes; this guards the page) ──
  // The route at /connectors is kept as a redirect at router level.

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Page Hero */}
        <PageHeader
          icon={Plug}
          eyebrow="Integrations & Agent Tools"
          title="Connectors & Integrations"
          description="Supercharge your autonomous AI agents with tools, external APIs, databases, and Model Context Protocol (MCP) remote capabilities."
          borderBottom
          actions={
            <Button
              onClick={handleOpenCustomCreate}
              className="h-9 text-xs font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Connection</span>
            </Button>
          }
        />

        {/* Navigation & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <AnimatedTabs
            tabs={mainTabs}
            activeTab={activeTab}
            onChange={(tab) => setActiveTab(tab as ConnectorTab)}
            layoutId="main-connector-tabs"
          />

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'connectors'
                  ? 'Search connectors…'
                  : 'Search your connections…'
              }
              className="w-full rounded-xl bg-background/80 pl-9 pr-8 py-1.5 h-9 text-xs text-foreground placeholder:text-muted-foreground shadow-sm"
              aria-label="Search"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Tab: Connectors ──────────────────────────────────────────── */}
        {activeTab === 'connectors' && (
          <div className="space-y-4">
            {/* Category filter */}
            <div className="flex items-center justify-between">
              <AnimatedTabs
                tabs={categoryFilterTabs}
                activeTab={typeFilter}
                onChange={setTypeFilter}
                layoutId="marketplace-type-filters"
              />
              <span className="text-[11px] text-muted-foreground font-mono">
                Showing {filteredCatalog.length} of {catalog.length} integrations
              </span>
            </div>

            {/* Error */}
            {catalogError && !isLoadingCatalog && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-destructive/40 py-16 text-center gap-3">
                <p className="text-sm text-destructive font-medium">Failed to load catalog</p>
                <p className="text-xs text-muted-foreground">
                  {(catalogError as Error).message}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetchCatalog()} className="text-xs">
                  Retry
                </Button>
              </div>
            )}

            {/* Loading skeletons */}
            {isLoadingCatalog && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ConnectorCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty search state */}
            {!isLoadingCatalog && !catalogError && filteredCatalog.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
                <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <h3 className="text-sm font-semibold text-foreground">No integrations found</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                  No connectors matched "{searchQuery}". Try a different search or configure a
                  custom MCP server.
                </p>
                <Button
                  variant="outline"
                  onClick={handleOpenCustomCreate}
                  className="mt-4 text-xs gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Configure Custom Connection
                </Button>
              </div>
            )}

            {/* Card grid */}
            {!isLoadingCatalog && !catalogError && filteredCatalog.length > 0 && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
                }}
              >
                {filteredCatalog.map((connector) => (
                  <motion.div
                    key={connector.id || connector.key}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                    }}
                  >
                    <ConnectorCard
                      connector={connector}
                      connectedCount={connectionCountsByKey[connector.key] || 0}
                      onConnect={handleOpenConnect}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* ── Tab: My Connections ──────────────────────────────────────── */}
        {activeTab === 'connections' && (
          <div className="space-y-4">
            {/* Error */}
            {connectionsError && !isLoadingConnections && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-destructive/40 py-16 text-center gap-3">
                <p className="text-sm text-destructive font-medium">Failed to load connections</p>
                <p className="text-xs text-muted-foreground">
                  {(connectionsError as Error).message}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetchConnections()} className="text-xs">
                  Retry
                </Button>
              </div>
            )}

            {/* Loading skeletons */}
            {isLoadingConnections && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ConnectorCardSkeleton key={i} />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoadingConnections && !connectionsError && filteredConnections.length === 0 && (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/10 py-20 text-center px-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 mb-3 shadow-sm">
                  <Plug className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">No active connections yet</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md leading-relaxed">
                  Connect your workspace to Slack, Google Suite, GitHub, Jira, or your custom Model
                  Context Protocol (MCP) servers to allow your agents to take real-world actions.
                </p>
                <div className="mt-5 flex items-center gap-2 flex-wrap justify-center">
                  <Button
                    onClick={() => setActiveTab('connectors')}
                    className="text-xs gap-1.5 shadow-sm font-semibold"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Browse Connectors
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleOpenCustomCreate}
                    className="text-xs gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Custom MCP Server
                  </Button>
                </div>
              </div>
            )}

            {/* Connection cards */}
            {!isLoadingConnections && !connectionsError && filteredConnections.length > 0 && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
                }}
              >
                {filteredConnections.map((connection) => (
                  <motion.div
                    key={connection.id}
                    variants={{
                      hidden: { opacity: 0, y: 12 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
                    }}
                  >
                    <ConnectionCard
                      connection={connection}
                      onInspectTools={handleInspectTools}
                      onReconnect={handleReconnect}
                      onDelete={(id) => deleteMutation.mutateAsync(id)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Create / Connect modal */}
      <CreateConnectionModal
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) setSelectedConnector(null);
        }}
        connector={selectedConnector}
        onSuccess={handleConnectSuccess}
      />

      {/* Tool Explorer */}
      <ToolExplorerModal
        open={isToolExplorerOpen}
        onOpenChange={setIsToolExplorerOpen}
        connection={activeConnectionForTools}
      />
    </div>
  );
};

export default ConnectorPage;
