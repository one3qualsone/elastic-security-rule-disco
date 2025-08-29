import { FastifyInstance } from 'fastify';
import { ElasticsearchService } from '../services/elasticsearch';

export async function rulesRoutes(fastify: FastifyInstance) {
  const esService = new ElasticsearchService();
  
  // Get all rules
  fastify.get('/rules', async (request, reply) => {
    try {
      const { search, limit = 50 } = request.query as { search?: string; limit?: number };
      
      const rules = await esService.searchRules(search, limit);
      return { rules, total: rules.length };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch rules' });
    }
  });

  // Get single rule
  fastify.get('/rules/:id', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const rule = await esService.getRuleById(id);
      
      if (!rule) {
        reply.status(404).send({ error: 'Rule not found' });
        return;
      }
      
      return { rule };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to fetch rule' });
    }
  });

  // Seed some sample data (for development)
  fastify.post('/rules/seed', async (request, reply) => {
    try {
      await esService.seedSampleRules();
      return { message: 'Sample rules seeded successfully' };
    } catch (error) {
      fastify.log.error(error);
      reply.status(500).send({ error: 'Failed to seed rules' });
    }
  });
}
