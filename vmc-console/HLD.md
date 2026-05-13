# High-Level Design (HLD)

> All diagrams use standard [Mermaid](https://mermaid.js.org/) syntax and render on GitHub, GitLab, and VS Code (Markdown Preview).

---

## 1. System Context

Who uses the system and what external systems it integrates with.

```mermaid
flowchart TD
    subgraph Users["Users"]
        Admin["Cloud Admin\nManages SDDCs and infrastructure"]
        Dev["Developer\nLaunches VMs and builds images"]
        RO["Read-Only User\nViews dashboards and resources"]
    end

    Console["VMC Management Console\nNext.js 15 SPA"]

    subgraph VMwareAPIs["External VMware Systems"]
        VC["vCenter Server 8.x\nVM lifecycle and Content Library"]
        NSX["NSX Manager\nOverlay networking and DFW"]
        VMCAPI["VMC API\nvmc.vmware.com"]
        CSP["Cloud Services Platform\nOAuth 2.0 token issuance"]
    end

    Admin -->|"HTTPS / browser"| Console
    Dev -->|"HTTPS / browser"| Console
    RO -->|"HTTPS / browser"| Console

    Console -->|"vCenter REST API"| VC
    Console -->|"NSX Manager REST API"| NSX
    Console -->|"VMC Management API"| VMCAPI
    Console -->|"OAuth token exchange"| CSP

    style Users fill:#232f3e,color:#fff,stroke:#ff9900
    style VMwareAPIs fill:#0073bb,color:#fff,stroke:#005b99
    style Console fill:#ff9900,color:#232f3e,stroke:#cc7a00
```

---

## 2. High-Level Architecture

The three main tiers of the application.

```mermaid
flowchart TD
    subgraph Browser["Browser — Static SPA"]
        UI["Next.js 15 App Router\nReact 19 · TypeScript 5.8 · Tailwind CSS"]
        CTX["Context Layer\nAuthContext · ResourceContext · ImageContext"]
        SVC["Service Layer\napiConfig · apiClient · imageService"]
        UI --> CTX --> SVC
    end

    subgraph Regions["VMware Cloud Regions"]
        USE1["US East\nvCenter + NSX + Content Library"]
        USW2["US West\nvCenter + NSX + Content Library"]
        EUW2["EU West\nvCenter + NSX + Content Library"]
        APS1["AP Southeast\nvCenter + NSX + Content Library"]
    end

    subgraph Platform["VMware Cloud Platform"]
        VMCAPI2["VMC API\nvmc.vmware.com"]
        CSP2["Cloud Services Platform\nOAuth 2.0"]
    end

    SVC -->|"vCenter REST API"| USE1
    SVC -->|"vCenter REST API"| USW2
    SVC -->|"vCenter REST API"| EUW2
    SVC -->|"vCenter REST API"| APS1
    SVC -->|"VMC API"| VMCAPI2
    SVC -->|"Token exchange"| CSP2

    style Browser fill:#232f3e,color:#fff,stroke:#ff9900
    style Regions fill:#0073bb,color:#fff,stroke:#005b99
    style Platform fill:#16191f,color:#fff,stroke:#545b64
```

---

## 3. Frontend Layer Detail

Internal structure of the SPA — providers, router, and pages.

```mermaid
flowchart TD
    subgraph Layout["app/layout.tsx — Provider Stack"]
        AP["AuthProvider\nlocalStorage session · 3 roles"]
        RP["ResourceProvider\nVMs · Volumes · Security Groups"]
        IP["ImageProvider\nImage Catalog · Build Lifecycle"]
        AP --> RP --> IP
    end

    subgraph Router["app/page.tsx — Client Router"]
        TN["TopNavigationEnhanced\nRegion selector · Marketplace shortcut"]
        SN["SideNavigation\nAll sections and sub-items"]
        NAV["activeNavItem state"]
        TN -->|"onNavigate()"| NAV
        SN -->|"onNavigate()"| NAV
    end

    subgraph Pages["Page Components"]
        P1["Dashboard"]
        P2["ComputePage + LaunchWizard"]
        P3["TemplatesPage + ImageBuilderWizard"]
        P4["MarketplacePage"]
        P5["NetworkingPage — NSX-T"]
        P6["InfrastructurePage"]
        P7["StoragePage"]
        P8["SecurityPage"]
        P9["MonitoringPage"]
        P10["SDDCPage"]
        P11["ServiceCatalog"]
    end

    IP --> Router
    NAV -->|"renders active page"| P1
    NAV -->|"renders active page"| P2
    NAV -->|"renders active page"| P3
    NAV -->|"renders active page"| P4
    NAV -->|"renders active page"| P5
    NAV -->|"renders active page"| P6

    style Layout fill:#232f3e,color:#fff,stroke:#ff9900
    style Router fill:#16191f,color:#fff,stroke:#545b64
    style Pages fill:#0073bb,color:#fff,stroke:#005b99
```

---

## 4. Service Layer

Mock vs real API switching via a single environment flag.

```mermaid
flowchart TD
    subgraph SL["Service Layer — src/services/"]
        CFG["apiConfig.ts\nREGIONAL_ENDPOINTS per region\nUSE_MOCK_API flag\ngetEndpoints(region)"]
        CLI["apiClient.ts\nApiError class\nvcenterClient(baseUrl, token)\nnsxClient(baseUrl, token)\nvmcClient(baseUrl, token)"]
        IMG["imageService.ts\nbuildImage()\ngetImageBuildStatus()\nreplicateImage()\ndeleteImage()\ndeployFromImage()"]
        CFG -->|"endpoint URLs"| CLI
        CFG -->|"USE_MOCK_API flag"| IMG
        CLI -->|"typed HTTP clients"| IMG
    end

    MOCK{"USE_MOCK_API = true?"}
    IMG --> MOCK
    MOCK -->|"Yes — default dev mode"| MD["Mock Data\nInstant resolve · no network calls"]
    MOCK -->|"No — production"| REAL["vCenter REST API\n/api/content/library\n/api/cis/tasks\n/api/vcenter/vm-template"]

    style SL fill:#232f3e,color:#fff,stroke:#ff9900
    style MOCK fill:#ff9900,color:#232f3e,stroke:#cc7a00
    style MD fill:#545b64,color:#fff,stroke:#333
    style REAL fill:#0073bb,color:#fff,stroke:#005b99
```

---

## 5. Image Build Pipeline

End-to-end flow from wizard submission to an available image.

```mermaid
sequenceDiagram
    actor User
    participant Wizard as ImageBuilderWizard
    participant IC as ImageContext
    participant IS as imageService
    participant VC as vCenter REST API
    participant TPage as TemplatesPage
    participant Compute as ComputePage

    User->>Wizard: Fill 4 steps and click Start Build
    Wizard->>IS: buildImage(payload, token)

    alt USE_MOCK_API is true
        IS-->>Wizard: taskId task-mock-xxx after 400ms delay
    else USE_MOCK_API is false
        IS->>VC: POST /api/content/library/item
        VC-->>IS: value item-id
        IS-->>Wizard: taskId item-id
    end

    Wizard->>IC: buildImage(payload, userEmail)
    IC->>IC: status queued
    IC->>IC: after 1500ms status building
    IC->>IC: after 5000ms status available

    loop Poll every 5s when real API enabled
        IC->>IS: getImageBuildStatus(taskId, region)
        IS->>VC: GET /api/cis/tasks/taskId
        VC-->>IS: state RUNNING or SUCCEEDED or FAILED
        IS-->>IC: building or available or failed
    end

    IC-->>TPage: images updated, BuildStatusBadge re-renders
    IC-->>Compute: imagesForRegion(region) available in My Images tab
```

---

## 6. Regional Content Library Replication

How a built image is replicated to additional regions.

```mermaid
flowchart LR
    subgraph Primary["Primary Region — Build Source"]
        SRC["vCenter\nLocal Content Library\nSource of truth"]
    end

    IS["imageService\nreplicateImage()"]

    subgraph Targets["Target Regions — Subscribed Libraries"]
        R1["US West\nSubscribed Library\nauto-syncs on demand"]
        R2["EU West\nSubscribed Library\nauto-syncs on demand"]
        R3["AP Southeast\nSubscribed Library\nauto-syncs on demand"]
    end

    SRC --> IS
    IS -->|"POST /api/content/subscribed-library"| R1
    IS -->|"POST /api/content/subscribed-library"| R2
    IS -->|"POST /api/content/subscribed-library"| R3

    SRC -.->|"on-demand sync"| R1
    SRC -.->|"on-demand sync"| R2
    SRC -.->|"on-demand sync"| R3

    style Primary fill:#0073bb,color:#fff,stroke:#005b99
    style Targets fill:#232f3e,color:#fff,stroke:#ff9900
    style IS fill:#16191f,color:#fff,stroke:#545b64
```

---

## 7. Authentication and Role-Based Access

Login flow and permission enforcement throughout the UI.

```mermaid
flowchart TD
    START(["User visits app"]) --> LP["LoginPage\nlogin(email, password)"]
    LP --> AUTH{"Valid credentials?"}
    AUTH -->|"No"| ERR["Show error message"]
    ERR --> LP
    AUTH -->|"Yes"| AC["AuthContext\nPersist session in localStorage\nkey: vmc_auth_session"]

    AC --> ROLE{"User Role"}
    ROLE -->|"admin"| ADMIN["Full access\nCreate · Modify · Delete\nUser management"]
    ROLE -->|"developer"| DEV["Create and modify\nNo user management"]
    ROLE -->|"readonly"| RO["View only\ncanEdit = false"]

    ADMIN --> APP["Application Pages"]
    DEV --> APP
    RO --> APP

    APP --> GUARD["UI Guards\nAction buttons shown or hidden\nbased on canEdit flag"]

    style AUTH fill:#ff9900,color:#232f3e,stroke:#cc7a00
    style ROLE fill:#ff9900,color:#232f3e,stroke:#cc7a00
    style GUARD fill:#232f3e,color:#fff,stroke:#ff9900
    style START fill:#0073bb,color:#fff,stroke:#005b99
```

---

## 8. Component and Context Dependency Map

Which page components consume which React contexts.

```mermaid
flowchart LR
    subgraph Contexts["React Contexts"]
        AC["AuthContext\nuser · login · logout"]
        RC["ResourceContext\nvms · createVm · deleteVm"]
        IC["ImageContext\nimages · buildImage · imagesForRegion"]
    end

    subgraph Nav["Navigation"]
        SideNav["SideNavigation"]
        TopNav["TopNavigationEnhanced"]
    end

    subgraph CorePages["Core Pages"]
        Login["LoginPage"]
        Dash["Dashboard"]
        Compute["ComputePage"]
        Storage["StoragePage"]
        Security["SecurityPage"]
    end

    subgraph ImagePages["Image Pages"]
        Templates["TemplatesPage"]
        Wizard["ImageBuilderWizard"]
        Market["MarketplacePage"]
    end

    AC --> Login
    AC --> SideNav
    AC --> TopNav
    AC --> Compute
    AC --> Templates
    AC --> Market

    RC --> Dash
    RC --> Compute
    RC --> Storage
    RC --> Security

    IC --> Templates
    IC --> Wizard
    IC --> Compute

    style Contexts fill:#232f3e,color:#fff,stroke:#ff9900
    style Nav fill:#16191f,color:#fff,stroke:#545b64
    style CorePages fill:#0073bb,color:#fff,stroke:#005b99
    style ImagePages fill:#005b99,color:#fff,stroke:#003d6b
```

---

## 9. Deployment Architecture

How the static export is built, hosted, and consumed.

```mermaid
flowchart LR
    subgraph CICD["CI/CD Pipeline"]
        SRC["Source Code\nGitHub / GitLab"]
        BUILD["npm run build\nStatic export to out/"]
        SRC --> BUILD
    end

    subgraph Hosting["Static Hosting Options"]
        S3["AWS S3 + CloudFront\nRecommended for VMC"]
        NGINX["Nginx / Apache\nOn-premises"]
        PAGES["GitHub Pages / Vercel\nDev and staging"]
    end

    subgraph EndUsers["End Users"]
        ADM["Cloud Admins"]
        DEVS["Developers"]
        ROU["Read-Only Users"]
    end

    subgraph VMwareInfra["VMware Cloud Infrastructure"]
        VC2["vCenter Servers\nper region"]
        NSX2["NSX Managers\nper region"]
        VMCA["VMC API"]
    end

    BUILD -->|"Upload out/"| S3
    BUILD -->|"Deploy"| NGINX
    BUILD -->|"Deploy"| PAGES

    S3 -->|"HTTPS"| ADM
    S3 -->|"HTTPS"| DEVS
    S3 -->|"HTTPS"| ROU

    ADM -->|"REST API calls from browser"| VC2
    ADM -->|"REST API calls from browser"| NSX2
    ADM -->|"REST API calls from browser"| VMCA

    style CICD fill:#232f3e,color:#fff,stroke:#ff9900
    style Hosting fill:#16191f,color:#fff,stroke:#545b64
    style EndUsers fill:#0073bb,color:#fff,stroke:#005b99
    style VMwareInfra fill:#545b64,color:#fff,stroke:#333
```

---

## 10. Data Model

Key entities and their relationships.

```mermaid
erDiagram
    USER {
        string email PK
        string name
        string role
        string currentRegion
    }

    VM {
        string id PK
        string name
        string status
        string instanceType
        string region
        string imageId
        int cpu
        int memoryGB
    }

    CUSTOM_IMAGE {
        string id PK
        string name
        string buildStatus
        string osFamily
        string sourceRegion
        string availableRegions
        int cpu
        int memoryGB
        int diskGB
        string cloudInitScript
        boolean isPublic
    }

    REGION {
        string id PK
        string label
        string vcenterApi
        string nsxApi
        string contentLibraryApi
    }

    NSX_SEGMENT {
        string id PK
        string name
        string type
        string cidr
        string status
        string region
    }

    MARKETPLACE_ITEM {
        string id PK
        string name
        string category
        string pricing
        string osFamily
        float rating
    }

    SECURITY_GROUP {
        string id PK
        string name
        string region
    }

    USER ||--o{ VM : owns
    CUSTOM_IMAGE ||--o{ VM : "launched from"
    REGION ||--o{ VM : hosts
    REGION ||--o{ NSX_SEGMENT : contains
    REGION ||--o{ CUSTOM_IMAGE : "image available in"
    VM ||--o{ SECURITY_GROUP : "assigned to"
```
