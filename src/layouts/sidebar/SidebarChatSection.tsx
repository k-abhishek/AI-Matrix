import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MessageSquare, ChevronDown, Search, Plus } from "lucide-react";
import { cn } from "../../utils/cn";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "../../components/ui/collapsible";
import { Skeleton } from "../../components/ui/Skeleton";
import { SidebarChatItem } from "./SidebarChatItem";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../components/ui/tooltip";
import type { ChatThread } from "../../types";

export interface SidebarChatSectionProps {
  isCollapsed?: boolean;
  onNavigate?: () => void;
  onOpenSearch: () => void;
  chatList: ChatThread[];
  isLoading: boolean;
  onDeleteChat: (chatId: string) => Promise<boolean | void> | void;
  setIsCollapsed?: (isCollapsed: boolean) => void;
}

export const SidebarChatSection: React.FC<SidebarChatSectionProps> = ({
  isCollapsed = false,
  onNavigate,
  onOpenSearch,
  chatList,
  isLoading,
  onDeleteChat,
  setIsCollapsed,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(true);

  const isChatRoute = location.pathname.startsWith("/chat");
  const last10Conversations = chatList.slice(0, 10);

  const handleNewChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate("/");
    onNavigate?.();
  };

  const handleOpenSearch = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenSearch();
  };

  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => {
              setIsCollapsed?.(false);
            }}
            aria-current={isChatRoute ? "page" : undefined}
            className={cn(
              "group relative flex items-center justify-center rounded-lg text-sm transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring h-10 w-10 mx-auto",
              isChatRoute
                ? "bg-accent text-accent-foreground font-medium shadow-sm"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <MessageSquare
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105",
                isChatRoute
                  ? "text-accent-foreground"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
              aria-hidden="true"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Chat</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Collapsible
      defaultOpen={true}
      open={isChatOpen}
      onOpenChange={setIsChatOpen}
      className="w-full flex flex-col"
    >
      <div
        className={cn(
          "group relative flex items-center justify-between rounded-lg text-sm transition-all duration-200 outline-none h-10 w-full px-2.5",
          isChatRoute && location.pathname === "/chat"
            ? "bg-accent/40 text-foreground"
            : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2.5 flex-1 min-w-0 text-left outline-none cursor-pointer py-1.5"
          >
            <MessageSquare
              className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-105",
                isChatRoute
                  ? "text-accent-foreground"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />
            <span className="truncate tracking-tight text-sm ">Chat</span>
          </button>
        </CollapsibleTrigger>

        {/* Title Action Icons: Search & New Chat */}
        <div className="flex items-center gap-0.5 shrink-0 ml-1">
          <button
            type="button"
            onClick={handleOpenSearch}
            title="Search conversations"
            aria-label="Search conversations"
            className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring cursor-pointer"
          >
            <Search className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNewChat}
            title="New conversation"
            aria-label="New conversation"
            className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-muted-foreground/80 transition-transform duration-200",
              isChatOpen ? "rotate-0" : "-rotate-90",
            )}
          />
        </div>
      </div>

      <CollapsibleContent className="pl-4 pr-1 py-1 space-y-0.5 border-l border-border/50 ml-3.5 my-0.5 overflow-visible">
        {isLoading ? (
          <div className="space-y-1.5 py-1 px-1">
            <Skeleton className="h-6 w-full rounded-md" />
            <Skeleton className="h-6 w-5/6 rounded-md" />
            <Skeleton className="h-6 w-3/4 rounded-md" />
          </div>
        ) : last10Conversations.length > 0 ? (
          last10Conversations.map((chat) => (
            <SidebarChatItem
              key={chat.chatId}
              chat={chat}
              onNavigate={onNavigate}
              onDelete={onDeleteChat}
            />
          ))
        ) : (
          <div className="px-2 py-1.5 text-xs text-muted-foreground/80 italic">
            No conversations yet
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default SidebarChatSection;
