import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  AlertCircle,
  Cpu,
  ExternalLink,
  Globe,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  useConnectMutation,
  useDiscoverTools,
} from "../../hooks/useConnectors";
import { getFriendlyErrorMessage } from "../../constants/connectorErrors";
import { isOAuthResponse } from "../../types";
import type {
  ConnectorDefinition,
  ConnectionAuthType,
  McpTransportType,
  ConnectorType,
  AuthFieldDescriptor,
} from "../../types";

// ── Props ──────────────────────────────────────────────────────────────────

interface CreateConnectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null = custom/generic connection (no catalog connector pre-selected). */
  connector: ConnectorDefinition | null;
  /** Called on success with connector name + tool count. */
  onSuccess?: (connectorName: string, toolsCount?: number) => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function labelForAuth(auth: ConnectionAuthType): string {
  const labels: Record<string, string> = {
    OAUTH2_AUTHORIZATION_CODE: "OAuth 2.0",
    OAUTH2_CLIENT_CREDENTIALS: "OAuth Client Credentials",
    API_KEY: "API Key",
    BEARER_TOKEN: "Bearer Token",
    BASIC_AUTH: "Basic Authentication",
    CUSTOM_HEADERS: "Custom Headers",
    NONE: "No Authentication",
  };
  return labels[auth] ?? auth.replace(/_/g, " ");
}

function isOAuth(auth: ConnectionAuthType): boolean {
  return (
    auth === "OAUTH2_AUTHORIZATION_CODE" || auth === "OAUTH2_CLIENT_CREDENTIALS"
  );
}

/** Validate a string is a valid http(s) URL. */
function isValidUrl(value: string): boolean {
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

// ── Default auth fields when the backend doesn't send authFields ──────────

const DEFAULT_AUTH_FIELDS: Record<string, AuthFieldDescriptor[]> = {
  API_KEY: [
    {
      name: "apiKey",
      label: "API Key",
      type: "password",
      placeholder: "Enter API key…",
      required: true,
    },
  ],
  BEARER_TOKEN: [
    {
      name: "accessToken",
      label: "Bearer Token",
      type: "password",
      placeholder: "eyJhbGci…",
      required: true,
    },
  ],
  BASIC_AUTH: [
    {
      name: "username",
      label: "Username",
      type: "text",
      placeholder: "user@example.com",
      required: true,
    },
    {
      name: "password",
      label: "Password / Token",
      type: "password",
      placeholder: "••••••••",
      required: true,
    },
  ],
};

// ── Component ──────────────────────────────────────────────────────────────

export const CreateConnectionModal: React.FC<CreateConnectionModalProps> = ({
  open,
  onOpenChange,
  connector,
  onSuccess,
}) => {
  // ── Form state ─────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [customType, setCustomType] = useState<ConnectorType>("MCP");
  const [baseUrl, setBaseUrl] = useState("");
  const [transport, setTransport] =
    useState<McpTransportType>("STREAMABLE_HTTP");
  const [authType, setAuthType] = useState<ConnectionAuthType>("NONE");
  /** Credential field values keyed by field.name */
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [oauthPending, setOauthPending] = useState(false);

  const connectMutation = useConnectMutation();
  const discoverMutation = useDiscoverTools();

  // ── Derived metadata ───────────────────────────────────────────────────

  /** Usable auth options: drop OAuth2 when oauthAvailable is false. */
  const usableAuth: ConnectionAuthType[] = useMemo(() => {
    if (!connector)
      return [
        "NONE",
        "API_KEY",
        "BEARER_TOKEN",
        "BASIC_AUTH",
        "CUSTOM_HEADERS",
      ];
    return connector.supportedAuth.filter((a) => {
      if (a === "OAUTH2_AUTHORIZATION_CODE")
        return connector.oauthAvailable === true;
      return true;
    });
  }, [connector]);

  const showAuthSelector = usableAuth.length > 1;

  /** Whether to show the base URL input. */
  const showBaseUrl = useMemo(() => {
    if (!connector) return true; // custom flow always needs URL
    return connector.requiresBaseUrl === true;
  }, [connector]);

  const baseUrlLabel = connector?.baseUrlLabel ?? "Server Endpoint / Base URL";
  const baseUrlPlaceholder =
    connector?.baseUrlPlaceholder ?? "https://your-server.com/api/v1";

  /** Whether selected auth is OAuth with oauthAvailable=true (skip modal). */
  const isOAuthFlow = isOAuth(authType) && connector?.oauthAvailable === true;

  /** Field descriptors for the selected auth type. */
  const authFields: AuthFieldDescriptor[] = useMemo(() => {
    if (isOAuth(authType)) return []; // OAuth shows no credential fields
    const fromCatalog = connector?.authFields?.[authType];
    if (fromCatalog && fromCatalog.length > 0) return fromCatalog;
    return DEFAULT_AUTH_FIELDS[authType] ?? [];
  }, [authType, connector]);

  const isMcp =
    connector?.type === "MCP" || (!connector && customType === "MCP");

  // ── Reset on open/connector change ────────────────────────────────────

  useEffect(() => {
    if (!open) return;

    if (connector) {
      setName(connector.name);
      setBaseUrl("");
      setTransport("STREAMABLE_HTTP");
      const defaultAuth =
        (connector.recommendedAuth &&
        usableAuth.includes(connector.recommendedAuth)
          ? connector.recommendedAuth
          : usableAuth[0]) ?? "NONE";
      setAuthType(defaultAuth);
    } else {
      setName("Custom MCP Connection");
      setCustomType("MCP");
      setBaseUrl("");
      setTransport("STREAMABLE_HTTP");
      setAuthType("NONE");
    }

    setCredentials({});
    setFormError(null);
    setOauthPending(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, connector]);

  // Clear only password fields when switching auth type
  const handleAuthChange = (newAuth: ConnectionAuthType) => {
    setAuthType(newAuth);
    setCredentials((prev) => {
      const next = { ...prev };
      // Drop password-type fields; keep text fields
      authFields.forEach((f) => {
        if (f.type === "password") delete next[f.name];
      });
      return next;
    });
    setFormError(null);
  };

  // Clear credentials when modal closes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) setCredentials({});
      onOpenChange(open);
    },
    [onOpenChange],
  );

  // ── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = name.trim() || (connector?.name ?? "Custom Connection");

    // Base URL validation
    if (showBaseUrl) {
      if (!baseUrl.trim()) {
        setFormError(`${baseUrlLabel} is required.`);
        return;
      }
      if (!isValidUrl(baseUrl)) {
        setFormError(`${baseUrlLabel} must be a valid http(s) URL.`);
        return;
      }
    }

    // Credential validation from authFields
    for (const field of authFields) {
      if (field.required && !credentials[field.name]?.trim()) {
        setFormError(`${field.label} is required.`);
        return;
      }
    }

    const connectorKey =
      connector?.key ?? (customType === "MCP" ? "mcp-server" : "custom-rest");

    // OAuth2 fast-path: skip modal, call /connect immediately
    if (isOAuthFlow) {
      setOauthPending(true);
      try {
        const res = await connectMutation.mutateAsync({
          connectorKey,
          name: trimmedName,
          authType,
          baseUrl: showBaseUrl ? baseUrl.trim() : undefined,
          mcpTransport: isMcp ? transport : undefined,
        });
        if (isOAuthResponse(res)) {
          window.location.href = res.authUrl;
          return; // browser navigates away
        }
        // Backend returned a connection (non-OAuth path)
        onSuccess?.(connector?.name ?? trimmedName, res.toolsCount);
        onOpenChange(false);
      } catch (err: unknown) {
        setOauthPending(false);
        const code = (err as { code?: string })?.code;
        const message = code
          ? getFriendlyErrorMessage(code)
          : (err as Error).message || getFriendlyErrorMessage();
        setFormError(message);
      }
      return;
    }

    // Non-OAuth submit
    try {
      const res = await connectMutation.mutateAsync({
        connectorKey,
        name: trimmedName,
        authType,
        baseUrl: showBaseUrl ? baseUrl.trim() : undefined,
        mcpTransport: isMcp ? transport : undefined,
        credentials:
          Object.keys(credentials).length > 0 ? credentials : undefined,
      });

      let toolsCount: number | undefined;

      if (!isOAuthResponse(res)) {
        toolsCount = res.toolsCount;
        // Trigger discovery if we have a connection id
        if (res.connection?.id) {
          discoverMutation.mutate(res.connection.id);
        }
        onSuccess?.(connector?.name ?? trimmedName, toolsCount);
        onOpenChange(false);
      } else {
        // Shouldn't reach here for non-OAuth, but handle gracefully
        window.location.href = res.authUrl;
      }
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const msg = code
        ? getFriendlyErrorMessage(code)
        : (err as Error).message || "Failed to connect.";
      setFormError(msg);
      // On INVALID_CREDENTIALS: clear password fields only
      if (code === "INVALID_CREDENTIALS") {
        setCredentials((prev) => {
          const next = { ...prev };
          authFields.forEach((f) => {
            if (f.type === "password") delete next[f.name];
          });
          return next;
        });
      }
      // Keep other values intact (never lose the form on failure)
    }
  };

  const isPending = connectMutation.isPending || oauthPending;


  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-lg bg-card/95 backdrop-blur-md border-border/80 shadow-xl"
        aria-describedby="connect-modal-desc"
      >
        <form onSubmit={handleSubmit} noValidate>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {connector
                ? `Connect ${connector.name}`
                : "Create Custom Integration"}
            </DialogTitle>
            <DialogDescription
              id="connect-modal-desc"
              className="text-xs text-muted-foreground"
            >
              {connector
                ? connector.description
                : "Configure a remote Model Context Protocol (MCP) or Custom REST endpoint."}
            </DialogDescription>
          </DialogHeader>

          {/* Error banner */}
          {formError && (
            <div
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-2.5 text-xs text-red-600 dark:text-red-400"
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="mt-4 space-y-4 text-xs">
            {/* Custom type selector (only when no preselected connector) */}
            {!connector && (
              <fieldset>
                <legend className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1.5">
                  Integration Type
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {(["MCP", "CUSTOM_REST"] as ConnectorType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setCustomType(t)}
                      aria-pressed={customType === t}
                      className={`flex items-center justify-center gap-2 rounded-lg border p-2.5 font-medium transition-colors ${
                        customType === t
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t === "MCP" ? (
                        <Cpu className="h-4 w-4" />
                      ) : (
                        <Globe className="h-4 w-4" />
                      )}
                      {t === "MCP" ? "MCP Server" : "Custom REST API"}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Connection name */}
            <div>
              <label
                htmlFor="conn-name"
                className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1"
              >
                Connection Name{" "}
                <span aria-hidden="true" className="text-muted-foreground">
                  (optional)
                </span>
              </label>
              <Input
                id="conn-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={connector?.name ?? "My Connection"}
                className="text-xs h-8"
              />
            </div>

            {/* Base URL */}
            {showBaseUrl && (
              <div>
                <label
                  htmlFor="conn-base-url"
                  className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1"
                >
                  {baseUrlLabel} <span className="text-red-500">*</span>
                </label>
                <Input
                  id="conn-base-url"
                  type="url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={baseUrlPlaceholder}
                  className="font-mono text-xs h-8"
                  required
                />
              </div>
            )}

            {/* MCP transport selector */}
            {isMcp && (
              <div>
                <label
                  htmlFor="conn-transport"
                  className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1"
                >
                  MCP Transport
                </label>
                <select
                  id="conn-transport"
                  value={transport}
                  onChange={(e) =>
                    setTransport(e.target.value as McpTransportType)
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="STREAMABLE_HTTP">
                    Streamable HTTP (recommended)
                  </option>
                  <option value="LEGACY_HTTP_SSE">Legacy HTTP SSE</option>
                  <option value="STDIO_ISOLATED">STDIO Isolated</option>
                </select>
              </div>
            )}

            {/* Auth type selector — only when >1 usable option */}
            {showAuthSelector && (
              <div>
                <label
                  htmlFor="conn-auth"
                  className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1"
                >
                  Authentication Method
                </label>
                <select
                  id="conn-auth"
                  value={authType}
                  onChange={(e) =>
                    handleAuthChange(e.target.value as ConnectionAuthType)
                  }
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {usableAuth.map((auth) => (
                    <option key={auth} value={auth}>
                      {labelForAuth(auth)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* OAuth2 info banner */}
            {isOAuth(authType) && (
              <div className="flex items-start gap-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs text-blue-700 dark:text-blue-300">
                <ExternalLink className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">OAuth 2.0 Authorization</p>
                  <p className="mt-0.5 text-[11px] opacity-80 leading-relaxed">
                    Clicking "Authorize with OAuth" will redirect you to the
                    provider's consent page. You will be returned here
                    automatically after granting access.
                  </p>
                </div>
              </div>
            )}

            {/* Dynamic credential fields (from authFields metadata) */}
            {authFields.map((field) => (
              <div key={field.name}>
                <label
                  htmlFor={`cred-${field.name}`}
                  className="block text-[11px] font-semibold text-foreground uppercase tracking-wider mb-1"
                >
                  {field.label}
                  {field.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {field.helpText && (
                  <p className="text-[10px] text-muted-foreground mb-1 leading-relaxed">
                    {field.helpText}
                  </p>
                )}
                <Input
                  id={`cred-${field.name}`}
                  type={field.type}
                  value={credentials[field.name] ?? ""}
                  onChange={(e) =>
                    setCredentials((prev) => ({
                      ...prev,
                      [field.name]: e.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  className="font-mono text-xs h-8"
                  required={field.required}
                  autoComplete={
                    field.type === "password" ? "current-password" : "off"
                  }
                />
              </div>
            ))}
          </div>

          <DialogFooter className="mt-6 flex items-center justify-end gap-2 border-t border-border/40 pt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 px-3 text-xs"
                disabled={isPending}
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="h-8 px-4 text-xs font-semibold gap-1.5 shadow-sm"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isOAuthFlow
                ? `Connect with ${connector?.name ?? "OAuth"}`
                : "Save Connection"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateConnectionModal;
