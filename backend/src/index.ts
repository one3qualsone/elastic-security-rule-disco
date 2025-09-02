import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Client } from '@elastic/elasticsearch';

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'development' ? true : 'http://localhost:3000'
}));
app.use(express.json());

// Initialize Elasticsearch client
let esClient: Client | null = null;

try {
  if (process.env.ELASTIC_CLOUD_URL && process.env.ELASTIC_API_KEY) {
    esClient = new Client({
      node: process.env.ELASTIC_CLOUD_URL,
      auth: {
        apiKey: process.env.ELASTIC_API_KEY
      }
    });
    console.log('✅ Elasticsearch client initialized');
  } else {
    console.warn('⚠️  Elasticsearch credentials not configured');
  }
} catch (error) {
  console.error('❌ Failed to initialize Elasticsearch:', error);
}

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      api: 'healthy',
      elasticsearch: 'unknown'
    }
  };

  // Check Elasticsearch connection
  if (esClient) {
    try {
      await esClient.ping();
      health.services.elasticsearch = 'healthy';
      
      // Get rule count
      try {
        const count = await esClient.count({
          index: 'elastic-security-rules'
        });
        health.services.elasticsearch = `healthy (${count.count} rules indexed)`;
      } catch (countError) {
        // Index might not exist yet, that's ok
      }
      
    } catch (error) {
      health.services.elasticsearch = 'unhealthy';
      health.status = 'degraded';
    }
  }

  res.json(health);
});

// Search endpoint with Elasticsearch integration
app.get('/api/search', async (req, res) => {
  const query = req.query.q as string;
  const severity = req.query.severity as string;
  const limit = parseInt(req.query.limit as string) || 20;
  
  console.log(`🔍 Search request: "${query}" (severity: ${severity || 'any'})`);

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    let results: any[] = [];
    
    if (esClient) {
      // Build Elasticsearch query
      const esQuery: any = {
        bool: {
          should: [
            {
              multi_match: {
                query: query,
                fields: [
                  'name^3',           // Boost name matches
                  'description^2',    // Boost description matches  
                  'tags^1.5',        // Boost tag matches
                  'threat.tactic.name',
                  'threat.technique.name'
                ],
                type: 'best_fields',
                fuzziness: 'AUTO'
              }
            },
            {
              wildcard: {
                'name.keyword': `*${query.toLowerCase()}*`
              }
            }
          ],
          minimum_should_match: 1
        }
      };

      // Add severity filter if specified
      if (severity && ['low', 'medium', 'high', 'critical'].includes(severity)) {
        esQuery.bool.filter = [
          { term: { severity: severity } }
        ];
      }

      const searchResult = await esClient.search({
        index: 'elastic-security-rules',
        body: {
          query: esQuery,
          size: limit,
          sort: [
            { _score: { order: 'desc' } },
            { riskScore: { order: 'desc' } }
          ],
          highlight: {
            fields: {
              name: {},
              description: {},
              tags: {}
            },
            pre_tags: ['<mark>'],
            post_tags: ['</mark>']
          }
        }
      });

      results = searchResult.hits.hits.map((hit: any) => ({
        id: hit._source.id,
        name: hit._source.name,
        description: hit._source.description,
        dataSource: hit._source.requiredFields?.join(', ') || 'Unknown',
        severity: hit._source.severity,
        riskScore: hit._source.riskScore,
        confidence: Math.min(0.95, hit._score / 10), // Normalize score to confidence
        tags: hit._source.tags,
        query: hit._source.query,
        language: hit._source.language,
        type: hit._source.type,
        threat: hit._source.threat,
        references: hit._source.references,
        lastUpdated: hit._source.lastUpdated,
        version: hit._source.version,
        highlights: hit.highlight
      }));

      console.log(`✅ Found ${results.length} rules in Elasticsearch`);
    }

    // Fallback to mock data if Elasticsearch not available or no results
    if (results.length === 0) {
      console.log('📝 Using mock data (Elasticsearch not available or no results)');
      results = generateMockResults(query);
    }
    
    res.json({
      query,
      total: results.length,
      results: results,
      timestamp: new Date().toISOString(),
      source: results.length > 0 && esClient ? 'elasticsearch' : 'mock'
    });
  } catch (error) {
    console.error('Search error:', error);
    
    // Fallback to mock data on error
    const mockResults = generateMockResults(query);
    
    res.json({
      query,
      total: mockResults.length,
      results: mockResults,
      timestamp: new Date().toISOString(),
      source: 'mock',
      warning: 'Elasticsearch search failed, using mock data'
    });
  }
});

// Get rule by ID endpoint
app.get('/api/rules/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    if (esClient) {
      const result = await esClient.get({
        index: 'elastic-security-rules',
        id: id
      });
      
      res.json({
        success: true,
        rule: result._source
      });
    } else {
      res.status(503).json({ error: 'Elasticsearch not configured' });
    }
  } catch (error) {
    if (error.meta?.statusCode === 404) {
      res.status(404).json({ error: 'Rule not found' });
    } else {
      console.error('Get rule error:', error);
      res.status(500).json({ error: 'Failed to retrieve rule' });
    }
  }
});

// Get rule statistics
app.get('/api/stats', async (req, res) => {
  try {
    if (esClient) {
      const stats = await esClient.search({
        index: 'elastic-security-rules',
        body: {
          size: 0,
          aggs: {
            severity_breakdown: {
              terms: { field: 'severity' }
            },
            type_breakdown: {
              terms: { field: 'type' }
            },
            language_breakdown: {
              terms: { field: 'language' }
            },
            avg_risk_score: {
              avg: { field: 'riskScore' }
            },
            total_rules: {
              value_count: { field: 'id' }
            }
          }
        }
      });

      res.json({
        total: stats.hits.total.value,
        averageRiskScore: Math.round(stats.aggregations.avg_risk_score.value || 0),
        breakdown: {
          severity: stats.aggregations.severity_breakdown.buckets,
          type: stats.aggregations.type_breakdown.buckets,
          language: stats.aggregations.language_breakdown.buckets
        }
      });
    } else {
      res.json({
        total: 0,
        averageRiskScore: 0,
        breakdown: { severity: [], type: [], language: [] },
        warning: 'Elasticsearch not configured'
      });
    }
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Mock data generator for development/fallback
function generateMockResults(query: string) {
  const allRules = [
    {
      id: 'aws-cloudtrail-1',
      name: 'AWS CloudTrail Suspicious Console Login',
      description: 'Detects suspicious AWS Management Console login patterns indicating potential unauthorized access attempts.',
      dataSource: 'aws.cloudtrail, event.action, user.name',
      severity: 'high',
      riskScore: 75,
      confidence: 0.9,
      tags: ['AWS', 'Authentication', 'CloudTrail'],
      query: 'event.dataset:aws.cloudtrail and event.action:(AssumeRoleWithWebIdentity or AssumeRoleWithSAML)',
      language: 'kuery',
      type: 'query'
    },
    {
      id: 'aws-cloudtrail-2',
      name: 'AWS CloudTrail Root Account Usage',
      description: 'Detects usage of AWS root account which should be avoided for security best practices.',
      dataSource: 'aws.cloudtrail, user.type, aws.iam.user',
      severity: 'critical',
      riskScore: 95,
      confidence: 0.95,
      tags: ['AWS', 'Privilege Escalation', 'Root Account'],
      query: 'event.dataset:aws.cloudtrail and user.type:Root',
      language: 'kuery',
      type: 'query'
    },
    {
      id: 'windows-security-1',
      name: 'Windows Process Injection Detection',
      description: 'Detects process injection techniques commonly used by malware to evade detection.',
      dataSource: 'winlog.security, process.executable, process.pid',
      severity: 'high',
      riskScore: 80,
      confidence: 0.85,
      tags: ['Windows', 'Process Injection', 'Malware'],
      query: 'event.category:process and winlog.event_id:10',
      language: 'kuery',
      type: 'query'
    },
    {
      id: 'nginx-access-1',
      name: 'Nginx SQL Injection Attempt',
      description: 'Detects potential SQL injection attempts in Nginx access logs based on common attack patterns.',
      dataSource: 'nginx.access, http.request.method, url.original',
      severity: 'medium',
      riskScore: 60,
      confidence: 0.75,
      tags: ['Web Security', 'SQL Injection', 'Nginx'],
      query: 'event.dataset:nginx.access and url.original:(*SELECT* or *UNION* or *DROP*)',
      language: 'kuery',
      type: 'query'
    },
    {
      id: 'linux-auditd-1',
      name: 'Linux Privilege Escalation',
      description: 'Detects potential privilege escalation attempts on Linux systems through auditd events.',
      dataSource: 'auditd.log, user.id, process.executable',
      severity: 'critical',
      riskScore: 88,
      confidence: 0.88,
      tags: ['Linux', 'Privilege Escalation', 'Auditd'],
      query: 'event.dataset:auditd.log and auditd.data.syscall:(setuid or setgid)',
      language: 'kuery',
      type: 'query'
    }
  ];

  // Simple keyword matching for demo
  const lowerQuery = query.toLowerCase();
  return allRules.filter(rule => 
    rule.name.toLowerCase().includes(lowerQuery) ||
    rule.description.toLowerCase().includes(lowerQuery) ||
    rule.dataSource.toLowerCase().includes(lowerQuery) ||
    rule.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Backend API server running on http://0.0.0.0:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔍 Search API: http://localhost:${port}/api/search?q=aws`);
  console.log(`📈 Stats API: http://localhost:${port}/api/stats`);
});