# Quick Start Guide

Get up and running in under 5 minutes.

## Prerequisites

- Node.js 18+ (Node 20 LTS recommended)
- npm 9+

## 1. Install & run

```bash
cd vmc-console
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The dev server uses Turbopack for fast refresh.

## 2. Log in

Use any of the built-in demo accounts:

| Email | Password | Role | Capabilities |
|---|---|---|---|
| `admin@company.com` | `admin123` | Admin | Full access — create, modify, delete everything |
| `developer@company.com` | `dev123` | Developer | Create and modify; cannot manage users |
| `readonly@company.com` | `readonly123` | Read-only | View only; all action buttons are hidden |

Sessions are stored in `localStorage` and survive page refreshes. Click the user avatar → **Sign out** to end a session.

## 3. Explore the pages

| Page | How to reach it | What you can do |
|---|---|---|
| Dashboard | Default on login | Overview of resources across regions |
| Compute | Sidebar → Compute | Launch / stop / terminate VMs; view recent activity |
| Templates | Sidebar → Compute → Templates | Browse the image catalog; build custom images |
| Marketplace | Sidebar → Marketplace | Browse & deploy partner solutions |
| Networking | Sidebar → Networking (NSX-T) | Manage segments, T0/T1 gateways, DFW rules |
| Infrastructure | Sidebar → Infrastructure | View vCenter, clusters, ESXi hosts, datacenters |
| Storage | Sidebar → Storage | vSAN datastores, NFS, object storage |
| Security | Sidebar → Security | Security groups, firewall rules |
| Monitoring | Sidebar → Monitoring | Metrics, alerts, audit log |
| SDDC | Sidebar → SDDC Management | SDDC lifecycle management |
| Service Catalog | Sidebar → Service Catalog | Browse all 40+ services |

## 4. Build a custom image

1. Go to **Templates** (Sidebar → Compute → Templates / Content Library)
2. Click **Build Image**
3. Step 1 — pick a base template (e.g. Ubuntu 22.04 LTS)
4. Step 2 — set name (lowercase, hyphens only), CPU/memory/disk, and optionally paste a Cloud-Init script
5. Step 3 — select target regions
6. Step 4 — review and click **Start Build**
7. The **My Built Images** tab shows the build status badge: Queued → Building → Available

Once available, the image appears in the **My Images** tab of the VM launch wizard.

## 5. Launch a VM with a custom image

1. Go to **Compute** and click **Launch Instance**
2. Step 2 — switch to the **My Images** tab
3. Select your custom image (only images available in the selected region appear)
4. Complete the remaining steps and click **Launch**

## 6. Switch regions

Use the region selector in the top navigation bar. All pages automatically scope their data to the selected region.

---

## Optional: connect to real VMware APIs

By default the app uses mock data. To point at real vCenter / NSX infrastructure:

1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```
2. Edit `.env.local`:
   ```env
   NEXT_PUBLIC_USE_MOCK_API=false
   NEXT_PUBLIC_VCENTER_USE1_URL=https://your-vcenter.example.com/api
   NEXT_PUBLIC_NSX_USE1_URL=https://your-nsx.example.com/api/v1
   ```
3. Restart the dev server — all API calls now hit real endpoints.

See [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) for the full environment variable reference and authentication setup.

---

## Build for production

```bash
npm run build          # Static export → out/
npx tsc --noEmit       # Type-check
npm run lint           # Lint
```

Serve the `out/` directory from any static host (S3, Nginx, CloudFront, etc.).
