import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  RotateCcw,
  Send,
  Loader2,
  Bot,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import Skeleton from '../components/ui/Skeleton';
import ErrorMessage from '../components/ui/ErrorMessage';
import { AssistantMessage, UserMessage } from '../components/chat';
import AgentExecutionPanel, {
  type PlaygroundActivityEvent,
} from '../components/agents/AgentExecutionPanel';
import {
  useAgent,
  useAgentKnowledgeBases,
  useAccessibleKnowledgeBases,
  useAgentSkills,
  useAgentToolGrants,
} from '../hooks/useAgents';
import { useAuthContext } from '../context/AuthContext';
import { canManageAgent, getAgentModelLabel } from '../utils/agentHelpers';
import { runApi, type StreamChatCallbacks } from '../api';
import type { ChatMessage } from '../types';

export const AgentPlaygroundPage: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const auth = useAuthContext();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | undefined>(undefined);
  const [prompt, setPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isResolvingApproval, setIsResolvingApproval] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<PlaygroundActivityEvent[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const {
    data: agent,
    isLoading: isLoadingAgent,
    error: agentError,
    refetch: refetchAgent,
  } = useAgent(agentId);

  const { data: attachedKbs = [] } = useAgentKnowledgeBases(agentId);
  const { data: accessibleKbs = [] } = useAccessibleKnowledgeBases();
  const { data: attachedSkills = [] } = useAgentSkills(agentId);
  const { data: toolGrants = [] } = useAgentToolGrants(agentId);

  const kbNames = useMemo(() => {
    const map = new Map(accessibleKbs.map((k) => [k.id, k.name]));
    return attachedKbs.map((b) => map.get(b.knowledgeBaseId) || 'Knowledge Base');
  }, [attachedKbs, accessibleKbs]);

  const pushEvent = useCallback(
    (type: PlaygroundActivityEvent['type'], label: string, detail?: string) => {
      setEvents((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type,
          label,
          detail,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    []
  );

  const updateLastAssistant = useCallback((updater: (prev: ChatMessage) => ChatMessage) => {
    setMessages((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const idx = next.length - 1;
      next[idx] = updater(next[idx]);
      return next;
    });
  }, []);

  const buildCallbacks = useCallback(
    (signal: AbortSignal): StreamChatCallbacks => ({
      onInit: (data) => {
        if (data.chatId) setChatId(data.chatId);
        pushEvent('generating', 'Generating response');
      },
      onStatus: (data) => {
        if (data.status === 'searching_kb') {
          pushEvent('searching_kb', 'Searching knowledge', data.taskName);
        } else if (data.status === 'loading_skill') {
          pushEvent('skill_load', 'Loading skill', data.taskName);
        }
      },
      onSkillLoad: (data) => {
        pushEvent('skill_load', `Loaded skill: ${data.skillName}`, data.skillKey);
      },
      onToolStart: (data) => {
        if (data.tool === 'search_knowledge_base') {
          pushEvent('searching_kb', 'Searching knowledge base');
        } else {
          pushEvent('tool_start', `Executing tool: ${data.tool}`, data.taskName);
        }
      },
      onToolEnd: (data) => {
        pushEvent('tool_end', `Completed tool: ${data.tool}`, data.taskName);
        if (data.citations && data.citations.length > 0) {
          updateLastAssistant((m) => ({ ...m, citations: data.citations }));
        }
      },
      onApprovalRequired: (data) => {
        pushEvent('approval_required', `Waiting for approval: ${data.toolName}`);
        updateLastAssistant((m) => ({
          ...m,
          approval: { ...data, status: 'PENDING' },
        }));
      },
      onConnectionIssue: (data) => {
        pushEvent('failed', 'Connection required', data.message);
        updateLastAssistant((m) => ({ ...m, connectionIssue: data }));
      },
      onToken: (chunk) => {
        updateLastAssistant((m) => ({
          ...m,
          content: (m.content || '') + chunk,
        }));
      },
      onDone: (data) => {
        if (data.chatId) setChatId(data.chatId);
        pushEvent('completed', 'Completed');
        updateLastAssistant((m) => ({
          ...m,
          ...(data.message ? { content: data.message } : {}),
          ...(data.toolCalls?.length ? { toolCalls: data.toolCalls } : {}),
          ...(data.citations?.length ? { citations: data.citations } : {}),
        }));
      },
      onError: (err) => {
        if (signal.aborted) return;
        const msg = err instanceof Error ? err.message : 'Execution failed.';
        pushEvent('failed', 'Failed', msg);
        setError(msg);
      },
    }),
    [pushEvent, updateLastAssistant]
  );

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed || !agentId || isStreaming) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessages((prev) => [
      ...prev,
      { role: 'user', content: trimmed, createdAt: new Date() },
      { role: 'assistant', content: '', createdAt: new Date() },
    ]);
    setPrompt('');
    setError(null);
    setIsStreaming(true);

    try {
      await runApi.streamAgent(
        agentId,
        { prompt: trimmed, chatId },
        buildCallbacks(controller.signal),
        controller.signal
      );
    } catch (err) {
      if (!controller.signal.aborted) {
        const msg = err instanceof Error ? err.message : 'Failed to execute agent.';
        setError(msg);
        pushEvent('failed', 'Failed', msg);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleResolveApproval = async (approvalId: string, approved: boolean) => {
    if (isResolvingApproval) return;
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsResolvingApproval(true);
    setIsStreaming(true);
    setError(null);

    updateLastAssistant((m) => ({
      ...m,
      approval: m.approval
        ? { ...m.approval, approvalId, status: approved ? 'APPROVED' : 'REJECTED' }
        : undefined,
    }));

    try {
      await runApi.resolveApprovalStream(
        approvalId,
        approved,
        buildCallbacks(controller.signal),
        controller.signal
      );
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to resolve approval.');
      }
    } finally {
      setIsResolvingApproval(false);
      setIsStreaming(false);
    }
  };

  const handleNewConversation = () => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setChatId(undefined);
    setEvents([]);
    setError(null);
    setIsStreaming(false);
  };

  if (isLoadingAgent) {
    return (
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="h-[500px] lg:col-span-8 rounded-xl" />
          <Skeleton className="h-[500px] lg:col-span-4 rounded-xl" />
        </div>
      </div>
    );
  }

  if (agentError || !agent) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
        <ErrorMessage
          title="Failed to load agent"
          message={agentError instanceof Error ? agentError.message : 'Agent not found.'}
          onRetry={() => refetchAgent()}
        />
      </div>
    );
  }

  const canManage = canManageAgent(agent, auth);

  return (
    <div className="flex-1 flex flex-col p-6 md:p-8 max-w-7xl mx-auto w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate('/agents')}
            aria-label="Back to Agents"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">
              {agent.name} — Playground
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {agent.description || 'Test agent responses, knowledge retrieval, skills, and tools.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNewConversation}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Test Chat
          </Button>
          {canManage && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(`/agents/${agent.id}`)}
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit Agent
            </Button>
          )}
        </div>
      </div>

      {/* Main Split: Chat + Execution Activity */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[540px]">
        <div className="lg:col-span-8 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Test {agent.name}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Send a prompt below to stream a response and inspect tool calls, citations,
                  and skill usage.
                </p>
              </div>
            ) : (
              messages.map((msg, idx) =>
                msg.role === 'assistant' ? (
                  <AssistantMessage
                    key={idx}
                    message={msg}
                    onResolveApproval={handleResolveApproval}
                    isResolvingApproval={isResolvingApproval}
                  />
                ) : (
                  <UserMessage key={idx} message={msg} />
                )
              )
            )}

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="border-t border-border p-3 flex items-end gap-2 bg-background/60"
          >
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Message ${agent.name}...`}
              rows={2}
              disabled={isStreaming}
              className="resize-none text-sm"
            />
            <Button
              type="submit"
              disabled={!prompt.trim() || isStreaming}
              className="shrink-0"
              aria-label="Send message"
            >
              {isStreaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>

        <div className="lg:col-span-4">
          <AgentExecutionPanel
            agentName={agent.name}
            modelLabel={getAgentModelLabel(agent)}
            isPublished={Boolean(agent.activeVersionId)}
            kbNames={kbNames}
            skillCount={attachedSkills.length}
            toolCount={toolGrants.filter((g) => g.isEnabled).length}
            events={events}
            isRunning={isStreaming}
          />
        </div>
      </div>
    </div>
  );
};

export default AgentPlaygroundPage;
