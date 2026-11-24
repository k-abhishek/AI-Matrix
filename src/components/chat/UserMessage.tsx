import React from "react";
import { ChatMessage } from "../../types";
import { cn } from "../../utils";

export interface UserMessageProps {
  message: ChatMessage;
  className?: string;
}

export const UserMessage: React.FC<UserMessageProps> = ({
  message,
  className,
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl text-sm transition-all bg-primary text-primary-foreground ml-auto w-fit max-w-xl shadow-sm",
        className,
      )}
    >
      <div className="w-fit max-w-full min-w-0 overflow-hidden rounded-3xl border border-transparent px-3 py-2.5 text-sm leading-relaxed wrap-break-word group-data-[align=end]/bubble:self-end [button]:text-left [button,a]:transition-colors [button,a]:outline-none [button,a]:focus-visible:border-ring [button,a]:focus-visible:ring-3 [button,a]:focus-visible:ring-ring/30 space-y-2">
        {message.content}
      </div>
    </div>
  );
};
