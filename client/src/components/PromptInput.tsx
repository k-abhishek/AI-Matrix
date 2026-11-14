import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Globe, ChevronDown, Mic, ArrowUp } from "lucide-react";
import { cn } from "../utils/cn";

export interface PromptInputProps {
  className?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  className,
  value,
  defaultValue = "",
  placeholder = "Ask me anything...",
  disabled = false,
  onChange,
  onSubmit,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isControlled = value !== undefined;
  const currentPrompt = isControlled ? value : internalValue;

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
    if (!currentPrompt.trim() || disabled) return;
    onSubmit?.(currentPrompt);
    if (!isControlled) {
      setInternalValue("");
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.overflowY = "hidden";
    }
  };

  return (
    <div
      className={cn("rounded-2xl w-full overflow-hidden shadow-sm", className)}
    >
      <textarea
        ref={textareaRef}
        value={currentPrompt}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="flex w-full resize-none border-none bg-transparent px-4 py-3.5 text-base md:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-0 min-h-[52px] max-h-[200px] overflow-y-hidden disabled:opacity-50"
        rows={1}
        placeholder={placeholder}
      />

      <div className="flex items-center justify-between gap-2 p-3 pt-0">
        <div className="flex items-center gap-2">
          <label
            htmlFor="file-upload"
            className="hover:bg-muted text-muted-foreground hover:text-foreground flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-colors"
            title="Attach file"
          >
            <input
              type="file"
              multiple
              className="hidden"
              id="file-upload"
              disabled={disabled}
            />
            <Paperclip className="h-4 w-4" />
          </label>

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-full border border-input bg-transparent hover:bg-accent hover:text-accent-foreground px-2.5 py-1 text-xs transition-colors outline-none"
          >
            <Globe className="h-3.5 w-3.5 text-muted-foreground" />
            {/*TODO:  create a dropdown to select agent */}
            <span className="hidden sm:inline">Agent</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-2">
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
            title="Send message"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptInput;
