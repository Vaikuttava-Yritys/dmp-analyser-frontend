# DMP Analyser Production Architecture

## Overview

The DMP Analyser system consists of three main components that need to be deployed in the client's Azure environment:

1. **API Backend**: Hosted on Azure Container Apps
2. **Database**: MongoDB Atlas cloud service (can be migrated to Azure CosmosDB)
3. **Frontend**: Hosted on Azure Static Web Apps

This document provides a comprehensive guide for Azure administrators to deploy and maintain the DMP Analyser system in their own Azure environment.

## Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   Frontend      │────▶│   API Backend   │────▶│   Database      │
│   Azure Static  │     │   Azure         │     │   MongoDB Atlas │
│   Web Apps      │◀────│   Container Apps│◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │                 │
                        │   LLM Services  │
                        │   (OpenAI &     │
                        │   Anthropic)    │
                        └─────────────────┘
```

## Components

### Frontend (Azure Static Web Apps)

- **Technology**: Static HTML/CSS/JS
- **Hosting**: Azure Static Web Apps
- **Current Demo URL**: https://green-plant-0d15bda03.6.azurestaticapps.net
- **Deployment Requirements**:
  - Azure Static Web Apps service (Standard plan recommended)
  - GitHub repository access for CI/CD integration
  - Custom domain (optional)
- **Features**:
  - Simple DMP analysis interface
  - Results viewing with PDF export capability
  - Shareable result links via access tokens
- **Resource Requirements**:
  - Standard tier recommended for production use
  - No additional compute resources needed

### API Backend (Azure Container Apps)

- **Technology**: Python FastAPI
- **Hosting**: Azure Container Apps
- **Current Demo URL**: https://reproai-app.lemondune-e106e75a.westeurope.azurecontainerapps.io
- **Container Image**: ghcr.io/juusorepo/reproai-v2:v2-20250608 (latest version)
- **Deployment Requirements**:
  - Azure Container Apps environment
  - Container listening on port 8002
  - 1.0 CPU cores minimum, 2.0 GB memory minimum
  - Ingress enabled with external traffic
  - Environment variables (see Environment Configuration section)
- **Key Services**:
  - Analysis orchestration
  - Document processing
  - LLM integration (requires API keys)
  - PDF generation
  - Token-based authentication for results viewing

### Database (MongoDB Atlas, later in Azure CosmosDB)
- **Technology**: MongoDB
- **Current Hosting**: MongoDB Atlas cloud service
- **Migration Options**: Can be migrated to Azure CosmosDB with MongoDB API
- **Deployment Requirements**:
  - MongoDB Atlas account or Azure CosmosDB instance
  - MongoDB version 4.4 or higher
  - Connection string with authentication
  - Network security rules to allow connections from Azure Container Apps
- **Data Storage**:
  - Stores analysis results
  - Manages user manuscripts
  - Stores system configurations
  - Maintains access tokens for shared results
- **Resource Requirements**:
  - Minimum M10 tier on MongoDB Atlas or equivalent
  - 10GB storage minimum (scales with usage)

## Integration Points

1. **Frontend to API**: 
   - REST API calls for analysis submission and result retrieval
   - Token-based authentication for accessing shared results
   - CORS configuration required (see Environment Configuration section)

2. **API to Database**:
   - Asynchronous MongoDB connections
   - Data storage and retrieval for analyses and manuscripts
   - Connection string provided via environment variables

3. **API to External Services**:
   - OpenAI API and Anthropic API for LLM-based analysis
   - API keys required (see Environment Configuration section)

## Security Considerations

- API endpoints use token-based authentication for shared results
- MongoDB connection strings and API keys must be stored as secure environment variables
- Azure Container Apps provide built-in security features
- CORS is configured to allow only specific origins
- All API keys should be rotated regularly
- Database credentials should use least-privilege access
- TLS encryption is required for all connections

## Monitoring and Logging

- Application logs should be configured to use Azure Application Insights
- Database performance can be monitored through MongoDB Atlas dashboard or Azure Monitor
- Custom logging is implemented throughout the application for debugging
- Recommended monitoring setup:
  - Azure Application Insights for application performance
  - Azure Monitor alerts for system health
  - Log Analytics workspace for centralized logging

## Scaling Considerations

- Azure Container Apps automatically scale based on demand
  - Recommended scaling rules: 0-10 replicas based on HTTP traffic
  - CPU target utilization: 70%
- MongoDB Atlas can scale vertically and horizontally as needed
  - Monitor database performance and scale up when reaching 70% resource utilization
- Azure Static Web Apps provides high availability and global distribution via CDN

## Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|--------|
| `ENV` | Environment name | `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority` |
| `MONGODB_DB_NAME` | Database name | `dmp-analyser-prod` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `ANTHROPIC_API_KEY` | Anthropic API key (optional) | `sk-ant-...` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `["https://your-frontend-domain.com"]` |
| `API_KEY` | API key for admin operations | `your-secure-api-key` |

## Deployment Instructions

1. **Database Setup**:
   - Use existing MonooDB Atlas or:
   - Create MongoDB Atlas cluster or Azure CosmosDB instance
   - Create database user with appropriate permissions
   - Configure network security to allow connections from Azure

2. **API Backend Deployment**:
   - Create Azure Container Apps environment
   - Deploy container using the image: `ghcr.io/juusorepo/reproai-v2:v2-20250608`
   - Configure environment variables as listed above
   - Set target port to 8002
   - Enable external ingress

3. **Frontend Deployment**:
   - Create Azure Static Web Apps service
   - Connect to existing GitHub repository
   - Configure build settings according to repository structure
   - Add API URL as environment variable during build

4. **Testing**:
   - Verify frontend can connect to API
   - Test document analysis functionality
   - Confirm database connections are working

## Maintenance and Updates

- Container images will be periodically updated with new features and bug fixes
- To update, pull the latest image and redeploy the container
- Database migrations will be provided when schema changes are required
- Monitor Azure and MongoDB logs regularly for any issues
