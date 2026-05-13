'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { buildImage as apiBuildImage, replicateImage as apiReplicateImage, deleteImage as apiDeleteImage } from '../services/imageService';
import type { BuildImagePayload } from '../services/imageService';

export type ImageBuildStatus = 'queued' | 'building' | 'available' | 'failed';

export interface CustomImage {
  id: string;
  name: string;
  description: string;
  os: string;
  osFamily: 'linux' | 'windows' | 'other';
  baseTemplateName: string;
  cpu: number;
  memory: number;
  diskGB: number;
  size: string;
  library: string;
  sourceRegion: string;
  availableRegions: string[];
  buildStatus: ImageBuildStatus;
  builtAt: string;
  builtBy: string;
  tags: Record<string, string>;
  cloudInitScript: string;
  isPublic: boolean;
  downloads: number;
}

interface ImageContextValue {
  images: CustomImage[];
  isBuilding: boolean;
  /** Submit a new image build job */
  buildImage: (payload: BuildImagePayload, builtBy: string) => Promise<CustomImage>;
  /** Replicate an existing image to an additional region */
  replicateToRegion: (imageId: string, targetRegion: string) => Promise<void>;
  /** Permanently delete an image from all regions */
  deleteImage: (imageId: string) => Promise<void>;
  /** Images available in a specific region */
  imagesForRegion: (region: string) => CustomImage[];
}

const ImageContext = createContext<ImageContextValue | null>(null);

const STORAGE_KEY = 'vmc_custom_images';

function generateId() {
  return `img-${Math.random().toString(36).slice(2, 10)}`;
}

// Seed images that ship with the console — treated as already-built custom images
const SEED_IMAGES: CustomImage[] = [
  {
    id: 'img-golden-web',
    name: 'web-server-golden',
    description: 'CIS-hardened NGINX web server — internal golden image, quarterly patched',
    os: 'Ubuntu 22.04 LTS',
    osFamily: 'linux',
    baseTemplateName: 'ubuntu-22.04-server',
    cpu: 2, memory: 4, diskGB: 40,
    size: '3.2 GB',
    library: 'internal-images',
    sourceRegion: 'us-east-1',
    availableRegions: ['us-east-1', 'us-west-2', 'eu-west-2'],
    buildStatus: 'available',
    builtAt: '2025-04-01T09:00:00Z',
    builtBy: 'admin@vmc-corp.com',
    tags: { Environment: 'Production', CIS: 'Level2', Patched: '2025-04-01' },
    cloudInitScript: '#!/bin/bash\napt-get update && apt-get install -y nginx fail2ban ufw\nufw allow 80 && ufw allow 443 && ufw enable',
    isPublic: false,
    downloads: 47,
  },
  {
    id: 'img-k8s-node',
    name: 'k8s-worker-node',
    description: 'Pre-configured Kubernetes worker node image with containerd and kubeadm',
    os: 'Ubuntu 22.04 LTS',
    osFamily: 'linux',
    baseTemplateName: 'ubuntu-22.04-server',
    cpu: 4, memory: 8, diskGB: 80,
    size: '4.8 GB',
    library: 'internal-images',
    sourceRegion: 'us-east-1',
    availableRegions: ['us-east-1', 'us-west-2'],
    buildStatus: 'available',
    builtAt: '2025-03-15T14:30:00Z',
    builtBy: 'developer@vmc-corp.com',
    tags: { Purpose: 'Kubernetes', Runtime: 'containerd', Version: '1.29' },
    cloudInitScript: '#!/bin/bash\ncurl -fsSL https://get.docker.com | sh\napt-get install -y kubelet kubeadm kubectl',
    isPublic: false,
    downloads: 23,
  },
  {
    id: 'img-db-postgres',
    name: 'postgres-16-hardened',
    description: 'PostgreSQL 16 on RHEL 9 with pgBackRest, pg_audit, and encrypted storage',
    os: 'Red Hat Enterprise Linux 9.2',
    osFamily: 'linux',
    baseTemplateName: 'rhel-9.2-server',
    cpu: 4, memory: 16, diskGB: 200,
    size: '5.6 GB',
    library: 'database-images',
    sourceRegion: 'us-east-1',
    availableRegions: ['us-east-1'],
    buildStatus: 'available',
    builtAt: '2025-04-10T11:00:00Z',
    builtBy: 'admin@vmc-corp.com',
    tags: { Database: 'PostgreSQL', Version: '16', Encrypted: 'true' },
    cloudInitScript: '#!/bin/bash\ndnf install -y postgresql16-server postgresql16-contrib\npostgresql-16-setup initdb\nsystemctl enable --now postgresql-16',
    isPublic: false,
    downloads: 12,
  },
];

export function ImageProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<CustomImage[]>([]);
  const [isBuilding, setIsBuilding] = useState(false);

  // Load from localStorage on mount, seed if empty
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CustomImage[] = JSON.parse(stored);
        // Merge seed images that aren't already stored
        const ids = new Set(parsed.map(i => i.id));
        const merged = [...parsed, ...SEED_IMAGES.filter(s => !ids.has(s.id))];
        setImages(merged);
      } else {
        setImages(SEED_IMAGES);
      }
    } catch {
      setImages(SEED_IMAGES);
    }
  }, []);

  // Persist whenever images change (skip seed-only initial state)
  useEffect(() => {
    if (images.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(images));
    }
  }, [images]);

  const buildImage = useCallback(async (payload: BuildImagePayload, builtBy: string): Promise<CustomImage> => {
    setIsBuilding(true);
    const id = generateId();

    const newImage: CustomImage = {
      id,
      name: payload.name,
      description: payload.description,
      os: payload.os,
      osFamily: payload.osFamily,
      baseTemplateName: payload.baseTemplateName,
      cpu: payload.cpu,
      memory: payload.memory,
      diskGB: payload.diskGB,
      size: `${(payload.diskGB * 0.12).toFixed(1)} GB`,
      library: payload.library || 'custom-images',
      sourceRegion: payload.targetRegions[0] ?? 'us-east-1',
      availableRegions: [...payload.targetRegions],
      buildStatus: 'queued',
      builtAt: new Date().toISOString(),
      builtBy,
      tags: payload.tags,
      cloudInitScript: payload.cloudInitScript,
      isPublic: false,
      downloads: 0,
    };

    setImages(prev => [newImage, ...prev]);

    // Call the API service (mocked or real)
    try {
      await apiBuildImage(payload);

      // Simulate build pipeline: queued → building → available
      setTimeout(() => {
        setImages(prev =>
          prev.map(img => img.id === id ? { ...img, buildStatus: 'building' } : img)
        );
      }, 1500);

      setTimeout(() => {
        setImages(prev =>
          prev.map(img => img.id === id ? { ...img, buildStatus: 'available' } : img)
        );
        setIsBuilding(false);
      }, 5000);
    } catch {
      setImages(prev =>
        prev.map(img => img.id === id ? { ...img, buildStatus: 'failed' } : img)
      );
      setIsBuilding(false);
    }

    return newImage;
  }, []);

  const replicateToRegion = useCallback(async (imageId: string, targetRegion: string) => {
    const image = images.find(i => i.id === imageId);
    if (!image || image.availableRegions.includes(targetRegion)) return;

    setImages(prev =>
      prev.map(img =>
        img.id === imageId
          ? { ...img, availableRegions: [...img.availableRegions, targetRegion] }
          : img
      )
    );

    await apiReplicateImage(image, targetRegion);
  }, [images]);

  const deleteImage = useCallback(async (imageId: string) => {
    const image = images.find(i => i.id === imageId);
    if (!image) return;
    await apiDeleteImage(imageId, image.availableRegions);
    setImages(prev => prev.filter(img => img.id !== imageId));
  }, [images]);

  const imagesForRegion = useCallback(
    (region: string) => images.filter(img => img.availableRegions.includes(region) && img.buildStatus === 'available'),
    [images]
  );

  return (
    <ImageContext.Provider value={{ images, isBuilding, buildImage, replicateToRegion, deleteImage, imagesForRegion }}>
      {children}
    </ImageContext.Provider>
  );
}

export function useImages() {
  const ctx = useContext(ImageContext);
  if (!ctx) throw new Error('useImages must be used inside ImageProvider');
  return ctx;
}
