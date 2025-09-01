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
    } catch (error) {
      health.services.elasticsearch = 'unhealthy';
      health.status = 'degraded';
    }
  }

  res.json(health);
});

// Search endpoint (placeholder)
app.get('/api/search', async (req, res) => {
  const query = req.query.q as string;
  
  console.log(`🔍 Search request: "${query}"`);

  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    // TODO: Replace with actual Elasticsearch search
    // For now, return mock data based on query
    const mockResults = generateMockResults(query);
    
    res.json({
      query,
      total: mockResults.length,
      results: mockResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Mock data generator for development
function generateMockResults(query: string) {
  const allRules = [
    {
      id: 'aws-cloudtrail-1',
      name: 'AWS CloudTrail Suspicious Console Login',
      description: 'Detects suspicious AWS Management Console login patterns',
      dataSource: 'aws.cloudtrail',
      severity: 'high',
      confidence: 0.9
    },
    {
      id: 'aws-cloudtrail-2',
      name: 'AWS CloudTrail Root Account Usage',
      description: 'Detects usage of AWS root account',
      dataSource: 'aws.cloudtrail',
      severity: 'critical',
      confidence: 0.95
    },
    {
      id: 'windows-security-1',
      name: 'Windows Process Injection Detection',
      description: 'Detects process injection techniques on Windows systems',
      dataSource: 'winlog.security',
      severity: 'high',
      confidence: 0.85
    },
    {
      id: 'nginx-access-1',
      name: 'Nginx SQL Injection Attempt',
      description: 'Detects potential SQL injection attempts in Nginx access logs',
      dataSource: 'nginx.access',
      severity: 'medium',
      confidence: 0.75
    },
    {
      id: 'linux-auditd-1',
      name: 'Linux Privilege Escalation',
      description: 'Detects potential privilege escalation on Linux systems',
      dataSource: 'auditd.log',
      severity: 'critical',
      confidence: 0.88
    }
  ];

  // Simple keyword matching for demo
  const lowerQuery = query.toLowerCase();
  return allRules.filter(rule => 
    rule.name.toLowerCase().includes(lowerQuery) ||
    rule.description.toLowerCase().includes(lowerQuery) ||
    rule.dataSource.toLowerCase().includes(lowerQuery)
  );
}

// API routes
app.get('/api/rules', async (req, res) => {
  // TODO: Get all rules from Elasticsearch
  res.json({ message: 'Rules endpoint - coming soon!' });
});

app.get('/api/integrations', async (req, res) => {
  // TODO: Get all integrations from Elasticsearch  
  res.json({ message: 'Integrations endpoint - coming soon!' });
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Backend API server running on http://0.0.0.0:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔍 Search API: http://localhost:${port}/api/search?q=aws`);
});