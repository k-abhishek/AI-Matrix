import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wrench,
  ShieldAlert,
  Users,
  UserCheck,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import Card from '../../ui/Card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import Skeleton from '../../ui/Skeleton';
import ErrorMessage from '../../ui/ErrorMessage';
import { useConnectorCatalog, useConnections } from '../../../hooks/useConnectors';
import type {
  AgentToolGrantDTO,
  CapabilityType,
  ConnectionScope,
  ConnectorConnection,
  ConnectorDefinition,
  CreateAgentToolGrantDTO,
  UpdateAgentToolGrantDTO,
} from '../../../types';

export interface AgentToolConfigProps {
  agentId?: string;
  grants: AgentToolGrantDTO[];
  isLoadingGrants?: boolean;
  disabled?: boolean;
  isMutating?: boolean;
  onCreateGrant: (dto: CreateAgentToolGrantDTO) => void;
  onUpdateGrant: (grantId: string, dto: UpdateAgentToolGrantDTO) => void;
  onDeleteGrant: (grantId: string) => void;
}

export const AgentToolConfig: React.FC<AgentToolConfigProps> = ({
  agentId,
  grants,
  isLoadingGrants = false,
  disabled = false,
  isMutating = false,
  onCreateGrant,
  onUpdateGrant,
  onDeleteGrant,
}) => {
  const {
    data: catalog = [],
    isLoading: isLoadingCatalog,
    error: catalogError,
    refetch: refetchCatalog,
  } = useConnectorCatalog();

  const {
    data: connections = [],
    isLoading: isLoadingConnections,
  } = useConnections();

  const connectionsByKey = useMemo(() => {
    const map = new Map<string, ConnectorConnection[]>();
    connections.forEach((conn) => {
      const key = conn.connectorDefinition?.key;
      if (key) {
        map.set(key, [...(map.get(key) || []), conn]);
      }
    });
    return map;
  }, [connections]);

  const grantByKey = useMemo(() => {
    const map = new Map<string, AgentToolGrantDTO>();
    grants.forEach((g) => map.set(g.toolKey, g));
    return map;
  }, [grants]);

  const handleToggleConnector = (def: ConnectorDefinition) => {
    const existing = grantByKey.get(def.key);
    if (existing) {
      onDeleteGrant(existing.id);
      return;
    }

    const matchingConns = connectionsByKey.get(def.key) || [];
    const activeConn = matchingConns.find((c) => c.status === 'CONNECTED') || matchingConns[0];
    const capabilityType: CapabilityType = def.type === 'MCP' ? 'MCP' : 'CONNECTOR';

    onCreateGrant({
      capabilityType,
      toolKey: def.key,
      connectionScope: 'WORKSPACE_SHARED',
      connectionId: activeConn?.id ?? null,
      requiresApproval: false,
      isEnabled: true,
    });
  };

  if (!agentId) {
    return (
      <Card className="space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-border/60">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">Tools & Integrations</h2>
            <p className="text-xs text-muted-foreground">
              Save your agent draft first to configure authorized tool grants and connection
              scopes.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground">Tools & Integrations</h2>
              <Badge variant="secondary" className="text-[10px]">
                {grants.filter((g) => g.isEnabled).length} enabled
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Authorize connectors, MCP servers, and execution scopes for this agent.
            </p>
          </div>
        </div>

        <Link
          to="/connector"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          Manage Connectors
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoadingCatalog || isLoadingConnections || isLoadingGrants ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      ) : catalogError ? (
        <ErrorMessage
          title="Failed to load tool catalog"
          message={
            catalogError instanceof Error
              ? catalogError.message
              : 'Unable to fetch available connectors.'
          }
          onRetry={() => refetchCatalog()}
        />
      ) : catalog.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          No integrations are available in the catalog.
        </p>
      ) : (
        <div className="space-y-3">
          {catalog.map((def) => {
            const grant = grantByKey.get(def.key);
            const conns = connectionsByKey.get(def.key) || [];
            const connected = conns.find((c) => c.status === 'CONNECTED');
            const isEnabled = Boolean(grant?.isEnabled);
            const scope: ConnectionScope = grant?.connectionScope || 'WORKSPACE_SHARED';

            return (
              <div
                key={def.id}
                className={`rounded-xl border p-4 space-y-3 transition-colors ${
                  grant
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border hover:border-border/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">{def.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {def.type}
                      </Badge>
                      {connected ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 gap-1"
                        >
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Connected
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 gap-1"
                        >
                          <AlertTriangle className="h-2.5 w-2.5" />
                          Not connected
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{def.description}</p>
                  </div>

                  {!disabled && (
                    <Button
                      type="button"
                      size="sm"
                      variant={grant ? 'secondary' : 'outline'}
                      disabled={isMutating}
                      onClick={() => handleToggleConnector(def)}
                    >
                      {grant ? 'Remove' : 'Enable'}
                    </Button>
                  )}
                </div>

                {grant && (
                  <div className="pt-3 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Connection Scope */}
                    <div>
                      <span className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                        Connection Scope
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          disabled={disabled || isMutating}
                          onClick={() =>
                            onUpdateGrant(grant.id, { connectionScope: 'WORKSPACE_SHARED' })
                          }
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                            scope === 'WORKSPACE_SHARED'
                              ? 'border-primary bg-background text-foreground shadow-xs'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <Users className="h-3 w-3 shrink-0" />
                          Workspace Shared
                        </button>
                        <button
                          type="button"
                          disabled={disabled || isMutating}
                          onClick={() =>
                            onUpdateGrant(grant.id, {
                              connectionScope: 'USER_DELEGATED',
                              connectionId: null,
                            })
                          }
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                            scope === 'USER_DELEGATED'
                              ? 'border-primary bg-background text-foreground shadow-xs'
                              : 'border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          <UserCheck className="h-3 w-3 shrink-0" />
                          User Delegated
                        </button>
                      </div>
                    </div>

                    {/* Approval & Active Controls */}
                    <div className="flex flex-col justify-end gap-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={grant.requiresApproval}
                          disabled={disabled || isMutating}
                          onChange={(e) =>
                            onUpdateGrant(grant.id, { requiresApproval: e.target.checked })
                          }
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                        <span>Require human approval before execution</span>
                      </label>

                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          disabled={disabled || isMutating}
                          onChange={(e) =>
                            onUpdateGrant(grant.id, { isEnabled: e.target.checked })
                          }
                          className="h-3.5 w-3.5 accent-primary"
                        />
                        <span>Grant active</span>
                      </label>
                    </div>

                    {scope === 'WORKSPACE_SHARED' && !connected && (
                      <div className="sm:col-span-2 flex items-center justify-between gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                        <span>
                          No active workspace connection for {def.name}. Connect it before
                          publishing or running.
                        </span>
                        <Link
                          to="/connector"
                          className="font-semibold underline shrink-0"
                        >
                          Connect now
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default AgentToolConfig;
