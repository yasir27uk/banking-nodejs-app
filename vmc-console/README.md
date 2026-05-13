# VMware Cloud Management Console

A full-featured, self-service cloud management console modelled on the AWS Management Console UX, built for VMware Cloud (VMC) on AWS environments. Manage compute, networking (NSX-T), storage, security, infrastructure, and custom images — all from a single portal.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.5.18 (App Router, static export) |
| UI | React 19, Tailwind CSS |
| Language | TypeScript 5.8 (strict) |
| Dev server | Turbopack (`next dev --turbopack`) |
| State | React Context (Auth, Resource, Image) |
| API layer | Typed HTTP clients (vCenter REST, NSX Manager, VMC API) |

## Features

### Authentication & Authorization
- Self-service login with localStorage-persisted sessions
- Three roles: **Admin** (full access), **Developer** (create/modify), **Read-only** (view only)
- Demo credentials: `admin@company.com / admin123`, `developer@company.com / dev123`, `readonly@company.com / readonly123`
- Role-based UI guards on all mutating actions

### Compute
- Launch wizard with multi-tab OS image selector (My Images / VMware Catalog / Quick Launch)
- Instance type grid with CPU/memory specs
- Key pair and security group association
- Start / Stop / Reboot / Terminate VMs
- Recent activity log

### Custom Images (Image Builder)
- 4-step wizard: Base Image → Configure → Regions → Review & Build
- Cloud-Init script editor baked into the build pipeline
- Build lifecycle: Queued → Building → Available / Failed
- Region replication via vCenter Content Library subscriptions
- Image catalog persisted in localStorage; available when launching VMs

### Marketplace
- Browse 40+ VMware and partner solutions
- Category and pricing filters
- Deploy directly to a cluster/segment from the marketplace listing

### Networking (NSX-T)
- Overlay segments, T0 / T1 gateways
- Distributed Firewall (DFW) policy management
- NSX Advanced Load Balancer

### Infrastructure
- vCenter Servers, Clusters, ESXi Hosts, Datacenters — all with utilisation bars
- Region-filtered views

### Storage
- vSAN datastores, NFS mounts, object storage

### Security
- Security groups, firewall rules, compliance posture

### Monitoring
- Metrics, alerts, and audit logs

### Service Catalog
- 40+ services across 8 categories (Compute, Networking, Storage, Security, Templates, Infrastructure, Marketplace, Monitoring)

## Project Structure

```
vmc-console/
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout — AuthProvider > ResourceProvider > ImageProvider
│   │   ├── page.tsx              # Top-level router (nav item → page component)
│   │   └── globals.css
│   ├── components/               # 19 page / feature components
│   │   ├── Dashboard.tsx
│   │   ├── ComputePage.tsx
│   │   ├── ImageBuilderWizard.tsx
│   │   ├── TemplatesPage.tsx
│   │   ├── MarketplacePage.tsx
│   │   ├── NetworkingPage.tsx
│   │   ├── InfrastructurePage.tsx
│   │   ├── StoragePage.tsx
│   │   ├── SecurityPage.tsx
│   │   ├── MonitoringPage.tsx
│   │   ├── SDDCPage.tsx
│   │   ├── ServiceCatalog.tsx
│   │   ├── SideNavigation.tsx
│   │   ├── TopNavigation.tsx
│   │   ├── TopNavigationEnhanced.tsx
│   │   ├── VirtualMachines.tsx
│   │   ├── CloudShell.tsx
│   │   ├── LoginPage.tsx
│   │   └── SkeletonLoader.tsx
│   ├── context/
│   │   ├── AuthContext.tsx        # Session, role, login / logout
│   │   ├── ResourceContext.tsx    # VMs, volumes, security groups, activity log
│   │   └── ImageContext.tsx       # Custom image catalog, build lifecycle
│   ├── services/
│   │   ├── apiConfig.ts           # Per-region endpoint config + USE_MOCK_API flag
│   │   ├── apiClient.ts           # Typed HTTP clients (vCenter, NSX, VMC)
│   │   └── imageService.ts        # Image CRUD against Content Library REST API
│   ├── data/
│   │   └── mockData.ts            # Seed data for all entities
│   └── types/
│       └── index.ts               # Shared TypeScript types
├── .env.local.example
├── ARCHITECTURE.md
├── QUICKSTART.md
├── INTEGRATION_GUIDE.md
└── DOCUMENTATION_INDEX.md
```

## Quick Start

```bash
cd vmc-console
npm install
npm run dev          # http://localhost:3000  (Turbopack)
```

Log in with any demo credential. The app runs entirely on mock data by default — no vCenter connectivity required.

To connect to real VMware infrastructure, see [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md).

## Environment Variables

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_USE_MOCK_API` | Set to `false` to enable real API calls | `true` |
| `NEXT_PUBLIC_VCENTER_USE1_URL` | vCenter API — US East | `https://vcenter.sddc-use1-prod.vmwarevmc.com/api` |
| `NEXT_PUBLIC_VCENTER_USW2_URL` | vCenter API — US West | |
| `NEXT_PUBLIC_VCENTER_EUW2_URL` | vCenter API — EU West | |
| `NEXT_PUBLIC_VCENTER_APS1_URL` | vCenter API — AP Southeast | |
| `NEXT_PUBLIC_NSX_USE1_URL` | NSX Manager API — US East | |
| `NEXT_PUBLIC_VMC_API_URL` | VMC management API | `https://vmc.vmware.com/vmc/api` |

## Build

```bash
npm run build        # Static export → out/
npm run lint
npx tsc --noEmit     # Type-check without emitting
```

## License

MIT
