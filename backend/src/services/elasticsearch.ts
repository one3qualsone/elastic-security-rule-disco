import { Client } from '@elastic/elasticsearch';

export class ElasticsearchService {
  private client: Client;
  private readonly indexName = 'security-rules';

  constructor() {
    // Configure for Elastic Cloud
    const cloudConfig: any = {
      node: process.env.ELASTIC_CLOUD_URL,
      tls: {
        rejectUnauthorized: true
      }
    };

    // Use API Key if provided (recommended)
    if (process.env.ELASTIC_API_KEY) {
      cloudConfig.auth = {
        apiKey: process.env.ELASTIC_API_KEY
      };
      console.log('🔑 Using Elastic API Key authentication');
    } else if (process.env.ELASTIC_USERNAME && process.env.ELASTIC_PASSWORD) {
      // Fallback to username/password
      cloudConfig.auth = {
        username: process.env.ELASTIC_USERNAME,
        password: process.env.ELASTIC_PASSWORD
      };
      console.log('👤 Using username/password authentication');
    } else {
      throw new Error('❌ No Elastic authentication provided. Set either ELASTIC_API_KEY or ELASTIC_USERNAME/ELASTIC_PASSWORD');
    }

    this.client = new Client(cloudConfig);
    
    this.ensureIndex();
  }

  private async ensureIndex() {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      
      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                rule_id: { type: 'keyword' },
                name: { type: 'text', analyzer: 'standard' },
                description: { type: 'text', analyzer: 'standard' },
                severity: { type: 'keyword' },
                risk_score: { type: 'integer' },
                author: { type: 'keyword' },
                license: { type: 'keyword' },
                type: { type: 'keyword' },
                query: { type: 'text' },
                language: { type: 'keyword' },
                index: { type: 'keyword' },
                data_source: { type: 'keyword' },
                integrations: { type: 'keyword' },
                tags: { type: 'keyword' },
                references: { type: 'keyword' },
                false_positives: { type: 'text' },
                threat: { type: 'object' },
                timeline_id: { type: 'keyword' },
                timeline_title: { type: 'text' },
                version: { type: 'integer' },
                created_date: { type: 'date' },
                updated_date: { type: 'date' },
                file_path: { type: 'keyword' },
                from: { type: 'keyword' },
                interval: { type: 'keyword' },
                max_signals: { type: 'integer' },
                building_block_type: { type: 'keyword' }
              }
            }
          }
        });
        console.log('✅ Created index: security-rules');
      } else {
        console.log('✅ Index already exists: security-rules');
      }
    } catch (error) {
      console.error('❌ Error creating index:', error);
      throw error;
    }
  }

  async indexRule(rule: any) {
    try {
      await this.client.index({
        index: this.indexName,
        id: rule.rule_id,
        body: rule
      });
    } catch (error) {
      console.error('❌ Error indexing rule:', error);
      throw error;
    }
  }

  async bulkIndexRules(rules: any[]) {
    try {
      const body = rules.flatMap(rule => [
        { index: { _index: this.indexName, _id: rule.rule_id } },
        rule
      ]);

      const response = await this.client.bulk({ body });
      
      if (response.errors) {
        console.error('❌ Bulk indexing errors:', response.items);
      } else {
        console.log(`✅ Successfully indexed ${rules.length} rules`);
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error bulk indexing rules:', error);
      throw error;
    }
  }

  async searchRules(query: string, filters: any = {}) {
    try {
      const searchBody: any = {
        query: {
          bool: {
            must: [],
            filter: []
          }
        },
        size: 50,
        sort: [{ risk_score: { order: 'desc' } }]
      };

      // Add text search if query provided
      if (query && query.trim()) {
        searchBody.query.bool.must.push({
          multi_match: {
            query: query,
            fields: ['name^3', 'description^2', 'tags', 'integrations', 'data_source'],
            type: 'best_fields',
            fuzziness: 'AUTO'
          }
        });
      } else {
        searchBody.query.bool.must.push({ match_all: {} });
      }

      // Add filters
      if (filters.severity) {
        searchBody.query.bool.filter.push({ term: { severity: filters.severity } });
      }
      if (filters.type) {
        searchBody.query.bool.filter.push({ term: { type: filters.type } });
      }
      if (filters.integrations) {
        searchBody.query.bool.filter.push({ term: { integrations: filters.integrations } });
      }

      const response = await this.client.search({
        index: this.indexName,
        body: searchBody
      });

      return {
        hits: response.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          ...hit._source
        })),
        total: response.hits.total
      };
    } catch (error) {
      console.error('❌ Error searching rules:', error);
      throw error;
    }
  }

  async getAggregations() {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          size: 0,
          aggs: {
            by_severity: { terms: { field: 'severity', size: 10 } },
            by_type: { terms: { field: 'type', size: 10 } },
            by_integrations: { terms: { field: 'integrations', size: 20 } },
            by_data_source: { terms: { field: 'data_source', size: 20 } }
          }
        }
      });

      return response.aggregations;
    } catch (error) {
      console.error('❌ Error getting aggregations:', error);
      throw error;
    }
  }

  async deleteAllRules() {
    try {
      await this.client.deleteByQuery({
        index: this.indexName,
        body: {
          query: { match_all: {} }
        }
      });
      console.log('✅ Deleted all rules from index');
    } catch (error) {
      console.error('❌ Error deleting rules:', error);
      throw error;
    }
  }
}