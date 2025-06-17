# DMP Analyser Architecture Diagrams

The following diagrams represent the production architecture of the DMP Analyser system, including security measures to protect the API backend.


## C4 Model Diagram

```mermaid
C4Context
    title DMP Analyser System Context Diagram
    
    Person(user, "User", "A researcher using the system")
    
    Enterprise_Boundary(b0, "DMP Analyser System") {
        System(frontend, "Frontend", "Azure Static Web Apps hosted site with HTML/CSS/JS and React components")
        System(apim, "API Management", "Azure API Management with subscription key validation")
        System(tokenproxy, "Token Proxy", "Azure Web App for secure token issuance")
        System(api, "API Backend", "Azure Container Apps running FastAPI with IP restrictions")
        SystemDb(database, "Database", "MongoDB Atlas cloud service")
        
        System_Ext(openai, "OpenAI API", "GPT-4 and other models")
        System_Ext(anthropic, "Anthropic API", "Claude models")
        System_Ext(azuread, "Azure AD", "Authentication service")
    }
    
    Rel(user, frontend, "Uses", "HTTPS")
    Rel(frontend, apim, "Makes API calls to", "HTTPS/REST with subscription key")
    Rel(apim, api, "Routes validated requests to", "HTTPS/REST")
    Rel(apim, tokenproxy, "Routes token requests to", "HTTPS/REST")
    Rel(tokenproxy, azuread, "Requests tokens from", "OAuth 2.0")
    Rel(api, database, "Reads from and writes to", "MongoDB Driver")
    Rel(api, openai, "Makes LLM requests to", "HTTPS/REST")
    Rel(api, anthropic, "Makes LLM requests to", "HTTPS/REST")
    
    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Mermaid Diagram Code

```mermaid
flowchart TB
    %% Define the main components
    User([User])
    
    subgraph Frontend["Frontend (Azure Static Web Apps)"]
        UI[Static HTML/React UI]
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
    
    subgraph API["API Backend (Azure Container Apps)"]
        FastAPI[FastAPI Service]
        subgraph Routers["API Routers"]
            PipelineRouter[Pipeline Configs Router]
            ChecklistRouter[Checklist Router]
            PromptsRouter[Prompts Router]
            EnrichedChecklistRouter[Enriched Checklist Router]
            ResultsFeedbackRouter[Results Feedback Router]
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
        end
    end
    
    subgraph LLMServices["LLM Services"]
        OpenAI[OpenAI API]
        Anthropic[Anthropic API]
    end
    
    %% Define the connections
    User -->|Accesses| UI
    UI -->|Loads| StaticAssets
    UI -->|API Calls with Subscription Key| Gateway
    
    Gateway -->|Validates| SubscriptionKey
    Gateway -->|Enforces| IPRestriction
    Gateway -->|Token Requests| TokenService
    Gateway -->|Validated API Calls| FastAPI
    
    TokenService -->|Authenticates| AzureADAuth
    
    FastAPI -->|Routes Requests| Routers
    PipelineRouter -->|CRUD Operations| PipelineConfigs
    ChecklistRouter -->|CRUD Operations| Checklists
    PromptsRouter -->|CRUD Operations| Prompts
    EnrichedChecklistRouter -->|CRUD Operations| EnrichedChecklists
    ResultsFeedbackRouter -->|CRUD Operations| ResultsFeedback
    
    EnrichedChecklistRouter -->|LLM Requests| OpenAI
    EnrichedChecklistRouter -->|LLM Requests| Anthropic
    
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
    participant API
    participant DB as MongoDB
    participant LLM as LLM Services
    
    User->>Frontend: Access DMP Analyzer
    Frontend->>APIM: GET /api/dmp/checklists with subscription key
    APIM->>APIM: Validate subscription key
    APIM->>API: Forward request
    API->>DB: Retrieve available checklists
    DB-->>API: Checklists data
    API-->>APIM: Return checklists
    APIM-->>Frontend: Available checklists
    
    User->>Frontend: Select checklist & enter DMP text
    Frontend->>APIM: POST /api/dmp/enriched-checklists with subscription key
    APIM->>APIM: Validate subscription key
    APIM->>API: Forward request with analysis_context
    API->>DB: Store initial request
    DB-->>API: Request ID
    API->>LLM: Send for analysis
    LLM-->>API: Analysis results
    API->>DB: Store enriched checklist
    DB-->>API: Confirmation
    API-->>APIM: Return enriched checklist ID
    APIM-->>Frontend: Enriched checklist ID
    
    User->>Frontend: View results
    Frontend->>APIM: GET /api/dmp/enriched-checklists/{id} with subscription key
    APIM->>APIM: Validate subscription key
    APIM->>API: Forward request
    API->>DB: Retrieve enriched checklist
    DB-->>API: Enriched checklist data
    API-->>APIM: Return enriched checklist
    APIM-->>Frontend: Enriched checklist results
    Frontend->>User: Display results
    
    User->>Frontend: Submit feedback on results
    Frontend->>APIM: POST /api/dmp/results-feedback with subscription key
    APIM->>APIM: Validate subscription key
    APIM->>API: Forward feedback request
    API->>DB: Store results feedback
    DB-->>API: Confirmation
    API-->>APIM: Success response
    APIM-->>Frontend: Feedback submitted
    Frontend->>User: Show confirmation
```

