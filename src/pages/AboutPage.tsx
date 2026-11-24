import React from "react";
import {
  Bot,
  Database,
  Globe,
  Layers,
  MessageSquare,
  Network,
  Plug,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Card from "../components/ui/Card";

const motivations = [
  {
    title: "Unified AI Workspace",
    icon: Layers,
    description:
      "Bring conversational RAG chat, live web crawling, semantic vector search, and external tool integrations into one cohesive interface instead of juggling disconnected tools.",
  },
  {
    title: "Transparent & Grounded AI",
    icon: ShieldCheck,
    description:
      "Make autonomous agent reasoning observable with real-time SSE streaming, visible tool-call execution, and direct source citations linking back to indexed content chunks.",
  },
  {
    title: "Extensible, Decoupled Design",
    icon: Network,
    description:
      "Separate the React frontend from the Fastify 5 API gateway, Qdrant vector store, and companion clients (Chrome extension, CLI, Slack bot) for independent scaling and hands-on AI engineering.",
  },
];

const coreCapabilities = [
  {
    title: "Autonomous RAG Chat",
    route: "/chat",
    icon: MessageSquare,
    description:
      "Low-latency SSE token streaming, rich Markdown/KaTeX/Mermaid rendering, persistent multi-thread conversations, tool-call visibility, and citation badges.",
  },
  {
    title: "Connector & MCP Marketplace",
    route: "/connectors",
    icon: Plug,
    description:
      "Discover and manage remote Model Context Protocol (MCP) servers and OAuth 2.0 PKCE integrations (Slack, Gmail, GitHub) with automated tool discovery.",
  },
  {
    title: "Knowledge Base & Web Crawler",
    route: "/knowledge-base",
    icon: Globe,
    description:
      "Configure recursive sitemap crawling with regex filters, monitor live run telemetry, track Qdrant storage quotas, and inspect token-chunked documents.",
  },
  {
    title: "Semantic Search Engine",
    route: "/search",
    icon: Search,
    description:
      "Sub-second vector retrieval against Qdrant collections with cosine similarity threshold filtering, text previews, and canonical source attribution.",
  },
  {
    title: "Organization Visualizer",
    route: "/org",
    icon: Bot,
    description:
      "Interactive team and hierarchy visualization powered by d3-org-chart with department, title, and member filtering.",
  },
  {
    title: "Decoupled Backend Ecosystem",
    route: "API Gateway",
    icon: Database,
    description:
      "Communicates over REST and SSE with AI-Matrix-backend (Fastify 5, LangChain RAG agent, PostgreSQL, MongoDB, and Qdrant).",
  },
];

const techDetails = [
  {
    name: "React 18",
    tag: "Frontend",
    icon: "⚛️",
    badgeColor:
      "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
    description:
      "Component-based UI library with concurrent features and hooks powering the interactive chat, crawler, and connector workflows.",
  },
  {
    name: "TypeScript 5",
    tag: "Language",
    icon: "📘",
    badgeColor:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    description:
      "End-to-end static typing across API DTOs, Zustand stores, and UI components to catch errors early and improve maintainability.",
  },
  {
    name: "Vite 5",
    tag: "Tooling",
    icon: "⚡",
    badgeColor:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    description:
      "Fast development server and optimized production bundler for the decoupled frontend client.",
  },
  {
    name: "Tailwind CSS & Radix",
    tag: "Styling & UI",
    icon: "🎨",
    badgeColor:
      "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    description:
      "Utility-first styling paired with accessible Radix UI primitives, Lucide icons, Motion animations, and Sonner toast notifications.",
  },
  {
    name: "TanStack Query & Zustand",
    tag: "State & Data",
    icon: "🔄",
    badgeColor:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    description:
      "Server-state caching and mutations with TanStack Query v5 alongside lightweight client state management in Zustand 5.",
  },
  {
    name: "Fastify 5 Gateway",
    tag: "Backend",
    icon: "🚀",
    badgeColor:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    description:
      "Decoupled AI-Matrix-backend service handling REST APIs, SSE token streaming, LangChain RAG orchestration, and MCP execution.",
  },
  {
    name: "Clerk Auth",
    tag: "Authentication",
    icon: "🔐",
    badgeColor:
      "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    description:
      "JWT session authentication via Clerk React SDK with automatic request header injection and a local mock auth fallback.",
  },
  {
    name: "SSE & Streamdown",
    tag: "Streaming",
    icon: "📡",
    badgeColor:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    description:
      "Resilient Server-Sent Events via @microsoft/fetch-event-source with live Markdown, KaTeX math, Mermaid diagrams, and code highlighting.",
  },
  {
    name: "React Router 6",
    tag: "Routing",
    icon: "🧭",
    badgeColor:
      "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20",
    description:
      "Declarative client-side routing with nested layouts, protected routes, and lazy-loaded page views.",
  },
];

const AboutPage: React.FC = () => {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto w-full space-y-10">
      {/* Hero Header */}
      <section className="rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 px-8 py-10 md:py-12 text-white shadow-lg">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-primary-100 backdrop-blur-sm mb-4">
          <Sparkles className="h-3.5 w-3.5" />
          Autonomous RAG &amp; MCP Platform
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          About AI Matrix
        </h1>
        <p className="mt-3 max-w-2xl text-base sm:text-lg text-primary-100 leading-relaxed">
          The modern frontend web application for{" "}
          <span className="font-semibold text-white">AI Matrix</span> — an
          autonomous Retrieval-Augmented Generation (RAG) and Model Context
          Protocol (MCP) agent platform, decoupled from{" "}
          <span className="font-semibold text-white">AI-Matrix-backend</span>{" "}
          over REST APIs and real-time Server-Sent Events (SSE).
        </p>
      </section>

      {/* Why It Was Created */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Why It Was Created
          </h2>
          <p className="text-sm text-muted-foreground">
            The motivation and architectural goals behind building AI Matrix.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {motivations.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.title} className="flex flex-col gap-2.5">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  {item.title}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Core Capabilities */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Core Capabilities
          </h2>
          <p className="text-sm text-muted-foreground">
            Key modules and workflows available across the AI Matrix web client.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {coreCapabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <Card key={cap.title} className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Icon className="h-4 w-4 text-primary shrink-0" />
                    {cap.title}
                  </span>
                  <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground shrink-0">
                    {cap.route}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {cap.description}
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Tech Stack */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Tech Stack
          </h2>
          <p className="text-sm text-muted-foreground">
            Key frameworks and libraries powering the frontend client and its
            integration with the AI Matrix backend.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {techDetails.map((tech) => (
            <Card key={tech.name} className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                  <span className="text-base" role="img" aria-label={tech.name}>
                    {tech.icon}
                  </span>
                  {tech.name}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium border ${tech.badgeColor}`}
                >
                  {tech.tag}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tech.description}
              </p>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
