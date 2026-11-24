# AI Matrix — Frontend Web Application

> High-performance, modern web application for the **AI Matrix** autonomous RAG and Model Context Protocol (MCP) agent platform.

[![Vite](https://img.shields.io/badge/Vite-5.3+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3+-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4+-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4+-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![TanStack Query](https://img.shields.io/badge/TanStack_Query-5.0+-FF4154?logo=reactquery&logoColor=white)](https://tanstack.com/query/latest)
[![Clerk](https://img.shields.io/badge/Clerk-Auth-6C47FF?logo=clerk&logoColor=white)](https://clerk.com/)

---

## Architecture Overview

Following the platform's architectural decoupling, this repository houses exclusively the **frontend client application** for the AI Matrix ecosystem. The application is completely decoupled from the server and communicates with the **[AI-Matrix-backend](../AI-Matrix-backend)** service over REST APIs and Server-Sent Events (SSE).

```
                      ┌──────────────────────────────────────────────┐
                      │          AI Matrix Web Application           │
                      │   (React 18, Vite 5, TypeScript, Tailwind)   │
                      └───────┬──────────────────────────────┬───────┘
                              │                              │
                    HTTP REST │ (JSON DTOs)       SSE Stream │ (Real-time Token Flow)
                              ▼                              ▼
                      ┌──────────────────────────────────────────────┐
                      │             Fastify 5 API Gateway            │
                      │            (AI-Matrix-backend)               │
                      └───────┬──────────────┬──────────────┬────────┘
                              │              │              │
                              ▼              ▼              ▼
                      ┌──────────────┐ ┌───────────┐ ┌───────────────┐
                      │  PostgreSQL  │ │  MongoDB  │ │ Qdrant Vector│
                      │   (Prisma)   │ │(Mongoose) │ │   Database    │
                      └──────────────┘ └───────────┘ └───────────────┘
```

### The AI Matrix Ecosystem

| Repository | Responsibility |
|---|---|
| **AI-Matrix** *(this repo)* | Production web client: chat interface, connector marketplace, crawler manager, semantic search, and org charts. |
| **[AI-Matrix-backend](../AI-Matrix-backend)** | Fastify 5 API gateway, LangChain RAG agent, Qdrant vector ingestion, AES-256 vault, and MCP runtime. |
| **ai-matrix-chrome-extension** | In-browser extension for on-the-fly content capture and assistant interactions. |
| **matrix-cli** | Developer CLI tool for managing crawlers, connections, and vector collections from terminal. |
| **matrix-slack-bot** | Slack bot integration forwarding team questions to the autonomous RAG agent. |

---

## Core Capabilities & Features

### 1. Autonomous Conversational RAG Chat (`/chat`)
- **Server-Sent Events (SSE) Streaming**: Low-latency token streaming powered by `@microsoft/fetch-event-source` with cancellation controls.
- **Rich Markdown & Math Rendering**: Full markdown parsing, math notation via **KaTeX**, diagrams via **Mermaid**, and code syntax highlighting with copy controls.
- **Multi-Thread Persistence**: Create, switch, rename, and delete conversation threads stored in MongoDB.
- **Tool Calling Visibility**: Real-time visualization of agent tool calls, arguments, and execution statuses.
- **Citation Badges**: Direct source attribution linking back to crawled page URLs and chunk indices.

### 2. Connector & MCP Marketplace (`/connectors`)
- **Model Context Protocol (MCP)**: Discover, register, and manage remote MCP servers using Streamable HTTP, Legacy HTTP SSE, or stdio transports.
- **Native Integrations**: Out-of-the-box support for Slack, Gmail, GitHub, and custom REST API endpoints.
- **OAuth 2.0 PKCE Flow**: In-browser authorization code flow with automatic query parameter parsing and non-intrusive status feedback via **Shadcn Sonner Toasts**.
- **Automated Tool Discovery**: Automatic synchronization of remote tool capabilities following credential authorization.
- **Interactive Tool Explorer**: Direct in-browser tool testing and schema inspector.

### 3. Knowledge Base & Web Crawler Hub (`/knowledge-base`)
- **Crawler Management**: Configure recursive sitemap crawling with XML index parsing, host whitelisting, and regex include/exclude filters.
- **Live Run Telemetry**: Real-time status monitoring (`PENDING`, `RUNNING`, `COMPLETED`, `CANCELLED`, `INTERRUPTED`).
- **Storage Quota Tracking**: Visual capacity indicators reflecting Qdrant vector database storage budgets.
- **Chunk Explorer**: Inspect token-chunked documents, content hashes, and embedding statuses.

### 4. Semantic Search Engine (`/search`)
- **Instant Vector Retrieval**: Sub-second semantic search against Qdrant vector collections.
- **Score Threshold Filtering**: Filter results by cosine similarity confidence scores.
- **Deep Attribution**: Inspect match score, text previews, page titles, and canonical links.

### 5. Organization Visualizer (`/org`)
- **Interactive Hierarchy Chart**: Dynamic corporate or team structure visualization powered by `d3-org-chart`.
- **Node Filtering & Inspection**: Search by department, title, or individual with responsive navigation.

### 6. Design System & Theme Engine
- **Dark & Light Mode**: Seamless theme toggling with zero-flash persistence and cross-tab synchronization via `BroadcastChannel`.
- **Shadcn / Radix Primitives**: Fully accessible, styled UI components (`Dialog`, `Button`, `Collapsible`, `Tooltip`, `Card`, `Sonner Toasts`).

---

## Technology Stack

| Layer | Technologies |
|---|---|
| **Build & Runtime** | [Vite 5](https://vitejs.dev/), [React 18](https://react.dev/), [TypeScript 5](https://www.typescriptlang.org/) |
| **Styling & Icons** | [Tailwind CSS 3](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Class Variance Authority](https://cva.style/) |
| **Animation** | [Motion](https://motion.dev/) (Framer Motion v14) |
| **State & Data Fetching** | [TanStack React Query v5](https://tanstack.com/query/latest), [Zustand 5](https://zustand-demo.pmnd.rs/) |
| **Routing** | [React Router 6](https://reactrouter.com/) |
| **Authentication** | [Clerk React SDK](https://clerk.com/docs) (with local mock fallback) |
| **Streaming & Markdown** | `@microsoft/fetch-event-source`, `streamdown`, `react-markdown`, `remark-gfm`, `katex` |
| **Data Visualization** | `d3-org-chart` |
| **Notification System** | [Sonner](https://sonner.emilkowal.ski/) (Shadcn Toast component) |

---

## Project Structure

```
AI-Matrix/
├── public/                 # Static assets and icons
├── src/
│   ├── api/                # API client layer & endpoint definitions
│   │   ├── chat.ts         # SSE streaming & thread management
│   │   ├── client.ts       # Centralized ApiClient with auth header injection
│   │   ├── connector.ts    # MCP & integration catalog endpoints
│   │   ├── knowledgeBase.ts# Crawlers, schedules & chunk endpoints
│   │   └── search.ts       # Semantic vector search API
│   ├── assets/             # Brand graphics and background overlays
│   ├── components/         # Modular React components
│   │   ├── auth/           # Protected routes & Clerk auth wrappers
│   │   ├── chat/           # Chat interface, message list, streaming view
│   │   ├── connectors/     # Connector cards, tool explorer, OAuth callback toast
│   │   ├── crawler/        # Crawler forms, status indicators, schedule cards
│   │   ├── home/           # Dashboard telemetry, metrics, and quick prompt cards
│   │   ├── search/         # Search bar, results grid, match filters
│   │   └── ui/             # Shadcn-inspired UI component library
│   ├── context/            # Global React contexts (AuthContext, ThemeContext)
│   ├── hooks/              # Custom TanStack Query & utility hooks
│   ├── layouts/            # MainLayout (Sidebar, Header, Breadcrumbs)
│   ├── pages/              # Top-level route pages (Chat, Connectors, KB, Search, Org)
│   ├── routes/             # React Router route hierarchy & lazy loading
│   ├── services/           # External client integrations (e.g. Brandfetch)
│   ├── store/              # Zustand global client state (chatStore)
│   ├── types/              # Comprehensive TypeScript interfaces & DTOs
│   ├── utils/              # Helper utilities (cn, date formatters, sanitizers)
│   ├── App.tsx             # Root application setup (Providers, Router, Toaster)
│   ├── index.css           # Global Tailwind CSS definitions & CSS variables
│   └── main.tsx            # Application entry point
├── .env.example            # Environment template
├── package.json            # Dependencies and npm scripts
├── tailwind.config.js      # Tailwind theme configuration
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite configuration & path aliases
```

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher (Node.js 20+ LTS recommended)
- **Package Manager**: `npm` (v9+) or `pnpm` (v8+)
- **Backend Service**: Running instance of **[AI-Matrix-backend](../AI-Matrix-backend)** (default: `http://localhost:3000`)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/<your-username>/AI-Matrix.git
   cd AI-Matrix
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the project root based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

   Update the configuration variables:
   ```env
   # URL of the running AI-Matrix-backend service
   VITE_API_BASE_URL=http://localhost:3000

   # Optional: Clerk Publishable Key (leave empty to use local development mock auth)
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```

### Development Server

Start the local Vite development server with hot module replacement (HMR):

```bash
npm run dev
```

Open your browser at **`http://localhost:5173`**.

### Building for Production

Compile TypeScript and build the optimized production bundle:

```bash
npm run build
```

The production output will be generated in the `dist/` directory.

To preview the production build locally:
```bash
npm run preview
```

---

## Backend & API Integration

The frontend automatically resolves the backend base URL via `VITE_API_BASE_URL`.

- **REST Endpoints**: All standard CRUD operations (Crawlers, Connectors, Threads, Search) target `${VITE_API_BASE_URL}/api/...`.
- **Authentication**: When Clerk is configured, JWT session tokens are automatically attached to outgoing HTTP requests via the `Authorization: Bearer <token>` header. If Clerk is omitted, an in-memory development provider enables seamless offline testing.
- **Server-Sent Events (SSE)**: The conversational chat utilizes `@microsoft/fetch-event-source` to maintain resilient streaming connections with automatic retry logic.
- **OAuth Callback Processing**: The `OAuthCallbackBanner` component headlessly intercepts `?connectionId=...&status=success` parameters, triggers automated tool discovery via TanStack mutations, cleans up the browser address bar without page refresh, and displays user status toasts.

---

## License

This project is licensed under the [MIT License](LICENSE).
