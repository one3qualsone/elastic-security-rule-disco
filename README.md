# Elastic Security Rule Discovery Platform

A simple platform for discovering relevant Elastic Security detection rules based on data source integrations.

## Overview

This application helps security teams discover which Elastic Security detection rules they should enable based on their data sources. Users can search for integrations (like "aws cloudtrail", "windows logs", "nginx") and get a list of relevant security rules.

## Architecture

- **Frontend**: React + Vite (simple UI, no complex dependencies)
- **Backend**: Node.js/Express API with mock data
- **Sync Service**: Service to sync rules from Elastic's detection-rules repository
- **Nginx**: Reverse proxy for routing
- **Redis**: Caching layer

## Quick Start

1. **Clone and setup**:
   ```bash
   git clone <your-repo>
   cd elastic-security-rule-disco
   ```

2. **Start the application**:
   ```bash
   npm run dev
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Sync Service: http://localhost:8081
   - Nginx Proxy: http://localhost

## Development

### Available Scripts
- `npm run dev` - Start all services with Docker Compose
- `npm run dev:logs` - View logs from all services
- `npm run down` - Stop all services
- `npm run clean` - Stop services and clean up volumes

### API Endpoints

**Backend (Port 3001)**
- `GET /health` - Health check
- `GET /api/search?q=<query>` - Search for security rules

**Sync Service (Port 8081)**
- `GET /health` - Health check  
- `POST /api/sync` - Manually trigger sync from GitHub
- `GET /api/sync/status` - Get sync status

### Testing the API

```bash
# Test backend health
curl http://localhost:3001/health

# Search for AWS rules
curl "http://localhost:3001/api/search?q=aws"

# Test sync service
curl http://localhost:8081/health
```

## Configuration

Currently using mock data for development. To connect to real Elasticsearch:

1. Create `.env` file:
   ```
   ELASTIC_CLOUD_URL=https://your-elastic-cloud-url
   ELASTIC_API_KEY=your-api-key
   GITHUB_TOKEN=your-github-token
   ```

2. Update the sync service to actually sync rules from GitHub
3. Update the backend to query real Elasticsearch data

## Next Steps

1. **Connect to real Elasticsearch**:
   - Set up Elastic Cloud credentials
   - Index actual security rules
   - Implement real search functionality

2. **Improve the sync service**:
   - Parse TOML rule files from elastic/detection-rules
   - Index rules with proper mapping
   - Set up automatic syncing

3. **Enhance the frontend**:
   - Add filtering by severity/data source
   - Add rule details view
   - Implement EUI components for better UX
   - Add rule export functionality

4. **Production setup**:
   - Add proper error handling
   - Implement authentication
   - Add monitoring and logging
   - Set up CI/CD pipeline

## Project Structure

```
├── frontend/          # React frontend (Vite)
├── backend/           # Node.js API server
├── sync-service/      # Rule synchronization service
├── config/            # Nginx configuration
├── docker-compose.yml # Docker services
└── README.md         # This file
```

## Current Status

✅ **Working**:
- All Docker services running
- Frontend displays and searches mock data
- Backend API working with mock responses
- Sync service ready for GitHub integration
- Nginx proxy routing requests correctly

🚧 **Next (Immediate)**:
- Connect to real Elasticsearch instance
- Implement actual rule syncing from GitHub
- Parse and index detection rules properly

🔮 **Future**:
- Advanced search and filtering
- Rule recommendation engine
- User authentication and preferences
- Rule management features