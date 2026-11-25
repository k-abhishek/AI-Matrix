import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import PromptInput from "../components/PromptInput";
import { AssistantMessage, UserMessage } from "../components/chat";
import Skeleton from "../components/ui/Skeleton";
import { useChatStore } from "../store";
import { chatApi, runApi, type StreamChatCallbacks } from "../api";

const ChatMessageSkeleton: React.FC = () => (
  <div
    className="space-y-6 py-4 w-full"
    aria-busy="true"
    aria-label="Loading conversation"
  >
    <div className="ml-auto w-fit max-w-lg space-y-2 p-4 rounded-2xl bg-primary/10">
      <Skeleton className="h-4 w-40 rounded bg-primary/20" />
      <Skeleton className="h-3.5 w-24 rounded bg-primary/15" />
    </div>
    <div className="mr-auto w-full max-w-2xl space-y-3 p-4 rounded-2xl bg-muted border border-border/40">
      <Skeleton className="h-4 w-3/4 rounded bg-muted-foreground/20" />
      <Skeleton className="h-4 w-5/6 rounded bg-muted-foreground/20" />
      <Skeleton className="h-4 w-1/2 rounded bg-muted-foreground/20" />
    </div>
  </div>
);

const ChatPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    chatList,
    messages,
    currentChatId,
    setCurrentChat,
    setCurrentChatId,
    addMessage,
    appendStreamChunk,
    updateLastMessage,
    addStatusStep,
    completeStatusSteps,
    addChat,
    clearCurrentChat,
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isResolvingApproval, setIsResolvingApproval] = useState(false);
  const [isFetchingThread, setIsFetchingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const skipNextFetchRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const autoStreamHandledRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeThread = chatList.find((c) => c.chatId === (chatId || currentChatId));
  const pinnedAgentId = activeThread?.agentId ?? selectedAgentId;

  // Clean up any pending abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // Auto scroll smoothly to bottom whenever messages change, deferring to rAF to avoid forced reflows on mount
  useEffect(() => {
    if (isFetchingThread) return;
    const frameId = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frameId);
  }, [messages.length, isLoading, isFetchingThread]);

  const buildStreamCallbacks = useCallback(
    (abortSignal: AbortSignal): StreamChatCallbacks => ({
      onStatus: (data) => {
        if (data.taskName) {
          addStatusStep(data.taskName, "in_progress");
        } else if (data.status === "searching_kb") {
          addStatusStep("Searching knowledge base...", "in_progress");
        } else if (data.tool) {
          addStatusStep(`Using ${data.tool}...`, "in_progress");
        } else {
          addStatusStep("Thinking...", "in_progress");
        }
      },
      onToken: (chunk) => {
        completeStatusSteps("completed");
        appendStreamChunk(chunk);
      },
      onSkillLoad: (data) => {
        addStatusStep(`Loaded skill: ${data.skillName}`, "completed", data.skillKey);
      },
      onToolStart: (data) => {
        if (data.tool === "search_knowledge_base") {
          addStatusStep("Searching knowledge base...", "in_progress");
        } else {
          addStatusStep(data.taskName || `Using ${data.tool}...`, "in_progress");
        }
      },
      onToolEnd: (data) => {
        completeStatusSteps("completed");
        if (data.citations && data.citations.length > 0) {
          updateLastMessage({ citations: data.citations });
        }
      },
      onApprovalRequired: (data) => {
        completeStatusSteps("completed");
        addStatusStep(`Waiting for approval: ${data.toolName}`, "in_progress");
        updateLastMessage({
          approval: { ...data, status: "PENDING" },
        });
      },
      onConnectionIssue: (data) => {
        completeStatusSteps("error");
        updateLastMessage({ connectionIssue: data });
      },
      onDone: (data) => {
        completeStatusSteps("completed");
        updateLastMessage({
          ...(data.message ? { content: data.message } : {}),
          ...(data.toolCalls && data.toolCalls.length > 0 ? { toolCalls: data.toolCalls } : {}),
          ...(data.citations && data.citations.length > 0 ? { citations: data.citations } : {}),
        });
      },
      onError: (err) => {
        if (abortSignal.aborted) return;
        completeStatusSteps("error");
        const message =
          err instanceof Error
            ? err.message
            : "Failed to stream message. Please try again.";
        setError(message);
        console.error("Error streaming chat response:", err);
      },
    }),
    [appendStreamChunk, updateLastMessage, addStatusStep, completeStatusSteps],
  );

  const startPendingStreamForChat = useCallback(
    async (targetChatId: string, initialPrompt?: string, initialAgentId?: string | null) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsLoading(true);
      setError(null);
      addStatusStep("Thinking...", "in_progress");

      try {
        await chatApi.streamMessage(
          {
            chatId: targetChatId,
            prompt: initialPrompt || "",
            agentId: initialAgentId || undefined,
          },
          buildStreamCallbacks(abortController.signal),
          abortController.signal,
        );
      } catch (err) {
        if (!abortController.signal.aborted) {
          completeStatusSteps("error");
          const message =
            err instanceof Error
              ? err.message
              : "Failed to stream message. Please try again.";
          setError(message);
          console.error("Error streaming chat:", err);
        }
      } finally {
        setIsLoading(false);
        completeStatusSteps("completed");
      }
    },
    [buildStreamCallbacks, addStatusStep, completeStatusSteps],
  );

  const handleResolveApproval = async (approvalId: string, approved: boolean) => {
    if (isResolvingApproval) return;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsResolvingApproval(true);
    setIsLoading(true);
    setError(null);
    addStatusStep(
      approved ? "Executing approved tool..." : "Tool rejected, continuing...",
      "in_progress",
    );

    updateLastMessage({
      approval: {
        ...(messages[messages.length - 1]?.approval as any),
        approvalId,
        status: approved ? "APPROVED" : "REJECTED",
      },
    });

    try {
      await runApi.resolveApprovalStream(
        approvalId,
        approved,
        buildStreamCallbacks(abortController.signal),
        abortController.signal,
      );
    } catch (err) {
      if (!abortController.signal.aborted) {
        const message =
          err instanceof Error ? err.message : "Failed to resolve approval.";
        setError(message);
      }
    } finally {
      setIsResolvingApproval(false);
      setIsLoading(false);
      completeStatusSteps("completed");
    }
  };

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || isFetchingThread) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    addMessage({
      role: "user",
      content: trimmed,
      createdAt: new Date(),
    });
    addMessage({
      role: "assistant",
      content: "",
      statusSteps: [
        { id: `${Date.now()}-0`, taskName: "Thinking...", status: "in_progress" },
      ],
      createdAt: new Date(),
    });

    setIsLoading(true);
    setError(null);
    setPrompt("");

    try {
      if (!chatId) {
        // Brand-new conversation from /chat: init via POST /api/chat, populate URL, then stream
        const initRes = await chatApi.initChat({
          prompt: trimmed,
          agentId: selectedAgentId || undefined,
        });
        skipNextFetchRef.current = initRes.chatId;
        addChat({
          chatId: initRes.chatId,
          title: initRes.title || trimmed.replace(/\s+/g, " ").slice(0, 50),
          agentId: initRes.agentId ?? selectedAgentId,
          agentVersionId: initRes.agentVersionId ?? null,
          messages: [{ role: "user", content: trimmed, createdAt: new Date() }],
        });
        setCurrentChatId(initRes.chatId);
        navigate(`/chat/${initRes.chatId}`, { replace: true });

        await chatApi.streamMessage(
          {
            prompt: trimmed,
            chatId: initRes.chatId,
            agentId: (initRes.agentId ?? selectedAgentId) || undefined,
          },
          buildStreamCallbacks(abortController.signal),
          abortController.signal,
        );
      } else {
        await chatApi.streamMessage(
          {
            prompt: trimmed,
            chatId,
            agentId: pinnedAgentId || undefined,
          },
          buildStreamCallbacks(abortController.signal),
          abortController.signal,
        );
      }
    } catch (err) {
      if (!abortController.signal.aborted) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to stream message. Please try again.";
        setError(message);
        console.error("Error in chat streaming:", err);
      }
    } finally {
      setIsLoading(false);
      completeStatusSteps("completed");
    }
  };

  // Handle autoStream passed from HomePage after POST /api/chat -> navigate('/chat/:chatId')
  useEffect(() => {
    const state = location.state as {
      autoStream?: boolean;
      prompt?: string;
      agentId?: string;
    } | null;
    if (chatId && state?.autoStream && autoStreamHandledRef.current !== chatId) {
      autoStreamHandledRef.current = chatId;
      skipNextFetchRef.current = chatId;
      window.history.replaceState({}, document.title);
      const fallbackPrompt =
        state.prompt ||
        [...messages].reverse().find((m) => m.role === "user")?.content ||
        "";
      startPendingStreamForChat(chatId, fallbackPrompt, state.agentId ?? pinnedAgentId);
    }
  }, [chatId, location.state, startPendingStreamForChat, messages, pinnedAgentId]);

  // When chatId changes, fetch messages for that thread and update the chatscreen
  useEffect(() => {
    if (!chatId) {
      clearCurrentChat();
      setError(null);
      setIsFetchingThread(false);
      return;
    }

    const state = location.state as { autoStream?: boolean } | null;
    if (state?.autoStream || autoStreamHandledRef.current === chatId) {
      setIsFetchingThread(false);
      return;
    }

    if (skipNextFetchRef.current === chatId) {
      skipNextFetchRef.current = null;
      setIsFetchingThread(false);
      return;
    }

    if (currentChatId === chatId && messages.length > 0) {
      setIsFetchingThread(false);
      return;
    }

    let isCurrent = true;
    setIsFetchingThread(true);
    setError(null);

    const loadThread = async () => {
      try {
        const chatThread = await chatApi.getChatById(chatId);
        if (isCurrent && chatThread) {
          setCurrentChat(chatThread.chatId, chatThread.messages || []);
        }
      } catch (err) {
        if (isCurrent) {
          const errorMessage =
            err instanceof Error
              ? err.message
              : "Failed to load chat messages.";
          setError(errorMessage);
          console.error("Error fetching chat thread:", err);
        }
      } finally {
        if (isCurrent) {
          setIsFetchingThread(false);
        }
      }
    };

    loadThread();

    return () => {
      isCurrent = false;
    };
  }, [chatId, setCurrentChat, clearCurrentChat, location.state]);

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-7rem)] p-6 md:p-8 w-full max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="flex-1 overflow-y-auto space-y-4 scrollbar-none pb-4"
      >
        {isFetchingThread ? (
          <ChatMessageSkeleton />
        ) : (
          <>
            {messages.map((msg, index) =>
              msg.role === "assistant" ? (
                <AssistantMessage
                  key={msg._id || index}
                  message={msg}
                  onResolveApproval={handleResolveApproval}
                  isResolvingApproval={isResolvingApproval}
                />
              ) : (
                <UserMessage key={msg._id || index} message={msg} />
              ),
            )}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="bg-muted text-foreground mr-auto w-fit max-w-3xl rounded-2xl p-4 text-sm shadow-sm">
                <div className="flex items-center space-x-2 text-muted-foreground py-1">
                  <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
                {error}
              </div>
            )}

            {messages.length === 0 && !isLoading && !error && (
              <div className="text-muted-foreground text-center py-12">
                {chatId
                  ? "No messages found for this thread."
                  : "Start a new conversation by sending a prompt below."}
              </div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </motion.div>

      <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pt-4 mt-auto w-[90%] max-w-4xl mx-auto z-10">
        <motion.div
          layoutId="shared-prompt-input"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <PromptInput
            value={prompt}
            onChange={(val) => setPrompt(val)}
            onSubmit={handleSend}
            selectedAgentId={pinnedAgentId}
            agentLocked={Boolean(chatId)}
            onAgentChange={setSelectedAgentId}
            disabled={isLoading || isFetchingThread}
            className="border border-input/60 bg-background shadow-sm"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ChatPage;
