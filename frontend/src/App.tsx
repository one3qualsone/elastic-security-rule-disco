import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

interface SearchResult {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  severity: string;
  confidence?: number;
}

interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
  timestamp: string;
}

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<SearchResponse>(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      setResults(response.data.results || []);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search for security rules. Please try again.');
      // Show mock data for development
      setResults([
        {
          id: 'mock-1',
          name: 'Sample AWS CloudTrail Rule',
          description: 'Detects suspicious activity in AWS CloudTrail logs for the queried integration',
          dataSource: 'aws.cloudtrail',
          severity: 'high',
          confidence: 0.9
        },
        {
          id: 'mock-2', 
          name: 'Sample Network Security Rule',
          description: 'Generic network security rule that matches your search query',
          dataSource: 'network.traffic',
          severity: 'medium',
          confidence: 0.75
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const formatSeverity = (severity: string): string => {
    return severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🛡️ Elastic Security Rule Discovery</h1>
        <p>Search for data sources to discover relevant Elastic Security detection rules</p>
      </header>

      <main className="main">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for data sources (e.g., 'aws cloudtrail', 'windows logs', 'nginx')"
              className="search-input"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              className="search-button"
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? '🔍 Searching...' : '🔍 Search Rules'}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {isLoading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Searching for relevant security rules...</p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="results">
            <h2>Found {results.length} relevant security rules</h2>
            <div className="rules-grid">
              {results.map((rule) => (
                <div key={rule.id} className="rule-card">
                  <h3 className="rule-title">{rule.name}</h3>
                  <p className="rule-description">{rule.description}</p>
                  <div className="rule-meta">
                    <div className="data-source">
                      <strong>Data Source:</strong> {rule.dataSource}
                    </div>
                    <div className="rule-badges">
                      <span 
                        className="severity-badge" 
                        style={{ backgroundColor: getSeverityColor(rule.severity) }}
                      >
                        {formatSeverity(rule.severity)}
                      </span>
                      {rule.confidence && (
                        <span className="confidence-badge">
                          {Math.round(rule.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isLoading && results.length === 0 && searchQuery && !error && (
          <div className="empty-state">
            <p>No security rules found for "{searchQuery}". Try a different search term.</p>
          </div>
        )}

        {!searchQuery && results.length === 0 && !error && (
          <div className="welcome-state">
            <p>Enter a data source above to discover relevant security rules</p>
            <div className="examples">
              <p><strong>Try searching for:</strong></p>
              <ul>
                <li>"aws cloudtrail" - AWS CloudTrail logs</li>
                <li>"windows security" - Windows Security events</li>
                <li>"nginx access" - Nginx access logs</li>
                <li>"kubernetes audit" - Kubernetes audit logs</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;