import {
  VM, SDDC, Volume, SecurityGroup, Region, CLITool, RecentActivity,
  VCenterServer, ESXiHost, Cluster, Datacenter,
  VMTemplate, MarketplaceItem, NSXSegment, NSXGateway, FirewallPolicy
} from '../types';

// ── Regions ───────────────────────────────────────────────────────────────────
export const regions: Region[] = [
  {
    id: 'us-east-1',
    name: 'US East (N. Virginia)',
    location: 'us-east-1',
    sddcs: [
      { id: 'sddc-use1-001', name: 'sddc-use1-prod', region: 'us-east-1', status: 'healthy', vms: 54, cpu: 73, memory: 65, version: '1.24' },
      { id: 'sddc-use1-002', name: 'sddc-use1-dev', region: 'us-east-1', status: 'healthy', vms: 28, cpu: 45, memory: 52, version: '1.24' },
    ]
  },
  {
    id: 'us-west-2',
    name: 'US West (Oregon)',
    location: 'us-west-2',
    sddcs: [
      { id: 'sddc-usw2-001', name: 'sddc-usw2-prod', region: 'us-west-2', status: 'healthy', vms: 48, cpu: 81, memory: 77, version: '1.24' },
    ]
  },
  {
    id: 'eu-west-2',
    name: 'EU (London)',
    location: 'eu-west-2',
    sddcs: [
      { id: 'sddc-euw2-001', name: 'sddc-euw2-prod', region: 'eu-west-2', status: 'degraded', vms: 52, cpu: 91, memory: 78, version: '1.23' },
    ]
  },
  {
    id: 'ap-southeast-1',
    name: 'Asia Pacific (Singapore)',
    location: 'ap-southeast-1',
    sddcs: [
      { id: 'sddc-apse1-001', name: 'sddc-apse1-prod', region: 'ap-southeast-1', status: 'healthy', vms: 32, cpu: 48, memory: 55, version: '1.24' },
    ]
  },
];

// ── Virtual Machines ──────────────────────────────────────────────────────────
export const vms: VM[] = [
  { id: 'vm-0a1b2c3d4e5f6789a', name: 'web-server-01', region: 'us-east-1', status: 'running', os: 'Ubuntu 22.04 LTS', cpu: 4, memory: 16, storage: 100, sddc: 'sddc-use1-prod', privateIp: '10.0.1.10', publicIp: '54.123.45.67', launchTime: '2024-05-01T08:30:00Z', tags: { Environment: 'Production', Team: 'Platform', Cluster: 'prod-cluster-01' } },
  { id: 'vm-0b2c3d4e5f6789ab1', name: 'app-server-02', region: 'us-east-1', status: 'running', os: 'RHEL 9.2', cpu: 8, memory: 32, storage: 200, sddc: 'sddc-use1-prod', privateIp: '10.0.1.15', publicIp: '54.123.45.89', launchTime: '2024-05-02T10:15:00Z', tags: { Environment: 'Production', Team: 'Apps' } },
  { id: 'vm-0c3d4e5f6789ab12c', name: 'db-primary', region: 'us-east-1', status: 'running', os: 'CentOS Stream 9', cpu: 16, memory: 64, storage: 500, sddc: 'sddc-use1-prod', privateIp: '10.0.2.20', launchTime: '2024-04-28T06:00:00Z', tags: { Environment: 'Production', Team: 'Database' } },
  { id: 'vm-0d4e5f6789ab12c3d', name: 'dev-workstation-01', region: 'us-east-1', status: 'stopped', os: 'Windows Server 2022', cpu: 4, memory: 16, storage: 150, sddc: 'sddc-use1-dev', privateIp: '10.1.1.5', launchTime: '2024-05-03T14:20:00Z', tags: { Environment: 'Development', Team: 'Engineering' } },
  { id: 'vm-0e5f6789ab12c3d4e', name: 'cache-cluster-01', region: 'us-west-2', status: 'running', os: 'Ubuntu 22.04 LTS', cpu: 8, memory: 64, storage: 50, sddc: 'sddc-usw2-prod', privateIp: '10.2.1.30', publicIp: '52.45.67.89', launchTime: '2024-05-01T12:00:00Z', tags: { Environment: 'Production', Team: 'Cache' } },
  { id: 'vm-0f6789ab12c3d4e5f', name: 'analytics-worker', region: 'us-west-2', status: 'error', os: 'Ubuntu 22.04 LTS', cpu: 32, memory: 128, storage: 1000, sddc: 'sddc-usw2-prod', privateIp: '10.2.3.40', launchTime: '2024-04-25T09:30:00Z', tags: { Environment: 'Production', Team: 'Data' } },
  { id: 'vm-06789ab12c3d4e5f6', name: 'eu-web-01', region: 'eu-west-2', status: 'running', os: 'RHEL 9.2', cpu: 4, memory: 16, storage: 100, sddc: 'sddc-euw2-prod', privateIp: '10.3.1.10', publicIp: '18.135.22.45', launchTime: '2024-05-04T08:00:00Z', tags: { Environment: 'Production', Team: 'Platform' } },
  { id: 'vm-0789ab12c3d4e5f67', name: 'eu-app-01', region: 'eu-west-2', status: 'provisioning', os: 'Ubuntu 22.04 LTS', cpu: 8, memory: 32, storage: 200, sddc: 'sddc-euw2-prod', privateIp: '10.3.1.20', launchTime: '2024-05-05T13:45:00Z', tags: { Environment: 'Production', Team: 'Apps' } },
  { id: 'vm-089ab12c3d4e5f678', name: 'ap-singapore-web', region: 'ap-southeast-1', status: 'running', os: 'Ubuntu 22.04 LTS', cpu: 4, memory: 16, storage: 100, sddc: 'sddc-apse1-prod', privateIp: '10.4.1.15', publicIp: '13.251.45.67', launchTime: '2024-05-02T03:30:00Z', tags: { Environment: 'Production', Team: 'Platform' } },
];

// ── Volumes ───────────────────────────────────────────────────────────────────
export const volumes: Volume[] = [
  { id: 'vol-0a1b2c3d4e5f6789a', name: 'web-data-vol', region: 'us-east-1', type: 'vSAN', size: 100, attachedTo: 'vm-0a1b2c3d4e5f6789a', status: 'in-use' },
  { id: 'vol-0b2c3d4e5f6789ab1', name: 'app-storage-vol', region: 'us-east-1', type: 'vSAN', size: 200, attachedTo: 'vm-0b2c3d4e5f6789ab1', status: 'in-use' },
  { id: 'vol-0c3d4e5f6789ab12', name: 'db-primary-vol', region: 'us-east-1', type: 'vSAN', size: 500, attachedTo: 'vm-0c3d4e5f6789ab12c', status: 'in-use' },
  { id: 'vol-0d4e5f6789ab12c3d', name: 'backup-nfs-01', region: 'us-east-1', type: 'NFS', size: 2000, status: 'available' },
  { id: 'vol-0e5f6789ab12c3d4e', name: 'cache-vol', region: 'us-west-2', type: 'vSAN', size: 50, attachedTo: 'vm-0e5f6789ab12c3d4e', status: 'in-use' },
  { id: 'vol-0f6789ab12c3d4e5f', name: 'analytics-vol', region: 'us-west-2', type: 'vSAN', size: 1000, attachedTo: 'vm-0f6789ab12c3d4e5f', status: 'in-use' },
  { id: 'vol-06789ab12c3d4e5f6', name: 'eu-web-vol', region: 'eu-west-2', type: 'vSAN', size: 100, attachedTo: 'vm-06789ab12c3d4e5f6', status: 'in-use' },
  { id: 'vol-0789ab12c3d4e5f67', name: 'eu-app-vol', region: 'eu-west-2', type: 'vSAN', size: 200, attachedTo: 'vm-0789ab12c3d4e5f67', status: 'in-use' },
];

// ── Security Groups ───────────────────────────────────────────────────────────
export const securityGroups: SecurityGroup[] = [
  { id: 'sg-0a1b2c3d4e5f6789a', name: 'web-tier-sg', region: 'us-east-1', rules: 8, vpcs: 2, description: 'Security group for web tier applications' },
  { id: 'sg-0b2c3d4e5f6789ab1', name: 'app-tier-sg', region: 'us-east-1', rules: 12, vpcs: 2, description: 'Security group for application tier' },
  { id: 'sg-0c3d4e5f6789ab12', name: 'db-tier-sg', region: 'us-east-1', rules: 4, vpcs: 2, description: 'Security group for database tier' },
  { id: 'sg-0d4e5f6789ab12c3', name: 'ALLOW-HTTPS-ALL', region: 'us-east-1', rules: 2, vpcs: 4, description: 'Allow HTTPS inbound from anywhere' },
  { id: 'sg-0e5f6789ab12c3d4', name: 'usw2-web-sg', region: 'us-west-2', rules: 6, vpcs: 1, description: 'Web tier security group US West' },
  { id: 'sg-0f6789ab12c3d4e5', name: 'euw2-web-sg', region: 'eu-west-2', rules: 6, vpcs: 1, description: 'Web tier security group EU London' },
  { id: 'sg-06789ab12c3d4e5f', name: 'apse1-web-sg', region: 'ap-southeast-1', rules: 6, vpcs: 1, description: 'Web tier security group AP Singapore' },
];

// ── Recent Activity ───────────────────────────────────────────────────────────
export const recentActivity: RecentActivity[] = [
  { id: '1', action: 'VM provisioned', resource: 'vm-0789ab12c3d4e5f67 (eu-app-01)', time: '2024-05-05T13:45:00Z', status: 'success', region: 'eu-west-2' },
  { id: '2', action: 'vSAN alarm triggered', resource: 'vSAN Cluster CPU Utilization > 90%', time: '2024-05-05T12:30:00Z', status: 'warning', region: 'eu-west-2' },
  { id: '3', action: 'Snapshot created', resource: 'snap-db-primary-20240505', time: '2024-05-05T08:15:00Z', status: 'success', region: 'us-east-1' },
  { id: '4', action: 'NSX DFW rule added', resource: 'sg-0d4e5f6789ab12c3 — ALLOW-HTTPS-ALL', time: '2024-05-04T16:20:00Z', status: 'success', region: 'global' },
  { id: '5', action: 'VM powered off', resource: 'vm-0d4e5f6789ab12c3d (dev-workstation-01)', time: '2024-05-03T18:00:00Z', status: 'success', region: 'us-east-1' },
];

export const cliTools: CLITool[] = [
  { name: 'vmc-cli', command: 'vmc', description: 'VMware Cloud CLI' },
  { name: 'govc', command: 'govc', description: 'Go vCenter CLI' },
  { name: 'nsx-cli', command: 'nsx', description: 'NSX-T CLI' },
  { name: 'PowerCLI', command: 'powercli', description: 'PowerShell for VMware' },
];

// ── vCenter Servers ───────────────────────────────────────────────────────────
export const vCenterServers: VCenterServer[] = [
  { id: 'vc-use1-001', name: 'vcenter-use1-prod', hostname: 'vcenter.sddc-use1-prod.vmwarevmc.com', version: '8.0 Update 3', build: '22837322', region: 'us-east-1', status: 'connected', datacenterCount: 2, clusterCount: 4, hostCount: 16, vmCount: 82, lastUpdated: '2024-05-05T13:50:00Z' },
  { id: 'vc-use1-002', name: 'vcenter-use1-dev', hostname: 'vcenter.sddc-use1-dev.vmwarevmc.com', version: '8.0 Update 3', build: '22837322', region: 'us-east-1', status: 'connected', datacenterCount: 1, clusterCount: 2, hostCount: 8, vmCount: 28, lastUpdated: '2024-05-05T13:45:00Z' },
  { id: 'vc-usw2-001', name: 'vcenter-usw2-prod', hostname: 'vcenter.sddc-usw2-prod.vmwarevmc.com', version: '8.0 Update 2', build: '22088424', region: 'us-west-2', status: 'connected', datacenterCount: 1, clusterCount: 2, hostCount: 8, vmCount: 48, lastUpdated: '2024-05-05T13:40:00Z' },
  { id: 'vc-euw2-001', name: 'vcenter-euw2-prod', hostname: 'vcenter.sddc-euw2-prod.vmwarevmc.com', version: '8.0 Update 2', build: '22088424', region: 'eu-west-2', status: 'connected', datacenterCount: 1, clusterCount: 2, hostCount: 6, vmCount: 52, lastUpdated: '2024-05-05T12:30:00Z' },
  { id: 'vc-apse1-001', name: 'vcenter-apse1-prod', hostname: 'vcenter.sddc-apse1-prod.vmwarevmc.com', version: '8.0 Update 3', build: '22837322', region: 'ap-southeast-1', status: 'connected', datacenterCount: 1, clusterCount: 1, hostCount: 4, vmCount: 32, lastUpdated: '2024-05-05T13:20:00Z' },
];

// ── ESXi Hosts ────────────────────────────────────────────────────────────────
export const esxiHosts: ESXiHost[] = [
  { id: 'host-use1-001', name: 'esxi-use1-001.vmwarevmc.com', ipAddress: '10.0.0.11', clusterId: 'cluster-use1-prod-01', clusterName: 'prod-cluster-01', vcenter: 'vcenter-use1-prod', region: 'us-east-1', status: 'connected', cpuTotal: 76800, cpuUsed: 56064, memoryTotal: 512, memoryUsed: 332, vmCount: 22, esxiVersion: 'ESXi 8.0 Update 3', model: 'Dell PowerEdge R760', vendor: 'Dell', uptime: '97 days' },
  { id: 'host-use1-002', name: 'esxi-use1-002.vmwarevmc.com', ipAddress: '10.0.0.12', clusterId: 'cluster-use1-prod-01', clusterName: 'prod-cluster-01', vcenter: 'vcenter-use1-prod', region: 'us-east-1', status: 'connected', cpuTotal: 76800, cpuUsed: 48384, memoryTotal: 512, memoryUsed: 298, vmCount: 18, esxiVersion: 'ESXi 8.0 Update 3', model: 'Dell PowerEdge R760', vendor: 'Dell', uptime: '97 days' },
  { id: 'host-use1-003', name: 'esxi-use1-003.vmwarevmc.com', ipAddress: '10.0.0.13', clusterId: 'cluster-use1-prod-01', clusterName: 'prod-cluster-01', vcenter: 'vcenter-use1-prod', region: 'us-east-1', status: 'connected', cpuTotal: 76800, cpuUsed: 38400, memoryTotal: 512, memoryUsed: 256, vmCount: 14, esxiVersion: 'ESXi 8.0 Update 3', model: 'Dell PowerEdge R760', vendor: 'Dell', uptime: '97 days' },
  { id: 'host-use1-004', name: 'esxi-use1-004.vmwarevmc.com', ipAddress: '10.0.0.14', clusterId: 'cluster-use1-prod-01', clusterName: 'prod-cluster-01', vcenter: 'vcenter-use1-prod', region: 'us-east-1', status: 'maintenance', cpuTotal: 76800, cpuUsed: 0, memoryTotal: 512, memoryUsed: 0, vmCount: 0, esxiVersion: 'ESXi 8.0 Update 3', model: 'Dell PowerEdge R760', vendor: 'Dell', uptime: '0 days (maintenance)' },
  { id: 'host-usw2-001', name: 'esxi-usw2-001.vmwarevmc.com', ipAddress: '10.2.0.11', clusterId: 'cluster-usw2-prod-01', clusterName: 'prod-cluster-usw2', vcenter: 'vcenter-usw2-prod', region: 'us-west-2', status: 'connected', cpuTotal: 76800, cpuUsed: 62208, memoryTotal: 512, memoryUsed: 393, vmCount: 26, esxiVersion: 'ESXi 8.0 Update 2', model: 'HPE ProLiant DL380 Gen11', vendor: 'HPE', uptime: '65 days' },
  { id: 'host-usw2-002', name: 'esxi-usw2-002.vmwarevmc.com', ipAddress: '10.2.0.12', clusterId: 'cluster-usw2-prod-01', clusterName: 'prod-cluster-usw2', vcenter: 'vcenter-usw2-prod', region: 'us-west-2', status: 'connected', cpuTotal: 76800, cpuUsed: 50688, memoryTotal: 512, memoryUsed: 340, vmCount: 22, esxiVersion: 'ESXi 8.0 Update 2', model: 'HPE ProLiant DL380 Gen11', vendor: 'HPE', uptime: '65 days' },
  { id: 'host-euw2-001', name: 'esxi-euw2-001.vmwarevmc.com', ipAddress: '10.3.0.11', clusterId: 'cluster-euw2-prod-01', clusterName: 'prod-cluster-euw2', vcenter: 'vcenter-euw2-prod', region: 'eu-west-2', status: 'connected', cpuTotal: 56000, cpuUsed: 50960, memoryTotal: 384, memoryUsed: 299, vmCount: 20, esxiVersion: 'ESXi 8.0 Update 2', model: 'Cisco UCS B200 M6', vendor: 'Cisco', uptime: '42 days' },
  { id: 'host-euw2-002', name: 'esxi-euw2-002.vmwarevmc.com', ipAddress: '10.3.0.12', clusterId: 'cluster-euw2-prod-01', clusterName: 'prod-cluster-euw2', vcenter: 'vcenter-euw2-prod', region: 'eu-west-2', status: 'connected', cpuTotal: 56000, cpuUsed: 46480, memoryTotal: 384, memoryUsed: 276, vmCount: 18, esxiVersion: 'ESXi 8.0 Update 2', model: 'Cisco UCS B200 M6', vendor: 'Cisco', uptime: '42 days' },
  { id: 'host-euw2-003', name: 'esxi-euw2-003.vmwarevmc.com', ipAddress: '10.3.0.13', clusterId: 'cluster-euw2-prod-01', clusterName: 'prod-cluster-euw2', vcenter: 'vcenter-euw2-prod', region: 'eu-west-2', status: 'not-responding', cpuTotal: 56000, cpuUsed: 0, memoryTotal: 384, memoryUsed: 0, vmCount: 14, esxiVersion: 'ESXi 8.0 Update 2', model: 'Cisco UCS B200 M6', vendor: 'Cisco', uptime: 'N/A' },
  { id: 'host-apse1-001', name: 'esxi-apse1-001.vmwarevmc.com', ipAddress: '10.4.0.11', clusterId: 'cluster-apse1-prod-01', clusterName: 'prod-cluster-apse1', vcenter: 'vcenter-apse1-prod', region: 'ap-southeast-1', status: 'connected', cpuTotal: 64000, cpuUsed: 30720, memoryTotal: 256, memoryUsed: 140, vmCount: 16, esxiVersion: 'ESXi 8.0 Update 3', model: 'Dell PowerEdge R750', vendor: 'Dell', uptime: '120 days' },
  { id: 'host-apse1-002', name: 'esxi-apse1-002.vmwarevmc.com', ipAddress: '10.4.0.12', clusterId: 'cluster-apse1-prod-01', clusterName: 'prod-cluster-apse1', vcenter: 'vcenter-apse1-prod', region: 'ap-southeast-1', status: 'connected', cpuTotal: 64000, cpuUsed: 23040, memoryTotal: 256, memoryUsed: 115, vmCount: 16, esxiVersion: 'ESXi 8.0 Update 3', model: 'Dell PowerEdge R750', vendor: 'Dell', uptime: '120 days' },
];

// ── Clusters ──────────────────────────────────────────────────────────────────
export const clusters: Cluster[] = [
  { id: 'cluster-use1-prod-01', name: 'prod-cluster-01', datacenterId: 'dc-use1-prod', datacenterName: 'DC-USE1-PROD', vcenter: 'vcenter-use1-prod', region: 'us-east-1', hostCount: 4, vmCount: 54, cpuTotalGHz: 307.2, cpuUsedGHz: 176.4, memTotalGB: 2048, memUsedGB: 886, haEnabled: true, drsEnabled: true, vsanEnabled: true, status: 'green' },
  { id: 'cluster-use1-dev-01', name: 'dev-cluster-01', datacenterId: 'dc-use1-dev', datacenterName: 'DC-USE1-DEV', vcenter: 'vcenter-use1-dev', region: 'us-east-1', hostCount: 2, vmCount: 28, cpuTotalGHz: 153.6, cpuUsedGHz: 55.3, memTotalGB: 1024, memUsedGB: 420, haEnabled: true, drsEnabled: false, vsanEnabled: true, status: 'green' },
  { id: 'cluster-usw2-prod-01', name: 'prod-cluster-usw2', datacenterId: 'dc-usw2-prod', datacenterName: 'DC-USW2-PROD', vcenter: 'vcenter-usw2-prod', region: 'us-west-2', hostCount: 2, vmCount: 48, cpuTotalGHz: 153.6, cpuUsedGHz: 112.9, memTotalGB: 1024, memUsedGB: 733, haEnabled: true, drsEnabled: true, vsanEnabled: true, status: 'yellow' },
  { id: 'cluster-euw2-prod-01', name: 'prod-cluster-euw2', datacenterId: 'dc-euw2-prod', datacenterName: 'DC-EUW2-PROD', vcenter: 'vcenter-euw2-prod', region: 'eu-west-2', hostCount: 3, vmCount: 52, cpuTotalGHz: 168.0, cpuUsedGHz: 148.1, memTotalGB: 1152, memUsedGB: 875, haEnabled: true, drsEnabled: true, vsanEnabled: true, status: 'red' },
  { id: 'cluster-apse1-prod-01', name: 'prod-cluster-apse1', datacenterId: 'dc-apse1-prod', datacenterName: 'DC-APSE1-PROD', vcenter: 'vcenter-apse1-prod', region: 'ap-southeast-1', hostCount: 2, vmCount: 32, cpuTotalGHz: 128.0, cpuUsedGHz: 53.8, memTotalGB: 512, memUsedGB: 255, haEnabled: true, drsEnabled: false, vsanEnabled: true, status: 'green' },
];

// ── Datacenters ───────────────────────────────────────────────────────────────
export const datacenters: Datacenter[] = [
  { id: 'dc-use1-prod', name: 'DC-USE1-PROD', vcenter: 'vcenter-use1-prod', region: 'us-east-1', clusterCount: 2, hostCount: 8, vmCount: 82, datastoreCount: 12, networkCount: 18 },
  { id: 'dc-use1-dev', name: 'DC-USE1-DEV', vcenter: 'vcenter-use1-dev', region: 'us-east-1', clusterCount: 1, hostCount: 4, vmCount: 28, datastoreCount: 6, networkCount: 8 },
  { id: 'dc-usw2-prod', name: 'DC-USW2-PROD', vcenter: 'vcenter-usw2-prod', region: 'us-west-2', clusterCount: 1, hostCount: 4, vmCount: 48, datastoreCount: 8, networkCount: 12 },
  { id: 'dc-euw2-prod', name: 'DC-EUW2-PROD', vcenter: 'vcenter-euw2-prod', region: 'eu-west-2', clusterCount: 1, hostCount: 3, vmCount: 52, datastoreCount: 6, networkCount: 10 },
  { id: 'dc-apse1-prod', name: 'DC-APSE1-PROD', vcenter: 'vcenter-apse1-prod', region: 'ap-southeast-1', clusterCount: 1, hostCount: 2, vmCount: 32, datastoreCount: 4, networkCount: 6 },
];

// ── Content Library / VM Templates ────────────────────────────────────────────
export const vmTemplates: VMTemplate[] = [
  { id: 'tmpl-ubuntu-2204', name: 'Ubuntu Server 22.04 LTS', description: 'Official Ubuntu 22.04 LTS server image optimised for VMware. Cloud-init enabled, open-vm-tools pre-installed.', os: 'Ubuntu 22.04 LTS', osFamily: 'linux', version: '22.04', cpu: 2, memory: 4, diskGB: 20, size: '1.4 GB', library: 'VMware-Official-Templates', region: 'us-east-1', tags: ['ubuntu', 'linux', 'lts', 'cloud-init'], isPublic: true, source: 'vmware', lastModified: '2024-04-01T00:00:00Z', type: 'template', rating: 4.8, downloads: 142300 },
  { id: 'tmpl-ubuntu-2404', name: 'Ubuntu Server 24.04 LTS', description: 'Ubuntu 24.04 LTS (Noble Numbat) server image for VMware. Latest LTS release with updated kernel 6.8.', os: 'Ubuntu 24.04 LTS', osFamily: 'linux', version: '24.04', cpu: 2, memory: 4, diskGB: 25, size: '1.6 GB', library: 'VMware-Official-Templates', region: 'us-east-1', tags: ['ubuntu', 'linux', 'lts', '24.04'], isPublic: true, source: 'vmware', lastModified: '2024-04-24T00:00:00Z', type: 'template', rating: 4.9, downloads: 38200, },
  { id: 'tmpl-rhel-9', name: 'Red Hat Enterprise Linux 9.2', description: 'RHEL 9.2 enterprise image. Subscription required. Pre-configured for VMware with RHEL cloud-init.', os: 'RHEL 9.2', osFamily: 'linux', version: '9.2', cpu: 2, memory: 8, diskGB: 50, size: '2.1 GB', library: 'VMware-Official-Templates', region: 'us-east-1', tags: ['rhel', 'redhat', 'enterprise', 'linux'], isPublic: true, source: 'vmware', lastModified: '2024-03-15T00:00:00Z', type: 'template', rating: 4.7, downloads: 89400 },
  { id: 'tmpl-windows-2022', name: 'Windows Server 2022 Datacenter', description: 'Windows Server 2022 Datacenter edition. VMware Tools pre-installed. EVAL license (180 days).', os: 'Windows Server 2022', osFamily: 'windows', version: '2022', cpu: 4, memory: 8, diskGB: 60, size: '6.4 GB', library: 'VMware-Official-Templates', region: 'us-east-1', tags: ['windows', 'server', 'microsoft', '2022'], isPublic: true, source: 'vmware', lastModified: '2024-02-20T00:00:00Z', type: 'template', rating: 4.5, downloads: 67800 },
  { id: 'tmpl-windows-2019', name: 'Windows Server 2019 Standard', description: 'Windows Server 2019 Standard edition with VMware Tools and Sysprep configuration.', os: 'Windows Server 2019', osFamily: 'windows', version: '2019', cpu: 2, memory: 4, diskGB: 50, size: '5.8 GB', library: 'VMware-Official-Templates', region: 'us-east-1', tags: ['windows', 'server', 'microsoft', '2019'], isPublic: true, source: 'vmware', lastModified: '2024-01-10T00:00:00Z', type: 'template', rating: 4.4, downloads: 112000 },
  { id: 'tmpl-centos-stream9', name: 'CentOS Stream 9', description: 'CentOS Stream 9 – the rolling preview of RHEL content. Optimised for VMware vSphere 8.', os: 'CentOS Stream 9', osFamily: 'linux', version: '9', cpu: 2, memory: 4, diskGB: 20, size: '1.2 GB', library: 'VMware-Official-Templates', region: 'us-east-1', tags: ['centos', 'linux', 'stream', 'rhel'], isPublic: true, source: 'vmware', lastModified: '2024-03-01T00:00:00Z', type: 'template', rating: 4.3, downloads: 44200 },
  { id: 'tmpl-photon-5', name: 'VMware Photon OS 5.0', description: 'Photon OS – VMware\'s purpose-built minimal Linux for cloud-native workloads and containers on vSphere.', os: 'Photon OS 5.0', osFamily: 'linux', version: '5.0', cpu: 1, memory: 1, diskGB: 8, size: '650 MB', library: 'VMware-Official-Templates', region: 'us-east-1', tags: ['photon', 'vmware', 'minimal', 'container'], isPublic: true, source: 'vmware', lastModified: '2024-04-10T00:00:00Z', type: 'template', rating: 4.6, downloads: 31000 },
  { id: 'tmpl-debian-12', name: 'Debian 12 (Bookworm)', description: 'Debian 12 Bookworm server template with VMware open-vm-tools, cloud-init, and minimal footprint.', os: 'Debian 12', osFamily: 'linux', version: '12', cpu: 1, memory: 2, diskGB: 20, size: '1.0 GB', library: 'VMware-Official-Templates', region: 'us-east-1', tags: ['debian', 'linux', 'bookworm', 'stable'], isPublic: true, source: 'vmware', lastModified: '2024-02-01T00:00:00Z', type: 'template', rating: 4.6, downloads: 27500 },
  { id: 'tmpl-sles-15', name: 'SUSE Linux Enterprise Server 15 SP5', description: 'SLES 15 SP5 enterprise Linux for mission-critical VMware deployments.', os: 'SLES 15 SP5', osFamily: 'linux', version: '15 SP5', cpu: 2, memory: 4, diskGB: 40, size: '2.8 GB', library: 'VMware-Official-Templates', region: 'us-east-1', tags: ['suse', 'sles', 'enterprise', 'linux'], isPublic: true, source: 'vmware', lastModified: '2024-01-20T00:00:00Z', type: 'template', rating: 4.4, downloads: 18900 },
  // Partner / Marketplace templates
  { id: 'tmpl-nginx-plus', name: 'NGINX Plus — F5', description: 'NGINX Plus – high-performance web server and reverse proxy with advanced LB and security features.', os: 'Ubuntu 22.04 LTS + NGINX Plus', osFamily: 'linux', version: 'R31', cpu: 4, memory: 8, diskGB: 40, size: '3.2 GB', library: 'VMware-Marketplace', region: 'us-east-1', tags: ['nginx', 'web server', 'load balancer', 'f5'], isPublic: true, source: 'marketplace', lastModified: '2024-04-05T00:00:00Z', type: 'ova', rating: 4.7, downloads: 22000 },
  { id: 'tmpl-pgsql-16', name: 'PostgreSQL 16 — Bitnami', description: 'Bitnami-packaged PostgreSQL 16 with automated backups, monitoring hooks, and VMware integration.', os: 'Debian 12 + PostgreSQL 16', osFamily: 'linux', version: '16.2', cpu: 2, memory: 8, diskGB: 80, size: '2.4 GB', library: 'VMware-Marketplace', region: 'us-east-1', tags: ['postgresql', 'database', 'bitnami', 'sql'], isPublic: true, source: 'marketplace', lastModified: '2024-03-20T00:00:00Z', type: 'ova', rating: 4.5, downloads: 18400 },
  // Custom / internal templates
  { id: 'tmpl-web-prod', name: 'web-server-golden (Internal)', description: 'Internal golden image for web servers. Pre-hardened, CIS-L1 compliant, monitoring agent installed.', os: 'Ubuntu 22.04 LTS', osFamily: 'linux', version: '1.4.2', cpu: 4, memory: 8, diskGB: 50, size: '2.1 GB', library: 'Corp-Internal-Templates', region: 'us-east-1', tags: ['internal', 'hardened', 'cis', 'web'], isPublic: false, source: 'custom', lastModified: '2024-05-01T00:00:00Z', type: 'template', rating: 4.9, downloads: 340 },
];

// ── VMware Marketplace ────────────────────────────────────────────────────────
export const marketplaceItems: MarketplaceItem[] = [
  { id: 'mkt-veeam-b&r', name: 'Veeam Backup & Replication', vendor: 'Veeam', vendorLogo: 'VE', category: 'Backup & Recovery', description: 'Industry-leading backup and replication for VMware vSphere. Provides reliable recovery, ransomware protection, and hybrid cloud capabilities.', shortDesc: 'Enterprise backup and DR for VMware', version: '12.1', deploymentType: 'vm', pricing: 'paid', priceLabel: 'From $649/yr per socket', rating: 4.9, reviews: 2847, downloads: 178000, tags: ['backup', 'replication', 'dr', 'ransomware'], isFeatured: true, osFamily: 'windows', requiredCPU: 4, requiredMemGB: 8, requiredDiskGB: 500 },
  { id: 'mkt-zerto', name: 'Zerto IT Resilience Platform', vendor: 'Zerto (HPE)', vendorLogo: 'ZE', category: 'Disaster Recovery', description: 'Continuous data protection and disaster recovery with near-zero RPO and RTO. Multi-cloud DR and long-term retention.', shortDesc: 'Continuous data protection & DR', version: '10.0 U4', deploymentType: 'vm', pricing: 'paid', priceLabel: 'Contact sales', rating: 4.8, reviews: 1234, downloads: 89000, tags: ['dr', 'cdp', 'replication', 'rpo', 'rto'], isFeatured: true, osFamily: 'linux', requiredCPU: 4, requiredMemGB: 16, requiredDiskGB: 100 },
  { id: 'mkt-nginx-plus', name: 'NGINX Plus', vendor: 'F5', vendorLogo: 'F5', category: 'Networking', description: 'Enterprise-grade NGINX: web server, reverse proxy, load balancer, API gateway, and content cache with advanced monitoring.', shortDesc: 'Enterprise web server & load balancer', version: 'R31', deploymentType: 'ova', pricing: 'paid', priceLabel: 'From $2,500/yr', rating: 4.7, reviews: 892, downloads: 45000, tags: ['nginx', 'load balancer', 'web server', 'api gateway'], osFamily: 'linux', requiredCPU: 2, requiredMemGB: 4, requiredDiskGB: 40 },
  { id: 'mkt-palo-vm-300', name: 'Palo Alto VM-Series Firewall', vendor: 'Palo Alto Networks', vendorLogo: 'PA', category: 'Security', description: 'Next-generation virtualised firewall delivering ML-powered security, Zero Trust network security, and URL filtering.', shortDesc: 'Next-gen virtualised NGFW', version: 'PAN-OS 11.1', deploymentType: 'ova', pricing: 'byol', priceLabel: 'BYOL', rating: 4.9, reviews: 3421, downloads: 210000, tags: ['firewall', 'ngfw', 'security', 'zero trust', 'palo alto'], isFeatured: true, osFamily: 'other', requiredCPU: 4, requiredMemGB: 16, requiredDiskGB: 60 },
  { id: 'mkt-bitnami-wordpress', name: 'WordPress Certified by Bitnami', vendor: 'Bitnami', vendorLogo: 'BI', category: 'CMS', description: 'Production-ready WordPress with Apache, MySQL, PHP and SSL. Auto-update enabled.', shortDesc: 'Production-ready WordPress stack', version: '6.5.2', deploymentType: 'ova', pricing: 'free', priceLabel: 'Free', rating: 4.5, reviews: 5612, downloads: 320000, tags: ['wordpress', 'cms', 'web', 'php', 'mysql'], osFamily: 'linux', requiredCPU: 1, requiredMemGB: 2, requiredDiskGB: 25 },
  { id: 'mkt-bitnami-grafana', name: 'Grafana by Bitnami', vendor: 'Bitnami', vendorLogo: 'BI', category: 'Monitoring', description: 'Grafana analytics and monitoring platform with pre-configured dashboards. Prometheus-compatible.', shortDesc: 'Open observability platform', version: '10.4', deploymentType: 'ova', pricing: 'free', priceLabel: 'Free', rating: 4.8, reviews: 4100, downloads: 280000, tags: ['grafana', 'monitoring', 'observability', 'prometheus'], osFamily: 'linux', requiredCPU: 2, requiredMemGB: 4, requiredDiskGB: 40 },
  { id: 'mkt-citrix-adc', name: 'Citrix ADC (NetScaler) VPX', vendor: 'Citrix', vendorLogo: 'CI', category: 'Networking', description: 'Application delivery controller with global load balancing, SSL offload, content switching, and DDoS protection.', shortDesc: 'Enterprise ADC and load balancer', version: '14.1', deploymentType: 'ova', pricing: 'byol', priceLabel: 'BYOL', rating: 4.6, reviews: 1876, downloads: 95000, tags: ['citrix', 'adc', 'load balancer', 'ssl', 'netscaler'], osFamily: 'other', requiredCPU: 4, requiredMemGB: 8, requiredDiskGB: 60 },
  { id: 'mkt-fortigate', name: 'FortiGate Next-Generation Firewall', vendor: 'Fortinet', vendorLogo: 'FO', category: 'Security', description: 'FortiGate virtualised NGFW with AI-powered threat intelligence, SD-WAN, and ZTNA capabilities.', shortDesc: 'AI-powered virtualised NGFW & SD-WAN', version: 'FortiOS 7.4', deploymentType: 'ova', pricing: 'byol', priceLabel: 'BYOL', rating: 4.7, reviews: 2234, downloads: 138000, tags: ['fortigate', 'firewall', 'ngfw', 'sd-wan', 'ztna'], isNew: true, osFamily: 'other', requiredCPU: 4, requiredMemGB: 8, requiredDiskGB: 30 },
  { id: 'mkt-k8s-rancher', name: 'Rancher by SUSE', vendor: 'SUSE', vendorLogo: 'SU', category: 'Containers', description: 'Complete Kubernetes management platform. Deploy and manage K8s clusters on VMware vSphere with integrated monitoring.', shortDesc: 'Kubernetes management for vSphere', version: '2.8', deploymentType: 'ova', pricing: 'freemium', priceLabel: 'Free / Enterprise', rating: 4.8, reviews: 1567, downloads: 112000, tags: ['kubernetes', 'k8s', 'rancher', 'containers', 'suse'], isFeatured: true, osFamily: 'linux', requiredCPU: 4, requiredMemGB: 8, requiredDiskGB: 60 },
  { id: 'mkt-hashicorp-vault', name: 'HashiCorp Vault', vendor: 'HashiCorp', vendorLogo: 'HA', category: 'Security', description: 'Secrets management, data encryption, and identity-based security. Enterprise version includes RAFT HA and disaster recovery.', shortDesc: 'Enterprise secrets management', version: '1.16', deploymentType: 'ova', pricing: 'freemium', priceLabel: 'Free / Enterprise', rating: 4.9, reviews: 2890, downloads: 195000, tags: ['vault', 'secrets', 'encryption', 'iam', 'hashicorp'], osFamily: 'linux', requiredCPU: 2, requiredMemGB: 4, requiredDiskGB: 40 },
  { id: 'mkt-elastic-stack', name: 'Elastic Stack (ELK)', vendor: 'Elastic', vendorLogo: 'EL', category: 'Monitoring', description: 'Elasticsearch, Logstash, Kibana, and Beats – the complete observability and search platform for your vSphere environment.', shortDesc: 'Enterprise search & observability stack', version: '8.13', deploymentType: 'ova', pricing: 'freemium', priceLabel: 'Free / Enterprise', rating: 4.7, reviews: 3120, downloads: 220000, tags: ['elasticsearch', 'kibana', 'logstash', 'elk', 'observability'], osFamily: 'linux', requiredCPU: 8, requiredMemGB: 32, requiredDiskGB: 200 },
  { id: 'mkt-zabbix', name: 'Zabbix Enterprise Monitoring', vendor: 'Zabbix', vendorLogo: 'ZA', category: 'Monitoring', description: 'Enterprise-class open source monitoring solution for networks, servers, VMs, and cloud services.', shortDesc: 'Open source enterprise monitoring', version: '6.4', deploymentType: 'ova', pricing: 'free', priceLabel: 'Free (Support optional)', rating: 4.5, reviews: 1845, downloads: 145000, tags: ['zabbix', 'monitoring', 'alerting', 'snmp', 'agentless'], osFamily: 'linux', requiredCPU: 4, requiredMemGB: 8, requiredDiskGB: 80 },
];

// ── NSX Segments ──────────────────────────────────────────────────────────────
export const nsxSegments: NSXSegment[] = [
  { id: 'seg-prod-web', name: 'prod-web-segment', type: 'routed', gateway: '10.0.1.1', cidr: '10.0.1.0/24', transportZone: 'overlay-tz-01', attachedVMs: 8, dhcp: true, region: 'us-east-1', status: 'up' },
  { id: 'seg-prod-app', name: 'prod-app-segment', type: 'routed', gateway: '10.0.2.1', cidr: '10.0.2.0/24', transportZone: 'overlay-tz-01', attachedVMs: 12, dhcp: true, region: 'us-east-1', status: 'up' },
  { id: 'seg-prod-db', name: 'prod-db-segment', type: 'routed', gateway: '10.0.3.1', cidr: '10.0.3.0/24', transportZone: 'overlay-tz-01', attachedVMs: 4, dhcp: false, region: 'us-east-1', status: 'up' },
  { id: 'seg-dev-01', name: 'dev-segment-01', type: 'isolated', gateway: '10.1.0.1', cidr: '10.1.0.0/24', transportZone: 'overlay-tz-01', attachedVMs: 6, dhcp: true, region: 'us-east-1', status: 'up' },
  { id: 'seg-mgmt', name: 'mgmt-segment', type: 'routed', gateway: '192.168.100.1', cidr: '192.168.100.0/24', transportZone: 'overlay-tz-01', attachedVMs: 15, dhcp: false, region: 'us-east-1', status: 'up' },
  { id: 'seg-usw2-web', name: 'usw2-web-segment', type: 'routed', gateway: '10.2.1.1', cidr: '10.2.1.0/24', transportZone: 'overlay-tz-usw2', attachedVMs: 10, dhcp: true, region: 'us-west-2', status: 'up' },
  { id: 'seg-euw2-web', name: 'euw2-web-segment', type: 'routed', gateway: '10.3.1.1', cidr: '10.3.1.0/24', transportZone: 'overlay-tz-euw2', attachedVMs: 8, dhcp: true, region: 'eu-west-2', status: 'down' },
];

// ── NSX Gateways ──────────────────────────────────────────────────────────────
export const nsxGateways: NSXGateway[] = [
  { id: 'gw-t0-use1', name: 'T0-GW-USE1-PROD', tier: 'T0', mode: 'active-active', ha: true, edgeCluster: 'edge-cluster-use1', linkedSegments: 5, bgpPeers: 2, region: 'us-east-1', status: 'up' },
  { id: 'gw-t1-web', name: 'T1-GW-WEB', tier: 'T1', mode: 'active-standby', ha: true, edgeCluster: 'edge-cluster-use1', linkedSegments: 2, bgpPeers: 0, region: 'us-east-1', status: 'up' },
  { id: 'gw-t1-app', name: 'T1-GW-APP', tier: 'T1', mode: 'active-standby', ha: true, edgeCluster: 'edge-cluster-use1', linkedSegments: 3, bgpPeers: 0, region: 'us-east-1', status: 'up' },
  { id: 'gw-t0-usw2', name: 'T0-GW-USW2-PROD', tier: 'T0', mode: 'active-active', ha: true, edgeCluster: 'edge-cluster-usw2', linkedSegments: 3, bgpPeers: 2, region: 'us-west-2', status: 'up' },
  { id: 'gw-t0-euw2', name: 'T0-GW-EUW2-PROD', tier: 'T0', mode: 'active-standby', ha: true, edgeCluster: 'edge-cluster-euw2', linkedSegments: 4, bgpPeers: 2, region: 'eu-west-2', status: 'degraded' },
];

// ── Firewall Policies ─────────────────────────────────────────────────────────
export const firewallPolicies: FirewallPolicy[] = [
  { id: 'fp-default-l3', name: 'Default Layer 3 Policy', scope: 'gateway', ruleCount: 12, priority: 100, applied: ['T0-GW-USE1-PROD', 'T0-GW-USW2-PROD'], region: 'us-east-1', status: 'enabled' },
  { id: 'fp-web-tier', name: 'Web Tier Micro-seg', scope: 'distributed', ruleCount: 8, priority: 200, applied: ['prod-web-segment'], region: 'us-east-1', status: 'enabled' },
  { id: 'fp-db-isolation', name: 'Database Isolation', scope: 'distributed', ruleCount: 4, priority: 300, applied: ['prod-db-segment'], region: 'us-east-1', status: 'enabled' },
  { id: 'fp-deny-all', name: 'Default Deny All', scope: 'distributed', ruleCount: 1, priority: 65000, applied: ['all-segments'], region: 'global', status: 'enabled' },
];
