import React from "react";
import { ExternalLink, Grip } from "lucide-react";
import { ChatMessage } from "../../types";
import { cn } from "../../utils";
import { MarkdownRenderer } from "./MarkdownRenderer";

export interface AssistantMessageProps {
  message: ChatMessage;
  className?: string;
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  message,
  className,
}) => {
  return (
    <div
      className={cn(
        "p-4 rounded-2xl text-sm transition-all text-foreground mr-auto w-fit max-w-5xl",
        className,
      )}
    >
      <div className="flex gap-2">
        <Grip className="h-6 w-6 flex-shrink-0 mt-0.5" />
        <div>
          {message.content ? (
            <MarkdownRenderer content={message.content} />
          ) : (
            <div className="flex items-center space-x-2 text-muted-foreground py-1">
              <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
              <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
              <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
            </div>
          )}

          {message.citations && message.citations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/40 flex flex-wrap gap-2 items-center">
              <span className="text-xs font-medium text-muted-foreground">
                Sources:
              </span>
              {message.citations.map((c, ci) => (
                <a
                  key={ci}
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={c.snippet || c.url}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-muted/80 hover:bg-muted text-foreground border border-border/50 transition-colors"
                >
                  <ExternalLink className="h-3 w-3 text-primary" />
                  <span className="max-w-[180px] truncate">
                    {c.title || c.url}
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>  
      </div>
    </div>
  );
};
