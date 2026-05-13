/**
 * Image Service — CRUD for Content Library / VM Templates.
 *
 * Real API surface (vCenter 8.x REST):
 *   GET    /api/content/library                                → list libraries
 *   GET    /api/content/library/item?library_id=...           → list items
 *   POST   /api/content/library/item                          → create item
 *   DELETE /api/content/library/item/{id}                     → delete item
 *   POST   /api/vcenter/vm-template/library-items/{id}/deploy → deploy VM from template
 *
 * When USE_MOCK_API=true, all methods resolve immediately with mock data
 * so the UI is fully functional without real vCenter connectivity.
 */

import { USE_MOCK_API, getEndpoints } from './apiConfig';
import { vcenterClient } from './apiClient';
import type { CustomImage } from '../context/ImageContext';

export type BuildImagePayload = {
  name: string;
  description: string;
  baseTemplateId: string;
  baseTemplateName: string;
  osFamily: 'linux' | 'windows' | 'other';
  os: string;
  cpu: number;
  memory: number;
  diskGB: number;
  cloudInitScript: string;
  targetRegions: string[];
  tags: Record<string, string>;
  library: string;
};

export type DeployImagePayload = {
  imageId: string;
  vmName: string;
  clusterId: string;
  segmentId: string;
  cpu?: number;
  memoryGB?: number;
};

/** Submit a build job to the Content Library. Returns a job/task ID. */
export async function buildImage(
  payload: BuildImagePayload,
  token?: string
): Promise<{ taskId: string }> {
  if (USE_MOCK_API) {
    await delay(400);
    return { taskId: `task-${generateId()}` };
  }

  // Real path: POST to each target region's Content Library
  const primaryRegion = payload.targetRegions[0] ?? 'us-east-1';
  const endpoints = getEndpoints(primaryRegion);
  const client = vcenterClient(endpoints.vcenterApi, token);

  const body = {
    name: payload.name,
    description: payload.description,
    type: 'vm_template',
    library_id: await getOrCreateLibrary(client, payload.library),
    client_token: generateId(),
  };

  const item = await client.post<{ value: string }>('/content/library/item', body);
  return { taskId: item.value };
}

/** Poll build status. In real API this maps to a vCenter task. */
export async function getImageBuildStatus(
  taskId: string,
  region: string,
  token?: string
): Promise<'queued' | 'building' | 'available' | 'failed'> {
  if (USE_MOCK_API) {
    await delay(200);
    return 'available';
  }

  const endpoints = getEndpoints(region);
  const client = vcenterClient(endpoints.vcenterApi, token);
  const task = await client.get<{ status: string; state: string }>(`/cis/tasks/${taskId}`);
  if (task.state === 'SUCCEEDED') return 'available';
  if (task.state === 'FAILED') return 'failed';
  return 'building';
}

/** Replicate an image to additional regions (subscribe a content library). */
export async function replicateImage(
  image: CustomImage,
  targetRegion: string,
  token?: string
): Promise<void> {
  if (USE_MOCK_API) {
    await delay(300);
    return;
  }

  const endpoints = getEndpoints(targetRegion);
  const client = vcenterClient(endpoints.vcenterApi, token);

  await client.post('/content/subscribed-library', {
    name: `Subscribed-${image.name}`,
    description: `Subscribed from ${image.sourceRegion}`,
    type: 'subscribed',
    subscription_info: {
      subscription_url: `https://${getEndpoints(image.sourceRegion).vcenterApi}/content/library/${image.id}`,
      authentication_method: 'NONE',
      on_demand: true,
    },
  });
}

/** Delete an image from Content Library across all its regions. */
export async function deleteImage(
  imageId: string,
  regions: string[],
  token?: string
): Promise<void> {
  if (USE_MOCK_API) {
    await delay(200);
    return;
  }

  await Promise.all(
    regions.map(async region => {
      const endpoints = getEndpoints(region);
      const client = vcenterClient(endpoints.vcenterApi, token);
      await client.delete(`/content/library/item/${imageId}`);
    })
  );
}

/** Deploy a VM from an image in Content Library. */
export async function deployFromImage(
  payload: DeployImagePayload,
  region: string,
  token?: string
): Promise<{ vmId: string }> {
  if (USE_MOCK_API) {
    await delay(500);
    return { vmId: `vm-${generateId()}` };
  }

  const endpoints = getEndpoints(region);
  const client = vcenterClient(endpoints.vcenterApi, token);

  const result = await client.post<{ value: string }>(
    `/vcenter/vm-template/library-items/${payload.imageId}/deploy`,
    {
      name: payload.vmName,
      placement: { cluster: payload.clusterId },
      hardware_customization: {
        cpu_update: payload.cpu ? { num_cpus: payload.cpu } : undefined,
        memory_update: payload.memoryGB ? { memory: payload.memoryGB * 1024 } : undefined,
      },
    }
  );
  return { vmId: result.value };
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function delay(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

async function getOrCreateLibrary(
  client: ReturnType<typeof vcenterClient>,
  libraryName: string
): Promise<string> {
  const libs = await client.get<string[]>('/content/library');
  for (const id of libs) {
    const lib = await client.get<{ name: string; id: string }>(`/content/library/${id}`);
    if (lib.name === libraryName) return id;
  }
  const created = await client.post<{ value: string }>('/content/local-library', {
    name: libraryName,
    type: 'local',
    storage_backings: [{ type: 'DATASTORE' }],
    client_token: generateId(),
  });
  return created.value;
}
