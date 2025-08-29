import Fastify from 'fastify';
import cors from '@fastify/cors';
import { rulesRoutes } from './routes/rules';
import 'dotenv/config';

const fastify = Fastify({ logger: true });

async function start() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: ['http://localhost:3000'],
      credentials: true
    });

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register routes
    await fastify.register(rulesRoutes, { prefix: '/api' });

    // Start server
    const port = parseInt(process.env.PORT || '3001');
    await fastify.listen({ port, host: '0.0.0.0' });
    
    console.log(`🚀 Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
