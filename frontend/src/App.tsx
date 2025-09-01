import React, { useState } from 'react';
import {
  EuiProvider,
  EuiPage,
  EuiPageBody,
  EuiPageSection,
  EuiTitle,
  EuiText,
  EuiSpacer,
  EuiFieldSearch,
  EuiButton,
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiLoadingSpinner
} from '@elastic/eui';

interface SearchResult {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  severity: string;
}

const App: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
      } else {
        console.error('Search failed:', response.statusText);
        // Mock data for now
        setResults([
          {
            id: '1',
            name: 'AWS CloudTrail Suspicious Activity',
            description: 'Detects suspicious activity in AWS CloudTrail logs',
            dataSource: 'aws.cloudtrail',
            severity: 'high'
          },
          {
            id: '2', 
            name: 'Windows Process Injection',
            description: 'Detects process injection techniques on Windows',
            dataSource: 'winlog.security',
            severity: 'critical'
          }
        ]);
      }
    } catch (error) {
      console.error('Search error:', error);
      // Show mock data on error for development
      setResults([
        {
          id: '1',
          name: 'Sample Security Rule',
          description: 'This is a sample rule for development testing',
          dataSource: 'sample.logs',
          severity: 'medium'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string): "default" | "primary" | "success" | "accent" | "warning" | "danger" => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'danger';
      case 'high': return 'warning';
      case 'medium': return 'primary';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <EuiProvider colorMode="light">
      <EuiPage paddingSize="l">
        <EuiPageBody>
          <EuiPageSection>
            <EuiTitle size="l">
              <h1>🛡️ Elastic Security Rule Intelligence</h1>
            </EuiTitle>
            <EuiSpacer />
            <EuiText>
              <p>Search for data sources to discover relevant Elastic Security detection rules</p>
            </EuiText>
            <EuiSpacer size="l" />

            {/* Search Interface */}
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiFieldSearch
                  placeholder="Search for data sources (e.g., 'aws cloudtrail', 'windows logs', 'nginx')"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onSearch={handleSearch}
                  isClearable={true}
                  isLoading={isLoading}
                />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiButton 
                  fill 
                  onClick={handleSearch}
                  isLoading={isLoading}
                  disabled={!searchQuery.trim()}
                >
                  Search Rules
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>

            <EuiSpacer size="l" />

            {/* Loading State */}
            {isLoading && (
              <EuiFlexGroup justifyContent="center">
                <EuiFlexItem grow={false}>
                  <EuiLoadingSpinner size="l" />
                  <EuiSpacer size="s" />
                  <EuiText textAlign="center">
                    <p>Searching for relevant security rules...</p>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            )}

            {/* Search Results */}
            {!isLoading && results.length > 0 && (
              <>
                <EuiTitle size="m">
                  <h2>Found {results.length} relevant security rules</h2>
                </EuiTitle>
                <EuiSpacer />
                <EuiFlexGroup direction="column">
                  {results.map((rule) => (
                    <EuiFlexItem key={rule.id}>
                      <EuiCard
                        title={rule.name}
                        description={rule.description}
                        footer={
                          <EuiFlexGroup justifyContent="spaceBetween" alignItems="center">
                            <EuiFlexItem grow={false}>
                              <EuiText size="s" color="subdued">
                                Data Source: <strong>{rule.dataSource}</strong>
                              </EuiText>
                            </EuiFlexItem>
                            <EuiFlexItem grow={false}>
                              <EuiBadge color={getSeverityColor(rule.severity)}>
                                {rule.severity.toUpperCase()}
                              </EuiBadge>
                            </EuiFlexItem>
                          </EuiFlexGroup>
                        }
                      />
                    </EuiFlexItem>
                  ))}
                </EuiFlexGroup>
              </>
            )}

            {/* Empty State */}
            {!isLoading && results.length === 0 && searchQuery && (
              <EuiText textAlign="center">
                <p>No security rules found for "{searchQuery}". Try a different search term.</p>
              </EuiText>
            )}

            {/* Welcome State */}
            {!searchQuery && results.length === 0 && (
              <EuiText textAlign="center" color="subdued">
                <p>Enter a data source above to discover relevant security rules</p>
                <EuiSpacer size="s" />
                <p><strong>Examples:</strong> "aws cloudtrail", "windows security", "nginx access logs"</p>
              </EuiText>
            )}
          </EuiPageSection>
        </EuiPageBody>
      </EuiPage>
    </EuiProvider>
  );
};

export default App;