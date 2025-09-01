# Elastic Security Rule Intelligence Platform

A comprehensive platform that intelligently correlates customer data sources with relevant Elastic Security detection rules, providing smart recommendations and search capabilities.

## 🎯 Project Overview

This platform addresses a critical gap in the Elastic Security ecosystem by:
- **Intelligent Rule Discovery**: Automatically identifying relevant security rules based on customer data sources
- **Search-Driven Experience**: Modern search interface powered by Elasticsearch
- **Real-time Synchronisation**: Automatic updates from Elastic's detection rules repository
- **Integration-Focused**: Mapping data sources to applicable security rules with confidence scoring

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Frontend      │    │   Backend API    │    │   Elasticsearch     │
│   React + EUI   │◄──►│   Node.js + TS   │◄──►│   Cloud Instance    │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  GitHub Sync     │
                       │  Service         │
                       └──────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Elastic         │
                       │  Detection       │
                       │  Rules Repo      │
                       └──────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- Access to Elasticsearch Cloud instance
- GitHub Personal Access Token

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/your-username/elastic-rule-intelligence.git
cd elastic-rule-intelligence
```

2. Copy environment variables:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration values

4. Start development environment:
```bash
docker-compose up -d
```

### Development Workflow

```bash
# Install dependencies
npm run install:all

# Start frontend development
npm run dev:frontend

# Start backend development  
npm run dev:backend

# Run tests
npm test

# Build for production
npm run build
```

## 📁 Project Structure

```
├── frontend/                 # React + Elastic UI frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript definitions
│   ├── public/
│   └── package.json
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/    # API route controllers
│   │   ├── services/       # Business logic services
│   │   ├── middleware/     # Express middleware
│   │   ├── types/          # TypeScript definitions
│   │   └── utils/          # Utility functions
│   └── package.json
├── sync-service/           # GitHub synchronisation service
│   ├── src/
│   │   ├── github/         # GitHub API integration
│   │   ├── elasticsearch/  # Elasticsearch operations
│   │   └── processors/     # Rule processing logic
│   └── package.json
├── docker/                 # Docker configurations
├── docs/                   # Documentation
└── scripts/               # Utility scripts
```

## 🔧 Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Elastic UI** - Official Elastic design system
- **React Query** - Data fetching and caching
- **React Router** - Client-side routing

### Backend
- **Node.js** - Runtime environment  
- **TypeScript** - Type-safe server development
- **Express** - Web framework
- **Elasticsearch Client** - Official client library
- **Jest** - Testing framework

### Infrastructure
- **Docker** - Containerised development
- **Elasticsearch Cloud** - Search and storage
- **GitHub Actions** - CI/CD pipeline

## 📊 Features

### Core Features
- [x] Data source search interface
- [x] Integration discovery and filtering
- [x] Security rule correlation
- [x] Real-time GitHub synchronisation
- [ ] Rule confidence scoring
- [ ] Advanced search filters
- [ ] User analytics dashboard

### Future Enhancements  
- [ ] AI-powered rule recommendations
- [ ] Custom rule creation assistance
- [ ] Bulk rule export/import
- [ ] Integration with Elastic Fleet
- [ ] Multi-tenant support

## 🔍 Search Capabilities

The platform provides intelligent search across:
- **Data Source Integrations** - Find relevant Elastic integrations
- **Security Rules** - Discover applicable detection rules  
- **Documentation** - Access rule explanations and setup guides
- **Examples** - View configuration templates

## 🔄 GitHub Synchronisation

Automated synchronisation with [Elastic's Detection Rules repository](https://github.com/elastic/detection-rules):
- **Daily Updates** - Automatic pulls of rule changes
- **Incremental Processing** - Only processes modified files
- **Version Control** - Tracks rule versions and changes
- **Validation** - Ensures rule integrity before indexing

## 📈 Monitoring & Observability

- Application performance monitoring via Elastic APM
- Custom metrics for search performance and user behaviour
- Error tracking and alerting
- Usage analytics and insights

## 🧪 Testing

```bash
# Run all tests
npm test

# Frontend tests
npm run test:frontend

# Backend tests  
npm run test:backend

# Integration tests
npm run test:integration

# Coverage report
npm run coverage
```

## 📚 API Documentation

API documentation is available at `http://localhost:8080/docs` when running the development server.

Key endpoints:
- `GET /api/integrations/search` - Search data source integrations
- `GET /api/rules/search` - Search security rules
- `POST /api/correlate` - Correlate data source with rules
- `GET /api/sync/status` - GitHub sync status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Elastic](https://www.elastic.co/) for the incredible security detection rules
- [Elastic UI](https://elastic.github.io/eui/) for the design system
- The open-source community for inspiration and tools