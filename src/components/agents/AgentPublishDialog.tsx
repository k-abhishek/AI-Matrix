import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Rocket,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import type { AgentValidationResult } from '../../types';

export interface AgentPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentName: string;
  validation: AgentValidationResult | null;
  isValidating: boolean;
  isPublishing: boolean;
  validationError?: string | null;
  onPublish: () => void;
}

export const AgentPublishDialog: React.FC<AgentPublishDialogProps> = ({
  open,
  onOpenChange,
  agentName,
  validation,
  isValidating,
  isPublishing,
  validationError,
  onPublish,
}) => {
  const canPublish = Boolean(validation?.valid) && !isValidating && !isPublishing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Publish Agent
          </DialogTitle>
          <DialogDescription>
            Publishing creates an immutable version of{' '}
            <span className="font-semibold text-foreground">{agentName}</span>. Existing
            conversations remain pinned to their original version.
          </DialogDescription>
        </DialogHeader>

        <div className="py-3 space-y-3">
          {isValidating ? (
            <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Validating agent configuration with backend...</span>
            </div>
          ) : validationError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive flex items-start gap-2">
              <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{validationError}</span>
            </div>
          ) : validation ? (
            <div className="space-y-2.5">
              {validation.valid ? (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="font-medium">
                    Validation passed. Ready to publish.
                  </span>
                </div>
              ) : (
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-destructive">
                    <XCircle className="h-4 w-4 shrink-0" />
                    <span>Validation failed — resolve these issues before publishing:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-destructive">
                    {validation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Warnings</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                    {validation.warnings.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onPublish}
            disabled={!canPublish}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Rocket className="h-4 w-4" />
                Confirm Publish
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AgentPublishDialog;
