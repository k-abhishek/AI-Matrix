import React, { useState } from "react";
import {
  Calendar,
  Video,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import Card from "@/components/ui/Card";
import { cn } from "@/utils/cn";

interface Attendee {
  initials: string;
  color: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  type: "meeting" | "deadline" | "reminder" | "focus";
  attendees?: Attendee[];
  meetingUrl?: string;
}

const DUMMY_EVENTS: CalendarEvent[] = [
  {
    id: "1",
    title: "Standup Sync",
    startTime: "9:00 AM",
    endTime: "9:15 AM",
    type: "meeting",
    attendees: [
      { initials: "AK", color: "bg-green-500" },
      { initials: "MJ", color: "bg-pink-500" },
    ],
    meetingUrl: "https://meet.google.com/standup",
  },
  {
    id: "2",
    title: "Design Review",
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    type: "meeting",
    attendees: [
      { initials: "A", color: "bg-green-500" },
      { initials: "M", color: "bg-orange-400" },
      { initials: "J", color: "bg-pink-500" },
    ],
    meetingUrl: "https://meet.google.com/design-review",
  },
  {
    id: "3",
    title: "Sprint Planning",
    startTime: "2:00 PM",
    endTime: "4:00 PM",
    type: "meeting",
    attendees: [
      { initials: "AK", color: "bg-blue-500" },
      { initials: "RS", color: "bg-purple-500" },
      { initials: "TN", color: "bg-yellow-500" },
      { initials: "MJ", color: "bg-pink-500" },
    ],
    meetingUrl: "https://meet.google.com/sprint-planning",
  },
  {
    id: "4",
    title: "PR Review Deadline",
    startTime: "5:00 PM",
    endTime: "",
    type: "deadline",
  },
];

const TYPE_ICON_BG: Record<CalendarEvent["type"], string> = {
  meeting: "bg-muted text-muted-foreground",
  deadline: "bg-red-500/10 text-red-500",
  reminder: "bg-yellow-500/10 text-yellow-500",
  focus: "bg-emerald-500/10 text-emerald-500",
};

function formatOffset(base: Date, offset: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

const CalendarCard: React.FC = () => {
  const today = new Date();
  const [dayOffset, setDayOffset] = useState(0);

  const dayLabel = formatOffset(today, dayOffset);

  return (
    <Card className="p-4 flex-1 flex flex-col gap-3 min-h-0">
      {/* Header — 3 items: label | navigator | open-calendar icon */}
      <div className="flex items-center justify-between gap-2">
        {/* 1. Label */}
        <div className="flex items-center gap-2 shrink-0">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-card-foreground">
            Schedules
          </span>
        </div>

        {/* 2. Date navigator */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDayOffset((o) => o - 1)}
            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-muted-foreground min-w-[64px] text-center select-none">
            {dayLabel}
          </span>
          <button
            onClick={() => setDayOffset((o) => o + 1)}
            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Next day"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 3. Open calendar in new tab */}
        <a
          href="https://calendar.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground shrink-0"
          aria-label="Open calendar"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Events */}
      <ul className="flex flex-col gap-2 flex-1 overflow-y-auto scrollbar-none">
        {DUMMY_EVENTS.map((event) => (
          <li
            key={event.id}
            className="flex items-start gap-3 rounded-xl px-3 py-2.5 border border-border bg-muted/30 hover:bg-muted/60 transition-colors"
          >
            <div className="flex flex-col w-full justify-between">
              {/* Type icon */}
              <div className="flex flex-row gap-2 w-full ">
                <div
                  className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5",
                    TYPE_ICON_BG[event.type],
                  )}
                >
                  {event.type === "meeting" ? (
                    <Video className="h-4 w-4" />
                  ) : (
                    <Calendar className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-card-foreground leading-tight">
                      {event.title}
                    </p>
                  </div>

                  {/* Time range */}
                  <p className="text-xs text-muted-foreground mt-0.5 text-left">
                    {event.startTime}
                    {event.endTime ? ` – ${event.endTime}` : ""}
                  </p>
                </div>
              </div>

              {/* Attendees + Join */}
              <div>
                <div className="flex items-center justify-between mt-2">
                  {event.attendees && event.attendees.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      {/* Avatar stack */}
                      <div className="flex -space-x-1.5">
                        {event.attendees.slice(0, 4).map((a, i) => (
                          <span
                            key={i}
                            className={cn(
                              "h-5 w-5 rounded-full border-2 border-card flex items-center justify-center text-[9px] font-bold text-white shrink-0",
                              a.color,
                            )}
                            title={a.initials}
                          >
                            {a.initials.charAt(0)}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {event.attendees.length}{" "}
                        {event.attendees.length === 1 ? "person" : "people"}
                      </span>
                    </div>
                  ) : (
                    <span />
                  )}

                  {/* Join button */}
                  {event.meetingUrl && (
                    <a
                      href={event.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                    >
                      <Video className="h-3 w-3" />
                      Join
                    </a>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default CalendarCard;
