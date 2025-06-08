# DMP Analyser Architecture Diagrams

The following diagrams represents the production architecture of the DMP Analyser system.


## C4 Model Diagram

```mermaid
C4Context
    title DMP Analyser System Context Diagram
    
    Person(user, "User", "A researcher using the system")
    
    Enterprise_Boundary(b0, "DMP Analyser System") {
        System(frontend, "Frontend", "Azure Static Web Apps hosted site with HTML/CSS/JS and React components")
        System(api, "API Backend", "Azure Container Apps running FastAPI")
        SystemDb(database, "Database", "MongoDB Atlas cloud service")
        
        System_Ext(openai, "OpenAI API", "GPT-4 and other models")
        System_Ext(anthropic, "Anthropic API", "Claude models")
    }
    
    Rel(user, frontend, "Uses", "HTTPS")
    Rel(frontend, api, "Makes API calls to", "HTTPS/REST")
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
    
    subgraph API["API Backend (Azure Container Apps)"]
        FastAPI[FastAPI Service]
        subgraph Routers["API Routers"]
            PipelineRouter[Pipeline Configs Router]
            ChecklistRouter[Checklist Router]
            PromptsRouter[Prompts Router]
            EnrichedChecklistRouter[Enriched Checklist Router]
        end
    end
    
    subgraph Database["Database (MongoDB Atlas)"]
        Collections[(Collections)]
        subgraph Collections
            PipelineConfigs[Pipeline Configs]
            Checklists[Checklists]
            Prompts[Prompts]
            EnrichedChecklists[Enriched Checklists]
        end
    end
    
    subgraph LLMServices["LLM Services"]
        OpenAI[OpenAI API]
        Anthropic[Anthropic API]
    end
    
    %% Define the connections
    User -->|Accesses| UI
    UI -->|Loads| StaticAssets
    UI -->|API Calls| FastAPI
    
    FastAPI -->|Routes Requests| Routers
    PipelineRouter -->|CRUD Operations| PipelineConfigs
    ChecklistRouter -->|CRUD Operations| Checklists
    PromptsRouter -->|CRUD Operations| Prompts
    EnrichedChecklistRouter -->|CRUD Operations| EnrichedChecklists
    
    EnrichedChecklistRouter -->|LLM Requests| OpenAI
    EnrichedChecklistRouter -->|LLM Requests| Anthropic
    
    %% Styling - User-friendly Grayscale with Patterns
    classDef frontend fill:#f5f5f5,stroke:#333,stroke-width:2px,stroke-dasharray: 0
    classDef api fill:#e8e8e8,stroke:#333,stroke-width:2px,stroke-dasharray: 0
    classDef database fill:#d9d9d9,stroke:#333,stroke-width:2px,stroke-dasharray: 5 5
    classDef llm fill:#efefef,stroke:#666,stroke-width:1px,stroke-dasharray: 3 3
    classDef user fill:white,stroke:#333,stroke-width:2px
    
    class Frontend frontend
    class API,Routers api
    class Database,Collections database
    class LLMServices llm
    class User user
```
## Sequence Diagram for DMP Checklist Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant DB as MongoDB
    participant LLM as LLM Services
    
    User->>Frontend: Access DMP Analyzer
    Frontend->>API: GET /api/dmp/checklists
    API->>DB: Retrieve available checklists
    DB-->>API: Checklists data
    API-->>Frontend: Available checklists
    
    User->>Frontend: Select checklist & enter DMP text
    Frontend->>API: POST /api/dmp/enriched-checklists
    API->>DB: Store initial request
    DB-->>API: Request ID
    API->>LLM: Send for analysis
    LLM-->>API: Analysis results
    API->>DB: Store enriched checklist
    DB-->>API: Confirmation
    API-->>Frontend: Enriched checklist ID
    
    User->>Frontend: View results
    Frontend->>API: GET /api/dmp/enriched-checklists/{id}
    API->>DB: Retrieve enriched checklist
    DB-->>API: Enriched checklist data
    API-->>Frontend: Enriched checklist results
    Frontend->>User: Display results
```

