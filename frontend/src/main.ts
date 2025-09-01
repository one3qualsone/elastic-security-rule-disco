import axios from 'axios';

// Types
interface SearchResult {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence?: number;
}

interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
  timestamp: string;
}

interface HealthResponse {
  status: string;
  timestamp: string;
  services: {
    api: string;
    elasticsearch: string;
  };
}

class ElasticRuleApp {
  private readonly apiBase = import.meta.env.DEV ? 'http://localhost:3001' : '';
  private readonly axiosClient = axios.create({
    baseURL: this.apiBase,
    timeout: 10000,
  });

  // DOM elements
  private searchForm = document.getElementById('searchForm') as HTMLFormElement;
  private searchInput = document.getElementById('searchInput') as HTMLInputElement;
  private searchButton = document.getElementById('searchButton') as HTMLButtonElement;
  private loading = document.getElementById('loading') as HTMLDivElement;
  private resultsSection = document.getElementById('resultsSection') as HTMLDivElement;
  private resultsTitle = document.getElementById('resultsTitle') as HTMLHeadingElement;
  private resultsContainer = document.getElementById('resultsContainer') as HTMLDivElement;
  private emptyState = document.getElementById('emptyState') as HTMLDivElement;
  private welcomeState = document.getElementById('welcomeState') as HTMLDivElement;
  private statusIndicator = document.getElementById('statusIndicator') as HTMLDivElement;

  constructor() {
    this.initializeEventListeners();
    this.checkBackendStatus();
    
    // Check status periodically
    setInterval(() => this.checkBackendStatus(), 30000);
  }

  private initializeEventListeners(): void {
    this.searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = this.searchInput.value.trim();
      if (query) {
        this.performSearch(query);
      }
    });
  }

  private async checkBackendStatus(): Promise<void> {
    this.statusIndicator.textContent = 'Checking...';
    this.statusIndicator.className = 'status status-loading';

    try {
      const response = await this.axiosClient.get<HealthResponse>('/health');
      
      if (response.data.status === 'ok') {
        this.statusIndicator.textContent = 'Backend Connected';
        this.statusIndicator.className = 'status status-connected';
      } else {
        throw new Error('Backend unhealthy');
      }
    } catch (error) {
      console.error('Backend health check failed:', error);
      this.statusIndicator.textContent = 'Backend Offline';
      this.statusIndicator.className = 'status status-error';
    }
  }

  private async performSearch(query: string): Promise<void> {
    if (!query.trim()) return;

    // Show loading state
    this.setLoadingState(true);
    this.hideAllStates();
    this.loading.style.display = 'block';

    try {
      const response = await this.axiosClient.get<SearchResponse>('/api/search', {
        params: { q: query }
      });

      console.log('Search response:', response.data);
      this.displayResults(response.data.results, query);

    } catch (error) {
      console.error('Search error:', error);
      
      // Show mock data on error for development
      const mockResults: SearchResult[] = [
        {
          id: 'dev-mock-1',
          name: `Sample Security Rule for "${query}"`,
          description: 'This is a mock rule shown when the backend is not available or search fails',
          dataSource: 'mock.logs',
          severity: 'medium'
        }
      ];
      
      this.displayResults(mockResults, query);
    } finally {
      this.setLoadingState(false);
      this.loading.style.display = 'none';
    }
  }

  private displayResults(results: SearchResult[], query: string): void {
    if (results.length === 0) {
      this.emptyState.style.display = 'block';
      return;
    }

    this.resultsTitle.textContent = `Found ${results.length} relevant security rules`;
    this.resultsContainer.innerHTML = '';

    results.forEach(rule => {
      const ruleCard = this.createRuleCard(rule);
      this.resultsContainer.appendChild(ruleCard);
    });

    this.resultsSection.style.display = 'block';
  }

  private createRuleCard(rule: SearchResult): HTMLElement {
    const card = document.createElement('div');
    card.className = 'rule-card';

    const title = document.createElement('h3');
    title.textContent = rule.name;

    const description = document.createElement('p');
    description.textContent = rule.description;

    const footer = document.createElement('div');
    footer.className = 'rule-footer';

    const dataSource = document.createElement('span');
    dataSource.className = 'data-source';
    dataSource.innerHTML = `Data Source: <strong>${rule.dataSource}</strong>`;

    const severityBadge = document.createElement('span');
    severityBadge.className = `severity-badge severity-${rule.severity}`;
    severityBadge.textContent = rule.severity.toUpperCase();

    footer.appendChild(dataSource);
    footer.appendChild(severityBadge);

    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(footer);

    return card;
  }

  private setLoadingState(isLoading: boolean): void {
    this.searchButton.disabled = isLoading;
    this.searchButton.textContent = isLoading ? 'Searching...' : 'Search Rules';
  }

  private hideAllStates(): void {
    this.resultsSection.style.display = 'none';
    this.emptyState.style.display = 'none';
    this.welcomeState.style.display = 'none';
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ElasticRuleApp();
});

export default ElasticRuleApp;