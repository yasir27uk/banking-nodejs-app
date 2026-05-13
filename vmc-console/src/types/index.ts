export interface VM {
  id: string;
  name: string;
  region: string;
  status: 'running' | 'stopped' | 'error' | 'provisioning';
  os: string;
  cpu: number;
  memory: number;
  storage: number;
  sddc: string;
  privateIp: string;
  publicIp?: string;
  launchTime: string;
  tags: Record<string, string>;
}

export interface SDDC {
  id: string;
  name: string;
  region: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  vms: number;
  cpu: number;
  memory: number;
  version: string;
}

export interface Volume {
  id: string;
  name: string;
  region: string;
  type: 'vSAN' | 'NFS' | 'vVOL';
  size: number;
  attachedTo?: string;
  status: 'available' | 'in-use' | 'error';
}

export interface SecurityGroup {
  id: string;
  name: string;
  region: string;
  rules: number;
  vpcs: number;
  description: string;
}

export interface Region {
  id: string;
  name: string;
  location: string;
  sddcs: SDDC[];
}

export interface CLITool {
  name: string;
  command: string;
  description: string;
}

export interface RecentActivity {
  id: string;
  action: string;
  resource: string;
  time: string;
  status: 'success' | 'warning' | 'error';
  region: string;
}

// ── VMware Infrastructure types ──────────────────────────────────────────────

export interface VCenterServer {
  id: string;
  name: string;
  hostname: string;
  version: string;
  build: string;
  region: string;
  status: 'connected' | 'disconnected' | 'maintenance';
  datacenterCount: number;
  clusterCount: number;
  hostCount: number;
  vmCount: number;
  lastUpdated: string;
}

export interface ESXiHost {
  id: string;
  name: string;
  ipAddress: string;
  clusterId: string;
  clusterName: string;
  vcenter: string;
  region: string;
  status: 'connected' | 'disconnected' | 'maintenance' | 'not-responding';
  cpuTotal: number;          // MHz
  cpuUsed: number;
  memoryTotal: number;       // GB
  memoryUsed: number;
  vmCount: number;
  esxiVersion: string;
  model: string;
  vendor: string;
  uptime: string;
}

export interface Cluster {
  id: string;
  name: string;
  datacenterId: string;
  datacenterName: string;
  vcenter: string;
  region: string;
  hostCount: number;
  vmCount: number;
  cpuTotalGHz: number;
  cpuUsedGHz: number;
  memTotalGB: number;
  memUsedGB: number;
  haEnabled: boolean;
  drsEnabled: boolean;
  vsanEnabled: boolean;
  status: 'green' | 'yellow' | 'red';
}

export interface Datacenter {
  id: string;
  name: string;
  vcenter: string;
  region: string;
  clusterCount: number;
  hostCount: number;
  vmCount: number;
  datastoreCount: number;
  networkCount: number;
}

// ── Content Library / Templates (AMI equivalent) ─────────────────────────────

export interface VMTemplate {
  id: string;
  name: string;
  description: string;
  os: string;
  osFamily: 'linux' | 'windows' | 'other';
  version: string;
  cpu: number;
  memory: number;
  diskGB: number;
  size: string;          // e.g. "4.2 GB"
  library: string;       // content library name
  region: string;
  tags: string[];
  isPublic: boolean;
  source: 'vmware' | 'partner' | 'custom' | 'marketplace';
  lastModified: string;
  type: 'template' | 'ovf' | 'ova' | 'iso';
  rating?: number;
  downloads?: number;
}

// ── VMware Marketplace ────────────────────────────────────────────────────────

export interface MarketplaceItem {
  id: string;
  name: string;
  vendor: string;
  vendorLogo: string;        // initials placeholder
  category: string;
  description: string;
  shortDesc: string;
  version: string;
  deploymentType: 'vm' | 'ova' | 'chart' | 'container';
  pricing: 'free' | 'byol' | 'paid' | 'freemium';
  priceLabel: string;
  rating: number;
  reviews: number;
  downloads: number;
  tags: string[];
  isNew?: boolean;
  isFeatured?: boolean;
  osFamily: 'linux' | 'windows' | 'multi' | 'other';
  requiredCPU: number;
  requiredMemGB: number;
  requiredDiskGB: number;
}

// ── NSX Networking ────────────────────────────────────────────────────────────

export interface NSXSegment {
  id: string;
  name: string;
  type: 'routed' | 'isolated' | 'extended';
  gateway: string;
  cidr: string;
  vlan?: string;
  transportZone: string;
  attachedVMs: number;
  dhcp: boolean;
  region: string;
  status: 'up' | 'down' | 'unknown';
}

export interface NSXGateway {
  id: string;
  name: string;
  tier: 'T0' | 'T1';
  mode: 'active-active' | 'active-standby';
  ha: boolean;
  edgeCluster: string;
  linkedSegments: number;
  bgpPeers: number;
  region: string;
  status: 'up' | 'down' | 'degraded';
}

export interface FirewallPolicy {
  id: string;
  name: string;
  scope: 'gateway' | 'distributed';
  ruleCount: number;
  priority: number;
  applied: string[];
  region: string;
  status: 'enabled' | 'disabled';
}
