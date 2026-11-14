import { FastifyPluginAsync } from 'fastify';
import healthRoutes from './healthRoutes';
import crawlerRoutes from './crawlerRoutes';
import crawlRunRoutes from './crawlRunRoutes';
import chatRoutes from './chatRoutes';
import searchRoutes from './searchRoutes';

/**
 * Main API Routes Aggregator Plugin.
 *
 * All routes registered here are mounted under the '/api' prefix in app.ts.
 *
 * Route Mapping:
 * - /api                     -> Welcome message
 * - /api/health              -> Health & liveness probe
 * - /api/ready               -> Readiness check (PostgreSQL + Qdrant)
 * - /api/crawlers            -> Crawler configuration CRUD & crawl trigger operations
 * - /api/crawl-runs          -> Crawl run inspection & live progress polling
 * - /api/chat                -> AI chat completions
 * - /api/search              -> Semantic Vector Search

 */
const apiRoutes: FastifyPluginAsync = async (fastify) => {
  // Base welcome endpoint
  fastify.get(
    '/',
    {
      schema: {
        tags: ['General'],
        summary: 'API welcome endpoint',
        description: 'Returns API status and documentation entry point.',
        response: {
          200: {
            description: 'API information',
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              documentation: { type: 'string' },
            },
          },
        },
      },
    },
    async (_req, reply) => {
      return reply.status(200).send({
        success: true,
        message: 'Website Crawler & Vector Indexer Backend API',
        documentation: '/documentation',
      });
    }
  );

  // Health and Readiness probes
  await fastify.register(healthRoutes, { prefix: '/health' });

  // Direct alias for readiness check: /api/ready
  fastify.get(
    '/ready',
    {
      schema: {
        tags: ['Health'],
        summary: 'Readiness check redirect',
        description: 'Convenience alias redirecting directly to /api/health/ready',
        response: {
          302: {
            description: 'Redirect to /api/health/ready',
            type: 'null',
          },
        },
      },
    },
    async (_req, reply) => {
      return reply.redirect('/api/health/ready');
    }
  );

  // Website Crawler Management & Crawl Operations (/api/crawlers)
  await fastify.register(crawlerRoutes, { prefix: '/crawlers' });

  // Crawl Run Progress, Monitoring & Page Logs (/api/crawl-runs)
  await fastify.register(crawlRunRoutes, { prefix: '/crawl-runs' });

  // Retain existing agent / chat endpoints for backward compatibility
  await fastify.register(chatRoutes, { prefix: '/chat' });

  // Semantic Vector Search (/api/search)
  await fastify.register(searchRoutes, { prefix: '/search' });
};

export default apiRoutes;
