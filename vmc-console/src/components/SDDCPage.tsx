'use client';

import { useState } from 'react';
import {
  Cloud, Server, HardDrive, Network, Shield, Activity, Plus, RefreshCw,
  MoreHorizontal, ChevronRight, Home, Search, Filter, X, CheckCircle,
  AlertTriangle, Clock, Cpu, Database, Globe, Lock
} from 'lucide-react';
import { regions } from '../data/mockData';

interface SDDCPageProps {
  currentRegion: string;
}

interface SDDC {
  id: string;
  name: string;
  status: 'READY' | 'PENDING' | 'FAILED' | 'MAINTENANCE';
  region: string;
  numHosts: number;
  vcenter: string;
  nsxManager: string;
  version: string;
  created: string;
  providerType: string;
  storageCapacity: string;
  networkType: string;
}

const mockSDDCs: SDDC[] = [
  {
    id: 'sddc-0a1b2c3d',
    name: 'prod-us-east-sddc',
    status: 'READY',
    region: 'us-east-1',
    numHosts: 4,
    vcenter: 'vcenter.sddc-0a1b2c3d.vmwarevmc.com',
    nsxManager: 'nsx.sddc-0a1b2c3d.vmwarevmc.com',
    version: 'VMware Cloud 1.22',
    created: '2024-01-15',
    providerType: 'VMC',
    storageCapacity: '61.44 TB',
    networkType: 'NSX-T',
  },
  {
    id: 'sddc-1b2c3d4e',
    name: 'prod-eu-west-sddc',
    status: 'MAINTENANCE',
    region: 'eu-west-2',
    numHosts: 3,
    vcenter: 'vcenter.sddc-1b2c3d4e.vmwarevmc.com',
    nsxManager: 'nsx.sddc-1b2c3d4e.vmwarevmc.com',
    version: 'VMware Cloud 1.21',
    created: '2024-02-08',
    providerType: 'VMC',
    storageCapacity: '46.08 TB',
    networkType: 'NSX-T',
  },
  {
    id: 'sddc-2c3d4e5f',
    name: 'dev-us-west-sddc',
    status: 'READY',
    region: 'us-west-2',
    numHosts: 2,
    vcenter: 'vcenter.sddc-2c3d4e5f.vmwarevmc.com',
    nsxManager: 'nsx.sddc-2c3d4e5f.vmwarevmc.com',
    version: 'VMware Cloud 1.22',
    created: '2024-03-01',
    providerType: 'VMC',
    storageCapacity: '30.72 TB',
    networkType: 'NSX-T',
  },
  {
    id: 'sddc-3d4e5f6a',
    name: 'staging-ap-sddc',
    status: 'READY',
    region: 'ap-southeast-1',
    numHosts: 3,
    vcenter: 'vcenter.sddc-3d4e5f6a.vmwarevmc.com',
    nsxManager: 'nsx.sddc-3d4e5f6a.vmwarevmc.com',
    version: 'VMware Cloud 1.22',
    created: '2024-03-15',
    providerType: 'VMC',
    storageCapacity: '46.08 TB',
    networkType: 'NSX-T',
  },
  {
    id: 'sddc-4e5f6a7b',
    name: 'dr-us-east-sddc',
    status: 'PENDING',
    region: 'us-east-1',
    numHosts: 2,
    vcenter: '(provisioning)',
    nsxManager: '(provisioning)',
    version: 'VMware Cloud 1.22',
    created: '2024-05-05',
    providerType: 'VMC',
    storageCapacity: '30.72 TB',
    networkType: 'NSX-T',
  },
];

function StatusBadge({ status }: { status: SDDC['status'] }) {
  const cfg = {
    READY:       { cls: 'bg-green-100 text-green-800',  icon: <CheckCircle className="w-3 h-3 mr-1" /> },
    PENDING:     { cls: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-3 h-3 mr-1 animate-spin" /> },
    FAILED:      { cls: 'bg-red-100 text-red-800',      icon: <AlertTriangle className="w-3 h-3 mr-1" /> },
    MAINTENANCE: { cls: 'bg-blue-100 text-blue-800',    icon: <RefreshCw className="w-3 h-3 mr-1" /> },
  }[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cfg.cls}`}>
      {cfg.icon}{status}
    </span>
  );
}

export default function SDDCPage({ currentRegion }: SDDCPageProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newSDDCName, setNewSDDCName] = useState('');
  const [newSDDCRegion, setNewSDDCRegion] = useState('us-east-1');
  const [newSDDCHosts, setNewSDDCHosts] = useState(2);

  const filtered = mockSDDCs.filter(s =>
    (currentRegion === 'all' || s.region === currentRegion) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.id.includes(search))
  );

  const selectedSDDC = mockSDDCs.find(s => s.id === selected);

  const stats = {
    total: mockSDDCs.length,
    ready: mockSDDCs.filter(s => s.status === 'READY').length,
    hosts: mockSDDCs.reduce((a, s) => a + s.numHosts, 0),
  };

  return (
    <div className="p-6 bg-[#f2f3f3] min-h-[calc(100vh-84px)]">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-[#545b64] mb-4">
        <Home className="w-4 h-4 mr-2" />
        <span className="hover:text-[#0073bb] cursor-pointer">Home</span>
        <ChevronRight className="w-4 h-4 mx-2" />
        <span className="text-[#16191f] font-medium">SDDCs</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-normal text-[#16191f] mb-1">Software-Defined Data Centers</h1>
          <p className="text-[#545b64] text-sm">
            Region: <span className="font-medium text-[#16191f]">{regions.find(r => r.id === currentRegion)?.name || 'All Regions'}</span>
            {' — '}{stats.total} SDDCs · {stats.ready} Ready · {stats.hosts} total hosts
          </p>
        </div>
        <div className="flex space-x-2">
          <button className="px-3 py-2 border border-[#d5dbdb] bg-white hover:bg-[#f2f3f3] text-sm text-[#16191f] rounded-sm flex items-center">
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />Create SDDC
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total SDDCs', value: stats.total, icon: Cloud, color: 'text-[#0073bb]' },
          { label: 'Ready', value: stats.ready, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Total Hosts', value: stats.hosts, icon: Server, color: 'text-[#ff9900]' },
          { label: 'Regions', value: new Set(mockSDDCs.map(s => s.region)).size, icon: Globe, color: 'text-purple-600' },
        ].map(card => (
          <div key={card.label} className="bg-white border border-[#d5dbdb] rounded p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#545b64] uppercase font-medium mb-1">{card.label}</p>
                <p className="text-3xl font-light text-[#16191f]">{card.value}</p>
              </div>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        {/* SDDC Table */}
        <div className={`bg-white border border-[#d5dbdb] rounded overflow-hidden ${selected ? 'flex-1' : 'w-full'}`}>
          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-[#d5dbdb] flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aab7b8]" />
              <input
                type="text"
                placeholder="Search SDDCs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 border border-[#d5dbdb] rounded text-sm w-64 focus:outline-none focus:border-[#ff9900]"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1.5 border border-[#d5dbdb] text-sm text-[#545b64] hover:bg-[#f2f3f3] rounded-sm flex items-center">
                <Filter className="w-4 h-4 mr-1" />Filter
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                <th className="text-left px-4 py-3 text-[#545b64] font-medium">Name / ID</th>
                <th className="text-left px-4 py-3 text-[#545b64] font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[#545b64] font-medium">Region</th>
                <th className="text-left px-4 py-3 text-[#545b64] font-medium">Hosts</th>
                <th className="text-left px-4 py-3 text-[#545b64] font-medium">Version</th>
                <th className="text-left px-4 py-3 text-[#545b64] font-medium">Created</th>
                <th className="text-left px-4 py-3 text-[#545b64] font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(sddc => (
                <tr
                  key={sddc.id}
                  className={`border-b border-[#eaeded] hover:bg-[#f2f3f3] cursor-pointer ${selected === sddc.id ? 'bg-[#f2f3f3]' : ''}`}
                  onClick={() => setSelected(selected === sddc.id ? null : sddc.id)}
                >
                  <td className="px-4 py-3">
                    <div className="text-[#0073bb] font-medium hover:underline">{sddc.name}</div>
                    <div className="text-xs text-[#aab7b8] font-mono">{sddc.id}</div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={sddc.status} /></td>
                  <td className="px-4 py-3 text-[#16191f]">{regions.find(r => r.id === sddc.region)?.name || sddc.region}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <Server className="w-4 h-4 mr-1 text-[#545b64]" />
                      <span>{sddc.numHosts}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[#545b64]">{sddc.version}</td>
                  <td className="px-4 py-3 text-[#545b64]">{sddc.created}</td>
                  <td className="px-4 py-3">
                    <button className="p-1 hover:bg-[#d5dbdb] rounded"><MoreHorizontal className="w-4 h-4 text-[#545b64]" /></button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#545b64]">No SDDCs found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selectedSDDC && (
          <div className="w-80 bg-white border border-[#d5dbdb] rounded overflow-hidden">
            <div className="px-4 py-3 border-b border-[#d5dbdb] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#16191f]">SDDC Details</h3>
              <button onClick={() => setSelected(null)}><X className="w-4 h-4 text-[#545b64]" /></button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <StatusBadge status={selectedSDDC.status} />
                <span className="text-xs text-[#aab7b8]">{selectedSDDC.created}</span>
              </div>
              <h4 className="font-semibold text-[#16191f] text-base">{selectedSDDC.name}</h4>
              <p className="text-xs text-[#aab7b8] font-mono">{selectedSDDC.id}</p>

              <div className="border-t border-[#eaeded] pt-3 space-y-2">
                {[
                  { icon: Globe, label: 'Region', val: regions.find(r => r.id === selectedSDDC.region)?.name || selectedSDDC.region },
                  { icon: Server, label: 'Hosts', val: `${selectedSDDC.numHosts} hosts` },
                  { icon: HardDrive, label: 'Storage', val: selectedSDDC.storageCapacity },
                  { icon: Network, label: 'Network', val: selectedSDDC.networkType },
                  { icon: Cpu, label: 'Version', val: selectedSDDC.version },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between">
                    <span className="flex items-center text-[#545b64]">
                      <row.icon className="w-3.5 h-3.5 mr-2" />{row.label}
                    </span>
                    <span className="text-[#16191f] font-medium text-xs">{row.val}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#eaeded] pt-3 space-y-1">
                <p className="text-xs text-[#545b64] font-medium uppercase mb-2">Endpoints</p>
                <div>
                  <p className="text-xs text-[#545b64]">vCenter</p>
                  <p className="text-xs font-mono text-[#0073bb] break-all">{selectedSDDC.vcenter}</p>
                </div>
                <div>
                  <p className="text-xs text-[#545b64] mt-2">NSX Manager</p>
                  <p className="text-xs font-mono text-[#0073bb] break-all">{selectedSDDC.nsxManager}</p>
                </div>
              </div>

              <div className="border-t border-[#eaeded] pt-3 grid grid-cols-2 gap-2">
                <button className="px-3 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-xs font-medium rounded-sm">
                  Open vCenter
                </button>
                <button className="px-3 py-2 border border-[#d5dbdb] hover:bg-[#f2f3f3] text-[#16191f] text-xs rounded-sm">
                  Open NSX
                </button>
                <button className="px-3 py-2 border border-[#d5dbdb] hover:bg-[#f2f3f3] text-[#16191f] text-xs rounded-sm">
                  Add Hosts
                </button>
                <button className="px-3 py-2 border border-red-300 hover:bg-red-50 text-red-600 text-xs rounded-sm">
                  Delete SDDC
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create SDDC Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-[520px]">
            <div className="px-6 py-4 border-b border-[#d5dbdb] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#16191f]">Create New SDDC</h2>
              <button onClick={() => setShowCreate(false)}><X className="w-5 h-5 text-[#545b64]" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#16191f] mb-1">SDDC Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newSDDCName}
                  onChange={e => setNewSDDCName(e.target.value)}
                  placeholder="e.g. prod-us-east-sddc"
                  className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#16191f] mb-1">Region</label>
                <select
                  value={newSDDCRegion}
                  onChange={e => setNewSDDCRegion(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
                >
                  {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#16191f] mb-1">Number of Hosts</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range" min={2} max={16} value={newSDDCHosts}
                    onChange={e => setNewSDDCHosts(Number(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium w-8 text-center">{newSDDCHosts}</span>
                </div>
                <p className="text-xs text-[#545b64] mt-1">Minimum 2 hosts required. Each host: i3.metal with 15.36 TB NVMe.</p>
              </div>
              <div className="bg-[#f2f3f3] rounded p-3 text-sm">
                <p className="text-[#16191f] font-medium mb-1">Estimated Cost</p>
                <p className="text-[#545b64]">~${(newSDDCHosts * 3.234).toFixed(2)}/hr · ~${(newSDDCHosts * 3.234 * 730).toFixed(0)}/mo</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#d5dbdb] flex justify-end space-x-3">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-[#d5dbdb] text-sm text-[#16191f] rounded-sm hover:bg-[#f2f3f3]">Cancel</button>
              <button
                disabled={!newSDDCName.trim()}
                className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] disabled:opacity-50 text-[#232f3e] text-sm font-medium rounded-sm"
              >
                Create SDDC
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
