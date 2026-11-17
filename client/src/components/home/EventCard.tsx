import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, PartyPopper } from "lucide-react";
import Card from "@/components/ui/Card";

interface OrgEvent {
  id: string;
  type: "anniversary" | "achievement" | "milestone" | "birthday";
  emoji: string;
  name: string;
  title: string;
  description: string;
  badge?: string;
}

const DUMMY_ORG_EVENTS: OrgEvent[] = [
  {
    id: "1",
    type: "anniversary",
    emoji: "🎂",
    name: "Priya Sharma",
    title: "5-Year Anniversary!",
    description:
      "Priya completes 5 incredible years with us. Thank you for everything!",
    badge: "5 Years",
  },
  {
    id: "2",
    type: "achievement",
    emoji: "🏆",
    name: "Platform Team",
    title: "Q3 Delivery Champion",
    description:
      "Platform team shipped the new crawler engine 2 weeks ahead of schedule!",
    badge: "Award",
  },
  {
    id: "3",
    type: "milestone",
    emoji: "🚀",
    name: "Matrix AI",
    title: "1M Requests Milestone",
    description:
      "Matrix AI crossed 1 million inference requests this month. Huge milestone!",
    badge: "1M",
  },
  {
    id: "4",
    type: "birthday",
    emoji: "🎉",
    name: "Rahul Verma",
    title: "Happy Birthday!",
    description:
      "Wishing Rahul a fantastic birthday — hope it's as amazing as the code he writes!",
  },
];

const TYPE_GRADIENT: Record<OrgEvent["type"], string> = {
  anniversary: "from-purple-500/10 to-indigo-500/10 border-purple-500/20",
  achievement: "from-yellow-500/10 to-orange-500/10 border-yellow-500/20",
  milestone: "from-blue-500/10 to-cyan-500/10 border-blue-500/20",
  birthday: "from-pink-500/10 to-rose-500/10 border-pink-500/20",
};

const EventCard: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const total = DUMMY_ORG_EVENTS.length;

  const goTo = (index: number, dir: number) => {
    setDirection(dir);
    setCurrent((index + total) % total);
  };

  // Auto-advance every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % total);
    }, 4000);
    return () => clearInterval(timer);
  }, [total]);

  const event = DUMMY_ORG_EVENTS[current];

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 60 : -60,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: dir > 0 ? -60 : 60,
      opacity: 0,
    }),
  };

  return (
    <Card className="p-4 flex-1 flex flex-col gap-3 min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PartyPopper className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-card-foreground">
            Around the Org
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => goTo(current - 1, -1)}
            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => goTo(current + 1, 1)}
            className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Carousel Slide */}
      <div className="flex-1 relative overflow-hidden rounded-lg">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={event.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={`flex flex-col items-center justify-center gap-2 rounded-lg border bg-gradient-to-br p-4 text-center h-full ${TYPE_GRADIENT[event.type]}`}
          >
            {/* <span className="text-3xl">{event.emoji}</span> */}
            {/* {event.badge && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-background/70 text-foreground border border-border">
                {event.badge}
              </span>
            )} */}
            <div>
              <p className="text-sm font-bold text-card-foreground">
                {event.name}
              </p>
              <p className="text-xs font-medium text-primary">{event.title}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {event.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5">
        {DUMMY_ORG_EVENTS.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > current ? 1 : -1)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === current ? "w-4 bg-primary" : "w-1.5 bg-muted-foreground/30"
            }`}
          />
        ))}
      </div>
    </Card>
  );
};

export default EventCard;
