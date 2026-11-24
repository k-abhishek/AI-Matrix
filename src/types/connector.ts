// ============================================================================
// Connector Platform – shared API types (matches backend contract)
// ============================================================================

export type ConnectorType = 'NATIVE' | 'MCP' | 'CUSTOM_REST';

export type ConnectionAuthType =
  | 'NONE'
  | 'API_KEY'
  | 'BEARER_TOKEN'
  | 'BASIC_AUTH'
  | 'OAUTH2_AUTHORIZATION_CODE'
  | 'OAUTH2_CLIENT_CREDENTIALS'
  | 'CUSTOM_HEADERS';

export type ConnectionStatus =
  | 'INITIALIZING'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ERROR'
  | 'EXPIRED'
  | 'REVOKED'
  | 'PENDING';

export type McpTransportType =
  | 'STREAMABLE_HTTP'
  | 'LEGACY_HTTP_SSE'
  | 'STDIO_ISOLATED';

export type ToolExecutionStatus =
  | 'SUCCESS'
  | 'FAILED'
  | 'TIMED_OUT'
  | 'PERMISSION_DENIED'
  | 'APPROVAL_REQUIRED';

// ── Catalog auth-field descriptor ──────────────────────────────────────────

export interface AuthFieldDescriptor {
  name: string;
  label: string;
  type: 'text' | 'password';
  placeholder?: string;
  helpText?: string;
  required: boolean;
}

export type CatalogAuthField = AuthFieldDescriptor;

// ── Connector catalog item (GET /api/connectors/catalog) ──────────────────

export interface ConnectorDefinition {
  id: string;
  key: string;
  name: string;
  description: string;
  type: ConnectorType;
  supportedAuth: ConnectionAuthType[];
  /** Preferred auth when multiple options are available. */
  recommendedAuth?: ConnectionAuthType;
  /** Whether OAuth2 is configured and usable on the backend. */
  oauthAvailable?: boolean;
  /** Whether a base URL must be supplied by the user. Fallback: type is MCP or CUSTOM_REST. */
  requiresBaseUrl?: boolean;
  baseUrlLabel?: string;
  baseUrlPlaceholder?: string;
  /**
   * Per-auth credential field descriptors.
   * authFields[authType] = array of field definitions.
   */
  authFields?: Record<string, AuthFieldDescriptor[]>;
  /** Key for icon resolution (Lucide / local SVG). */
  iconKey?: string;
  // Legacy field kept for backward compat (ConnectorIcon reads this)
  iconUrl?: string | null;
  docUrl?: string | null;
  isSystem?: boolean;
  /** Whether this connector is fully launched. Fallback: true. */
  isAvailable?: boolean;
  defaultConfig?: Record<string, unknown> | null;
  createdAt?: string;
  updatedAt?: string;
  connectionsCount?: number;
}

export type ConnectorCatalogItem = ConnectorDefinition;

// ── Connection (GET /api/connections item) ────────────────────────────────

export interface ConnectorTool {
  id: string;
  connectionId: string;
  name: string;
  displayName: string;
  description: string;
  inputSchema: Record<string, unknown>;
  outputSchema?: Record<string, unknown> | null;
  schemaHash?: string | null;
  isEnabled: boolean;
  requiresApproval: boolean;
  rateLimitPerMin?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorResource {
  id: string;
  connectionId: string;
  uri: string;
  name: string;
  description?: string | null;
  mimeType?: string | null;
  isIndexed: boolean;
  lastReadAt?: string | null;
}

export interface ConnectorPrompt {
  id: string;
  connectionId: string;
  name: string;
  description?: string | null;
  arguments?: unknown;
}

export interface ConnectorConnection {
  id: string;
  workspaceId?: string;
  userId?: string;
  connectorDefinitionId?: string;
  name: string;
  status: ConnectionStatus;
  authType: ConnectionAuthType;
  baseUrl?: string | null;
  mcpTransport?: McpTransportType | null;
  config?: Record<string, unknown> | null;
  lastConnectedAt?: string | null;
  lastTestedAt?: string | null;
  lastDiscoveredAt?: string | null;
  lastErrorMessage?: string | null;
  configVersion?: number;
  createdAt: string;
  updatedAt: string;
  connectorDefinition?: ConnectorDefinition;
  tools?: ConnectorTool[];
  resources?: ConnectorResource[];
  prompts?: ConnectorPrompt[];
  _count?: {
    tools?: number;
    resources?: number;
    prompts?: number;
  };
}

// ── POST /api/connections/connect  ─────────────────────────────────────────

export interface ConnectRequestDto {
  /** Catalog key – preferred; do NOT send connectorDefinitionId. */
  connectorKey: string;
  name?: string;
  authType: ConnectionAuthType;
  baseUrl?: string;
  mcpTransport?: McpTransportType;
  credentials?: Record<string, string>;
}

/** Token/key/basic success → 201 */
export interface ConnectSuccessResponse {
  connection: ConnectorConnection;
  toolsCount?: number;
}

/** OAuth2 flow → 200 */
export interface ConnectOAuthResponse {
  authUrl: string;
}

export type ConnectResponse = ConnectSuccessResponse | ConnectOAuthResponse;

/** Narrows union to OAuth response */
export function isOAuthResponse(r: ConnectResponse): r is ConnectOAuthResponse {
  return 'authUrl' in r;
}

// ── API error shape ────────────────────────────────────────────────────────

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

// ── Legacy DTOs (kept for hooks that call older endpoints) ────────────────

export interface CatalogFilterQuery {
  type?: ConnectorType;
  search?: string;
}

/** @deprecated Use ConnectRequestDto for /connect. Keep for existing hooks. */
export interface CreateConnectionDto {
  name: string;
  authType: ConnectionAuthType;
  connectorDefinitionId?: string;
  connectorKey?: string;
  baseUrl?: string;
  mcpTransport?: McpTransportType;
  config?: Record<string, unknown>;
  credentials?: Record<string, string>;
}

export interface UpdateConnectionDto {
  name?: string;
  baseUrl?: string;
  mcpTransport?: McpTransportType;
  config?: Record<string, unknown>;
  status?: ConnectionStatus;
  credentials?: Record<string, string>;
}

export interface ConnectionHealthResult {
  status: ConnectionStatus;
  isHealthy: boolean;
  message?: string;
  testedAt: string | Date;
  details?: Record<string, unknown>;
}

export interface InitiateAuthRequest {
  credentials?: Record<string, string>;
  apiKey?: string;
  token?: string;
  redirectBaseUrl?: string;
}

export interface InitiateAuthResponse {
  success: boolean;
  authorizationUrl?: string | null;
  state?: string | null;
  message?: string | null;
}

export interface DiscoverResult {
  toolsCount: number;
  resourcesCount: number;
  promptsCount: number;
  timestamp: string;
}

export interface ToolExecutionResult {
  success: boolean;
  data?: unknown;
  error?: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}
