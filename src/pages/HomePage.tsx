import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { toast } from "sonner";
import PromptInput from "../components/PromptInput";
import { useChatStore } from "../store";
import { chatApi } from "../api";
import CalendarCard from "@/components/home/CalendarCard";
import EventCard from "@/components/home/EventCard";
import PriorityCard from "@/components/home/PriorityCard";

const HomePage: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const navigate = useNavigate();
  const { clearCurrentChat, addChat, setCurrentChat } = useChatStore();

  const handleSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isStartingChat) return;

    setIsStartingChat(true);
    try {
      const initResult = await chatApi.initChat({
        prompt: trimmed,
        agentId: selectedAgentId || undefined,
      });

      const userMessage = {
        role: "user" as const,
        content: trimmed,
        createdAt: new Date(),
      };
      const assistantPlaceholder = {
        role: "assistant" as const,
        content: "",
        createdAt: new Date(),
      };

      clearCurrentChat();
      addChat({
        chatId: initResult.chatId,
        title: initResult.title || trimmed.replace(/\s+/g, " ").slice(0, 50),
        agentId: initResult.agentId ?? selectedAgentId,
        agentVersionId: initResult.agentVersionId ?? null,
        messages: [userMessage],
      });
      setCurrentChat(initResult.chatId, [userMessage, assistantPlaceholder]);

      navigate(`/chat/${initResult.chatId}`, {
        state: {
          autoStream: true,
          prompt: trimmed,
          agentId: initResult.agentId ?? selectedAgentId ?? undefined,
        },
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start conversation.";
      toast.error(message);
      console.error("Failed to initialize chat:", err);
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      {/* Hero Header */}
      <motion.h1
        initial={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25 }}
        className="text-center text-2xl leading-normal font-medium lg:text-4xl mb-10 backdrop-blur-md"
      >
        Good Evening, Abhishek
        <br />
        How can I{" "}
        <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
          help you today?
        </span>
      </motion.h1>

      {/* Prompt Input Box */}
      <div className="bg-sidebar/30 w-full max-w-2xl rounded-2xl p-1 pt-0 text-left backdrop-blur-md">
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground">
          <span>you can show any notification here</span>
          <span>•</span>
          <a
            className="hover:underline font-medium text-foreground"
            href="#upgrade"
          >
            Action Item
          </a>
        </div>

        <motion.div
          layoutId="shared-prompt-input"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <PromptInput
            className="border border-input/60 bg-background shadow-sm"
            value={prompt}
            disabled={isStartingChat}
            selectedAgentId={selectedAgentId}
            onAgentChange={setSelectedAgentId}
            onChange={(val) => setPrompt(val)}
            onSubmit={handleSend}
          />
        </motion.div>
      </div>

      {/* Dashboard Cards Grid */}
      <div className="mt-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-4 items-start">
        {/* Priority card — height sized to show exactly 5 task rows */}
        <div className="h-[464px]">
          <PriorityCard />
        </div>
        {/* Right column — Calendar + Event stacked, total height matches Priority card */}
        <div className="flex flex-col gap-4 h-[464px]">
          <CalendarCard />
          <EventCard />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
