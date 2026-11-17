import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import PromptInput from "../components/PromptInput";
import { useChatStore } from "../store";
import CalendarCard from "@/components/home/CalendarCard";
import EventCard from "@/components/home/EventCard";
import PriorityCard from "@/components/home/PriorityCard";

const HomePage: React.FC = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();
  const { clearCurrentChat } = useChatStore();

  const handleSend = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    clearCurrentChat();
    navigate("/chat", { state: { initialPrompt: trimmed } });
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center w-full h-full p-6 text-center">
      {/* Hero Header */}

      <motion.h1
        initial={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.25 }}
        className="text-center text-2xl leading-normal font-medium lg:text-4xl mb-10"
      >
        Good Evening, Abhishek
        <br />
        How can I{" "}
        <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
          help you today?
        </span>
      </motion.h1>

      {/* Prompt Input Box */}
      <div className="bg-primary/10 w-full max-w-2xl rounded-2xl p-1 pt-0 text-left">
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
