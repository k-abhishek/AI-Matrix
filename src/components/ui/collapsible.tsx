import * as React from "react";
import { cn } from "../../utils/cn";

interface CollapsibleContextValue {
  open: boolean;
  onOpenToggle: () => void;
  disabled?: boolean;
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | undefined>(undefined);

export function useCollapsible() {
  const context = React.useContext(CollapsibleContext);
  if (!context) {
    throw new Error("useCollapsible must be used within a Collapsible");
  }
  return context;
}

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
}

export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  (
    {
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      disabled = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : uncontrolledOpen;

    const onOpenToggle = React.useCallback(() => {
      if (disabled) return;
      const nextOpen = !open;
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    }, [disabled, isControlled, open, onOpenChange]);

    return (
      <CollapsibleContext.Provider value={{ open, onOpenToggle, disabled }}>
        <div
          ref={ref}
          data-state={open ? "open" : "closed"}
          className={cn("", className)}
          {...props}
        >
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);
Collapsible.displayName = "Collapsible";

export interface CollapsibleTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

export const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  CollapsibleTriggerProps
>(({ className, children, asChild, onClick, ...props }, ref) => {
  const { open, onOpenToggle, disabled } = useCollapsible();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e);
    if (!e.defaultPrevented) {
      onOpenToggle();
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: (e: React.MouseEvent<any>) => {
        (children.props as any)?.onClick?.(e);
        if (!e.defaultPrevented) {
          onOpenToggle();
        }
      },
      "data-state": open ? "open" : "closed",
      "aria-expanded": open,
      disabled: disabled || (children.props as any)?.disabled,
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      data-state={open ? "open" : "closed"}
      aria-expanded={open}
      disabled={disabled}
      onClick={handleClick}
      className={cn("", className)}
      {...props}
    >
      {children}
    </button>
  );
});
CollapsibleTrigger.displayName = "CollapsibleTrigger";

export interface CollapsibleContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  CollapsibleContentProps
>(({ className, children, ...props }, ref) => {
  const { open } = useCollapsible();

  if (!open) return null;

  return (
    <div
      ref={ref}
      data-state={open ? "open" : "closed"}
      className={cn("overflow-hidden transition-all animate-in fade-in-0 duration-200", className)}
      {...props}
    >
      {children}
    </div>
  );
});
CollapsibleContent.displayName = "CollapsibleContent";

