import React, { useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Trash2, Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";
import type { ChatThread } from "../../types";

export interface SidebarChatItemProps {
  chat: ChatThread;
  onNavigate?: () => void;
  onDelete: (chatId: string) => Promise<boolean | void> | void;
}

export const SidebarChatItem: React.FC<SidebarChatItemProps> = ({
  chat,
  onNavigate,
  onDelete,
}) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isActive = location.pathname === `/chat/${chat.chatId}`;

  // Close dropdown on click outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMenuOpen(false);
        buttonRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setIsDeleting(true);
      await onDelete(chat.chatId);
      setIsMenuOpen(false);
    } catch (err) {
      console.error("Failed to delete chat:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center justify-between rounded-md text-xs transition-colors outline-none",
        isActive
          ? "bg-accent text-accent-foreground font-medium shadow-2xs"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        isMenuOpen && "bg-accent/60"
      )}
    >
      <NavLink
        to={`/chat/${chat.chatId}`}
        onClick={onNavigate}
        title={chat.title || "Untitled Chat"}
        className="flex items-center gap-2 flex-1 min-w-0 px-2 py-1.5 outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring rounded-md"
      >
        <span className="truncate flex-1">
          {chat.title || "Untitled Chat"}
        </span>
        {isActive && !isMenuOpen && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary group-hover:hidden"
            aria-hidden="true"
          />
        )}
      </NavLink>

      {/* Delete Trigger (Trash Icon) */}
      <div className="relative shrink-0 flex items-center">
        <button
          ref={buttonRef}
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMenuOpen((prev) => !prev);
          }}
          aria-label={`Delete ${chat.title || "chat"}`}
          aria-expanded={isMenuOpen}
          aria-haspopup="dialog"
          disabled={isDeleting}
          className={cn(
            "p-1 mr-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring",
            isMenuOpen || isDeleting
              ? "opacity-100 text-destructive bg-destructive/10"
              : "opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-destructive" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Confirmation Dropdown Menu */}
        {isMenuOpen && (
          <div
            ref={menuRef}
            role="dialog"
            aria-label="Confirm chat deletion"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute right-0 top-full mt-1 z-50 w-48 rounded-lg border border-border bg-popover p-2.5 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-150"
          >
            <p className="text-xs font-medium text-foreground">Delete chat?</p>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
              This action cannot be undone.
            </p>
            <div className="mt-2.5 flex items-center justify-end gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
                disabled={isDeleting}
                className="px-2 py-1 text-xs rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-sidebar-ring disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-destructive disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SidebarChatItem;
