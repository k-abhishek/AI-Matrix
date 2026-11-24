import apiClient, { ApiError } from './client';
import type {
  ConnectorDefinition,
  ConnectorConnection,
  ConnectorTool,
  ConnectorResource,
  ConnectorPrompt,
  CatalogFilterQuery,
  CreateConnectionDto,
  UpdateConnectionDto,
  ConnectionHealthResult,
  InitiateAuthRequest,
  InitiateAuthResponse,
  DiscoverResult,
  ToolExecutionResult,
  ConnectRequestDto,
  ConnectResponse,
} from '../types';

// Generic wrapper returned by backend list/detail responses
interface ApiResponse<T> {
  data?: T;
  success?: boolean;
  message?: string;
}

export const connectorCatalogApi = {
  /** Fetch all connector definitions available in the platform catalog. */
  getCatalog: async (params?: CatalogFilterQuery): Promise<ConnectorDefinition[]> => {
    const queryParams: Record<string, string> = {};
    if (params?.type) queryParams.type = params.type;
    if (params?.search) queryParams.search = params.search;

    const res = await apiClient.get<ApiResponse<ConnectorDefinition[]>>('/connectors/catalog', {
      params: queryParams,
    });
    // Apply fallbacks for fields the backend may not yet send
    return (res.data || []).map(normalizeConnectorDef);
  },

  /** Fetch a single connector definition by unique key. */
  getByKey: async (key: string): Promise<ConnectorDefinition> => {
    const res = await apiClient.get<ApiResponse<ConnectorDefinition>>(`/connectors/catalog/${key}`);
    return normalizeConnectorDef(res.data!);
  },
};

/**
 * Apply fallbacks for new catalog fields that the backend may not yet return.
 * Keeps the frontend resilient against a partially-updated backend.
 */
function normalizeConnectorDef(def: ConnectorDefinition): ConnectorDefinition {
  return {
    ...def,
    isAvailable: def.isAvailable ?? true,
    oauthAvailable: def.oauthAvailable ?? false,
    requiresBaseUrl:
      def.requiresBaseUrl ?? (def.type === 'MCP' || def.type === 'CUSTOM_REST'),
    authFields: def.authFields ?? {},
    recommendedAuth: def.recommendedAuth ?? def.supportedAuth[0] ?? 'NONE',
  };
}

export const connectionApi = {
  /** List all connections configured for the current workspace. */
  list: async (): Promise<ConnectorConnection[]> => {
    const res = await apiClient.get<ApiResponse<ConnectorConnection[]>>('/connections');
    return res.data || [];
  },

  /** Get single connection details by ID. */
  getById: async (id: string): Promise<ConnectorConnection> => {
    const res = await apiClient.get<ApiResponse<ConnectorConnection>>(`/connections/${id}`);
    return res.data!;
  },

  /**
   * POST /api/connections/connect
   * Creates a connection. Returns either ConnectSuccessResponse (201) or
   * ConnectOAuthResponse (200 with authUrl).
   */
  connect: async (dto: ConnectRequestDto): Promise<ConnectResponse> => {
    // Try the new /connect endpoint first; fall back to /connections only on 404.
    try {
      const raw = await apiClient.post<ConnectResponse | ApiResponse<ConnectResponse>>(
        '/connections/connect',
        dto,
      );
      if (raw && typeof raw === 'object' && 'data' in raw && raw.data) {
        return raw.data;
      }
      return raw as ConnectResponse;
    } catch (err) {
      if (!(err instanceof ApiError) || err.status !== 404) {
        throw err;
      }
      // Legacy backend: POST /connections, then derive ConnectSuccessResponse shape
      const legacy: CreateConnectionDto = {
        name: dto.name ?? dto.connectorKey,
        connectorKey: dto.connectorKey,
        authType: dto.authType,
        baseUrl: dto.baseUrl,
        mcpTransport: dto.mcpTransport,
        credentials: dto.credentials,
      };
      const res = await apiClient.post<ApiResponse<ConnectorConnection>>('/connections', legacy);
      return { connection: res.data!, toolsCount: 0 } as ConnectResponse;
    }
  },

  /** Update existing connection configuration or status. */
  update: async (id: string, dto: UpdateConnectionDto): Promise<ConnectorConnection> => {
    const res = await apiClient.patch<ApiResponse<ConnectorConnection>>(`/connections/${id}`, dto);
    return res.data!;
  },

  /** Permanently delete a connection and all its credentials & discovered tools. */
  delete: async (id: string): Promise<{ success: boolean; message: string; id: string }> => {
    return apiClient.delete<{ success: boolean; message: string; id: string }>(`/connections/${id}`);
  },

  /** Initiate authentication: direct credentials or OAuth flow initiation. */
  initiateAuth: async (id: string, req?: InitiateAuthRequest): Promise<InitiateAuthResponse> => {
    return apiClient.post<InitiateAuthResponse>(`/connections/${id}/auth`, req || {});
  },

  /** Trigger health check and latency ping against connection. */
  test: async (id: string): Promise<ConnectionHealthResult> => {
    const res = await apiClient.post<ApiResponse<ConnectionHealthResult>>(`/connections/${id}/test`);
    return res.data!;
  },

  /** Trigger tool, resource, and prompt discovery against remote server. */
  discover: async (id: string): Promise<DiscoverResult> => {
    const res = await apiClient.post<ApiResponse<DiscoverResult>>(`/connections/${id}/discover`);
    return res.data!;
  },

  /** Get discovered tools for a connection. */
  getTools: async (id: string): Promise<ConnectorTool[]> => {
    const res = await apiClient.get<ApiResponse<ConnectorTool[]>>(`/connections/${id}/tools`);
    return res.data || [];
  },

  /** Get discovered resources for a connection. */
  getResources: async (id: string): Promise<ConnectorResource[]> => {
    const res = await apiClient.get<ApiResponse<ConnectorResource[]>>(`/connections/${id}/resources`);
    return res.data || [];
  },

  /** Get discovered prompts for a connection. */
  getPrompts: async (id: string): Promise<ConnectorPrompt[]> => {
    const res = await apiClient.get<ApiResponse<ConnectorPrompt[]>>(`/connections/${id}/prompts`);
    return res.data || [];
  },

  /** Execute a tool on the connection in a live sandbox test. */
  executeTool: async (
    id: string,
    toolName: string,
    parameters: Record<string, unknown> = {},
  ): Promise<ToolExecutionResult> => {
    const res = await apiClient.post<ApiResponse<ToolExecutionResult>>(
      `/connections/${id}/execute`,
      { toolName, parameters },
    );
    return (res.data || res) as ToolExecutionResult;
  },
};
