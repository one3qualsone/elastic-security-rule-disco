import express from 'express';
import dotenv from 'dotenv';
import cron from 'node-cron';
import { Octokit } from '@octokit/rest';
import { Client } from '@elastic/elasticsearch';

// Load environment variables
dotenv.config();

const app = express();
const port = 8081;

// Initialize GitHub client
let githubClient: Octokit | null = null;
if (process.env.GITHUB_TOKEN) {
  githubClient = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });
  console.log('✅ GitHub client initialized');
} else {
  console.warn('⚠️  GitHub token not configured');
}

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

app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      sync: 'healthy',
      github: githubClient ? 'configured' : 'not configured',
      elasticsearch: 'unknown'
    },
    lastSync: null as string | null,
    note: 'Auto-sync disabled for development'
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

// Manual sync endpoint for testing
app.post('/api/sync', async (req, res) => {
  console.log('🔄 Manual sync triggered');
  
  try {
    await performSync();
    res.json({ 
      success: true, 
      message: 'Sync completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Sync failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Sync failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Get sync status
app.get('/api/sync/status', async (req, res) => {
  res.json({
    lastSync: null,
    totalRules: 0,
    status: 'ready',
    autoSync: false,
    message: 'Auto-sync disabled for development. Use POST /api/sync to manually sync.'
  });
});

async function performSync() {
  if (!githubClient) {
    throw new Error('GitHub client not configured');
  }

  const owner = process.env.GITHUB_OWNER || 'elastic';
  const repo = process.env.GITHUB_REPO || 'detection-rules';
  const branch = process.env.GITHUB_BRANCH || 'main';

  console.log(`📡 Syncing from ${owner}/${repo}@${branch}`);

  try {
    // Get repository information
    const repoInfo = await githubClient.rest.repos.get({
      owner,
      repo
    });

    console.log(`📊 Repository: ${repoInfo.data.full_name}`);
    console.log(`📅 Last updated: ${repoInfo.data.updated_at}`);

    // Get the contents of the rules directory
    const contents = await githubClient.rest.repos.getContent({
      owner,
      repo,
      path: 'rules',
      ref: branch
    });

    if (Array.isArray(contents.data)) {
      console.log(`📁 Found ${contents.data.length} items in rules directory`);
      
      // Filter for .toml files (Elastic detection rules format)
      const ruleFiles = contents.data.filter(
        item => item.type === 'file' && item.name?.endsWith('.toml')
      );

      console.log(`📝 Found ${ruleFiles.length} rule files`);

      // Process a few rule files for demonstration
      let processedCount = 0;
      for (const file of ruleFiles.slice(0, 5)) { // Only process first 5 for demo
        if (file.download_url) {
          try {
            const response = await fetch(file.download_url);
            const content = await response.text();
            
            console.log(`📄 Processing rule file: ${file.name}`);
            // TODO: Parse TOML content and index to Elasticsearch
            processedCount++;
          } catch (error) {
            console.error(`❌ Failed to process ${file.name}:`, error);
          }
        }
      }

      console.log(`✅ Processed ${processedCount} rule files`);
    }

  } catch (error) {
    console.error('❌ GitHub API error:', error);
    throw error;
  }
}

// Schedule disabled for development
// const syncInterval = process.env.SYNC_INTERVAL_HOURS || '24';
// const cronExpression = `0 2 */${syncInterval} * *`;

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`🔄 Sync service running on http://0.0.0.0:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔄 Manual sync: POST http://localhost:${port}/api/sync`);
  console.log(`⚠️  Auto-sync disabled for development`);
  
  // Disabled automatic initial sync
  console.log('ℹ️  Use POST /api/sync to manually trigger sync when ready');
});