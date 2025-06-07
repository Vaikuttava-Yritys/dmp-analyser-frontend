# DMP Analyser Frontend Documentation

## Overview

The DMP Analyser is a web application that analyzes Data Management Plans (DMPs) using AI. The frontend is a static web application that communicates with a Node.js backend API.

## Project Structure

```
dmp-analyser-frontend/
├── index.html              # Main entry page with analysis form
├── feedback_view.html      # Results view page
├── app.js                  # Main application logic
├── pdf-export.js           # PDF export functionality
├── js/
│   ├── config.js           # Environment configuration
│   ├── api.js              # API client utilities
│   └── init.js             # Application initialization
├── css/
│   └── shared-styles.css   # Consolidated styles
└── docs/
    └── frontend-documentation.md  # This documentation
```

## Key Components

### Configuration (js/config.js)

Detects the environment (development/production) and sets the appropriate API base URL:
- Development: `http://localhost:8002`
- Production: `https://dmp-analyser-api.azurewebsites.net`

All API URLs are constructed using `window.AppConfig.api.baseUrl`.

### API Endpoints

All endpoints include the `/api` prefix:

- Health check: `GET /api/health`
- Submit analysis: `POST /api/dmp/enriched-checklists/analyze`
- Check status: `GET /api/dmp/enriched-checklists/run/{runId}`
- View results: `GET /api/dmp/enriched-checklists/access/{token}`
- Export PDF: `GET /api/dmp/enriched-checklists/access/{token}/export-pdf`
- Download checklist: `GET /api/dmp/checklists/{checklistId}/export-pdf`

### Pages

1. **index.html**: Main page with:
   - Analysis form
   - API status indicator
   - Loading spinner
   - Configuration selection dropdowns

2. **feedback_view.html**: Results page with:
   - Analysis results display
   - PDF export functionality
   - Detailed feedback sections

## Application Flow

1. **Initialization**:
   - `js/config.js` sets up environment configuration
   - `js/init.js` checks API health and initializes the UI
   - `app.js` sets up event handlers

2. **Analysis Submission**:
   - User enters text and selects options
   - Form submits to `/api/dmp/enriched-checklists/analyze`
   - Application polls for completion using the returned `run_id`

3. **Results Viewing**:
   - User is redirected to `feedback_view.html?token={accessToken}`
   - Results are fetched and displayed
   - PDF export option is available

## Local Development

1. Start the backend API on port 8002
2. Serve the frontend files on port 3000 using a static file server
3. Access the application at `http://localhost:3000`

## Deployment

The frontend is deployed as an Azure Static Web App. The application automatically detects the environment and uses the appropriate API URL.

