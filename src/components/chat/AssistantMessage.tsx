import React from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  Wrench,
  XCircle,
} from "lucide-react";
import { ThinkingOrb, type OrbState } from "thinking-orbs";
import { ChatMessage } from "../../types";
import { cn } from "../../utils";
import { MarkdownRenderer } from "./MarkdownRenderer";
import VerticalStepper from "../ui/vertical-stepper";

export interface AssistantMessageProps {
  message: ChatMessage;
  className?: string;
  onResolveApproval?: (approvalId: string, approved: boolean) => void;
  isResolvingApproval?: boolean;
}

function mapTaskNameToOrbState(taskName: string): OrbState {
  const lower = taskName.toLowerCase();
  if (/search|knowledge base|fetch|retriev|lookup|find/.test(lower)) {
    return "searching";
  }
  if (/connect|approval|auth|wait|sync/.test(lower)) {
    return "connecting";
  }
  if (/draft|compos|writ|synthesiz|summariz|generat/.test(lower)) {
    return "composing";
  }
  if (/think|analyz|solv|reason|plan|evaluat/.test(lower)) {
    return "solving";
  }
  if (/listen|stream|receiv|audio/.test(lower)) {
    return "listening";
  }
  if (/weav|integrat|combin|merg/.test(lower)) {
    return "weaving";
  }
  if (/shap|format|structur|render/.test(lower)) {
    return "shaping";
  }
  return "working";
}

function getOrbStatus(message: ChatMessage): {
  state: OrbState;
  paused: boolean;
} {
  const steps = message.statusSteps ?? [];
  const activeStep = steps.find((s) => s.status === "in_progress");
  const hasSteps = steps.length > 0;
  const hasPendingApproval = message.approval?.status === "PENDING";

  if (activeStep) {
    return {
      state: mapTaskNameToOrbState(activeStep.taskName),
      paused: false,
    };
  }

  const isDone =
    !hasPendingApproval &&
    (hasSteps || Boolean(message.content) || Boolean(message.connectionIssue));

  if (hasSteps) {
    const lastStep = steps[steps.length - 1];
    return {
      state: mapTaskNameToOrbState(lastStep.taskName),
      paused: isDone,
    };
  }

  return {
    state: isDone ? "breathing" : "working",
    paused: isDone,
  };
}

export const AssistantMessage: React.FC<AssistantMessageProps> = ({
  message,
  className,
  onResolveApproval,
  isResolvingApproval = false,
}) => {
  const approval = message.approval;
  const connectionIssue = message.connectionIssue;
  const orb = getOrbStatus(message);

  return (
    <div
      className={cn(
        "p-4 rounded-2xl text-sm transition-all text-foreground mr-auto w-fit max-w-5xl",
        className,
      )}
    >
      <div className="flex gap-2">
        <ThinkingOrb
          state={orb.state}
          size={32}
          paused={orb.paused}
          className="shrink-0"
          data-orb-state={orb.state}
          data-orb-paused={String(orb.paused)}
        />
        <div className="space-y-3 min-w-0">
          {message.statusSteps && message.statusSteps.length > 0 && (
            <VerticalStepper steps={message.statusSteps} />
          )}

          {message.toolCalls && message.toolCalls.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {message.toolCalls.map((tc, idx) => (
                <span
                  key={tc.toolCallId || `${tc.name}-${idx}`}
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-muted/70 text-muted-foreground border border-border/50"
                >
                  <Wrench className="h-3 w-3 text-primary" />
                  <span>{tc.taskName || tc.name}</span>
                </span>
              ))}
            </div>
          )}

          {message.content ? (
            <MarkdownRenderer content={message.content} />
          ) : !approval &&
            !connectionIssue &&
            (!message.statusSteps || message.statusSteps.length === 0) ? (
            <div className="flex items-center space-x-2 text-muted-foreground py-1">
              <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
              <div className="h-2 w-2 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
              <div className="h-2 w-2 rounded-full bg-current animate-bounce" />
            </div>
          ) : null}

          {approval && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>Approval Required: {approval.toolName}</span>
              </div>
              {approval.parameters &&
                Object.keys(approval.parameters).length > 0 && (
                  <pre className="text-[11px] bg-background/70 border border-border/50 rounded-lg p-2 overflow-x-auto max-h-36">
                    {JSON.stringify(approval.parameters, null, 2)}
                  </pre>
                )}
              {(!approval.status || approval.status === "PENDING") &&
              onResolveApproval ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isResolvingApproval}
                    onClick={() => onResolveApproval(approval.approvalId, true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve & Continue
                  </button>
                  <button
                    type="button"
                    disabled={isResolvingApproval}
                    onClick={() =>
                      onResolveApproval(approval.approvalId, false)
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </button>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Status: <span className="font-medium">{approval.status}</span>
                </div>
              )}
            </div>
          )}

          {connectionIssue && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-destructive">
                    {connectionIssue.code === "CONNECTION_EXPIRED"
                      ? "Connection Expired"
                      : "Connection Required"}
                  </div>
                  <p className="text-muted-foreground mt-0.5">
                    {connectionIssue.message}
                  </p>
                </div>
              </div>
              <Link
                to="/connector"
                className="shrink-0 rounded-lg bg-background border border-border px-2.5 py-1 font-medium hover:bg-muted transition-colors"
              >
                Manage Connectors
              </Link>
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
