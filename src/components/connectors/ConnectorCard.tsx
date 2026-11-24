import React from "react";
import { Check, ExternalLink, Plus } from "lucide-react";
import SpotlightCard from "./SpotlightCard";
import ConnectorIcon from "./ConnectorIcon";
import { Button } from "../ui/button";
import type { ConnectorDefinition } from "../../types";
import { cn } from "../../utils/cn";

interface ConnectorCardProps {
  connector: ConnectorDefinition;
  connectedCount?: number;
  onConnect: (connector: ConnectorDefinition) => void;
}

function formatAuthType(auth: string): string {
  const labels: Record<string, string> = {
    OAUTH2_AUTHORIZATION_CODE: "OAuth 2.0",
    OAUTH2_CLIENT_CREDENTIALS: "OAuth CC",
    API_KEY: "API Key",
    BEARER_TOKEN: "Token",
    BASIC_AUTH: "Basic",
    CUSTOM_HEADERS: "Headers",
    NONE: "No Auth",
  };
  return labels[auth] ?? auth.replace(/_/g, " ");
}

export const ConnectorCard: React.FC<ConnectorCardProps> = ({
  connector,
  connectedCount = 0,
  onConnect,
}) => {
  const isConnected = connectedCount > 0;
  // isAvailable defaults to true via normalizeConnectorDef in api layer
  const isAvailable = connector.isAvailable !== false;

  return (
    <SpotlightCard className="flex flex-col justify-between h-full bg-card/70 backdrop-blur-sm transition-all hover:translate-y-[-2px]">
      <div className="flex flex-col justify-between h-full">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <ConnectorIcon
              connectorKey={connector.iconKey ?? connector.key}
              name={connector.name}
              iconUrl={connector.iconUrl}
            />
            <div>
              <h3 className="font-semibold text-sm text-foreground leading-tight flex items-center gap-2">
                {connector.name}
                {!isAvailable && (
                  <span className="inline-flex items-center rounded-full bg-muted border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    Coming soon
                  </span>
                )}
              </h3>
              {connector.docUrl ? (
                <a
                  href={connector.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors group/link"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Docs</span>
                  <ExternalLink className="h-3 w-3 transition-transform group-hover/link:translate-x-0.5" />
                </a>
              ) : (
                <span className="text-[11px] text-muted-foreground/60">
                  Built-in
                </span>
              )}
            </div>
          </div>

          {/* Right column: connected badge + button */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            {isConnected && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Connected ({connectedCount})
              </span>
            )}
            <Button
              size="sm"
              variant={isConnected ? "outline" : "default"}
              disabled={!isAvailable}
              onClick={() => onConnect(connector)}
              aria-label={
                isAvailable
                  ? `Connect ${connector.name}`
                  : `${connector.name} coming soon`
              }
              className={cn(
                "h-8 px-3 text-xs font-medium gap-1.5 transition-all",
                isConnected
                  ? "border-border/80 hover:bg-muted text-foreground"
                  : "shadow-sm hover:shadow-md",
                !isAvailable && "opacity-50 cursor-not-allowed",
              )}
            >
              {isConnected ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Add Another
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex flex-col">
          {/* Description */}
          <p className="mt-3.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {connector.description}
          </p>

          {/* Auth badges */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground/80 uppercase font-mono tracking-wider mr-1">
              Auth:
            </span>
            {connector.supportedAuth.slice(0, 3).map((auth) => (
              <span
                key={auth}
                className="rounded-md bg-muted/60 border border-border/50 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80"
              >
                {formatAuthType(auth)}
              </span>
            ))}
            {connector.supportedAuth.length > 3 && (
              <span className="text-[10px] text-muted-foreground font-mono">
                +{connector.supportedAuth.length - 3}
              </span>
            )}
          </div>
        </div>
      </div>
    </SpotlightCard>
  );
};

export default ConnectorCard;
