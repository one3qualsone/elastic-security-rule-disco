import express from 'express';
import dotenv from 'dotenv';
import { Octokit } from '@octokit/rest';
import { Client } from '@elastic/elasticsearch';

// Load environment variables
dotenv.config();

const app = express();
const port = 8081;

// Interfaces for our data structures
interface DetectionRule {
  id: string;
  name: string;
  description: string;
  query: string;
  language: 'kuery' | 'lucene' | 'eql';
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  tags: string[];
  references: string[];
  falsePositives: string[];
  threat: ThreatInfo[];
  requiredFields: string[];
  version: number;
  lastUpdated: string;
  author: string[];
  license: string;
  ruleSource: string;
  enabled: boolean;
  integration?: string[];
  maturity?: string;
  creationDate?: string;
  updatedDate?: string;
  from?: string;
  index?: string[];
  timestampOverride?: string;
  ruleId?: string;
  note?: string;
}

interface ThreatInfo {
  framework: string;
  tactic?: {
    id: string;
    name: string;
    reference: string;
  };
  technique?: {
    id: string;
    name: string;
    reference: string;
    subtechnique?: {
      id: string;
      name: string;
      reference: string;
    }[];
  }[];
}

interface SyncStats {
  totalFiles: number;
  processed: number;
  indexed: number;
  updated: number;
  skipped: number;
  errors: number;
  startTime: Date;
  endTime?: Date;
  lastCommitSha?: string;
  lastSyncTime?: string;
}

interface SyncState {
  lastCommitSha?: string;
  lastSyncTime?: string;
}

// Helper function to convert TOML dates to ISO format
function parseTomlDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  
  // Convert TOML date format "2024/07/25" to ISO format "2024-07-25"
  if (dateStr.match(/^\d{4}\/\d{2}\/\d{2}$/)) {
    return dateStr.replace(/\//g, '-');
  }
  
  // If it's already in ISO format, return as is
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return dateStr;
  }
  
  // Try to parse other formats
  try {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Return just YYYY-MM-DD
    }
  } catch (error) {
    console.warn(`⚠️  Could not parse date: ${dateStr}`);
  }
  
  return undefined;
}

// Initialize GitHub client - try with token first, fallback to public access
let githubClient: Octokit;
let useAuthentication = false;

try {
  if (process.env.GITHUB_TOKEN) {
    githubClient = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      request: { timeout: 30000 }
    });
    useAuthentication = true;
    console.log('✅ GitHub client initialized with authentication');
  } else {
    githubClient = new Octokit({
      request: { timeout: 30000 }
    });
    console.log('✅ GitHub client initialized for public access');
  }
} catch (error) {
  console.error('❌ Failed to initialize GitHub client:', error);
  // Initialize without auth as fallback
  githubClient = new Octokit({
    request: { timeout: 30000 }
  });
  console.log('⚠️  Using public GitHub access');
}

// Initialize Elasticsearch client
let esClient: Client | null = null;
try {
  if (process.env.ELASTIC_CLOUD_URL && process.env.ELASTIC_API_KEY) {
    esClient = new Client({
      node: process.env.ELASTIC_CLOUD_URL,
      auth: { apiKey: process.env.ELASTIC_API_KEY },
      requestTimeout: 60000,
      maxRetries: 3
    });
    console.log('✅ Elasticsearch client initialized');
  } else {
    console.warn('⚠️  Elasticsearch credentials not configured');
  }
} catch (error) {
  console.error('❌ Failed to initialize Elasticsearch:', error);
}

app.use(express.json());

// Global sync state
let currentSync: SyncStats | null = null;
let lastSyncResult: SyncStats | null = null;
const SYNC_STATE_INDEX = 'elastic-rule-sync-state';
const RULES_INDEX = 'elastic-security-rules';

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      sync: 'healthy',
      github: useAuthentication ? 'authenticated' : 'public-access',
      elasticsearch: 'unknown'
    },
    lastSync: lastSyncResult ? {
      timestamp: lastSyncResult.endTime,
      processed: lastSyncResult.processed,
      indexed: lastSyncResult.indexed,
      updated: lastSyncResult.updated,
      errors: lastSyncResult.errors,
      lastCommitSha: lastSyncResult.lastCommitSha
    } : null,
    currentSync: currentSync ? {
      running: true,
      progress: `${currentSync.processed}/${currentSync.totalFiles}`,
      errors: currentSync.errors
    } : { running: false }
  };

  if (esClient) {
    try {
      await esClient.ping();
      health.services.elasticsearch = 'healthy';
      
      try {
        const count = await esClient.count({ index: RULES_INDEX });
        health.services.elasticsearch = `healthy (${count.count} rules indexed)`;
      } catch (countError) {
        // Index might not exist yet
      }
    } catch (error) {
      health.services.elasticsearch = 'unhealthy';
      health.status = 'degraded';
    }
  }

  res.json(health);
});

// Test GitHub access endpoint
app.get('/api/test-github', async (req, res) => {
  try {
    const owner = process.env.GITHUB_OWNER || 'elastic';
    const repo = process.env.GITHUB_REPO || 'detection-rules';

    console.log(`🔍 Testing GitHub access to ${owner}/${repo}`);

    // Try to get repository info (this works for public repos without auth)
    const repoInfo = await githubClient.rest.repos.get({
      owner,
      repo
    });

    // Try to get some rule files to test access
    const contents = await githubClient.rest.repos.getContent({
      owner,
      repo,
      path: 'rules',
    });

    let fileCount = 0;
    if (Array.isArray(contents.data)) {
      fileCount = contents.data.filter(item => 
        item.type === 'file' && item.name.endsWith('.toml')
      ).length;
    }

    res.json({
      success: true,
      repository: {
        name: repoInfo.data.full_name,
        isPublic: !repoInfo.data.private,
        lastUpdated: repoInfo.data.updated_at,
        defaultBranch: repoInfo.data.default_branch
      },
      access: {
        authenticated: useAuthentication,
        canReadRules: true,
        ruleFilesFound: fileCount
      },
      message: 'GitHub access is working!'
    });

  } catch (error: any) {
    console.error('❌ GitHub access test failed:', error.message);
    
    res.status(500).json({
      success: false,
      error: error.message,
      authenticated: useAuthentication,
      suggestion: error.status === 403 ? 
        'Repository may require authentication or SAML SSO authorization' :
        'Check network connectivity and repository name'
    });
  }
});

// Get or create sync state
async function getSyncState(): Promise<SyncState> {
  if (!esClient) return {};

  try {
    const result = await esClient.get({
      index: SYNC_STATE_INDEX,
      id: 'current-state'
    });
    return result._source as SyncState;
  } catch (error) {
    return {};
  }
}

async function saveSyncState(state: SyncState): Promise<void> {
  if (!esClient) return;

  try {
    await esClient.index({
      index: SYNC_STATE_INDEX,
      id: 'current-state',
      body: {
        ...state,
        updatedAt: new Date().toISOString()
      },
      refresh: true
    });
  } catch (error) {
    console.error('❌ Failed to save sync state:', error);
  }
}

// Create indices
async function createElasticsearchIndices() {
  if (!esClient) throw new Error('Elasticsearch client not configured');

  // Create sync state index
  try {
    const stateExists = await esClient.indices.exists({ index: SYNC_STATE_INDEX });
    if (!stateExists) {
      await esClient.indices.create({
        index: SYNC_STATE_INDEX,
        body: {
          settings: { number_of_shards: 1, number_of_replicas: 0 },
          mappings: {
            properties: {
              lastCommitSha: { type: 'keyword' },
              lastSyncTime: { type: 'date' },
              updatedAt: { type: 'date' }
            }
          }
        }
      });
      console.log(`✅ Created sync state index: ${SYNC_STATE_INDEX}`);
    }
  } catch (error) {
    console.error('❌ Failed to create sync state index:', error);
  }

  // Create rules index
  try {
    const rulesExists = await esClient.indices.exists({ index: RULES_INDEX });
    if (!rulesExists) {
      await esClient.indices.create({
        index: RULES_INDEX,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                security_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'stop']
                }
              }
            }
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              name: { 
                type: 'text',
                analyzer: 'security_analyzer',
                fields: { keyword: { type: 'keyword' } }
              },
              description: { type: 'text', analyzer: 'security_analyzer' },
              query: { type: 'text', index: false },
              language: { type: 'keyword' },
              type: { type: 'keyword' },
              severity: { type: 'keyword' },
              riskScore: { type: 'integer' },
              tags: { type: 'keyword' },
              references: { type: 'keyword' },
              falsePositives: { type: 'text' },
              threat: {
                type: 'nested',
                properties: {
                  framework: { type: 'keyword' },
                  tactic: {
                    properties: {
                      id: { type: 'keyword' },
                      name: { type: 'keyword' },
                      reference: { type: 'keyword' }
                    }
                  },
                  technique: {
                    type: 'nested',
                    properties: {
                      id: { type: 'keyword' },
                      name: { type: 'keyword' },
                      reference: { type: 'keyword' }
                    }
                  }
                }
              },
              requiredFields: { type: 'keyword' },
              version: { type: 'integer' },
              lastUpdated: { type: 'date' },
              author: { type: 'keyword' },
              license: { type: 'keyword' },
              ruleSource: { type: 'keyword' },
              enabled: { type: 'boolean' },
              integration: { type: 'keyword' },
              maturity: { type: 'keyword' },
              creationDate: { type: 'date' },
              updatedDate: { type: 'date' },
              ruleId: { type: 'keyword' },
              note: { type: 'text' }
            }
          }
        }
      });
      console.log(`✅ Created rules index: ${RULES_INDEX}`);
    }
  } catch (error) {
    console.error('❌ Failed to create rules index:', error);
    throw error;
  }

  return RULES_INDEX;
}

function parseDetectionRule(content: string, filename: string): DetectionRule | null {
  try {
    const lines = content.split('\n');
    const rule: Partial<DetectionRule> = {
      id: filename.replace('.toml', ''),
      ruleSource: filename,
      lastUpdated: new Date().toISOString(),
      enabled: true,
      tags: [],
      references: [],
      falsePositives: [],
      threat: [],
      requiredFields: [],
      author: [],
      integration: [],
      index: []
    };

    let currentSection = '';
    let inMultilineString = false;
    let multilineBuffer = '';
    let inMetadataSection = false;
    let inRuleSection = false;
    let machineLearningJobId = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line || line.startsWith('#')) continue;

      // Track sections
      if (line === '[metadata]') {
        inMetadataSection = true;
        inRuleSection = false;
        continue;
      } else if (line === '[rule]') {
        inMetadataSection = false;
        inRuleSection = true;
        continue;
      } else if (line.startsWith('[[rule.')) {
        inMetadataSection = false;
        inRuleSection = false;
        continue;
      }

      // Handle multiline strings - FIXED
      if (line.includes('"""')) {
        if (inMultilineString) {
          // End of multiline string
          multilineBuffer += line.replace('"""', '');
          inMultilineString = false;
          
          if (currentSection === 'query') {
            rule.query = multilineBuffer.trim();
          } else if (currentSection === 'description') {
            rule.description = multilineBuffer.trim();
          } else if (currentSection === 'note') {
            rule.note = multilineBuffer.trim();
          }
          
          multilineBuffer = '';
          currentSection = '';
        } else {
          // Start of multiline string
          inMultilineString = true;
          multilineBuffer = line.replace('"""', '');
          
          // Better detection of what we're capturing
          const prevLines = lines.slice(Math.max(0, i-2), i);
          const context = prevLines.join(' ').toLowerCase();
          
          if (context.includes('query =')) currentSection = 'query';
          else if (context.includes('description =')) currentSection = 'description';
          else if (context.includes('note =')) currentSection = 'note';
        }
        continue;
      }

      if (inMultilineString) {
        multilineBuffer += '\n' + line;
        continue;
      }

      // Parse key-value pairs
      if (line.includes(' = ')) {
        const equalIndex = line.indexOf(' = ');
        const key = line.substring(0, equalIndex).trim();
        const value = line.substring(equalIndex + 3).trim();
        const cleanValue = value.replace(/^["']|["']$/g, '');

        // Metadata section
        if (inMetadataSection) {
          switch (key) {
            case 'creation_date':
              rule.creationDate = parseTomlDate(cleanValue);
              break;
            case 'updated_date':
              rule.updatedDate = parseTomlDate(cleanValue);
              break;
            case 'maturity':
              rule.maturity = cleanValue;
              break;
            case 'integration':
              rule.integration = parseArrayValue(value);
              break;
          }
        }

        // Rule section
        if (inRuleSection) {
          switch (key) {
            case 'name':
              rule.name = cleanValue;
              break;
            case 'description':
              if (!value.includes('"""')) rule.description = cleanValue;
              break;
            case 'query':
              if (!value.includes('"""')) rule.query = cleanValue;
              break;
            case 'language':
              rule.language = cleanValue as 'kuery' | 'lucene' | 'eql';
              break;
            case 'type':
              rule.type = cleanValue;
              break;
            case 'severity':
              rule.severity = cleanValue as 'low' | 'medium' | 'high' | 'critical';
              break;
            case 'risk_score':
              rule.riskScore = parseInt(cleanValue) || 0;
              break;
            case 'version':
              rule.version = parseInt(cleanValue) || 1;
              break;
            case 'license':
              rule.license = cleanValue;
              break;
            case 'rule_id':
              rule.ruleId = cleanValue;
              break;
            case 'from':
              rule.from = cleanValue;
              break;
            case 'timestamp_override':
              rule.timestampOverride = cleanValue;
              break;
            case 'note':
              if (!value.includes('"""')) rule.note = cleanValue;
              break;
            // ML-specific fields
            case 'machine_learning_job_id':
              machineLearningJobId = cleanValue;
              break;
            case 'anomaly_threshold':
              // Could store this as a special field if needed
              break;
            case 'tags':
              rule.tags = parseArrayValue(value);
              break;
            case 'references':
              rule.references = parseArrayValue(value);
              break;
            case 'author':
              rule.author = parseArrayValue(value);
              break;
            case 'false_positives':
              rule.falsePositives = parseArrayValue(value);
              break;
            case 'index':
              rule.index = parseArrayValue(value);
              break;
          }
        }
      }
    }

    // Handle ML rules - create synthetic query from ML job ID
    if (!rule.query && machineLearningJobId) {
      rule.query = `ML Job: ${machineLearningJobId}`;
      rule.type = rule.type || 'machine_learning';
      console.log(`✅ Processed ML rule: ${rule.name} (Job: ${machineLearningJobId})`);
    }

    // Extract required fields from query (skip for ML rules)
    if (rule.query && !machineLearningJobId && !rule.requiredFields?.length) {
      rule.requiredFields = extractFieldsFromQuery(rule.query);
    }

    // Enhanced validation - ML rules don't need traditional query
    const hasName = rule.name && rule.name.length > 0;
    const hasQuery = rule.query && rule.query.length > 0;
    const isMlRule = machineLearningJobId && machineLearningJobId.length > 0;
    
    if (!hasName || (!hasQuery && !isMlRule)) {
      console.warn(`⚠️  Skipping incomplete rule: ${filename} (missing name: ${!hasName}, missing query: ${!hasQuery}, ML job: ${machineLearningJobId || 'none'})`);
      return null;
    }

    return rule as DetectionRule;
  } catch (error) {
    console.error(`❌ Failed to parse ${filename}:`, error);
    return null;
  }
}

// ADD this helper function if you haven't already
function parseArrayValue(value: string): string[] {
  if (!value) return [];
  
  // Handle array format: ["item1", "item2", "item3"]
  if (value.includes('[') && value.includes(']')) {
    try {
      const arrayContent = value.substring(value.indexOf('[') + 1, value.lastIndexOf(']'));
      if (!arrayContent.trim()) return [];
      
      return arrayContent
        .split(',')
        .map(item => item.trim().replace(/^["']|["']$/g, ''))
        .filter(item => item.length > 0);
    } catch (error) {
      console.warn(`Could not parse array: ${value}`);
      return [];
    }
  }
  
  // Handle single value
  return [value.replace(/^["']|["']$/g, '')];
}

function extractFieldsFromQuery(query: string): string[] {
  const fields = new Set<string>();
  
  const fieldPatterns = [
    /(\w+\.\w+(?:\.\w+)*)/g,
    /\b([a-z_]+):/g,
  ];

  fieldPatterns.forEach(pattern => {
    const matches = query.match(pattern);
    if (matches) {
      matches.forEach(match => {
        const field = match.replace(':', '').trim();
        if (field && field.length > 2 && !field.includes(' ')) {
          fields.add(field);
        }
      });
    }
  });

  return Array.from(fields).slice(0, 20);
}

// Manual sync endpoint
app.post('/api/sync', async (req, res) => {
  const forceFullSync = req.body?.force === true;
  
  if (currentSync) {
    return res.status(409).json({
      success: false,
      message: 'Sync already in progress',
      currentProgress: `${currentSync.processed}/${currentSync.totalFiles}`
    });
  }

  console.log(`🔄 ${forceFullSync ? 'Full' : 'Incremental'} sync triggered`);
  
  performSync(forceFullSync).catch(error => {
    console.error('❌ Sync failed:', error);
    if (currentSync) {
      currentSync.errors++;
    }
  });

  res.json({ 
    success: true, 
    message: `${forceFullSync ? 'Full' : 'Incremental'} sync started`,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/sync/status', async (req, res) => {
  const syncState = await getSyncState();
  
  res.json({
    lastSync: lastSyncResult,
    currentSync: currentSync ? {
      running: true,
      progress: currentSync.processed,
      total: currentSync.totalFiles,
      errors: currentSync.errors,
      startTime: currentSync.startTime
    } : { running: false },
    syncState
  });
});

// Get all rule files from GitHub repository
async function getAllRuleFiles(owner: string, repo: string) {
  const allFiles: any[] = [];
  
  async function traverseDirectory(path: string) {
    try {
      const contents = await githubClient.rest.repos.getContent({
        owner,
        repo,
        path
      });

      if (Array.isArray(contents.data)) {
        for (const item of contents.data) {
          if (item.type === 'file' && item.name.endsWith('.toml') && item.download_url) {
            allFiles.push(item);
          } else if (item.type === 'dir' && allFiles.length < 1000) { // Limit to prevent infinite loops
            await traverseDirectory(item.path);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to traverse directory ${path}:`, error);
    }
  }

  await traverseDirectory('rules');
  return allFiles;
}

// Modified performSync to work with public repos
async function performSync(forceFullSync: boolean = false) {
  if (!esClient) {
    throw new Error('Elasticsearch client not configured');
  }

  const owner = process.env.GITHUB_OWNER || 'elastic';
  const repo = process.env.GITHUB_REPO || 'detection-rules';

  console.log(`📡 Starting ${forceFullSync ? 'full' : 'incremental'} sync from ${owner}/${repo}`);
  console.log(`🔐 Using ${useAuthentication ? 'authenticated' : 'public'} GitHub access`);

  currentSync = {
    totalFiles: 0,
    processed: 0,
    indexed: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
    startTime: new Date()
  };

  try {
    await createElasticsearchIndices();
    const syncState = await getSyncState();

    // Get repository information (works for public repos)
    const repoInfo = await githubClient.rest.repos.get({
      owner,
      repo
    });
    
    const currentCommitSha = repoInfo.data.id.toString(); // Use repo ID as simple change detection
    currentSync.lastCommitSha = currentCommitSha;

    console.log(`📊 Repository: ${repoInfo.data.full_name} (Public: ${!repoInfo.data.private})`);

    // Get all rule files
    const ruleFiles = await getAllRuleFiles(owner, repo);
    currentSync.totalFiles = ruleFiles.length;
    
    console.log(`📝 Found ${ruleFiles.length} rule files to process`);

    if (ruleFiles.length === 0) {
      throw new Error('No rule files found. Check repository access.');
    }

    // Process files in batches
    const batchSize = 5; // Smaller batches for public API
    for (let i = 0; i < ruleFiles.length; i += batchSize) {
      const batch = ruleFiles.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (file) => {
        try {
          const response = await fetch(file.download_url!);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const content = await response.text();
          const rule = parseDetectionRule(content, file.name);
          
          if (rule) {
            // Check if rule exists
            let isUpdate = false;
            try {
              await esClient!.get({ index: RULES_INDEX, id: rule.id });
              isUpdate = true;
            } catch (error) {
              // Rule doesn't exist
            }

            // Index to Elasticsearch with error handling
            try {
              await esClient!.index({
                index: RULES_INDEX,
                id: rule.id,
                body: rule,
                refresh: false
              });
              
              if (isUpdate) {
                currentSync!.updated++;
                console.log(`🔄 Updated rule: ${rule.name}`);
              } else {
                currentSync!.indexed++;
                console.log(`✅ Indexed new rule: ${rule.name}`);
              }
            } catch (indexError) {
              console.error(`❌ Failed to index ${rule.name}:`, indexError);
              currentSync!.errors++;
            }
          } else {
            currentSync!.skipped++;
            console.log(`⏭️  Skipped rule: ${file.name} (parsing failed or incomplete)`);
          }
          
          currentSync!.processed++;
          
        } catch (error: any) {
          currentSync!.errors++;
          console.error(`❌ Failed to process ${file.name}:`, error.message || error);
        }
      }));

      // Rate limiting for public API
      if (i + batchSize < ruleFiles.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      console.log(`📊 Progress: ${currentSync.processed}/${currentSync.totalFiles} (${currentSync.indexed} new, ${currentSync.updated} updated, ${currentSync.skipped} skipped, ${currentSync.errors} errors)`);
    }

    // Final refresh and save state
    await esClient.indices.refresh({ index: RULES_INDEX });
    
    await saveSyncState({
      lastCommitSha: currentCommitSha,
      lastSyncTime: new Date().toISOString()
    });

    currentSync.endTime = new Date();
    lastSyncResult = { ...currentSync };
    
    console.log(`✅ Sync completed! New: ${currentSync.indexed}, Updated: ${currentSync.updated}, Skipped: ${currentSync.skipped}, Errors: ${currentSync.errors}`);
    
  } catch (error) {
    console.error('❌ Sync failed:', error);
    if (currentSync) {
      currentSync.endTime = new Date();
      lastSyncResult = { ...currentSync };
    }
    throw error;
  } finally {
    currentSync = null;
  }
}

app.listen(port, '0.0.0.0', () => {
  console.log(`🔄 Sync service running on http://0.0.0.0:${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔍 Test GitHub access: http://localhost:${port}/api/test-github`);
  console.log(`🔄 Incremental sync: POST http://localhost:${port}/api/sync`);
  console.log(`🔄 Full sync: POST http://localhost:${port}/api/sync -d '{"force":true}'`);
  console.log(`📈 Sync status: GET http://localhost:${port}/api/sync/status`);
});