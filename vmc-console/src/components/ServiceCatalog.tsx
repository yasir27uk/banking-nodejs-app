'use client';

import { useState, useEffect } from 'react';
import {
  Server, Network, HardDrive, Shield, Code, Cloud, Activity,
  Box, Database, Layers, Monitor, FileText, Users, Key, Lock,
  BarChart3, Wallet, Globe, Cpu, Zap, Clock, Search, X, Star,
  History, LayoutGrid, ShoppingBag,
} from 'lucide-react';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ElementType;
  href: string;
  isNew?: boolean;
  isPreview?: boolean;
}

const services: Service[] = [
  // Compute
  { id: 'vm-instances',          name: 'VM Instances',          description: 'Virtual machines powered by ESXi', category: 'Compute', icon: Server, href: '#compute' },
  { id: 'autoscaling',           name: 'Auto Scaling',          description: 'Scale capacity automatically', category: 'Compute', icon: Activity, href: '#compute' },
  { id: 'launch-templates',      name: 'Launch Templates',      description: 'Reusable VM configuration templates', category: 'Compute', icon: FileText, href: '#compute' },
  { id: 'dedicated-hosts',       name: 'Dedicated Hosts',       description: 'Single-tenant physical ESXi hosts', category: 'Compute', icon: Cpu, href: '#compute' },
  { id: 'capacity-reservations', name: 'Capacity Reservations', description: 'Reserve compute capacity', category: 'Compute', icon: Clock, href: '#compute', isNew: true },

  // Content Library & Templates
  { id: 'content-library',  name: 'Content Library',    description: 'VM templates, OVFs, OVAs — like AMI catalog', category: 'Templates', icon: Layers, href: '#templates' },
  { id: 'vm-templates',     name: 'VM Templates',       description: 'Golden images and OS templates', category: 'Templates', icon: Box, href: '#templates' },
  { id: 'ova-import',       name: 'OVA / OVF Import',  description: 'Import and manage OVA/OVF packages', category: 'Templates', icon: FileText, href: '#templates' },

  // Networking
  { id: 'network-segments', name: 'NSX Segments',       description: 'Overlay and VLAN network segments', category: 'Networking', icon: Network, href: '#networking' },
  { id: 'tier-gateways',    name: 'T0 / T1 Gateways',  description: 'NSX Tier-0 and Tier-1 gateways', category: 'Networking', icon: Database, href: '#networking' },
  { id: 'dfw',              name: 'Distributed Firewall', description: 'Micro-segmentation with NSX DFW', category: 'Networking', icon: Shield, href: '#networking' },
  { id: 'load-balancers',   name: 'Load Balancers',     description: 'NSX Advanced LB — L4/L7 load balancing', category: 'Networking', icon: Layers, href: '#networking' },
  { id: 'vpn-connections',  name: 'VPN Connections',    description: 'Site-to-site and L2 VPN tunnels', category: 'Networking', icon: Lock, href: '#networking' },
  { id: 'transit-connect',  name: 'Transit Connect',    description: 'Multi-SDDC network transit hub', category: 'Networking', icon: Network, href: '#networking' },

  // Storage
  { id: 'volumes',           name: 'Volumes',           description: 'Block storage for VMs', category: 'Storage', icon: HardDrive, href: '#storage' },
  { id: 'vsan',              name: 'vSAN',              description: 'Hyperconverged storage clusters', category: 'Storage', icon: Database, href: '#storage' },
  { id: 'nfs',               name: 'NFS Datastores',   description: 'Network file storage (NFS v3/v4)', category: 'Storage', icon: Server, href: '#storage' },
  { id: 'snapshots',         name: 'Snapshots',         description: 'Point-in-time VM snapshots', category: 'Storage', icon: Zap, href: '#storage' },
  { id: 'backup',            name: 'VM Backup',         description: 'Backup and restore VMs', category: 'Storage', icon: Cloud, href: '#storage', isNew: true },

  // Infrastructure
  { id: 'vcenter',     name: 'vCenter Servers',  description: 'Manage vCenter server instances', category: 'Infrastructure', icon: Monitor, href: '#infrastructure' },
  { id: 'clusters',    name: 'Clusters',          description: 'ESXi compute clusters with HA/DRS', category: 'Infrastructure', icon: Layers, href: '#infrastructure' },
  { id: 'esxi-hosts',  name: 'ESXi Hosts',        description: 'Physical hypervisor host inventory', category: 'Infrastructure', icon: Server, href: '#infrastructure' },
  { id: 'datacenters', name: 'Datacenters',        description: 'vSphere datacenter objects', category: 'Infrastructure', icon: Globe, href: '#infrastructure' },

  // Security & Identity
  { id: 'security-groups', name: 'Security Groups',   description: 'Instance-level firewall rules', category: 'Security & Identity', icon: Shield, href: '#security' },
  { id: 'nsx-firewall',    name: 'NSX Firewall',      description: 'Gateway and distributed firewall', category: 'Security & Identity', icon: Shield, href: '#security' },
  { id: 'identity',        name: 'Identity Manager',  description: 'Users, roles, and permissions', category: 'Security & Identity', icon: Users, href: '#security' },
  { id: 'certificates',    name: 'Certificates',      description: 'SSL/TLS certificate management', category: 'Security & Identity', icon: Lock, href: '#security' },
  { id: 'encryption',      name: 'Encryption Keys',   description: 'VM encryption and KMS integration', category: 'Security & Identity', icon: Key, href: '#security' },
  { id: 'waf',             name: 'WAF',               description: 'Web application firewall', category: 'Security & Identity', icon: Shield, href: '#security', isPreview: true },

  // Management & Governance
  { id: 'vmc-monitor',    name: 'VMC Monitor',      description: 'Metrics, logs and observability', category: 'Management', icon: BarChart3, href: '#management' },
  { id: 'activity-log',   name: 'Activity Log',     description: 'Account and resource activity', category: 'Management', icon: FileText, href: '#management' },
  { id: 'inventory',      name: 'Inventory',         description: 'Resource inventory and compliance', category: 'Management', icon: Box, href: '#management' },
  { id: 'cost-management', name: 'Cost Management', description: 'Cost tracking, budgets, and alerts', category: 'Management', icon: Wallet, href: '#management' },
  { id: 'health',         name: 'Health Dashboard', description: 'Service and SDDC health status', category: 'Management', icon: Activity, href: '#management' },

  // Developer Tools
  { id: 'cloudshell',     name: 'CloudShell',      description: 'Browser-based shell environment', category: 'Developer Tools', icon: Code, href: '#developer' },
  { id: 'vmc-cli',        name: 'VMC CLI',          description: 'Command line interface for VMC', category: 'Developer Tools', icon: FileText, href: '#developer' },
  { id: 'api-explorer',   name: 'API Explorer',    description: 'REST API documentation and testing', category: 'Developer Tools', icon: Box, href: '#developer' },
  { id: 'automation',     name: 'Automation',       description: 'vRealize Automation integration', category: 'Developer Tools', icon: Zap, href: '#developer' },
  { id: 'nsx-policy',     name: 'NSX Policy API',  description: 'Policy-based networking automation', category: 'Developer Tools', icon: Code, href: '#developer' },

  // Marketplace
  { id: 'marketplace-home',    name: 'VMware Marketplace',  description: 'Browse and deploy partner solutions', category: 'Marketplace', icon: ShoppingBag, href: '#marketplace', isNew: true },
  { id: 'marketplace-security', name: 'Security Solutions', description: 'Firewalls, WAF, endpoint protection', category: 'Marketplace', icon: Shield, href: '#marketplace' },
  { id: 'marketplace-backup',   name: 'Backup & Recovery',  description: 'Enterprise backup and DR solutions', category: 'Marketplace', icon: Cloud, href: '#marketplace' },
];

const CATEGORY_ORDER = ['Compute', 'Templates', 'Infrastructure', 'Networking', 'Storage', 'Security & Identity', 'Management', 'Developer Tools', 'Marketplace'];

interface ServiceCatalogProps {
  isOpen: boolean;
  onClose: () => void;
  onServiceClick: (serviceId: string) => void;
}

export default function ServiceCatalog({ isOpen, onClose, onServiceClick }: ServiceCatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['vm-instances', 'network-segments', 'volumes', 'vmc-monitor', 'content-library']);
  const [recentServices, setRecentServices] = useState<string[]>(['security-groups', 'identity', 'cloudshell', 'marketplace-home']);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const filteredServices = searchTerm
    ? services.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : activeCategory
    ? services.filter(s => s.category === activeCategory)
    : services;

  const toggleFavorite = (serviceId: string) => {
    setFavorites(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  const handleServiceClick = (service: Service) => {
    setRecentServices(prev => [service.id, ...prev.filter(id => id !== service.id)].slice(0, 5));
    onServiceClick(service.id);
    onClose();
  };

  const favoriteServices = services.filter(s => favorites.includes(s.id));
  const recentServiceObjects = recentServices.map(id => services.find(s => s.id === id)).filter(Boolean) as Service[];

  return (
    <div className="fixed inset-0 z-[100]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="absolute top-[84px] left-4 right-4 md:left-16 md:right-auto md:w-[960px] bg-white rounded-lg shadow-2xl overflow-hidden max-h-[calc(100vh-100px)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#eaeded]">
          <div className="flex items-center space-x-3">
            <LayoutGrid className="w-6 h-6 text-[#232f3e]" />
            <h2 className="text-xl font-medium text-[#16191f]">Services</h2>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#545b64]" />
              <input
                type="text"
                placeholder="Find a service or feature…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-72 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900] focus:ring-1 focus:ring-[#ff9900]"
                autoFocus
              />
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#f2f3f3] rounded">
              <X className="w-5 h-5 text-[#545b64]" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 border-r border-[#eaeded] bg-[#f8f9fa] overflow-y-auto flex-shrink-0">
            <button
              onClick={() => { setActiveCategory(null); setSearchTerm(''); }}
              className={`w-full text-left px-4 py-3 text-sm font-medium ${
                !activeCategory && !searchTerm
                  ? 'bg-white text-[#16191f] border-l-2 border-[#ff9900]'
                  : 'text-[#545b64] hover:bg-[#eaeded]'
              }`}
            >
              All Services
            </button>
            {CATEGORY_ORDER.map(category => (
              <button
                key={category}
                onClick={() => { setActiveCategory(category); setSearchTerm(''); }}
                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between ${
                  activeCategory === category
                    ? 'bg-white text-[#16191f] border-l-2 border-[#ff9900] font-medium'
                    : 'text-[#545b64] hover:bg-[#eaeded]'
                }`}
              >
                <span>{category}</span>
                {category === 'Marketplace' && (
                  <span className="px-1.5 py-0.5 text-xs bg-[#ff9900] text-[#232f3e] rounded font-medium">New</span>
                )}
              </button>
            ))}
          </div>

          {/* Main */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Favorites */}
            {!searchTerm && !activeCategory && favoriteServices.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-[#545b64] uppercase tracking-wide mb-4 flex items-center">
                  <Star className="w-4 h-4 mr-2 text-[#ff9900]" />Favorites
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {favoriteServices.map(service => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isFavorite
                      onToggleFavorite={() => toggleFavorite(service.id)}
                      onClick={() => handleServiceClick(service)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Recently Visited */}
            {!searchTerm && !activeCategory && recentServiceObjects.length > 0 && (
              <div className="mb-8">
                <h3 className="text-xs font-semibold text-[#545b64] uppercase tracking-wide mb-4 flex items-center">
                  <History className="w-4 h-4 mr-2 text-[#0073bb]" />Recently visited
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {recentServiceObjects.map(service => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isFavorite={favorites.includes(service.id)}
                      onToggleFavorite={() => toggleFavorite(service.id)}
                      onClick={() => handleServiceClick(service)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Results / All */}
            <div>
              <h3 className="text-xs font-semibold text-[#545b64] uppercase tracking-wide mb-4">
                {searchTerm ? `Search results (${filteredServices.length})` : activeCategory || 'All Services'}
              </h3>
              {filteredServices.length === 0 ? (
                <p className="text-sm text-[#545b64]">No services match your search.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredServices.map(service => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isFavorite={favorites.includes(service.id)}
                      onToggleFavorite={() => toggleFavorite(service.id)}
                      onClick={() => handleServiceClick(service)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  isFavorite,
  onToggleFavorite,
  onClick,
}: {
  service: Service;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
}) {
  const Icon = service.icon;
  return (
    <div
      className="group p-4 border border-[#d5dbdb] rounded hover:border-[#ff9900] hover:shadow-md transition-all cursor-pointer bg-white"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="p-2 bg-[#f2f3f3] rounded group-hover:bg-[#fff4e6] transition-colors">
          <Icon className="w-5 h-5 text-[#545b64] group-hover:text-[#ff9900]" />
        </div>
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite(); }}
          className="p-1 rounded hover:bg-[#f2f3f3]"
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-[#ff9900] text-[#ff9900]' : 'text-[#aab7b8]'}`} />
        </button>
      </div>
      <h4 className="text-sm font-medium text-[#16191f] mb-1 group-hover:text-[#0073bb]">
        {service.name}
        {service.isNew && (
          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-[#ff9900] text-[#232f3e]">NEW</span>
        )}
        {service.isPreview && (
          <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-[#0073bb] text-white">PREVIEW</span>
        )}
      </h4>
      <p className="text-xs text-[#545b64] line-clamp-2">{service.description}</p>
    </div>
  );
}
