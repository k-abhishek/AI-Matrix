import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import PromptInput from "../components/PromptInput";
import { MarkdownRenderer } from "../components/chat";
import Skeleton from "../components/ui/Skeleton";
import { useChatStore } from "../store";
import { chatApi } from "../api";

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
    messages,
    currentChatId,
    setCurrentChat,
    setCurrentChatId,
    addMessage,
    addChat,
    clearCurrentChat,
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingThread, setIsFetchingThread] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const skipNextFetchRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const initialPromptHandledRef = useRef(false);

  // Auto scroll smoothly to bottom whenever messages change, deferring to rAF to avoid forced reflows on mount
  useEffect(() => {
    if (isFetchingThread) return;
    const frameId = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frameId);
  }, [messages.length, isLoading, isFetchingThread]);

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading || isFetchingThread) return;
    addMessage({
      role: "user",
      content: trimmed,
      createdAt: new Date(),
    });

    try {
      setIsLoading(true);
      setError(null);

      const response = await chatApi.sendMessage({
        prompt: trimmed,
        chatId,
      });

      addMessage({
        role: "assistant",
        content: response.message,
        createdAt: new Date(),
      });

      if (!chatId && response.chatId) {
        const title = trimmed.replace(/\s+/g, " ").slice(0, 50);
        skipNextFetchRef.current = response.chatId;
        addChat({
          chatId: response.chatId,
          title,
          messages: [
            { role: "user", content: trimmed, createdAt: new Date() },
            {
              role: "assistant",
              content: response.message,
              createdAt: new Date(),
            },
          ],
        });
        setCurrentChatId(response.chatId);
        navigate(`/chat/${response.chatId}`, { replace: true });
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to send message. Please try again.";
      setError(message);
      console.error("Error sending chat prompt:", err);
    } finally {
      setIsLoading(false);
      setPrompt("");
    }
  };

  // Handle initial prompt passed from HomePage transition
  useEffect(() => {
    const state = location.state as { initialPrompt?: string } | null;
    const initialPrompt = state?.initialPrompt;

    if (initialPrompt && !initialPromptHandledRef.current) {
      initialPromptHandledRef.current = true;
      window.history.replaceState({}, document.title);
      handleSend(initialPrompt);
    }
  }, [location.state]);

  // When chatId changes, fetch messages for that thread and update the chatscreen
  useEffect(() => {
    if (!chatId) {
      const state = location.state as { initialPrompt?: string } | null;
      if (state?.initialPrompt) {
        return;
      }
      clearCurrentChat();
      setError(null);
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
    <div className="flex-1 flex flex-col min-h-[calc(100vh-3.5rem)] p-6 md:p-8 w-full max-w-6xl mx-auto">
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
            {messages.map((msg, index) => (
              <div
                key={msg._id || index}
                className={`p-4 rounded-2xl text-sm transition-all ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground ml-auto w-fit max-w-xl shadow-sm"
                    : "text-foreground mr-auto w-fit max-w-5xl"
                }`}
              >
                <div className="text-xs font-semibold uppercase mb-1.5 opacity-70 tracking-wider">
                  {msg.role}
                </div>
                {msg.role === "assistant" ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="bg-muted text-foreground mr-auto w-fit max-w-3xl rounded-2xl p-4 text-sm shadow-sm">
                <div className="text-xs font-semibold uppercase mb-1.5 opacity-70 tracking-wider">
                  assistant
                </div>
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
            disabled={isLoading || isFetchingThread}
            className="border border-input/60 bg-background shadow-sm"
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ChatPage;
