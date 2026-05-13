# Architecture

## Overview

The console is a Next.js 15 static-export SPA. All state lives in React Context providers. A thin service layer handles API calls; a `USE_MOCK_API` flag switches between mock data (development) and real VMware REST APIs (production) without any code changes.

```
Browser
  └── Next.js App Router (static export)
        ├── AuthProvider       — session, role, login/logout (localStorage)
        ├── ResourceProvider   — VMs, volumes, security groups, activity log (in-memory)
        └── ImageProvider      — custom image catalog, build lifecycle (localStorage)
              └── page.tsx     — top-level client-side router
                    ├── TopNavigationEnhanced
                    ├── SideNavigation
                    └── <ActivePage>
                          └── services/ — API calls (mock or real vCenter/NSX/VMC)
```

## Layer Breakdown

### 1. Routing (`src/app/page.tsx`)

Client-side routing via a single `activeNavItem` state string. `page.tsx` maps each nav key to a page component — no file-based routing for inner pages.

| Nav key | Component |
|---|---|
| `dashboard` | Dashboard |
| `compute` | ComputePage |
| `templates` | TemplatesPage |
| `marketplace` | MarketplacePage |
| `networking`, `nsx-segments`, `nsx-gateways`, `dfw` | NetworkingPage |
| `infrastructure`, `vcenter`, `clusters`, `esxi-hosts`, `datacenters` | InfrastructurePage |
| `storage` | StoragePage |
| `security` | SecurityPage |
| `monitoring` | MonitoringPage |
| `sddc` | SDDCPage |
| `catalog` | ServiceCatalog |

### 2. Context Layer (`src/context/`)

| Context | Persistence | Key exports |
|---|---|---|
| `AuthContext` | localStorage (`vmc_auth_session`) | `user`, `login()`, `logout()`, `isAuthenticated` |
| `ResourceContext` | in-memory | `vms`, `createVm()`, `deleteVm()`, `recentActivity` |
| `ImageContext` | localStorage (`vmc_custom_images`) | `images`, `buildImage()`, `replicateToRegion()`, `deleteImage()`, `imagesForRegion()` |

**Image build lifecycle** (ImageContext):

```
buildImage() called
  → status: 'queued'
  → 1 500 ms setTimeout → status: 'building'
  → 5 000 ms setTimeout → status: 'available'  (or 'failed' on error)
```

In production (`USE_MOCK_API=false`) the status is polled via `imageService.getImageBuildStatus()` against the vCenter task API (`/api/cis/tasks/{taskId}`).

### 3. Service Layer (`src/services/`)

```
apiConfig.ts
  REGIONAL_ENDPOINTS — per-region: vcenterApi, nsxApi, vmcApi, contentLibraryApi
  USE_MOCK_API       — true when NEXT_PUBLIC_USE_MOCK_API is absent or !== 'false'
  getEndpoints(region: string) → RegionalEndpoints

apiClient.ts
  ApiError            — thrown on non-2xx; carries status + body
  vcenterClient(baseUrl, sessionToken) → { get, post, put, patch, delete }
  nsxClient(baseUrl, token)
  vmcClient(baseUrl, token)

imageService.ts
  buildImage(payload, token)                 → { taskId }
  getImageBuildStatus(taskId, region, token) → 'queued'|'building'|'available'|'failed'
  replicateImage(image, targetRegion, token) → void
  deleteImage(imageId, regions, token)       → void
  deployFromImage(payload, region, token)    → { vmId }
```

Every service function checks `USE_MOCK_API` first. When true it returns mock data after a short artificial delay. When false it calls the real VMware REST endpoints.

### 4. VMware API Surface

| API | Endpoint | Used for |
|---|---|---|
| vCenter REST 8.x | `GET  /api/content/library` | List content libraries |
| vCenter REST 8.x | `GET  /api/content/library/item?library_id=…` | List library items |
| vCenter REST 8.x | `POST /api/content/library/item` | Create library item (build) |
| vCenter REST 8.x | `DELETE /api/content/library/item/{id}` | Delete image |
| vCenter REST 8.x | `POST /api/vcenter/vm-template/library-items/{id}/deploy` | Deploy VM from template |
| vCenter REST 8.x | `GET  /api/cis/tasks/{id}` | Poll task / build status |
| vCenter REST 8.x | `POST /api/content/local-library` | Create local Content Library |
| vCenter REST 8.x | `POST /api/content/subscribed-library` | Replicate image across regions |
| NSX Manager REST | `/api/v1/logical-switches` | Segment management |
| VMC API | `/vmc/api/orgs/{id}/sddcs` | SDDC management |

### 5. Component Hierarchy

```
page.tsx
├── TopNavigationEnhanced
│     └── secondary bar: Marketplace (orange), Content Library — call onNavigate()
├── SideNavigation
│     ├── Compute
│     │     ├── EC2 Instances
│     │     ├── Launch Templates
│     │     └── Templates / Content Library  →  TemplatesPage
│     ├── Marketplace (top-level, orange accent, "New" badge)  →  MarketplacePage
│     ├── Networking (NSX-T)
│     │     ├── NSX Segments
│     │     ├── NSX Gateways (T0/T1)
│     │     └── Distributed Firewall (DFW)
│     ├── Infrastructure
│     │     ├── vCenter Servers
│     │     ├── Clusters
│     │     ├── ESXi Hosts
│     │     └── Datacenters
│     ├── Storage, Security, Monitoring, SDDC Management
│     └── Service Catalog
└── <ActivePage>
      TemplatesPage
        └── ImageBuilderWizard (modal, 4-step)
              Steps: Base Image → Configure → Regions → Review & Build
      ComputePage
        └── LaunchWizard (modal)
              Step 2 tabs: My Images | VMware Catalog | Quick Launch
                My Images → imagesForRegion(currentRegion) from ImageContext
```

### 6. Data Flow — Custom Image Build

```
User fills ImageBuilderWizard
  → handleBuild()
  → imageService.buildImage(payload, token)     [USE_MOCK_API=false → real vCenter POST]
  → ImageContext.buildImage() → status: queued → building → available
  → TemplatesPage shows BuildStatusBadge (animated spinner while building)
  → ComputePage LaunchWizard "My Images" tab shows available images
     filtered by imagesForRegion(currentRegion)
```

### 7. Colour Palette

| Token | Hex | Usage |
|---|---|---|
| navy | `#232f3e` | Top nav background |
| orange | `#ff9900` | Accent, Marketplace highlight |
| blue | `#0073bb` | Primary actions, links |
| dark | `#16191f` | Sidebar background |
| muted | `#545b64` | Secondary text |
| background | `#f2f3f3` | Page background |

### 8. Build Output

`npm run build` produces a fully static export in `out/`. No server runtime required — deployable to any CDN (S3 + CloudFront, Nginx, etc.).
