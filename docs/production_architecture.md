# DMP Analyser Production Architecture

## Overview

The DMP Analyser system consists of four main components deployed in Azure.
Architecture now supports secure token issuance and role-based access to API via Azure AD and APIM.
All backend services are locked down: only APIM can access the Token Proxy and API backend.

1. **Frontend** – Azure Static Web Apps  
2. **API Backend** – Azure Container Apps  
3. **Database** – MongoDB Atlas (or Azure CosmosDB)  
4. **Token Proxy** – Azure Web App (secured via Azure API Management)

## Architecture Diagram

```
┌────────────────────┐                ┌────────────────────┐                ┌─────────────────┐
│                    │                │                    │                │                 │
│   Frontend (SPA)   │───────────────▶│   API Backend      │───────────────▶│   MongoDB Atlas │
│   Azure Static Web │                │   Azure Container  │                │   or CosmosDB   │
└─────────┬──────────┘                └─────────┬──────────┘                └─────────────────┘
           │                                     │                                     ▲
           │                                     │                                     │
           │                                     ▼                                     │
           │                           ┌────────────────────┐                          │
           │                           │                    │                          │
           │                           │   LLM Services     │                          │
           │                           │   OpenAI/Anthropic │                          │
           │                           └────────────────────┘                          │
           │                                                                           │
           ▼                                                                           │
┌────────────────────┐                                                                │
│                    │                                                                │
│   Token Proxy      │◀──────────────────────────────────────────────────────────────┘
│   Azure Web App    │
└─────────┬──────────┘
           ▲
           │ 🔒 IP-restricted to APIM
           ▼
┌────────────────────┐
│                    │
│   Azure API Mgmt   │
│  (Public Entrypoint)│
└────────────────────┘
           ▲
           │ 🔐 Requires subscription key
           │
           ▼
```

## Components

### Frontend (Azure Static Web Apps)

- **Technology**: Static HTML/CSS/JS
- **Hosting**: Azure Static Web Apps
- **Current Demo URL**: TODO
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
  - Ingress restricted to APIM IP (132.220.54.209) using access restrictions
- Public access is blocked; only APIM can communicate with the backend
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

### Token Proxy (Azure Web App)

**Purpose**: To securely acquire Azure AD tokens from the frontend without exposing client secrets.

### Deployment

- **Technology**: Node.js with Express + MSAL
- **Hosted on**: Azure App Service (Linux Web App)
- **Secured via**: Azure API Management (APIM)
- **Public access blocked** using IP access restrictions
- Only Azure API Management can call the token endpoint
- Token Proxy validates requests using the APIM subscription key

### Token Flow

1. Frontend sends a GET request to `/token-proxy/token` (via APIM)
2. APIM forwards to the Azure Web App (Token Proxy)
3. Token Proxy requests an Azure AD token using `client_credentials` flow
4. Token is returned to frontend (used to authenticate backend API calls)



## Integration Points

1. **Frontend to API**: 
   - REST API calls for analysis submission and result retrieval
   - Token-based authentication for accessing shared results
   - CORS configuration required (see Environment Configuration section)

2. **Frontend ↔ Token Proxy**

- URL: `https://dmp-apim.azure-api.net/token-proxy/token`
- **CORS**: Still managed via ALLOWED_ORIGINS (unchanged)
- Subscription key required to access this endpoint
- Direct access to the Web App is blocked

3. **Frontend ↔ API Backend**

- Secured with token acquired from proxy
- RESTful endpoints for submitting and fetching DMP analysis
- API backend is only reachable via APIM
- Public ingress to the container app is IP-restricted to APIM

4. **API to Database**:
   - Asynchronous MongoDB connections
   - Data storage and retrieval for analyses and manuscripts
   - Connection string provided via environment variables

5. **API to External Services**:
   - OpenAI API and Anthropic API for LLM-based analysis
   - API keys required (see Environment Configuration section)

## Security Considerations

- API endpoints use token-based authentication for shared results
- Only the Token Proxy can request Azure AD tokens with `client_credentials`
- Secrets are never exposed to the frontend
- CORS is strictly configured
- Token Proxy is IP-restricted; only APIM can access it
- API backend enforces IP restriction; only APIM can reach it
- APIM endpoints require a valid subscription key
- No direct public access exists to any backend component
- Token Proxy and API backend validate request origin implicitly through APIM

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

## Environment Configuration

| Variable           | Description                          | Example                                                   |
|--------------------|--------------------------------------|-----------------------------------------------------------|
| `CLIENT_ID`        | Azure AD App Registration            | `2e93d7f3-7e47-4767-ac3b-9f19e9e57784`                    |
| `TENANT_ID`        | Azure AD Tenant ID                   | `f592cb5f-b8bc-41b9-901f-9a99ab84afa6`                    |
| `CLIENT_SECRET`    | Azure App Client Secret              | *(stored securely)*                                       |
| `API_SCOPE`        | DMP API Scope                        | `api://.../.default`                                     |
| `ALLOWED_ORIGINS`  | CORS Origins for Proxy               | `http://localhost:3000,https://green-plant...`            |
| `PORT`             | Proxy Port (local dev)               | `3001`                                                    |

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
   - Enable external ingress with IP restriction to APIM's IP (132.220.54.209)

3. **Frontend Deployment**:
   - Create Azure Static Web Apps service
   - Connect to existing GitHub repository
   - Configure build settings according to repository structure
   - Add API URL as environment variable during build

5. **Token Proxy Deployment**:

- **Token Proxy** deployed from GitHub using CI/CD via Azure Web Apps
- **Frontend** uses APIM endpoint (`https://dmp-apim.azure-api.net/token-proxy/token`) to obtain token
- After deployment, configure Access Restrictions in the Azure Web App to only allow requests from APIM's IP

4. **Testing**:
   - Verify frontend can connect to API
   - Test document analysis functionality
   - Confirm database connections are working

## Maintenance and Updates

- Container images will be periodically updated with new features and bug fixes
- To update, pull the latest image and redeploy the container
- Database migrations will be provided when schema changes are required
- Monitor Azure and MongoDB logs regularly for any issues
