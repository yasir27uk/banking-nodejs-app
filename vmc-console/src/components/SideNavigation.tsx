'use client';

import { useState, useEffect } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Server,
  Network,
  HardDrive,
  Shield,
  Code,
  Home,
  Cloud,
  Activity,
  Box,
  Database,
  Layers,
  Monitor,
  FileText,
  Users,
  Key,
  Lock,
  Bell,
  BarChart3,
  Wallet,
  Tag,
  FileCode,
  ShoppingBag,
  Cpu,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  children?: NavItem[];
  badge?: string;
  accent?: boolean;
}

interface SideNavigationProps {
  activeItem: string;
  onItemClick: (id: string) => void;
}

function CameraIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

const navigationItems: NavItem[] = [
  { id: 'home',      label: 'VMC Console Home',  icon: <Home className="w-4 h-4" /> },
  { id: 'sddcs',     label: 'SDDCs',             icon: <Cloud className="w-4 h-4" />, badge: '5' },
  { id: 'marketplace', label: 'Marketplace',     icon: <ShoppingBag className="w-4 h-4" />, accent: true },
  {
    id: 'compute',
    label: 'Compute',
    icon: <Server className="w-4 h-4" />,
    children: [
      { id: 'virtual-machines',   label: 'Virtual Machines',       icon: <Box className="w-4 h-4" />, badge: '9' },
      { id: 'templates',          label: 'Content Library',         icon: <Layers className="w-4 h-4" /> },
      { id: 'launch-templates',   label: 'Launch Templates',        icon: <FileText className="w-4 h-4" /> },
      { id: 'auto-scaling',       label: 'Auto Scaling Groups',     icon: <Activity className="w-4 h-4" /> },
      { id: 'resource-pools',     label: 'Resource Pools',          icon: <Layers className="w-4 h-4" /> },
    ],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    icon: <Cpu className="w-4 h-4" />,
    children: [
      { id: 'vcenter',     label: 'vCenter Servers', icon: <Database className="w-4 h-4" /> },
      { id: 'clusters',    label: 'Clusters',         icon: <Layers className="w-4 h-4" /> },
      { id: 'esxi-hosts',  label: 'ESXi Hosts',       icon: <Server className="w-4 h-4" /> },
      { id: 'datacenters', label: 'Datacenters',       icon: <Activity className="w-4 h-4" /> },
    ],
  },
  {
    id: 'networking',
    label: 'Networking (NSX-T)',
    icon: <Network className="w-4 h-4" />,
    children: [
      { id: 'nsx-segments',  label: 'Segments',             icon: <Network className="w-4 h-4" /> },
      { id: 'nsx-gateways',  label: 'T0 / T1 Gateways',    icon: <Database className="w-4 h-4" /> },
      { id: 'dfw',           label: 'Distributed Firewall', icon: <Shield className="w-4 h-4" /> },
      { id: 'load-balancers', label: 'Load Balancers',      icon: <Database className="w-4 h-4" /> },
      { id: 'vpn-connections', label: 'VPN Connections',    icon: <Lock className="w-4 h-4" /> },
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: <HardDrive className="w-4 h-4" />,
    children: [
      { id: 'volumes',   label: 'Volumes',        icon: <Database className="w-4 h-4" />, badge: '8' },
      { id: 'vsan',      label: 'vSAN Clusters',  icon: <Box className="w-4 h-4" /> },
      { id: 'snapshots', label: 'Snapshots',       icon: <CameraIcon /> },
      { id: 'backup',    label: 'Backup',          icon: <Cloud className="w-4 h-4" /> },
    ],
  },
  {
    id: 'security',
    label: 'Security & Identity',
    icon: <Shield className="w-4 h-4" />,
    children: [
      { id: 'security-groups', label: 'Security Groups',   icon: <Shield className="w-4 h-4" />, badge: '7' },
      { id: 'nsx-firewall',    label: 'NSX Firewall',      icon: <FileCode className="w-4 h-4" /> },
      { id: 'identity',        label: 'Identity Manager',  icon: <Users className="w-4 h-4" /> },
      { id: 'certificates',    label: 'Certificates',      icon: <Lock className="w-4 h-4" /> },
      { id: 'encryption',      label: 'Encryption Keys',   icon: <Key className="w-4 h-4" /> },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring & Governance',
    icon: <BarChart3 className="w-4 h-4" />,
    children: [
      { id: 'vmc-monitor',    label: 'VMC Monitor',      icon: <Activity className="w-4 h-4" /> },
      { id: 'activity-log',   label: 'Activity Log',     icon: <FileText className="w-4 h-4" /> },
      { id: 'cost-management', label: 'Cost Management', icon: <Wallet className="w-4 h-4" /> },
      { id: 'health',         label: 'Health Dashboard', icon: <Bell className="w-4 h-4" /> },
      { id: 'inventory',      label: 'Inventory',        icon: <Tag className="w-4 h-4" /> },
    ],
  },
  {
    id: 'developer',
    label: 'Developer Tools',
    icon: <Code className="w-4 h-4" />,
    children: [
      { id: 'vmc-cloudshell', label: 'CloudShell',   icon: <Monitor className="w-4 h-4" /> },
      { id: 'api-explorer',   label: 'API Explorer', icon: <FileCode className="w-4 h-4" /> },
      { id: 'automation',     label: 'Automation',   icon: <Box className="w-4 h-4" /> },
    ],
  },
];

function NavItemComponent({
  item,
  level = 0,
  expandedItems,
  toggleExpand,
  activeItem,
  onItemClick,
}: {
  item: NavItem;
  level?: number;
  expandedItems: Set<string>;
  toggleExpand: (id: string) => void;
  activeItem: string;
  onItemClick: (id: string) => void;
}) {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.has(item.id);
  const isActive = activeItem === item.id;

  return (
    <div>
      <button
        onClick={() => {
          if (hasChildren) {
            toggleExpand(item.id);
          } else {
            onItemClick(item.id);
          }
        }}
        className={`w-full flex items-center py-2 text-sm transition-colors ${
          isActive
            ? 'bg-[#2a3b4c] text-white border-l-2 border-[#ff9900]'
            : item.accent
            ? 'text-[#ff9900] hover:bg-[#2a3b4c] border-l-2 border-transparent'
            : 'text-[#d5dbdb] hover:bg-[#2a3b4c] hover:text-white border-l-2 border-transparent'
        }`}
        style={{ paddingLeft: `${12 + level * 12}px`, paddingRight: '12px' }}
      >
        {hasChildren && (
          <span className="mr-1">
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </span>
        )}
        {item.icon && <span className="mr-2">{item.icon}</span>}
        <span className="flex-1 text-left truncate">{item.label}</span>
        {item.badge && (
          <span className="ml-2 px-2 py-0.5 text-xs bg-[#414750] rounded text-[#d5dbdb]">
            {item.badge}
          </span>
        )}
        {item.accent && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-[#ff9900] text-[#232f3e] rounded font-medium">New</span>
        )}
      </button>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {item.children!.map(child => (
            <NavItemComponent
              key={child.id}
              item={child}
              level={level + 1}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              activeItem={activeItem}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SideNavigation({ activeItem, onItemClick }: SideNavigationProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(
    new Set(['compute', 'infrastructure', 'storage', 'security', 'networking', 'monitoring'])
  );

  useEffect(() => {
    const parent = navigationItems.find(item =>
      item.children?.some(child => child.id === activeItem)
    );
    if (parent) {
      setExpandedItems(prev => {
        if (prev.has(parent.id)) return prev;
        const next = new Set(prev);
        next.add(parent.id);
        return next;
      });
    }
  }, [activeItem]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedItems(next);
  };

  return (
    <aside className="w-64 bg-[#232f3e] min-h-[calc(100vh-84px)] border-r border-[#414750] overflow-y-auto">
      <nav className="py-2">
        {navigationItems.map(item => (
          <NavItemComponent
            key={item.id}
            item={item}
            expandedItems={expandedItems}
            toggleExpand={toggleExpand}
            activeItem={activeItem}
            onItemClick={onItemClick}
          />
        ))}
      </nav>
    </aside>
  );
}
