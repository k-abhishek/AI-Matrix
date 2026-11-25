import React, { useState, useEffect } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  XCircle,
} from "lucide-react";
import { cn } from "../../utils/cn";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./collapsible";

export type StepStatus = "in_progress" | "completed" | "error";

export interface VerticalStepItem {
  id: string;
  taskName: string;
  status: StepStatus;
  detail?: string;
}

export interface VerticalStepperProps {
  steps: VerticalStepItem[];
  className?: string;
}

export const VerticalStepper: React.FC<VerticalStepperProps> = ({
  steps,
  className,
}) => {
  const hasActiveStep = steps.some((s) => s.status === "in_progress");
  //const hasErrorStep = steps.some((s) => s.status === "error");
  const [isOpen, setIsOpen] = useState(true);

  if (!steps || steps.length === 0) return null;

  const isAllDone = !hasActiveStep;
  const activeOrLastStep =
    steps.find((s) => s.status === "in_progress") || steps[steps.length - 1];

  useEffect(() => {
    if (isAllDone) {
      setIsOpen(false);
    }
  }, [isAllDone]);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("rounded-xl pr-3 pb-2.5 text-xs", className)}
    >
      {/* Header / Toggle when finished */}
      <CollapsibleTrigger className="flex w-full items-center gap-2 text-left font-medium text-muted-foreground hover:text-foreground transition-colors">
        <span className="flex items-center gap-1.5 min-w-0">
          {/* {hasActiveStep ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary shrink-0" />
          ) : hasErrorStep ? (
            <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
          ) : (
            <Check className="h-3.5 w-3.5 shrink-0" />
          )} */}
          <span className="truncate text-base">
            {hasActiveStep
              ? activeOrLastStep.taskName
              : isAllDone
                ? `Completed ${steps.length} ${steps.length === 1 ? "step" : "steps"}`
                : activeOrLastStep.taskName}
          </span>
        </span>
        {isOpen ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-70" />
        )}
      </CollapsibleTrigger>

      {/* Vertical Steps List */}
      <CollapsibleContent>
        <div className="mt-2.5 flex flex-col pl-0.5 ml-2">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const isCompleted = step.status === "completed";
            const isActive = step.status === "in_progress";
            const isError = step.status === "error";

            return (
              <div key={step.id} className="relative flex items-start gap-2.5">
                {/* Connecting vertical line */}
                {!isLast && (
                  <div
                    aria-hidden="true"
                    className={cn(
                      "absolute left-[9px] top-5 bottom-0 w-px transition-colors",
                      isCompleted ? "bg-primary/50" : "bg-border",
                    )}
                  />
                )}

                {/* Step node */}
                <span
                  data-state={step.status}
                  className={cn(
                    "relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border bg-background",
                    isCompleted &&
                      "border-primary/60 bg-primary/10 text-primary",
                    isActive && "border-primary/60 bg-primary/10 text-primary",
                    isError &&
                      "border-destructive/50 bg-destructive/10 text-destructive",
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-3 w-3" />
                  ) : isActive ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                </span>

                {/* Step label & detail */}
                <div className={cn("min-w-0 flex-1", !isLast && "pb-2.5")}>
                  <div
                    className={cn(
                      "leading-5 truncate",
                      isActive
                        ? "font-medium text-foreground"
                        : isError
                          ? "font-medium text-destructive"
                          : "text-muted-foreground",
                    )}
                  >
                    {step.taskName}
                  </div>
                  {step.detail && (
                    <div className="text-[11px] text-muted-foreground/80 truncate">
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default VerticalStepper;
