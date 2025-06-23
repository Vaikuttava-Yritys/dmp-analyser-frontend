# Architecture Diagrams

The following diagrams represent the production architecture of the system, including security measures to protect the API backend and integrations with external services.


## C4 Model Diagram

```mermaid
C4Context
    title System Context Diagram
    
    Person(user, "User", "A researcher using the system")
    
    Enterprise_Boundary(b0, "System") {
        System(frontend, "Frontend", "React UI in Docker container on Azure Container Apps")
        System(apim, "API Management", "Azure API Management with subscription key validation")
        System(tokenproxy, "Token Proxy", "Azure Web App for secure token issuance")
        System(api, "API Backend", "Azure Container Apps running FastAPI with IP restrictions")
        SystemDb(database, "Database", "MongoDB Atlas cloud service")
        System(sharepoint, "SharePoint Integration", "Document storage and retrieval")
        System(dockling, "Dockling API", "PDF text extraction service")
        System(logicapp, "Azure Logic App", "Email notifications and workflow automation")
        
        System_Ext(openai, "OpenAI API", "GPT-4 and other models")
        System_Ext(anthropic, "Anthropic API", "Claude models")
        System_Ext(azuread, "Azure AD", "Authentication service")
    }
    
    Rel(user, frontend, "Uses", "HTTPS")
    Rel(frontend, apim, "Makes API calls to", "HTTPS/REST with subscription key")
    Rel(apim, api, "Routes validated requests to", "HTTPS/REST")
    Rel(apim, tokenproxy, "Routes token requests to", "HTTPS/REST")
    Rel(apim, dockling, "Routes PDF extraction requests to", "HTTPS/REST")
    Rel(tokenproxy, azuread, "Requests tokens from", "OAuth 2.0")
    Rel(api, database, "Reads from and writes to", "MongoDB Driver")
    Rel(api, openai, "Makes LLM requests to", "HTTPS/REST")
    Rel(api, anthropic, "Makes LLM requests to", "HTTPS/REST")
    Rel(api, sharepoint, "Retrieves documents from", "Microsoft Graph API")
    Rel(api, logicapp, "Triggers workflows in", "HTTPS/REST")
    Rel(logicapp, user, "Sends email notifications to", "SMTP")
    
    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

## Mermaid Diagram Code

```mermaid
flowchart TB
    %% Define the main components
    User([User])
    
    subgraph Frontend["Frontend (React UI in Azure Container Apps)"]
        UI[React UI Components]
        PDFViewer[PDF Viewer with Annotations]
        StaticAssets[Static Assets]
    end
    
    subgraph APIM["API Management (Azure APIM)"]
        Gateway[API Gateway]
        SubscriptionKey[Subscription Key Validation]
        IPRestriction[IP Restriction Policy]
    end
    
    subgraph TokenProxy["Token Proxy (Azure Web App)"]
        TokenService[Token Service]
        AzureADAuth[Azure AD Authentication]
    end
    
    subgraph SharePoint["SharePoint Integration"]
        SPDocuments[Document Storage]
        GraphAPI[Microsoft Graph API]
    end
    
    subgraph Dockling["Dockling API"]
        PDFExtraction[PDF Text Extraction]
        StructuredText[Structured Text Output]
    end
    
    subgraph LogicApp["Azure Logic App"]
        EmailNotifications[Email Notifications]
        WorkflowAutomation[Workflow Automation]
    end
    
    subgraph API["API Backend (Azure Container Apps)"]
        FastAPI[FastAPI Service]
        subgraph Routers["API Routers"]
            PipelineRouter[Pipeline Configs Router]
            ChecklistRouter[Checklist Router]
            PromptsRouter[Prompts Router]
            EnrichedChecklistRouter[Enriched Checklist Router]
            ResultsFeedbackRouter[Results Feedback Router]
            SharePointRouter[SharePoint Router]
        end
    end
    
    subgraph Database["Database (MongoDB Atlas)"]
        Collections[(Collections)]
        subgraph Collections
            PipelineConfigs[Pipeline Configs]
            Checklists[Checklists]
            Prompts[Prompts]
            EnrichedChecklists[Enriched Checklists]
            ResultsFeedback[Results Feedback]
            DocumentMetadata[Document Metadata]
        end
    end
    
    subgraph LLMServices["LLM Services"]
        OpenAI[OpenAI API]
        Anthropic[Anthropic API]
    end
    
    %% Define the connections
    User -->|Accesses| UI
    UI -->|Displays| PDFViewer
    UI -->|Loads| StaticAssets
    UI -->|API Calls with Subscription Key| Gateway
    
    Gateway -->|Validates| SubscriptionKey
    Gateway -->|Enforces| IPRestriction
    Gateway -->|Token Requests| TokenService
    Gateway -->|Validated API Calls| FastAPI
    Gateway -->|PDF Extraction Requests| PDFExtraction
    
    TokenService -->|Authenticates| AzureADAuth
    
    FastAPI -->|Routes Requests| Routers
    PipelineRouter -->|CRUD Operations| PipelineConfigs
    ChecklistRouter -->|CRUD Operations| Checklists
    PromptsRouter -->|CRUD Operations| Prompts
    EnrichedChecklistRouter -->|CRUD Operations| EnrichedChecklists
    ResultsFeedbackRouter -->|CRUD Operations| ResultsFeedback
    SharePointRouter -->|Document Operations| DocumentMetadata
    
    SharePointRouter -->|Retrieves Documents| GraphAPI
    GraphAPI -->|Stores/Retrieves| SPDocuments
    
    EnrichedChecklistRouter -->|LLM Requests| OpenAI
    EnrichedChecklistRouter -->|LLM Requests| Anthropic
    EnrichedChecklistRouter -->|Triggers| EmailNotifications
    
    EmailNotifications -->|Notifies| User
    WorkflowAutomation -->|Scheduled Tasks| FastAPI
    
    %% Styling - User-friendly Grayscale with Patterns
    classDef frontend fill:#f5f5f5,stroke:#333,stroke-width:2px,stroke-dasharray: 0
    classDef api fill:#e8e8e8,stroke:#333,stroke-width:2px,stroke-dasharray: 0
    classDef apim fill:#d0e0f0,stroke:#0066cc,stroke-width:2px,stroke-dasharray: 0
    classDef database fill:#d9d9d9,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    classDef llm fill:#efefef,stroke:#666,stroke-width:1px,stroke-dasharray: 3 3
    classDef user fill:white,stroke:#333,stroke-width:2px
    classDef security fill:#ffe6e6,stroke:#cc0000,stroke-width:1px,stroke-dasharray: 0
    
    class Frontend frontend
    class API,Routers api
    class APIM,Gateway,SubscriptionKey,IPRestriction apim
    class TokenProxy,TokenService,AzureADAuth security
    class Database,Collections database
    class LLMServices llm
    class User user
```
## Sequence Diagram for DMP Checklist Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant APIM as API Management
    participant SharePoint
    participant Dockling
    participant API
    participant DB as MongoDB
    participant LLM as LLM Services
    participant LogicApp as Azure Logic App
    
    User->>Frontend: Access system
    Frontend->>APIM: GET /api/checklists with subscription key
    APIM->>APIM: Validate subscription key
    APIM->>API: Forward request
    API->>DB: Retrieve available checklists
    DB-->>API: Checklists data
    API-->>APIM: Return checklists
    APIM-->>Frontend: Available checklists
    
    User->>Frontend: Upload document or select from SharePoint
    Frontend->>APIM: GET /api/sharepoint/documents with subscription key
    APIM->>API: Forward request
    API->>SharePoint: Request document list
    SharePoint-->>API: Document list
    API-->>APIM: Return document list
    APIM-->>Frontend: Available documents
    
    User->>Frontend: Select document for analysis
    Frontend->>APIM: GET /api/sharepoint/documents/{id} with subscription key
    APIM->>API: Forward request
    API->>SharePoint: Retrieve document
    SharePoint-->>API: Document content
    API->>APIM: Forward to Dockling for text extraction
    APIM->>Dockling: Extract text from PDF
    Dockling-->>APIM: Structured text with positions
    APIM-->>Frontend: Document content and structure
    
    User->>Frontend: Select checklist & confirm analysis
    Frontend->>APIM: POST /api/enriched-checklists with subscription key
    APIM->>APIM: Validate subscription key
    APIM->>API: Forward request with analysis_context
    API->>DB: Store initial request
    DB-->>API: Request ID
    API->>LLM: Send for analysis
    LLM-->>API: Analysis results
    API->>DB: Store enriched checklist
    DB-->>API: Confirmation
    API->>LogicApp: Trigger email notification workflow
    LogicApp->>User: Send email notification
    API-->>APIM: Return enriched checklist ID
    APIM-->>Frontend: Enriched checklist ID
    
    User->>Frontend: View results (from email link or dashboard)
    Frontend->>APIM: GET /api/enriched-checklists/{id} with subscription key
    APIM->>APIM: Validate subscription key
    APIM->>API: Forward request
    API->>DB: Retrieve enriched checklist
    DB-->>API: Enriched checklist data
    API-->>APIM: Return enriched checklist
    APIM-->>Frontend: Enriched checklist results
    Frontend->>User: Display results with PDF annotations
    
    User->>Frontend: Export results as PDF
    Frontend->>APIM: GET /api/enriched-checklists/{id}/export-pdf with subscription key
    APIM->>API: Forward request
    API->>DB: Retrieve enriched checklist
    DB-->>API: Enriched checklist data
    API-->>APIM: Return PDF document
    APIM-->>Frontend: PDF document
    Frontend->>User: Download PDF
    
    User->>Frontend: Submit feedback on results
    Frontend->>APIM: POST /api/results-feedback with subscription key
    APIM->>APIM: Validate subscription key
    APIM->>API: Forward feedback request
    API->>DB: Store results feedback
    DB-->>API: Confirmation
    API->>LogicApp: Trigger feedback notification
    LogicApp->>User: Send feedback confirmation email
    API-->>APIM: Success response
    APIM-->>Frontend: Feedback submitted
    Frontend->>User: Show confirmation
```

