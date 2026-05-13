'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../components/LoginPage';
import TopNavigationEnhanced from '../components/TopNavigationEnhanced';
import SideNavigation from '../components/SideNavigation';
import ServiceCatalog from '../components/ServiceCatalog';
import Dashboard from '../components/Dashboard';
import ComputePage from '../components/ComputePage';
import NetworkingPage from '../components/NetworkingPage';
import StoragePage from '../components/StoragePage';
import SecurityPage from '../components/SecurityPage';
import MonitoringPage from '../components/MonitoringPage';
import SDDCPage from '../components/SDDCPage';
import MarketplacePage from '../components/MarketplacePage';
import TemplatesPage from '../components/TemplatesPage';
import InfrastructurePage from '../components/InfrastructurePage';
import { PageLoadingSkeleton } from '../components/SkeletonLoader';
import CloudShell from '../components/CloudShell';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentRegion, setCurrentRegion] = useState('us-east-1');
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [isServiceCatalogOpen, setIsServiceCatalogOpen] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [cloudShellOpen, setCloudShellOpen] = useState(false);

  const handleNavItemClick = (item: string) => {
    if (item === activeNavItem && item !== 'vmc-cloudshell') return;
    if (item === 'vmc-cloudshell') {
      setCloudShellOpen(v => !v);
      setActiveNavItem(item);
      return;
    }
    setIsPageLoading(true);
    setActiveNavItem(item);
    setTimeout(() => setIsPageLoading(false), 300);
  };

  const handleServiceClick = (serviceId: string) => {
    const serviceMap: Record<string, string> = {
      'vm-instances':    'virtual-machines',
      'autoscaling':     'auto-scaling',
      'launch-templates':'launch-templates',
      'content-library': 'templates',
      'network-segments':'nsx-segments',
      'tier-gateways':   'nsx-gateways',
      'nsx-policy':      'dfw',
      'load-balancers':  'load-balancers',
      'volumes':         'volumes',
      'vsan':            'vsan',
      'snapshots':       'snapshots',
      'backup':          'backup',
      'security-groups': 'security-groups',
      'nsx-firewall':    'nsx-firewall',
      'identity':        'identity',
      'certificates':    'certificates',
      'encryption':      'encryption',
      'vmc-monitor':     'vmc-monitor',
      'activity-log':    'activity-log',
      'cost-management': 'cost-management',
      'cloudshell':      'vmc-cloudshell',
    };
    const navItem = serviceMap[serviceId] || serviceId;
    setIsPageLoading(true);
    setActiveNavItem(navItem);
    setTimeout(() => setIsPageLoading(false), 300);
  };

  const renderContent = () => {
    switch (activeNavItem) {
      case 'home':
        return <Dashboard currentRegion={currentRegion} onNavigate={handleNavItemClick} />;

      case 'sddcs':
        return <SDDCPage currentRegion={currentRegion} />;

      case 'marketplace':
        return <MarketplacePage />;

      case 'virtual-machines':
      case 'compute':
      case 'launch-templates':
      case 'auto-scaling':
      case 'resource-pools':
        return <ComputePage currentRegion={currentRegion} />;

      case 'templates':
        return <TemplatesPage />;

      case 'vcenter':
      case 'clusters':
      case 'esxi-hosts':
      case 'datacenters':
      case 'infrastructure':
        return <InfrastructurePage currentRegion={currentRegion} />;

      case 'networking':
      case 'nsx-segments':
      case 'nsx-gateways':
      case 'dfw':
      case 'load-balancers':
      case 'vpn-connections':
        return <NetworkingPage currentRegion={currentRegion} />;

      case 'storage':
      case 'volumes':
      case 'vsan':
      case 'snapshots':
      case 'backup':
        return <StoragePage currentRegion={currentRegion} />;

      case 'security':
      case 'security-groups':
      case 'nsx-firewall':
      case 'identity':
      case 'certificates':
      case 'encryption':
        return <SecurityPage currentRegion={currentRegion} />;

      case 'monitoring':
      case 'vmc-monitor':
      case 'activity-log':
      case 'cost-management':
      case 'health':
      case 'inventory':
        return <MonitoringPage currentRegion={currentRegion} />;

      case 'vmc-cloudshell':
        return <Dashboard currentRegion={currentRegion} onNavigate={handleNavItemClick} />;

      case 'api-explorer':
      case 'automation':
      case 'developer':
        return <Dashboard currentRegion={currentRegion} onNavigate={handleNavItemClick} />;

      default:
        return <Dashboard currentRegion={currentRegion} onNavigate={handleNavItemClick} />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f2f3f3] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0073bb] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-[#f2f3f3]">
      <TopNavigationEnhanced
        currentRegion={currentRegion}
        onRegionChange={setCurrentRegion}
        onOpenServiceCatalog={() => setIsServiceCatalogOpen(true)}
        onNavigate={handleNavItemClick}
      />

      <ServiceCatalog
        isOpen={isServiceCatalogOpen}
        onClose={() => setIsServiceCatalogOpen(false)}
        onServiceClick={handleServiceClick}
      />

      <div className="flex">
        <SideNavigation
          activeItem={activeNavItem}
          onItemClick={handleNavItemClick}
        />
        <main className="flex-1 overflow-auto">
          {isPageLoading ? <PageLoadingSkeleton /> : renderContent()}
        </main>
      </div>

      <CloudShell forceOpen={cloudShellOpen} />
    </div>
  );
}
