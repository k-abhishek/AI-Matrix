import { fetchEventSource, type EventSourceMessage } from '@microsoft/fetch-event-source';
import apiClient from './client';
import type {
  ApiResponse,
  AgentRunDTO,
  AgentExecutionEventDTO,
  ApprovalRequiredPayload,
  ConnectionIssuePayload,
  SkillLoadPayload,
  AgentStatusPhase,
  IChatCitation,
  IToolCall,
} from '../types';

export interface StreamChatCallbacks {
  onInit?: (data: {
    chatId: string;
    runId?: string;
    agentId?: string;
    agentVersionId?: string;
  }) => void;
  onStatus?: (data: {
    status: AgentStatusPhase | string;
    taskName?: string;
    tool?: string;
  }) => void;
  onToken?: (chunk: string) => void;
  onSkillLoad?: (data: SkillLoadPayload) => void;
  onToolStart?: (data: { tool: string; taskName?: string; input: any }) => void;
  onToolEnd?: (data: {
    tool: string;
    taskName?: string;
    output?: unknown;
    citations?: IChatCitation[];
  }) => void;
  onApprovalRequired?: (data: ApprovalRequiredPayload) => void;
  onConnectionIssue?: (data: ConnectionIssuePayload) => void;
  onDone?: (data: {
    chatId: string;
    runId?: string;
    message: string;
    toolCalls?: IToolCall[];
    citations?: IChatCitation[];
  }) => void;
  onError?: (error: Error) => void;
}

/**
 * Shared SSE event dispatcher for chat, agent streaming, and HITL approval resumption.
 */
export function dispatchSseEvent(event: EventSourceMessage, callbacks: StreamChatCallbacks): void {
  if (!event.data) return;
  try {
    const parsed = JSON.parse(event.data);
    switch (event.event) {
      case 'init':
        callbacks.onInit?.(parsed);
        break;
      case 'status':
        callbacks.onStatus?.(parsed);
        break;
      case 'token':
        if (parsed.chunk) {
          callbacks.onToken?.(parsed.chunk);
        }
        break;
      case 'skill_load':
        callbacks.onSkillLoad?.(parsed);
        break;
      case 'tool_start':
        callbacks.onToolStart?.(parsed);
        break;
      case 'tool_end':
        callbacks.onToolEnd?.(parsed);
        break;
      case 'approval_required':
        callbacks.onApprovalRequired?.(parsed);
        break;
      case 'connection_issue':
        callbacks.onConnectionIssue?.(parsed);
        break;
      case 'done':
        callbacks.onDone?.(parsed);
        break;
      case 'error':
        callbacks.onError?.(new Error(parsed.error || parsed.message || 'Streaming error'));
        break;
    }
  } catch (err) {
    console.error('Failed to parse SSE event data:', event.data, err);
  }
}

/**
 * Opens an SSE connection using fetchEventSource with consistent error handling.
 */
export async function openSseStream(
  path: string,
  options: { method: 'GET' | 'POST'; body?: unknown },
  callbacks: StreamChatCallbacks,
  signal?: AbortSignal
): Promise<void> {
  const url = apiClient.getUrl(path);
  const headers = await apiClient.getAuthHeaders();

  await fetchEventSource(url, {
    method: options.method,
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal,
    async onopen(response) {
      if (
        response.ok &&
        response.headers.get('content-type')?.includes('text/event-stream')
      ) {
        return;
      }
      let errorMsg = `Server responded with ${response.status}: ${response.statusText}`;
      try {
        const errData = await response.json();
        const nestedMsg =
          typeof errData?.error === 'object' ? errData.error?.message : errData?.error;
        if (nestedMsg || errData?.message) {
          errorMsg = nestedMsg || errData.message;
        }
      } catch {
        // ignore JSON parse failure
      }
      throw new Error(errorMsg);
    },
    onmessage(event) {
      dispatchSseEvent(event, callbacks);
    },
    onerror(err) {
      callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
      // Rethrow so fetchEventSource does not enter an infinite reconnect loop
      throw err;
    },
  });
}

export const runApi = {
  listAgentRuns: async (agentId: string, chatId?: string): Promise<AgentRunDTO[]> => {
    const res = await apiClient.get<ApiResponse<AgentRunDTO[]>>(`/agents/${agentId}/runs`, {
      params: chatId ? { chatId } : undefined,
    });
    return res.data || [];
  },

  inspectRun: async (
    runId: string
  ): Promise<{ run: AgentRunDTO; events: AgentExecutionEventDTO[]; toolLogs: unknown[] }> => {
    const res = await apiClient.get<
      ApiResponse<{ run: AgentRunDTO; events: AgentExecutionEventDTO[]; toolLogs: unknown[] }>
    >(`/agents/runs/${runId}`);
    return res.data!;
  },

  /**
   * Streams an agent execution turn via POST /api/agents/:agentId/stream.
   */
  streamAgent: async (
    agentId: string,
    body: { prompt: string; chatId?: string; connectionIds?: string[] },
    callbacks: StreamChatCallbacks,
    signal?: AbortSignal
  ): Promise<void> => {
    await openSseStream(
      `/agents/${agentId}/stream`,
      { method: 'POST', body },
      callbacks,
      signal
    );
  },

  /**
   * Resolves a pending HITL approval and streams the resumed agent turn over SSE.
   */
  resolveApprovalStream: async (
    approvalId: string,
    approved: boolean,
    callbacks: StreamChatCallbacks,
    signal?: AbortSignal
  ): Promise<void> => {
    await openSseStream(
      `/agents/approvals/${approvalId}/resolve`,
      { method: 'POST', body: { approved } },
      callbacks,
      signal
    );
  },
};

export default runApi;
