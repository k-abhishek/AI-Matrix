import React from "react";
import { Target, ExternalLink } from "lucide-react";
import Card from "@/components/ui/Card";
import { cn } from "@/utils/cn";

interface PriorityTask {
  id: string;
  title: string;
  project: string;
  priority: "P1" | "P2" | "P3";
  status: "In Progress" | "Blocked" | "Todo" | "In Review";
  due: string;
  assignee: string;
  source: "Jira" | "Confluence" | "Linear";
}

const DUMMY_TASKS: PriorityTask[] = [
  {
    id: "MAT-421",
    title: "Fix crawler timeout on large sitemaps",
    project: "Matrix Platform",
    priority: "P1",
    status: "Blocked",
    due: "Today",
    assignee: "AK",
    source: "Jira",
  },
  {
    id: "MAT-398",
    title: "Integrate streaming response in chat API",
    project: "Matrix AI",
    priority: "P1",
    status: "In Progress",
    due: "Today",
    assignee: "AK",
    source: "Jira",
  },
  {
    id: "MAT-410",
    title: "Update RAG pipeline to v2 embeddings",
    project: "Matrix AI",
    priority: "P2",
    status: "Todo",
    due: "Tomorrow",
    assignee: "AK",
    source: "Jira",
  },
  {
    id: "MAT-387",
    title: "PR review: Search filters refactor",
    project: "Matrix UI",
    priority: "P2",
    status: "In Review",
    due: "Tomorrow",
    assignee: "AK",
    source: "Jira",
  },
  {
    id: "CONF-88",
    title: "Draft Q4 architecture decision doc",
    project: "Confluence",
    priority: "P3",
    status: "Todo",
    due: "Nov 20",
    assignee: "AK",
    source: "Confluence",
  },
];

const PRIORITY_STYLES: Record<PriorityTask["priority"], string> = {
  P1: "bg-red-500/15 text-red-500 border-red-500/30",
  P2: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  P3: "bg-blue-500/15 text-blue-500 border-blue-500/30",
};

const SOURCE_STYLES: Record<PriorityTask["source"], string> = {
  Jira: "text-blue-400",
  Confluence: "text-teal-400",
  Linear: "text-indigo-400",
};

const PriorityCard: React.FC = () => {
  return (
    <Card className="p-4 h-full flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-card-foreground">
            Tasks
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {/* Task list */}
      <ul className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-none">
        {DUMMY_TASKS.map((task) => (
          <li
            key={task.id}
            className="flex items-start gap-3 rounded-lg px-3 py-2.5 border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
          >
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span
                  className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded border",
                    PRIORITY_STYLES[task.priority],
                  )}
                >
                  {task.priority}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    SOURCE_STYLES[task.source],
                  )}
                >
                  {task.id}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[10px] text-muted-foreground">
                  {task.project}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-[10px] text-muted-foreground">
                  Due: {task.due}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-[10px] text-muted-foreground">
                  {task.status}
                </span>
              </div>
              <p className="text-sm font-medium text-card-foreground mt-0.5 truncate text-left">
                {task.title}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default PriorityCard;
