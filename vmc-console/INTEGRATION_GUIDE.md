# Integration Guide

This guide covers everything needed to connect the console to real VMware Cloud infrastructure.

## Table of Contents

1. [How the service layer works](#1-how-the-service-layer-works)
2. [Environment variables](#2-environment-variables)
3. [Authentication](#3-authentication)
4. [Regional endpoints](#4-regional-endpoints)
5. [vCenter Content Library API](#5-vcenter-content-library-api)
6. [NSX-T API](#6-nsx-t-api)
7. [VMC management API](#7-vmc-management-api)
8. [Image build pipeline](#8-image-build-pipeline)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. How the service layer works

All API calls go through `src/services/`. The layer has two modes controlled by a single env variable:

```
NEXT_PUBLIC_USE_MOCK_API=true   (default)  →  in-process mock data, no network calls
NEXT_PUBLIC_USE_MOCK_API=false             →  real VMware REST API calls
```

No code changes are required to switch modes. The flag is read at module load time by `apiConfig.ts`:

```typescript
// src/services/apiConfig.ts
export const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false';
```

Every service function follows the same pattern:

```typescript
export async function buildImage(payload, token) {
  if (USE_MOCK_API) {
    await delay(400);
    return { taskId: `task-${generateId()}` };
  }
  // real vCenter API call below
  const endpoints = getEndpoints(payload.targetRegions[0]);
  const client = vcenterClient(endpoints.vcenterApi, token);
  const item = await client.post<{ value: string }>('/content/library/item', body);
  return { taskId: item.value };
}
```

---

## 2. Environment variables

Create `.env.local` in the `vmc-console/` directory:

```env
# ── Global ──────────────────────────────────────────────────────────────────
NEXT_PUBLIC_USE_MOCK_API=false
NEXT_PUBLIC_VMC_API_URL=https://vmc.vmware.com/vmc/api

# ── US East (N. Virginia) ───────────────────────────────────────────────────
NEXT_PUBLIC_VCENTER_USE1_URL=https://vcenter.sddc-use1.example.com/api
NEXT_PUBLIC_NSX_USE1_URL=https://nsx.sddc-use1.example.com/api/v1
NEXT_PUBLIC_CL_USE1_URL=https://vcenter.sddc-use1.example.com/api/content

# ── US West (Oregon) ────────────────────────────────────────────────────────
NEXT_PUBLIC_VCENTER_USW2_URL=https://vcenter.sddc-usw2.example.com/api
NEXT_PUBLIC_NSX_USW2_URL=https://nsx.sddc-usw2.example.com/api/v1
NEXT_PUBLIC_CL_USW2_URL=https://vcenter.sddc-usw2.example.com/api/content

# ── EU West (Ireland) ───────────────────────────────────────────────────────
NEXT_PUBLIC_VCENTER_EUW2_URL=https://vcenter.sddc-euw2.example.com/api
NEXT_PUBLIC_NSX_EUW2_URL=https://nsx.sddc-euw2.example.com/api/v1
NEXT_PUBLIC_CL_EUW2_URL=https://vcenter.sddc-euw2.example.com/api/content

# ── AP Southeast (Singapore) ────────────────────────────────────────────────
NEXT_PUBLIC_VCENTER_APS1_URL=https://vcenter.sddc-aps1.example.com/api
NEXT_PUBLIC_NSX_APS1_URL=https://nsx.sddc-aps1.example.com/api/v1
NEXT_PUBLIC_CL_APS1_URL=https://vcenter.sddc-aps1.example.com/api/content
```

Variables not set fall back to the default production hostnames defined in `apiConfig.ts`.

---

## 3. Authentication

The console passes bearer / session tokens acquired at login to every API call.

### vCenter session token

```
POST /api/session
Authorization: Basic base64(user:password)
→ returns: "session-token-string"
```

Store this token in `AuthContext` and pass it as the `token` argument to service functions. The `vcenterClient` factory attaches it automatically:

```typescript
// src/services/apiClient.ts
function vcenterClient(baseUrl: string, sessionToken?: string) {
  return {
    get: <T>(path: string) =>
      request<T>(`${baseUrl}${path}`, { token: sessionToken }),
    // post, put, patch, delete …
  };
}
```

The `request()` function adds:

```
vmware-api-session-id: <sessionToken>   (vCenter)
Authorization: Bearer <token>           (NSX / VMC)
Content-Type: application/json
```

### NSX Manager token

NSX Manager uses a separate session. Acquire it from the NSX login endpoint and pass to `nsxClient()`.

---

## 4. Regional endpoints

`src/services/apiConfig.ts` exports `REGIONAL_ENDPOINTS`:

```typescript
export interface RegionalEndpoints {
  vcenterApi: string;
  nsxApi: string;
  vmcApi: string;
  contentLibraryApi: string;
  label: string;
}
```

Supported regions and their env-var overrides:

| Region key | Label | vCenter env var | NSX env var |
|---|---|---|---|
| `us-east-1` | US East (N. Virginia) | `NEXT_PUBLIC_VCENTER_USE1_URL` | `NEXT_PUBLIC_NSX_USE1_URL` |
| `us-west-2` | US West (Oregon) | `NEXT_PUBLIC_VCENTER_USW2_URL` | `NEXT_PUBLIC_NSX_USW2_URL` |
| `eu-west-2` | EU West (Ireland) | `NEXT_PUBLIC_VCENTER_EUW2_URL` | `NEXT_PUBLIC_NSX_EUW2_URL` |
| `ap-southeast-1` | AP Southeast (Singapore) | `NEXT_PUBLIC_VCENTER_APS1_URL` | `NEXT_PUBLIC_NSX_APS1_URL` |

To add a new region, extend `REGIONAL_ENDPOINTS` in `apiConfig.ts`.

---

## 5. vCenter Content Library API

Used by `imageService.ts` for all image operations.

### List libraries

```
GET /api/content/library
vmware-api-session-id: <token>
→ string[]   (library IDs)
```

### List items in a library

```
GET /api/content/library/item?library_id=<id>
→ string[]   (item IDs)
```

### Create a library item (build)

```
POST /api/content/library/item
{
  "name": "my-image",
  "description": "...",
  "type": "vm_template",
  "library_id": "<library-id>",
  "client_token": "<uuid>"
}
→ { "value": "<item-id>" }   ← use as taskId
```

### Delete an item

```
DELETE /api/content/library/item/<id>
```

### Deploy a VM from a template

```
POST /api/vcenter/vm-template/library-items/<item-id>/deploy
{
  "name": "my-vm",
  "placement": { "cluster": "<cluster-id>" },
  "hardware_customization": {
    "cpu_update": { "num_cpus": 4 },
    "memory_update": { "memory": 8192 }
  }
}
→ { "value": "<vm-id>" }
```

### Poll task status

```
GET /api/cis/tasks/<task-id>
→ { "state": "RUNNING" | "SUCCEEDED" | "FAILED", "status": "..." }
```

### Create a subscribed library (region replication)

```
POST /api/content/subscribed-library
{
  "name": "Subscribed-<image-name>",
  "type": "subscribed",
  "subscription_info": {
    "subscription_url": "https://<source-vcenter>/api/content/library/<library-id>",
    "authentication_method": "NONE",
    "on_demand": true
  }
}
```

---

## 6. NSX-T API

`NetworkingPage.tsx` uses mock data today. To enable real NSX calls, add API functions in `src/services/` that use `nsxClient()`.

Key endpoints:

```
GET    /api/v1/logical-switches                 List segments
POST   /api/v1/logical-switches                 Create segment
DELETE /api/v1/logical-switches/<id>            Delete segment
GET    /api/v1/logical-routers                  List T0/T1 gateways
GET    /api/v1/firewall/sections                List DFW sections
GET    /policy/api/v1/infra/load-balancers      List load balancers
```

---

## 7. VMC management API

Used for SDDC management (`SDDCPage.tsx`). Base URL: `https://vmc.vmware.com/vmc/api`

```
GET /vmc/api/orgs                              List organisations
GET /vmc/api/orgs/{orgId}/sddcs               List SDDCs
POST /vmc/api/orgs/{orgId}/sddcs              Create SDDC
DELETE /vmc/api/orgs/{orgId}/sddcs/{sddcId}   Delete SDDC
```

VMC API uses OAuth 2.0 access tokens from the CSP (Cloud Services Platform):

```
POST https://console.cloud.vmware.com/csp/gateway/am/api/auth/api-tokens/authorize
{ "refresh_token": "<api-token>" }
→ { "access_token": "...", "expires_in": 1799 }
```

---

## 8. Image build pipeline

In production the build pipeline is:

1. **Frontend** calls `imageService.buildImage()` → POST to vCenter Content Library → receives `taskId`
2. **ImageContext** polls `imageService.getImageBuildStatus(taskId, region)` every 5 s
3. vCenter returns `RUNNING` / `SUCCEEDED` / `FAILED` for the task
4. On `SUCCEEDED` the image status transitions to `available` in the catalog
5. For cross-region replication, `imageService.replicateImage()` creates a subscribed library in each target region

In mock mode (default) steps 2–5 are simulated with `setTimeout` chains in `ImageContext`.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| All pages show mock data despite `USE_MOCK_API=false` | Env var not picked up | Restart the dev server after editing `.env.local` |
| `ApiError: 401` on every call | Session token expired or not passed | Re-login; verify `AuthContext` passes token to service functions |
| Image stuck in "Building" | vCenter task polling fails | Check vCenter reachability; inspect browser Network tab for 4xx/5xx on `/api/cis/tasks/…` |
| CORS errors in browser | vCenter not configured for CORS | Add the console origin to vCenter's CORS allow-list, or proxy through a backend |
| `getEndpoints` returns defaults | Region key not matching | Region keys must be exactly `us-east-1`, `us-west-2`, `eu-west-2`, `ap-southeast-1` |

### CORS

vCenter and NSX APIs do not enable CORS by default. For browser-based access either:

- Configure CORS on each vCenter / NSX Manager (allow-list your console origin), or
- Add a lightweight reverse proxy (Nginx, Caddy) in front of the APIs that injects the required `Access-Control-Allow-*` headers.
