import Fastify, { FastifyInstance, FastifyServerOptions } from "fastify";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import env from "./config/env";
import { requestLogger } from "./lib/logger";
import { errorHandler } from "./lib/errors";
import apiRoutes from "./routes";

export const buildApp = async (
  opts: FastifyServerOptions = {},
): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: false, // Using our lightweight console logger
    ...opts,
  });

  // Global error handler (must be registered before encapsulated plugins/routes)
  app.setErrorHandler(errorHandler);

  // Body parsers
  await app.register(formbody);

  // CORS
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
  });

  // Swagger (OpenAPI) specification
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Website Crawler & Vector Indexer API",
        description:
          "Fastify backend for crawling sitemaps, extracting content via Cheerio, generating embeddings, and storing in Qdrant & PostgreSQL",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://localhost:${env.PORT}`,
          description: "Local server",
        },
      ],
      tags: [
        {
          name: "General",
          description: "General API information and discovery",
        },
        {
          name: "Crawlers",
          description: "Crawler management and manual triggering",
        },
        {
          name: "Crawl Runs",
          description: "Crawl execution monitoring and progress",
        },
        {
          name: "Search",
          description:
            "Semantic vector similarity search across crawled content",
        },
        {
          name: "Chat",
          description: "AI conversational agent with crawled content",
        },
        { name: "Health", description: "Liveness and readiness checks" },
      ],
    },
  });

  // Swagger UI
  await app.register(swaggerUi, {
    routePrefix: "/documentation",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
    staticCSP: true,
  });

  // Convenient redirect from /docs to /documentation
  app.get("/docs", { schema: { hide: true } }, async (_req, reply) => {
    return reply.redirect("/documentation");
  });

  // Request logger
  await app.register(requestLogger);

  // API routes
  await app.register(apiRoutes, { prefix: "/api" });

  return app;
};

export default buildApp;
