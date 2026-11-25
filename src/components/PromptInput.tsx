import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Plus,
  Globe,
  Bot,
  ChevronDown,
  Lock,
  Mic,
  ArrowUp,
  MessageSquare,
  Search,
} from "lucide-react";
import { cn } from "../utils/cn";
import { agentApi } from "../api";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import type { AgentDTO } from "../types";

export type PromptMode = "chat" | "search";

export interface PromptInputProps {
  className?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  mode?: PromptMode;
  defaultMode?: PromptMode;
  selectedAgentId?: string | null;
  agentLocked?: boolean;
  onAgentChange?: (agentId: string | null) => void;
  onModeChange?: (mode: PromptMode) => void;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  className,
  value,
  defaultValue = "",
  placeholder = "Ask me anything...",
  disabled = false,
  mode: controlledMode,
  defaultMode = "chat",
  selectedAgentId: controlledAgentId,
  agentLocked = false,
  onAgentChange,
  onModeChange,
  onChange,
  onSubmit,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [internalMode, setInternalMode] = useState<PromptMode>(defaultMode);
  const [internalAgentId, setInternalAgentId] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const isAgentControlled = controlledAgentId !== undefined;
  const currentAgentId = isAgentControlled ? controlledAgentId : internalAgentId;

  const { data: agents = [] } = useQuery<AgentDTO[]>({
    queryKey: ["agents", "ACTIVE"],
    queryFn: () => agentApi.list({ status: "ACTIVE" }),
    staleTime: 60_000,
    retry: false,
  });

  const publishedAgents = agents.filter((a) => Boolean(a.activeVersionId));
  const selectableAgents = publishedAgents.length > 0 ? publishedAgents : agents;
  const selectedAgent = selectableAgents.find((a) => a.id === currentAgentId) ?? null;

  const handleSelectAgent = (nextAgentId: string | null) => {
    if (agentLocked) return;
    if (!isAgentControlled) {
      setInternalAgentId(nextAgentId);
    }
    onAgentChange?.(nextAgentId);
  };

  const isControlled = value !== undefined;
  const currentPrompt = isControlled ? value : internalValue;

  const isModeControlled = controlledMode !== undefined;
  const currentMode = isModeControlled ? controlledMode : internalMode;

  const handleModeToggle = (newMode: PromptMode) => {
    if (!isModeControlled) {
      setInternalMode(newMode);
    }
    onModeChange?.(newMode);
  };

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    requestAnimationFrame(() => {
      textarea.style.height = "auto";
      const maxHeight = 200; // max height in px before vertical scroll kicks in
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textarea.style.overflowY = scrollHeight > maxHeight ? "auto" : "hidden";
    });
  };

  useEffect(() => {
    adjustHeight();
  }, [currentPrompt]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmedPrompt = currentPrompt.trim();
    if (!trimmedPrompt || disabled) return;

    if (currentMode === "search") {
      navigate(`/search?q=${encodeURIComponent(trimmedPrompt)}`);
    } else {
      onSubmit?.(currentPrompt);
    }

    if (!isControlled) {
      setInternalValue("");
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }
  };

  const computedPlaceholder =
    placeholder !== "Ask me anything..."
      ? placeholder
      : currentMode === "search"
        ? "Search anything..."
        : "Ask me anything...";

  return (
    <div
      className={cn("rounded-2xl w-full shadow-sm", className)}
    >
      <textarea
        ref={textareaRef}
        value={currentPrompt}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex w-full resize-none border-none bg-transparent px-4 py-3.5 text-base md:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-0 min-h-[52px] max-h-[200px] overflow-y-hidden disabled:opacity-50"
        rows={1}
        placeholder={computedPlaceholder}
      />

      <div className="flex items-center justify-between gap-2 p-2 pt-0">
        <div className="flex items-center gap-2">
          <label
            htmlFor="file-upload"
            className="hover:bg-muted text-muted-foreground hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
            title="Attach file"
          >
            {/* <input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
              disabled={disabled}
            /> */}
            <Plus className="h-4 w-4" />
          </label>

          {/* Mode Toggle Switch */}
          <div className="inline-flex items-center rounded-full bg-muted/60 p-0.5 border border-border/40 text-xs select-none">
            <button
              type="button"
              onClick={() => handleModeToggle("chat")}
              disabled={disabled}
              className={cn(
                "relative flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors outline-none",
                currentMode === "chat"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {currentMode === "chat" && (
                <motion.div
                  layoutId="prompt-mode-indicator"
                  className="absolute inset-0 rounded-full bg-background shadow-sm border border-border/40"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <MessageSquare className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10 text-xs">Chat</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeToggle("search")}
              disabled={disabled}
              className={cn(
                "relative flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors outline-none",
                currentMode === "search"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {currentMode === "search" && (
                <motion.div
                  layoutId="prompt-mode-indicator"
                  className="absolute inset-0 rounded-full bg-background shadow-sm border border-border/40"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
              <Search className="relative z-10 h-3.5 w-3.5" />
              <span className="relative z-10 text-xs">Search</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentMode === "chat" && (
            <Select
              value={currentAgentId ?? "__default__"}
              onValueChange={(val) =>
                handleSelectAgent(val === "__default__" ? null : val)
              }
              disabled={disabled || agentLocked}
            >
              <SelectTrigger
                hideIcon
                aria-label="Select agent"
                title={
                  agentLocked
                    ? "Agent is pinned for this conversation"
                    : "Select an agent (defaults to platform assistant)"
                }
                className={cn(
                  "h-auto rounded-full border border-input bg-transparent hover:bg-accent hover:text-accent-foreground px-2.5 py-1 text-xs shadow-none focus:ring-1",
                  (disabled || agentLocked) && "opacity-70 cursor-not-allowed",
                )}
              >
                <span className="flex items-center gap-1.5">
                  {selectedAgent ? (
                    <Bot className="h-3.5 w-3.5 text-primary shrink-0" />
                  ) : (
                    <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="hidden sm:inline max-w-[140px] truncate">
                    <SelectValue placeholder="Default Agent">
                      {selectedAgent ? selectedAgent.name : "Default Agent"}
                    </SelectValue>
                  </span>
                  {agentLocked ? (
                    <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  )}
                </span>
              </SelectTrigger>

              <SelectContent side="top" align="end" className="w-64">
                <SelectGroup>
                  <SelectLabel>Select Agent</SelectLabel>
                  <SelectItem value="__default__">
                    <span className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>Default Agent</span>
                    </span>
                  </SelectItem>
                </SelectGroup>

                {selectableAgents.length > 0 && <SelectSeparator />}

                <SelectGroup>
                  {selectableAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <span className="flex items-center justify-between gap-2 w-full">
                        <span className="flex items-center gap-2 min-w-0">
                          <Bot className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{agent.name}</span>
                        </span>
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground shrink-0">
                          {agent.visibility === "WORKSPACE" ? "Team" : "Personal"}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors outline-none"
            title="Voice input"
          >
            <Mic className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!currentPrompt.trim() || disabled}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed outline-none"
            title={currentMode === "search" ? "Search" : "Send message"}
          >
            {currentMode === "search" ? (
              <Search className="h-4 w-4" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
