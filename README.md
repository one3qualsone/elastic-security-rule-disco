# Elastic Security Rules Browser

A web application to browse and search real Elastic Security detection rules from GitHub using Elastic Cloud.

## Features

- 🔍 Search real detection rules from Elastic's GitHub repo
- 📊 View rule details including severity, MITRE tactics/techniques  
- 🎨 Native Elastic UI design
- ⚡ Fast search powered by Elastic Cloud
- 🔄 Real-time sync with GitHub repository

## Setup

### 1. Create Elastic Cloud Deployment
- Go to [Elastic Cloud](https://cloud.elastic.co/)
- Create a free deployment
- Copy your Cloud ID and credentials

### 2. Get GitHub Token (Optional but Recommended)
- Go to GitHub Settings > Developer settings > Personal access tokens
- Create a token with `public_repo` access
- This avoids rate limiting when syncing rules

### 3. Configure Environment
Update `.env` with your credentials:
```bash
# Elastic Cloud Configuration  
ELASTIC_CLOUD_URL=https://your-deployment.es.region.cloud.es.io:443

# Use EITHER API key (recommended):
ELASTIC_API_KEY=your-base64-encoded-api-key

# OR username/password:
# ELASTIC_USERNAME=elastic
# ELASTIC_PASSWORD=your-password

# GitHub Integration (optional - avoids rate limits)
GITHUB_TOKEN=your-github-personal-access-token
```

### 4. Start Application
```bash
npm run dev
```

### 5. Sync Rules
- Visit http://localhost:3000
- Click "Sync from GitHub" to load real detection rules
- Wait for sync to complete (may take 1-2 minutes)

## Services

- **Frontend**: http://localhost:3000 (React + Elastic UI)
- **Backend API**: http://localhost:3001 (Node.js + Fastify)
- **Elastic Cloud**: Your deployment URL

## API Endpoints

- `GET /api/rules` - Get all rules (with optional `?search=term`)
- `GET /api/rules/:id` - Get specific rule
- `POST /api/rules/sync` - Sync rules from GitHub
- `GET /api/rules/sync/status` - Check sync status

## What Gets Synced

Real detection rules from [elastic/detection-rules](https://github.com/elastic/detection-rules):
- Windows security rules
- AWS CloudTrail rules  
- Network security rules
- Endpoint detection rules
- MITRE ATT&CK mappings
- And 800+ more!

## Commands

- `npm run dev` - Start development environment
- `npm run stop` - Stop all services
- `npm run clean` - Stop and remove all data
- `npm run logs` - View all service logs