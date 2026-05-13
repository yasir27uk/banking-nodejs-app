# Documentation Index

## Documentation files

| File | Purpose |
|---|---|
| [README.md](README.md) | Project overview, stack, feature list, project structure, env vars, build |
| [HLD.md](HLD.md) | High-Level Design — 10 Mermaid diagrams: system context, architecture, service layer, image pipeline, auth, deployment, data model |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Layer breakdown, routing table, context layer, service layer, API surface, component hierarchy |
| [QUICKSTART.md](QUICKSTART.md) | Install → run → log in → explore → build an image → connect to real APIs |
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | Full API reference, env vars, auth, regional endpoints, CORS, troubleshooting |

---

## Source tree

```
src/
├── app/
│   ├── layout.tsx            Root layout — provider nesting order
│   ├── page.tsx              Client-side router (activeNavItem → component)
│   └── globals.css
│
├── components/               (19 files)
│   ├── Dashboard.tsx         Landing page — resource summary cards
│   ├── ComputePage.tsx       VM list + LaunchWizard (3-tab image selector)
│   ├── ImageBuilderWizard.tsx 4-step modal wizard for building custom images
│   ├── TemplatesPage.tsx     Catalog Templates + My Built Images tabs
│   ├── MarketplacePage.tsx   Marketplace browse + deploy
│   ├── NetworkingPage.tsx    NSX-T: Segments, Gateways, DFW, Load Balancers
│   ├── InfrastructurePage.tsx vCenter, Clusters, ESXi Hosts, Datacenters
│   ├── StoragePage.tsx       vSAN, NFS, object storage
│   ├── SecurityPage.tsx      Security groups, firewall rules
│   ├── MonitoringPage.tsx    Metrics, alerts, audit log
│   ├── SDDCPage.tsx          SDDC lifecycle management
│   ├── ServiceCatalog.tsx    40+ services across 8 categories
│   ├── SideNavigation.tsx    Left nav — all sections and sub-items
│   ├── TopNavigation.tsx     Basic top nav (unused in main layout)
│   ├── TopNavigationEnhanced.tsx  Top nav with region selector + Marketplace/CL shortcuts
│   ├── VirtualMachines.tsx   VM data table sub-component
│   ├── CloudShell.tsx        Embedded terminal panel
│   ├── LoginPage.tsx         Login form (3 demo accounts)
│   └── SkeletonLoader.tsx    Loading skeleton placeholder
│
├── context/                  (3 files)
│   ├── AuthContext.tsx       user, login(), logout(), isAuthenticated
│   ├── ResourceContext.tsx   vms, createVm(), deleteVm(), recentActivity
│   └── ImageContext.tsx      images, buildImage(), replicateToRegion(),
│                             deleteImage(), imagesForRegion()
│
├── services/                 (3 files)
│   ├── apiConfig.ts          REGIONAL_ENDPOINTS, USE_MOCK_API, getEndpoints()
│   ├── apiClient.ts          ApiError, vcenterClient(), nsxClient(), vmcClient()
│   └── imageService.ts       buildImage(), getImageBuildStatus(), replicateImage(),
│                             deleteImage(), deployFromImage()
│
├── data/
│   └── mockData.ts           Seed data: VMs, segments, gateways, images, marketplace items,
│                             ESXi hosts, clusters, vCenter servers, datacenters
│
└── types/
    └── index.ts              Shared types: VM, Volume, SecurityGroup, MarketplaceItem,
                              NSXSegment, NSXGateway, FirewallPolicy, CustomImage, etc.
```

---

## Routing table (page.tsx)

| `activeNavItem` value | Page rendered |
|---|---|
| `dashboard` | Dashboard |
| `compute` | ComputePage |
| `templates` | TemplatesPage |
| `marketplace` | MarketplacePage |
| `networking` / `nsx-segments` / `nsx-gateways` / `dfw` | NetworkingPage |
| `infrastructure` / `vcenter` / `clusters` / `esxi-hosts` / `datacenters` | InfrastructurePage |
| `storage` | StoragePage |
| `security` | SecurityPage |
| `monitoring` | MonitoringPage |
| `sddc` | SDDCPage |
| `catalog` | ServiceCatalog |

---

## Context provider nesting (`layout.tsx`)

```tsx
<AuthProvider>
  <ResourceProvider>
    <ImageProvider>
      {children}
    </ImageProvider>
  </ResourceProvider>
</AuthProvider>
```

---

## Key types (`types/index.ts`)

```typescript
VM               — id, name, status, instanceType, region, os, cpu, memory, …
Volume           — id, name, size, status, region
SecurityGroup    — id, name, rules[]
MarketplaceItem  — id, name, category, pricing, osFamily ('linux'|'windows'|'multi'|'other'), …
NSXSegment       — id, name, type, cidr, status, transportZone
NSXGateway       — id, name, type ('T0'|'T1'), status, connectedSegments[]
FirewallPolicy   — id, name, rules[], priority, status
CustomImage      — id, name, os, osFamily, buildStatus, availableRegions, cpu, memory, diskGB, …
```

---

## Image build status lifecycle

```
'queued'  →  'building'  →  'available'
                         ↘  'failed'
```

Driven by `ImageContext` (`setTimeout` in mock mode, vCenter task polling in production).

---

## Service layer flag

```bash
# .env.local
NEXT_PUBLIC_USE_MOCK_API=false   # enables real VMware API calls
```

All 5 functions in `imageService.ts` and all `apiClient.ts` factory clients respect this flag automatically.
