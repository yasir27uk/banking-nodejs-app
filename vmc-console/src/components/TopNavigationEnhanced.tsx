'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Bell,
  HelpCircle,
  Cog,
  MapPin,
  ChevronDown,
  ExternalLink,
  User,
  LogOut,
  Shield,
  CreditCard,
  Settings2,
  Moon,
  Check,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from 'lucide-react';
import { regions } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

interface TopNavigationProps {
  currentRegion: string;
  onRegionChange: (region: string) => void;
  onOpenServiceCatalog: () => void;
  onNavigate?: (navItem: string) => void;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
}

const mockNotifications: Notification[] = [
  { id: '1', title: 'High CPU Utilization', message: 'eu-west-2 SDDC CPU is at 91% for 22 minutes', timestamp: '2024-05-05T13:45:00Z', type: 'warning', read: false },
  { id: '2', title: 'VM Backup Completed', message: 'Scheduled backup for web-server-01 completed successfully', timestamp: '2024-05-05T12:30:00Z', type: 'success', read: false },
  { id: '3', title: 'Security Alert', message: 'New security group rule added to sg-0d4e5f6789ab12c3', timestamp: '2024-05-05T10:15:00Z', type: 'info', read: true },
  { id: '4', title: 'Cost Alert', message: 'Monthly spending exceeded 80% of budget', timestamp: '2024-05-04T18:00:00Z', type: 'warning', read: true },
];

const notifIcon = (type: Notification['type']) => {
  if (type === 'warning') return <AlertTriangle className="w-3.5 h-3.5 text-[#ff9900]" />;
  if (type === 'error') return <XCircle className="w-3.5 h-3.5 text-red-500" />;
  if (type === 'success') return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
  return <Info className="w-3.5 h-3.5 text-[#0073bb]" />;
};

export default function TopNavigationEnhanced({ currentRegion, onRegionChange, onOpenServiceCatalog, onNavigate }: TopNavigationProps) {
  const { user, logout } = useAuth();
  const [searchValue, setSearchValue] = useState('');
  const [isRegionOpen, setIsRegionOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [darkMode, setDarkMode] = useState(false);

  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ label: string; id: string; parent?: string }[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const regionRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const navSearchItems = [
    { id: 'home', label: 'VMC Console Home' },
    { id: 'sddcs', label: 'SDDCs' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'virtual-machines', label: 'Virtual Machines', parent: 'Compute' },
    { id: 'templates', label: 'Content Library', parent: 'Compute' },
    { id: 'launch-templates', label: 'Launch Templates', parent: 'Compute' },
    { id: 'auto-scaling', label: 'Auto Scaling Groups', parent: 'Compute' },
    { id: 'resource-pools', label: 'Resource Pools', parent: 'Compute' },
    { id: 'vcenter', label: 'vCenter Servers', parent: 'Infrastructure' },
    { id: 'clusters', label: 'Clusters', parent: 'Infrastructure' },
    { id: 'esxi-hosts', label: 'ESXi Hosts', parent: 'Infrastructure' },
    { id: 'datacenters', label: 'Datacenters', parent: 'Infrastructure' },
    { id: 'nsx-segments', label: 'Segments', parent: 'Networking' },
    { id: 'nsx-gateways', label: 'T0 / T1 Gateways', parent: 'Networking' },
    { id: 'dfw', label: 'Distributed Firewall', parent: 'Networking' },
    { id: 'load-balancers', label: 'Load Balancers', parent: 'Networking' },
    { id: 'vpn-connections', label: 'VPN Connections', parent: 'Networking' },
    { id: 'volumes', label: 'Volumes', parent: 'Storage' },
    { id: 'vsan', label: 'vSAN Clusters', parent: 'Storage' },
    { id: 'snapshots', label: 'Snapshots', parent: 'Storage' },
    { id: 'backup', label: 'Backup', parent: 'Storage' },
    { id: 'security-groups', label: 'Security Groups', parent: 'Security' },
    { id: 'nsx-firewall', label: 'NSX Firewall', parent: 'Security' },
    { id: 'identity', label: 'Identity Manager', parent: 'Security' },
    { id: 'certificates', label: 'Certificates', parent: 'Security' },
    { id: 'encryption', label: 'Encryption Keys', parent: 'Security' },
    { id: 'vmc-monitor', label: 'VMC Monitor', parent: 'Monitoring' },
    { id: 'activity-log', label: 'Activity Log', parent: 'Monitoring' },
    { id: 'cost-management', label: 'Cost Management', parent: 'Monitoring' },
    { id: 'health', label: 'Health Dashboard', parent: 'Monitoring' },
    { id: 'inventory', label: 'Inventory', parent: 'Monitoring' },
    { id: 'vmc-cloudshell', label: 'CloudShell', parent: 'Developer Tools' },
    { id: 'api-explorer', label: 'API Explorer', parent: 'Developer Tools' },
    { id: 'automation', label: 'Automation', parent: 'Developer Tools' },
  ];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (regionRef.current && !regionRef.current.contains(e.target as Node)) setIsRegionOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setIsUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setIsNotifOpen(false);
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) setIsSettingsOpen(false);
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) setIsHelpOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsSearchFocused(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (!value.trim()) { setSearchResults([]); return; }
    const q = value.toLowerCase();
    setSearchResults(
      navSearchItems.filter(item =>
        item.label.toLowerCase().includes(q) || item.parent?.toLowerCase().includes(q)
      ).slice(0, 8)
    );
  };

  const handleSearchSelect = (id: string) => {
    setSearchValue('');
    setSearchResults([]);
    setIsSearchFocused(false);
    onNavigate?.(id);
  };

  const unread = notifications.filter(n => !n.read).length;
  const markAllRead = () => setNotifications(p => p.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications(p => p.map(n => n.id === id ? { ...n, read: true } : n));

  const currentRegionData = regions.find(r => r.id === currentRegion);
  const roleBadgeColor = user?.role === 'admin' ? 'bg-red-100 text-red-700' : user?.role === 'developer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600';

  return (
    <header className="bg-[#232f3e] text-white sticky top-0 z-50">
      {/* Primary bar */}
      <div className="flex items-center h-[48px] px-4">
        {/* Logo */}
        <div className="flex items-center mr-6 cursor-pointer" onClick={onOpenServiceCatalog}>
          <div className="w-8 h-8 bg-white rounded mr-2 flex items-center justify-center hover:bg-[#ff9900] transition-colors">
            <span className="text-[#232f3e] font-bold text-[10px]">VMC</span>
          </div>
          <span className="font-semibold text-sm tracking-wide hover:text-[#ff9900] transition-colors">VMware Cloud</span>
        </div>

        {/* Services */}
        <button onClick={onOpenServiceCatalog} className="mr-4 px-3 py-1.5 text-sm hover:bg-[#2a3b4c] rounded transition-colors flex items-center">
          Services <ChevronDown className="w-3.5 h-3.5 ml-1" />
        </button>

        {/* Search */}
        <div className="flex-1 max-w-2xl mx-4 relative" ref={searchRef}>
          <div className="relative">
            <input
              type="text"
              placeholder="Search services, features, marketplace products, and docs"
              className="w-full h-9 pl-3 pr-10 bg-white text-gray-900 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[#ff9900]"
              value={searchValue}
              onChange={e => handleSearchChange(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
            />
            <button
              onClick={() => searchResults.length === 0 && handleSearchChange(searchValue)}
              className="absolute right-0 top-0 h-9 w-10 bg-[#ff9900] hover:bg-[#e88a00] flex items-center justify-center rounded-r-sm transition-colors"
            >
              <Search className="w-4 h-4 text-[#232f3e]" />
            </button>
          </div>
          {isSearchFocused && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#d5dbdb] rounded shadow-xl z-50">
              {searchResults.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleSearchSelect(item.id)}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#f2f3f3] flex items-center justify-between"
                >
                  <span className="text-sm text-[#16191f]">{item.label}</span>
                  {item.parent && <span className="text-xs text-[#545b64] ml-3">{item.parent}</span>}
                </button>
              ))}
            </div>
          )}
          {isSearchFocused && searchValue.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#d5dbdb] rounded shadow-xl z-50 px-4 py-3">
              <p className="text-xs text-[#545b64] font-medium mb-2">Quick links</p>
              <div className="flex flex-wrap gap-2">
                {['virtual-machines','networking','storage','security','monitoring'].map(id => (
                  <button key={id} onClick={() => handleSearchSelect(id)}
                    className="px-2 py-1 text-xs bg-[#f2f3f3] hover:bg-[#eaeded] text-[#16191f] rounded border border-[#d5dbdb] capitalize">
                    {id.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center ml-auto space-x-1">
          {/* Region selector */}
          <div className="relative" ref={regionRef}>
            <button
              onClick={() => setIsRegionOpen(!isRegionOpen)}
              className="flex items-center mr-2 px-3 py-1.5 hover:bg-[#2a3b4c] rounded transition-colors"
            >
              <MapPin className="w-4 h-4 mr-1.5 text-[#ff9900]" />
              <span className="text-sm">{currentRegionData?.name || currentRegion}</span>
              <ChevronDown className={`w-3.5 h-3.5 ml-1.5 transition-transform ${isRegionOpen ? 'rotate-180' : ''}`} />
            </button>
            {isRegionOpen && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded shadow-xl border border-[#d5dbdb] py-2 z-50">
                <div className="px-4 py-2 border-b border-[#eaeded]">
                  <h3 className="text-sm font-semibold text-[#16191f]">Select a Region</h3>
                  <p className="text-xs text-[#545b64] mt-0.5">Resources are region-specific</p>
                </div>
                {regions.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { onRegionChange(r.id); setIsRegionOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#f2f3f3] flex items-center justify-between ${currentRegion === r.id ? 'bg-[#fff4e6]' : ''}`}
                  >
                    <div>
                      <span className={`block ${currentRegion === r.id ? 'font-medium text-[#16191f]' : 'text-[#16191f]'}`}>{r.name}</span>
                      <span className="text-xs text-[#545b64]">{r.location}</span>
                    </div>
                    {currentRegion === r.id && <Check className="w-4 h-4 text-[#ff9900]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2 hover:bg-[#2a3b4c] rounded relative transition-colors">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff9900] rounded-full" />
              )}
            </button>
            {isNotifOpen && (
              <div className="absolute right-0 top-full mt-1 w-96 bg-white rounded shadow-xl border border-[#d5dbdb] z-50">
                <div className="px-4 py-3 border-b border-[#eaeded] flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[#16191f]">Notifications</h3>
                  {unread > 0 && (
                    <button onClick={markAllRead} className="text-xs text-[#0073bb] hover:underline">Mark all as read</button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-[#eaeded]">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => markRead(n.id)}
                      className={`px-4 py-3 cursor-pointer hover:bg-[#f2f3f3] ${!n.read ? 'bg-[#fff8ee]' : ''}`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="mt-0.5 flex-shrink-0">{notifIcon(n.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#16191f]">{n.title}</p>
                          <p className="text-xs text-[#545b64] mt-0.5">{n.message}</p>
                          <p className="text-xs text-[#aab7b8] mt-1">{new Date(n.timestamp).toLocaleString()}</p>
                        </div>
                        {!n.read && <span className="w-2 h-2 bg-[#ff9900] rounded-full flex-shrink-0 mt-1" />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-[#eaeded]">
                  <button className="text-xs text-[#0073bb] hover:underline flex items-center">
                    View all notifications <ExternalLink className="w-3 h-3 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <div className="relative" ref={settingsRef}>
            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="p-2 hover:bg-[#2a3b4c] rounded transition-colors">
              <Cog className="w-5 h-5" />
            </button>
            {isSettingsOpen && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded shadow-xl border border-[#d5dbdb] py-2 z-50">
                <div className="px-4 py-2 border-b border-[#eaeded]">
                  <h3 className="text-sm font-semibold text-[#16191f]">Settings</h3>
                </div>
                <button className="w-full text-left px-4 py-2 text-sm text-[#16191f] hover:bg-[#f2f3f3] flex items-center">
                  <Settings2 className="w-4 h-4 mr-3 text-[#545b64]" /> Console Preferences
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-[#16191f] hover:bg-[#f2f3f3] flex items-center">
                  <Shield className="w-4 h-4 mr-3 text-[#545b64]" /> Security Credentials
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-[#16191f] hover:bg-[#f2f3f3] flex items-center">
                  <CreditCard className="w-4 h-4 mr-3 text-[#545b64]" /> Billing & Cost Management
                </button>
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="w-full text-left px-4 py-2 text-sm text-[#16191f] hover:bg-[#f2f3f3] flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Moon className="w-4 h-4 mr-3 text-[#545b64]" /> Dark Mode
                  </div>
                  {darkMode && <Check className="w-4 h-4 text-[#ff9900]" />}
                </button>
              </div>
            )}
          </div>

          {/* Help */}
          <div className="relative" ref={helpRef}>
            <button onClick={() => setIsHelpOpen(!isHelpOpen)} className="p-2 hover:bg-[#2a3b4c] rounded transition-colors">
              <HelpCircle className="w-5 h-5" />
            </button>
            {isHelpOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded shadow-xl border border-[#d5dbdb] py-2 z-50">
                <div className="px-4 py-2 border-b border-[#eaeded]">
                  <h3 className="text-sm font-semibold text-[#16191f]">Help & Resources</h3>
                </div>
                <a href="https://docs.vmware.com/en/VMware-Cloud-on-AWS/" target="_blank" rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 text-sm text-[#16191f] hover:bg-[#f2f3f3]">
                  <ExternalLink className="w-4 h-4 mr-3 text-[#545b64]" /> Documentation
                </a>
                <a href="https://customerconnect.vmware.com/" target="_blank" rel="noopener noreferrer"
                  className="flex items-center px-4 py-2 text-sm text-[#16191f] hover:bg-[#f2f3f3]">
                  <ExternalLink className="w-4 h-4 mr-3 text-[#545b64]" /> Support Portal
                </a>
                <button onClick={() => onNavigate?.('marketplace')}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-[#16191f] hover:bg-[#f2f3f3]">
                  <ExternalLink className="w-4 h-4 mr-3 text-[#545b64]" /> VMware Marketplace
                </button>
                <div className="border-t border-[#eaeded] mx-4 my-1" />
                <div className="px-4 py-2">
                  <p className="text-xs text-[#545b64]">VMware Cloud on AWS</p>
                  <p className="text-xs text-[#aab7b8]">Console v2.0.0</p>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setIsUserOpen(!isUserOpen)}
              className="ml-1 flex items-center hover:bg-[#2a3b4c] px-2 py-1.5 rounded transition-colors"
            >
              <div className="w-7 h-7 bg-[#ff9900] rounded-full flex items-center justify-center text-[#232f3e] font-bold text-xs">
                {user?.avatar || 'U'}
              </div>
              <span className="ml-2 text-sm hidden lg:inline">{user?.username || 'user'}</span>
              <ChevronDown className={`w-3.5 h-3.5 ml-1 hidden lg:block transition-transform ${isUserOpen ? 'rotate-180' : ''}`} />
            </button>
            {isUserOpen && (
              <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded shadow-xl border border-[#d5dbdb] py-2 z-50">
                <div className="px-4 py-3 border-b border-[#eaeded]">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[#ff9900] rounded-full flex items-center justify-center text-[#232f3e] font-bold">
                      {user?.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#16191f]">{user?.displayName}</p>
                      <p className="text-xs text-[#545b64]">{user?.email}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${roleBadgeColor}`}>
                        {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#aab7b8] mt-2">Account: {user?.accountId}</p>
                </div>
                <button className="w-full text-left px-4 py-2 text-sm text-[#16191f] hover:bg-[#f2f3f3] flex items-center">
                  <User className="w-4 h-4 mr-3 text-[#545b64]" /> Account Settings
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-[#16191f] hover:bg-[#f2f3f3] flex items-center">
                  <Shield className="w-4 h-4 mr-3 text-[#545b64]" /> Security Settings
                </button>
                <div className="border-t border-[#eaeded] my-1" />
                <button
                  onClick={logout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-3" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary bar */}
      <div className="bg-[#16191f] h-[36px] flex items-center px-4 text-sm border-t border-[#414750]">
        <nav className="flex items-center space-x-6">
          <button onClick={onOpenServiceCatalog} className="text-white hover:text-[#ff9900] transition-colors font-medium flex items-center">
            Services <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </button>
          <button
            onClick={() => onNavigate?.('marketplace')}
            className="text-[#ff9900] hover:text-white transition-colors font-medium"
          >
            Marketplace
          </button>
          <button
            onClick={() => onNavigate?.('templates')}
            className="text-[#d5dbdb] hover:text-white transition-colors"
          >
            Content Library
          </button>
          <span className="text-[#687078]">|</span>
          <button className="text-[#d5dbdb] hover:text-white transition-colors flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            New – vSAN 8 Update 3
          </button>
          <a href="https://docs.vmware.com/en/VMware-Cloud-on-AWS/" target="_blank" rel="noopener noreferrer" className="text-[#d5dbdb] hover:text-white transition-colors">Documentation</a>
          <a href="https://customerconnect.vmware.com/" target="_blank" rel="noopener noreferrer" className="text-[#d5dbdb] hover:text-white transition-colors">Support</a>
        </nav>
      </div>
    </header>
  );
}
