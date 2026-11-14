import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import middie from '@fastify/middie';
import buildApp from './app';
import env from './config/env';
import logger from './lib/logger';
import notFoundHandler from './middleware/notFound';
import crawlService from './services/crawl.service';
import prisma from './lib/prisma';
import { connectMongoDB, disconnectMongoDB } from './lib/mongoose';

(async () => {
  // Connect to MongoDB
  await connectMongoDB();

  const app = await buildApp();

  // Startup recovery: mark previously RUNNING crawl runs as INTERRUPTED
  await crawlService.recoverDanglingRuns();

  // Standard robots.txt route for search engines and crawlers
  app.get('/robots.txt', async (_request, reply) => {
    return reply
      .header('Cache-Control', 'public, max-age=86400')
      .type('text/plain')
      .send('User-agent: *\nAllow: /\n');
  });

  if (env.NODE_ENV !== 'production') {
    // Dev: register middie and attach Vite middleware if client folder exists
    const clientRoot = path.resolve(__dirname, '../../client');
    const viteConfigPath = path.resolve(clientRoot, 'vite.config.ts');

    if (fs.existsSync(viteConfigPath)) {
      await app.register(middie);

      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        configFile: viteConfigPath,
        server: {
          middlewareMode: true,
          hmr: {
            server: app.server,
          },
        },
        appType: 'custom',
        root: clientRoot,
      });

      // Do not pass /api or /documentation requests through Vite middleware
      app.use((req, res, next) => {
        const url = req.url || '';
        if (url.startsWith('/api') || url.startsWith('/documentation') || url.startsWith('/docs')) {
          return next();
        }
        vite.middlewares(req, res, next);
      });

      // Fallback for HTML / SPA routing in development
      app.setNotFoundHandler(async (request, reply) => {
        const url = request.url.split('?')[0];
        if (
          url.startsWith('/api') ||
          url.startsWith('/documentation') ||
          url.startsWith('/docs') ||
          /\.(json|xml|txt|ico|png|jpg|jpeg|svg|map)$/i.test(url)
        ) {
          return notFoundHandler(request, reply);
        }
        try {
          const indexPath = path.resolve(clientRoot, 'index.html');
          if (fs.existsSync(indexPath)) {
            let template = fs.readFileSync(indexPath, 'utf-8');
            template = await vite.transformIndexHtml(request.url, template);
            return reply.status(200).type('text/html').send(template);
          }
          return notFoundHandler(request, reply);
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          return reply.status(500).send(e);
        }
      });
    }
  } else {
    // Prod: pure backend API server — do not serve frontend assets
    app.setNotFoundHandler(notFoundHandler);
  }

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    try {
      await app.close();
      await prisma.$disconnect();
      await disconnectMongoDB();
      logger.info('Server closed. Process terminated cleanly.');
      process.exit(0);
    } catch (err: any) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  logger.info(`Website Crawler Backend running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`API Base URL: http://localhost:${env.PORT}/api`);
  logger.info(`Swagger UI: http://localhost:${env.PORT}/documentation`);
})().catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
