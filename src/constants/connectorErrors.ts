/**
 * Connector error-code → user-friendly message map.
 * Used by the Connect modal and the OAuth return handler.
 * All messages are static strings – never inserted raw from the URL.
 */
export const CONNECTOR_ERROR_MESSAGES: Record<string, string> = {
  VALIDATION_ERROR:
    'The information you entered is invalid. Please check each field and try again.',
  INVALID_CREDENTIALS:
    'Authentication failed. Please verify your credentials.',
  BASE_URL_BLOCKED:
    'The base URL provided points to a restricted or private address.',
  BASE_URL_UNREACHABLE:
    'Could not resolve or connect to the provided base URL.',
  OAUTH_NOT_CONFIGURED:
    'OAuth is not configured on the backend. Please use an API Token.',
  DISCOVERY_FAILED:
    'The connection was saved but tool discovery failed. Try syncing tools from the Connections tab.',
  ACCESS_DENIED:
    'Access was denied. Please grant the requested permissions to connect.',
  OAUTH_EXCHANGE_FAILED:
    'Could not complete OAuth token exchange. Please try again.',
  SESSION_EXPIRED:
    'Your OAuth session expired. Please try connecting again.',
  UNKNOWN:
    'An unexpected error occurred. Please try again or contact support.',
};

export type ConnectorErrorCode = keyof typeof CONNECTOR_ERROR_MESSAGES;

/**
 * Returns a friendly message for a backend error code.
 * Always returns a safe static string – never echoes raw URL params.
 */
export function getFriendlyErrorMessage(code?: string | null): string {
  if (!code) return CONNECTOR_ERROR_MESSAGES.UNKNOWN;
  return CONNECTOR_ERROR_MESSAGES[code] ?? CONNECTOR_ERROR_MESSAGES.UNKNOWN;
}

/** Tab identifiers used in the URL ?tab= param */
export type ConnectorTab = 'connectors' | 'connections';
export const DEFAULT_TAB: ConnectorTab = 'connectors';
