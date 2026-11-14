# Website Crawler & RAG Backend (Fastify + Cheerio + Prisma + Qdrant + Google GenAI)

A production-grade, in-process website crawler backend built with Fastify, TypeScript, Cheerio, Prisma ORM, PostgreSQL, and Qdrant vector database.

It allows you to register a website using its `sitemap.xml` URL, crawl pages once with bounded in-process concurrency, extract and clean readable content using Cheerio, generate vector embeddings using **Google Generative AI (`text-embedding-004`) via LangChain**, and store the vectors in Qdrant while tracking authoritative metadata in PostgreSQL.

---

## Architecture & Technology Stack

| Component | Technology | Description |
|---|---|---|
| **Runtime** | Node.js 22 LTS (or compatible) | High-performance JavaScript/TypeScript runtime |
| **Language** | TypeScript (ES2020) | Fully type-safe domain models and DTOs |
| **Framework** | Fastify 5 | High-throughput web framework with built-in schema validation |
| **HTML Parser** | Cheerio | Fast server-side HTML parser and cleaner |
| **Sitemap Parser** | fast-xml-parser | Supports standard sitemaps and recursive `<sitemapindex>` |
| **ORM** | Prisma 6.4.1 | PostgreSQL schema, relations, cascades, and migrations |
| **Database** | PostgreSQL | Authoritative relational store for crawlers, runs, pages, and chunks |
| **Vector Database** | Qdrant | Nearest-neighbor vector index with payload filters & metadata |
| **Embeddings** | `@langchain/google-genai` | Google `text-embedding-004` (768-dim embeddings) |
| **Validation** | Zod | Request payload, query param, and environment variable validation |
| **Testing** | Vitest | Fast unit and integration tests |

### Explicitly Excluded Infrastructure

This application is strictly designed as an **in-process, manually triggered crawler**. It contains:
- **NO** Redis, BullMQ, Kafka, or external message queues.
- **NO** separate worker processes or cron schedulers.
- **NO** Playwright or Puppeteer headless browsers.

> **Note on Client-Side Rendering:**
> Cheerio parses raw HTTP HTML responses directly. Pages requiring client-side JavaScript execution (e.g., SPA hydration or dynamic JavaScript rendering) will not yield content that is not present in the initial server HTML response.

---

## Key Features

1. **Sitemap Discovery (`SitemapService`)**:
   - Recursively parses XML sitemaps and sitemap indexes (`<sitemapindex>`).
   - Normalizes URLs, removes tracking parameters (`utm_*`, `ref`, etc.), and deduplicates links.
   - Enforces domain boundaries (`allowedHosts`), inclusion/exclusion glob/regex patterns, and page limits (`maxPages`).

2. **Security & SSRF Hardening (`FetcherService`)**:
   - Strict protocol check (only HTTP and HTTPS allowed).
   - Blocks private/internal destinations (`localhost`, `127.0.0.0/8`, `10.0.0.0/8`, `192.168.0.0/16`, `172.16-31.x.x`, link-local `169.254.169.254`, `metadata.google.internal`).
   - Inspects redirect targets manually to prevent domain-escape and SSRF bypass.
   - Streaming response byte limiter (default 5 MB max per page) and request timeouts.

3. **Content Extraction & Cleaning (`ContentExtractorService`)**:
   - Removes boilerplate: `script`, `style`, `noscript`, `iframe`, `svg`, `nav`, `footer`, `header`, `aside`, `form`, `button`, plus cookie banners, ads, and modal overlays.
   - Content container priority: `main` > `article` > `[role="main"]` > `body`.
   - Extracts page title, meta description, canonical URL, H1–H6 headings, and clean text.

4. **Chunking & Incremental Ingestion**:
   - Chunks text into ~700-token blocks with 100-token overlap, preserving sentence boundaries.
   - Computes SHA-256 content hashes. Unchanged pages are skipped on subsequent runs without regenerating embeddings.
   - Obsolete vectors in Qdrant are automatically deleted when an updated page produces fewer chunks.

5. **Qdrant 4 GiB Storage Budget Enforcement (`StorageService`)**:
   - Monitors vector collection statistics and estimates incoming byte size (vector floats + payload + HNSW index overhead).
   - Automatically stops crawl ingestion when the configured threshold (default 85% of 4 GiB = ~3.65 GiB) is reached, marking the run status with a clear explanatory error.

6. **In-Process Run Lifecycle & Recovery (`CrawlService`)**:
   - Non-blocking execution: `POST /api/crawlers/:id/crawl` immediately responds with `202 Accepted` and `crawlRunId`.
   - Single-flight concurrency: prevents simultaneous crawls for the same crawler.
   - Cooperative cancellation: `POST /api/crawlers/:id/cancel` aborts running fetches via `AbortController`.
   - Startup crash recovery: automatically marks previously `RUNNING` crawl runs as `INTERRUPTED` on server reboot.

---

## REST API Reference

### 1. Crawler Management
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/crawlers` | Create a crawler configuration |
| `GET` | `/api/crawlers` | List all crawler configurations |
| `GET` | `/api/crawlers/:id` | Get crawler configuration by ID |
| `PATCH` | `/api/crawlers/:id` | Update crawler configuration |
| `DELETE` | `/api/crawlers/:id` | Delete crawler (and cleanup Qdrant vectors) |

#### Example Request: Create Crawler
```http
POST /api/crawlers
Content-Type: application/json

{
  "name": "Fastify Documentation",
  "sitemapUrl": "https://fastify.dev/sitemap.xml",
  "baseUrl": "https://fastify.dev",
  "maxPages": 1000,
  "maxConcurrency": 3,
  "requestTimeoutMs": 15000,
  "requestDelayMs": 500,
  "enabled": true
}
```

### 2. Crawl Operations
| Method | Endpoint | Description | Status Code |
|---|---|---|---|
| `POST` | `/api/crawlers/:id/crawl` | Trigger standard incremental crawl | `202 Accepted` |
| `POST` | `/api/crawlers/:id/crawl/full` | Trigger full crawl (forces re-embedding) | `202 Accepted` |
| `POST` | `/api/crawlers/:id/cancel` | Cancel an active in-flight crawl | `200 OK` |

### 3. Crawl Run Monitoring & Progress Polling
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/crawl-runs` | List crawl runs with pagination (`?page=1&limit=20`) |
| `GET` | `/api/crawl-runs/:runId` | Get crawl run metadata |
| `GET` | `/api/crawl-runs/:runId/progress` | **Polling endpoint** for real-time progress and storage usage |
| `GET` | `/api/crawl-runs/:runId/pages` | Paginated page-level crawl results (`?status=COMPLETED`) |

#### Example Response: `GET /api/crawl-runs/:runId/progress`
```json
{
  "crawlRunId": "9d1b098b-70c3-42e1-9549-ee4c5ef33a1e",
  "crawlerId": "a12bc9f3-8557-418e-a749-bbca64731a54",
  "status": "RUNNING",
  "progressPercentage": 65,
  "progress": {
    "totalPages": 500,
    "discoveredPages": 500,
    "queuedPages": 100,
    "processingPages": 20,
    "fetchedPages": 380,
    "cleanedPages": 360,
    "skippedPages": 20,
    "failedPages": 20,
    "totalChunks": 1200,
    "embeddedChunks": 900,
    "storedChunks": 900
  },
  "metrics": {
    "averageFetchTimeMs": 420,
    "totalFetchedBytes": 125000000,
    "storageUsedBytes": 125000000,
    "storageBudgetBytes": 4294967296,
    "storageUsagePercentage": 2.9,
    "storageUsageSource": "ESTIMATED"
  },
  "timestamps": {
    "createdAt": "2026-11-12T10:00:00.000Z",
    "startedAt": "2026-11-12T10:00:05.000Z",
    "completedAt": null
  },
  "errors": []
}
```

### 4. Metrics & Health
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/crawlers/:crawlerId/metrics` | Crawler stats and storage utilization |
| `GET` | `/api/health` | Liveness check (`status: "ok"`) |
| `GET` | `/api/ready` | Readiness check (tests PostgreSQL & Qdrant connectivity) |

---

## Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | `4000` | Application server port |
| `DATABASE_URL` | *(Required)* | PostgreSQL connection string |
| `QDRANT_URL` | `http://localhost:6333` | Qdrant REST URL |
| `QDRANT_API_KEY` | *(Optional)* | Qdrant API key |
| `QDRANT_COLLECTION` | `website_content` | Shared Qdrant collection name |
| `QDRANT_VECTOR_SIZE` | `768` | Vector dimension (768 for Google `text-embedding-004`) |
| `QDRANT_DISTANCE` | `Cosine` | Vector distance metric (`Cosine`, `Euclid`, `Dot`) |
| `EMBEDDING_PROVIDER` | `google` | Embedding provider (`google`) |
| `EMBEDDING_MODEL` | `text-embedding-004` | Google embedding model name |
| `GOOGLE_API_KEY` | *(Required for crawl)* | Google Gemini / Generative AI API key |
| `CRAWLER_MAX_CONCURRENCY` | `3` | Default concurrent fetch workers per crawl |
| `CRAWLER_REQUEST_TIMEOUT_MS`| `15000` | HTTP request timeout in milliseconds |
| `CRAWLER_MAX_PAGES_PER_RUN` | `1000` | Maximum pages allowed per crawl run |
| `CRAWLER_MAX_RESPONSE_BYTES`| `5242880` | Max response size (5 MB) |
| `CRAWLER_DEFAULT_DELAY_MS` | `500` | Delay between successive HTTP page requests |
| `QDRANT_STORAGE_BUDGET_BYTES`| `4294967296` | 4 GiB storage ceiling |
| `QDRANT_STORAGE_STOP_THRESHOLD_PERCENT`| `85` | Stop ingestion at 85% of budget |

---

## Local Development Commands

All commands are run from the `server` directory:

```bash
# Install dependencies
npm install

# Run database migrations
npm run prisma:migrate

# Generate Prisma client
npm run prisma:generate

# Open Prisma Studio GUI
npm run prisma:studio

# Run dev server with auto-reload
npm run dev

# Run TypeScript type check
npm run typecheck

# Run test suite
npm run test

# Build production TypeScript output
npm run build

# Start production server
npm run start
```

### Starting Local PostgreSQL (Docker Compose)

If you don't already have a local PostgreSQL instance running:

```bash
docker compose up -d
```

