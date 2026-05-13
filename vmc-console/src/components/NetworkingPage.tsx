'use client';

import { useState, useMemo } from 'react';
import {
  Shield, ChevronRight, Home,
  Plus, Search, Filter, MoreHorizontal, RefreshCw, Download, X,
  CheckCircle, AlertCircle, AlertTriangle,
} from 'lucide-react';
import { regions, nsxSegments, nsxGateways, firewallPolicies } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

interface NetworkingPageProps { currentRegion: string; }

const mockLoadBalancers = [
  { id: 'lb-prod-web-use1', name: 'prod-web-lb', type: 'Layer 7', algorithm: 'Round Robin', vip: '10.0.1.100', port: 443, members: 3, region: 'us-east-1', status: 'up' as const },
  { id: 'lb-prod-app-use1', name: 'prod-app-lb', type: 'Layer 4', algorithm: 'Least Connections', vip: '10.0.10.100', port: 8080, members: 2, region: 'us-east-1', status: 'up' as const },
  { id: 'lb-dev-web-use1',  name: 'dev-web-lb',  type: 'Layer 7', algorithm: 'Round Robin', vip: '10.1.1.100',  port: 80,  members: 1, region: 'us-east-1', status: 'up' as const },
  { id: 'lb-prod-web-usw2', name: 'prod-web-lb', type: 'Layer 7', algorithm: 'Round Robin', vip: '10.2.1.100',  port: 443, members: 2, region: 'us-west-2', status: 'up' as const },
];

function Breadcrumb({ items }: { items: { label: string }[] }) {
  return (
    <nav className="flex items-center text-sm text-[#545b64] mb-4">
      <Home className="w-4 h-4 mr-2" />
      {items.map((item, i) => (
        <span key={i} className="flex items-center">
          {i > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
          <span className={i === items.length - 1 ? 'text-[#16191f]' : 'hover:text-[#0073bb] cursor-pointer'}>{item.label}</span>
        </span>
      ))}
    </nav>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    up:       { cls: 'bg-green-100 text-green-700',  label: 'Up',       icon: <CheckCircle className="w-3 h-3 mr-1" /> },
    down:     { cls: 'bg-red-100 text-red-700',      label: 'Down',     icon: <AlertCircle className="w-3 h-3 mr-1" /> },
    degraded: { cls: 'bg-yellow-100 text-yellow-700',label: 'Degraded', icon: <AlertTriangle className="w-3 h-3 mr-1" /> },
    unknown:  { cls: 'bg-gray-100 text-gray-600',    label: 'Unknown',  icon: null },
    enabled:  { cls: 'bg-green-100 text-green-700',  label: 'Enabled',  icon: <CheckCircle className="w-3 h-3 mr-1" /> },
    disabled: { cls: 'bg-gray-100 text-gray-600',    label: 'Disabled', icon: null },
  };
  const { cls, label, icon } = map[status] ?? map.unknown;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {icon}{label}
    </span>
  );
}

type Tab = 'segments' | 'gateways' | 'firewall' | 'loadbalancers';

export default function NetworkingPage({ currentRegion }: NetworkingPageProps) {
  const { user } = useAuth();
  const canEdit = user?.role !== 'readonly';
  const [activeTab, setActiveTab] = useState<Tab>('segments');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const regionName = regions.find(r => r.id === currentRegion)?.name ?? currentRegion;

  const filteredSegments = useMemo(() =>
    nsxSegments.filter(s =>
      (currentRegion === 'all' || s.region === currentRegion) &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       s.cidr.includes(searchTerm) || s.transportZone.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [currentRegion, searchTerm]);

  const filteredGateways = useMemo(() =>
    nsxGateways.filter(g =>
      (currentRegion === 'all' || g.region === currentRegion) &&
      (g.name.toLowerCase().includes(searchTerm.toLowerCase()) || g.tier.includes(searchTerm.toUpperCase()))
    ), [currentRegion, searchTerm]);

  const filteredPolicies = useMemo(() =>
    firewallPolicies.filter(p =>
      (currentRegion === 'all' || p.region === currentRegion) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [currentRegion, searchTerm]);

  const filteredLBs = useMemo(() =>
    mockLoadBalancers.filter(lb =>
      (currentRegion === 'all' || lb.region === currentRegion) &&
      lb.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [currentRegion, searchTerm]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'segments',      label: 'NSX Segments',         count: filteredSegments.length },
    { id: 'gateways',      label: 'T0 / T1 Gateways',     count: filteredGateways.length },
    { id: 'firewall',      label: 'Distributed Firewall',  count: filteredPolicies.length },
    { id: 'loadbalancers', label: 'Load Balancers',        count: filteredLBs.length },
  ];

  return (
    <div className="p-6 bg-[#f2f3f3] min-h-[calc(100vh-84px)]">
      <Breadcrumb items={[{ label: 'Services' }, { label: 'Networking' }, { label: 'NSX-T Networking' }]} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-[#16191f] mb-1">NSX-T Networking</h1>
          <p className="text-[#545b64] text-sm">
            Region: <span className="text-[#16191f] font-medium">{regionName}</span> — Segments, Gateways, Distributed Firewall &amp; Load Balancers
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm transition-colors flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Segment
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Segments', value: filteredSegments.length, sub: `${filteredSegments.filter(s => s.status === 'up').length} up`, color: 'text-green-600' },
          { label: 'Gateways', value: filteredGateways.length, sub: `T0: ${filteredGateways.filter(g => g.tier === 'T0').length} · T1: ${filteredGateways.filter(g => g.tier === 'T1').length}`, color: 'text-[#0073bb]' },
          { label: 'Firewall Policies', value: filteredPolicies.length, sub: `${filteredPolicies.reduce((s, p) => s + p.ruleCount, 0)} total rules`, color: 'text-[#545b64]' },
          { label: 'Load Balancers', value: filteredLBs.length, sub: 'NSX Advanced LB', color: 'text-[#545b64]' },
        ].map(c => (
          <div key={c.label} className="bg-white border border-[#d5dbdb] rounded-sm p-4">
            <p className="text-xs text-[#545b64] uppercase tracking-wide mb-1">{c.label}</p>
            <p className={`text-3xl font-light ${c.color}`}>{c.value}</p>
            <p className="text-xs text-[#aab7b8] mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-[#d5dbdb]">
        <div className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#ff9900] text-[#16191f]'
                  : 'border-transparent text-[#545b64] hover:text-[#16191f]'
              }`}
            >
              {tab.label}
              <span className="ml-2 px-2 py-0.5 text-xs bg-[#eaeded] rounded">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between bg-white p-3 border border-[#d5dbdb] rounded-sm">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#545b64]" />
            <input
              type="text"
              placeholder="Search…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-1.5 w-64 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
            />
          </div>
          <button className="px-3 py-1.5 text-sm border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] flex items-center">
            <Filter className="w-4 h-4 mr-2" />Filters
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-1.5 text-[#545b64] hover:bg-[#f2f3f3] rounded"><RefreshCw className="w-4 h-4" /></button>
          <button className="px-3 py-1.5 text-sm border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] flex items-center">
            <Download className="w-4 h-4 mr-2" />Export
          </button>
        </div>
      </div>

      {/* ── Segments ── */}
      {activeTab === 'segments' && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                {['Name', 'Type', 'Gateway / CIDR', 'Transport Zone', 'Attached VMs', 'DHCP', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#545b64] font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredSegments.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#545b64] text-sm">No segments found</td></tr>
              ) : filteredSegments.map(seg => (
                <tr key={seg.id} className="border-b border-[#eaeded] hover:bg-[#f2f3f3]">
                  <td className="px-4 py-3 font-medium text-[#0073bb]">{seg.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      seg.type === 'routed' ? 'bg-blue-100 text-blue-700' :
                      seg.type === 'isolated' ? 'bg-purple-100 text-purple-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>{seg.type}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#545b64]">{seg.gateway} / {seg.cidr}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{seg.transportZone}</td>
                  <td className="px-4 py-3 text-[#16191f]">{seg.attachedVMs}</td>
                  <td className="px-4 py-3">
                    {seg.dhcp
                      ? <span className="inline-flex items-center text-xs text-green-700"><CheckCircle className="w-3 h-3 mr-1" />Enabled</span>
                      : <span className="text-xs text-[#aab7b8]">Disabled</span>
                    }
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={seg.status} /></td>
                  <td className="px-4 py-3">
                    {canEdit && <button className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]"><MoreHorizontal className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Gateways ── */}
      {activeTab === 'gateways' && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                {['Name', 'Tier', 'Mode', 'HA', 'Edge Cluster', 'Linked Segments', 'BGP Peers', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#545b64] font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredGateways.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-[#545b64] text-sm">No gateways found</td></tr>
              ) : filteredGateways.map(gw => (
                <tr key={gw.id} className="border-b border-[#eaeded] hover:bg-[#f2f3f3]">
                  <td className="px-4 py-3 font-medium text-[#0073bb]">{gw.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${gw.tier === 'T0' ? 'bg-[#232f3e] text-white' : 'bg-[#0073bb] text-white'}`}>
                      {gw.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{gw.mode}</td>
                  <td className="px-4 py-3">
                    {gw.ha
                      ? <span className="text-xs text-green-700 flex items-center"><CheckCircle className="w-3 h-3 mr-1" />HA</span>
                      : <span className="text-xs text-[#aab7b8]">No HA</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{gw.edgeCluster}</td>
                  <td className="px-4 py-3 text-[#16191f]">{gw.linkedSegments}</td>
                  <td className="px-4 py-3 text-[#16191f]">{gw.bgpPeers}</td>
                  <td className="px-4 py-3"><StatusBadge status={gw.status} /></td>
                  <td className="px-4 py-3">
                    {canEdit && <button className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]"><MoreHorizontal className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── DFW Policies ── */}
      {activeTab === 'firewall' && (
        <div className="space-y-4">
          <div className="bg-[#fff4e6] border border-[#ff9900] rounded-sm p-3 flex items-center text-sm">
            <Shield className="w-4 h-4 text-[#ff9900] mr-2 flex-shrink-0" />
            <span className="text-[#16191f]">NSX Distributed Firewall (DFW) applies micro-segmentation policies across all workloads in selected transport zones.</span>
          </div>
          <div className="bg-white border border-[#d5dbdb] rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                  {['Policy Name', 'Scope', 'Priority', 'Rules', 'Applied To', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[#545b64] font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredPolicies.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-[#545b64] text-sm">No policies found</td></tr>
                ) : filteredPolicies.map(pol => (
                  <tr key={pol.id} className="border-b border-[#eaeded] hover:bg-[#f2f3f3]">
                    <td className="px-4 py-3 font-medium text-[#0073bb]">{pol.name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        pol.scope === 'distributed' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>{pol.scope === 'distributed' ? 'DFW' : 'Gateway'}</span>
                    </td>
                    <td className="px-4 py-3 text-[#545b64]">{pol.priority}</td>
                    <td className="px-4 py-3 text-[#16191f] font-medium">{pol.ruleCount}</td>
                    <td className="px-4 py-3 text-xs text-[#545b64]">{pol.applied.join(', ')}</td>
                    <td className="px-4 py-3"><StatusBadge status={pol.status} /></td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <div className="flex items-center space-x-1">
                          <button className="px-2 py-1 text-xs border border-[#d5dbdb] rounded hover:bg-[#f2f3f3]">Edit Rules</button>
                          <button className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]"><MoreHorizontal className="w-4 h-4" /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Load Balancers ── */}
      {activeTab === 'loadbalancers' && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                {['Name', 'Type', 'VIP', 'Port', 'Algorithm', 'Members', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#545b64] font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLBs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#545b64] text-sm">No load balancers found</td></tr>
              ) : filteredLBs.map(lb => (
                <tr key={lb.id} className="border-b border-[#eaeded] hover:bg-[#f2f3f3]">
                  <td className="px-4 py-3 font-medium text-[#0073bb]">{lb.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${lb.type === 'Layer 7' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {lb.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#545b64]">{lb.vip}</td>
                  <td className="px-4 py-3 text-[#16191f]">{lb.port}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{lb.algorithm}</td>
                  <td className="px-4 py-3 text-[#16191f]">{lb.members}</td>
                  <td className="px-4 py-3"><StatusBadge status={lb.status} /></td>
                  <td className="px-4 py-3">
                    {canEdit && <button className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]"><MoreHorizontal className="w-4 h-4" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Segment Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-[520px]">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <h2 className="text-lg font-medium text-[#16191f]">Create NSX Segment</h2>
              <button onClick={() => setIsCreateOpen(false)} className="text-[#545b64] hover:text-[#16191f]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#545b64] mb-1">Segment Name</label>
                <input className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]" placeholder="e.g. prod-web-segment" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#545b64] mb-1">Type</label>
                  <select className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]">
                    <option>routed</option>
                    <option>isolated</option>
                    <option>extended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#545b64] mb-1">Gateway CIDR</label>
                  <input className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]" placeholder="10.x.x.1/24" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#545b64] mb-1">Transport Zone</label>
                <select className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]">
                  <option>overlay-tz-use1</option>
                  <option>overlay-tz-usw2</option>
                  <option>overlay-tz-euw2</option>
                  <option>vlan-tz-use1</option>
                </select>
              </div>
              <label className="flex items-center space-x-2 text-sm">
                <input type="checkbox" className="rounded" defaultChecked />
                <span>Enable DHCP</span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-[#eaeded] bg-[#fafafa] flex justify-end space-x-3">
              <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 border border-[#d5dbdb] rounded text-sm hover:bg-[#f2f3f3]">Cancel</button>
              <button onClick={() => setIsCreateOpen(false)} className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm">
                Create Segment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
