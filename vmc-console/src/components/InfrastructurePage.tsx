'use client';

import { useState, useMemo } from 'react';
import {
  Server, Cpu, MemoryStick, HardDrive, ChevronRight, Home,
  CheckCircle, AlertCircle, AlertTriangle, Clock, Activity,
  Search, RefreshCw, MoreHorizontal, Database, Layers,
} from 'lucide-react';
import { vCenterServers, esxiHosts, clusters, datacenters } from '../data/mockData';
import type { VCenterServer, ESXiHost, Cluster, Datacenter } from '../types';

interface InfrastructurePageProps { currentRegion: string; }

type Tab = 'vcenter' | 'clusters' | 'hosts' | 'datacenters';

function Breadcrumb() {
  return (
    <nav className="flex items-center text-sm text-[#545b64] mb-4">
      <Home className="w-4 h-4 mr-2" />
      <ChevronRight className="w-4 h-4 mx-2" />
      <span className="text-[#16191f]">VMware Infrastructure</span>
    </nav>
  );
}

function UtilBar({ used, total, unit = '' }: { used: number; total: number; unit?: string }) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const color = pct > 85 ? 'bg-red-500' : pct > 70 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="min-w-[80px]">
      <div className="flex justify-between text-xs text-[#545b64] mb-0.5">
        <span>{used}{unit}</span>
        <span className={pct > 85 ? 'text-red-600 font-semibold' : ''}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-[#eaeded] rounded-full">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-[#aab7b8] mt-0.5">{total}{unit}</div>
    </div>
  );
}

function VCenterStatus({ status }: { status: VCenterServer['status'] }) {
  const map = {
    connected:    { cls: 'bg-green-100 text-green-700',  icon: <CheckCircle className="w-3 h-3 mr-1" />,    label: 'Connected' },
    disconnected: { cls: 'bg-red-100 text-red-700',      icon: <AlertCircle className="w-3 h-3 mr-1" />,    label: 'Disconnected' },
    maintenance:  { cls: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle className="w-3 h-3 mr-1" />, label: 'Maintenance' },
  };
  const { cls, icon, label } = map[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{icon}{label}</span>;
}

function HostStatus({ status }: { status: ESXiHost['status'] }) {
  const map = {
    connected:     { cls: 'bg-green-100 text-green-700',   icon: <CheckCircle className="w-3 h-3 mr-1" />,    label: 'Connected' },
    disconnected:  { cls: 'bg-red-100 text-red-700',       icon: <AlertCircle className="w-3 h-3 mr-1" />,    label: 'Disconnected' },
    maintenance:   { cls: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle className="w-3 h-3 mr-1" />,   label: 'Maintenance' },
    'not-responding': { cls: 'bg-red-100 text-red-700',    icon: <AlertCircle className="w-3 h-3 mr-1" />,    label: 'Not Responding' },
  };
  const { cls, icon, label } = map[status] ?? { cls: 'bg-gray-100 text-gray-600', icon: null, label: status };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{icon}{label}</span>;
}

function ClusterStatus({ status }: { status: Cluster['status'] }) {
  const map = {
    green:  { cls: 'bg-green-100 text-green-700',   label: 'Green' },
    yellow: { cls: 'bg-yellow-100 text-yellow-700', label: 'Yellow' },
    red:    { cls: 'bg-red-100 text-red-700',        label: 'Red' },
  };
  const { cls, label } = map[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}

export default function InfrastructurePage({ currentRegion }: InfrastructurePageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('vcenter');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVC = useMemo(() =>
    vCenterServers.filter(v =>
      (currentRegion === 'all' || v.region === currentRegion) &&
      (v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.hostname.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [currentRegion, searchTerm]);

  const filteredHosts = useMemo(() =>
    esxiHosts.filter(h =>
      (currentRegion === 'all' || h.region === currentRegion) &&
      (h.name.toLowerCase().includes(searchTerm.toLowerCase()) || h.clusterName.toLowerCase().includes(searchTerm.toLowerCase()))
    ), [currentRegion, searchTerm]);

  const filteredClusters = useMemo(() =>
    clusters.filter(c =>
      (currentRegion === 'all' || c.region === currentRegion) &&
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [currentRegion, searchTerm]);

  const filteredDCs = useMemo(() =>
    datacenters.filter(d =>
      (currentRegion === 'all' || d.region === currentRegion) &&
      d.name.toLowerCase().includes(searchTerm.toLowerCase())
    ), [currentRegion, searchTerm]);

  const tabs: { id: Tab; label: string; count: number; icon: React.ReactNode }[] = [
    { id: 'vcenter',     label: 'vCenter Servers', count: filteredVC.length,       icon: <Database className="w-4 h-4" /> },
    { id: 'clusters',    label: 'Clusters',         count: filteredClusters.length, icon: <Layers className="w-4 h-4" /> },
    { id: 'hosts',       label: 'ESXi Hosts',       count: filteredHosts.length,    icon: <Server className="w-4 h-4" /> },
    { id: 'datacenters', label: 'Datacenters',       count: filteredDCs.length,      icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="p-6 bg-[#f2f3f3] min-h-[calc(100vh-84px)]">
      <Breadcrumb />

      <div className="mb-6">
        <h1 className="text-2xl font-normal text-[#16191f] mb-1">VMware Infrastructure</h1>
        <p className="text-sm text-[#545b64]">vCenter Servers, ESXi hosts, clusters, and datacenters powering your VMC SDDCs</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-4">
          <p className="text-xs text-[#545b64] uppercase tracking-wide mb-1">vCenter Servers</p>
          <p className="text-3xl font-light text-[#16191f]">{filteredVC.length}</p>
          <p className="text-xs text-[#aab7b8] mt-1">{filteredVC.filter(v => v.status === 'connected').length} connected</p>
        </div>
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-4">
          <p className="text-xs text-[#545b64] uppercase tracking-wide mb-1">ESXi Hosts</p>
          <p className="text-3xl font-light text-[#16191f]">{filteredHosts.length}</p>
          <p className="text-xs text-[#aab7b8] mt-1">
            {filteredHosts.filter(h => h.status === 'connected').length} connected
            {filteredHosts.filter(h => h.status === 'maintenance').length > 0 && ` · ${filteredHosts.filter(h => h.status === 'maintenance').length} maintenance`}
          </p>
        </div>
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-4">
          <p className="text-xs text-[#545b64] uppercase tracking-wide mb-1">Clusters</p>
          <p className="text-3xl font-light text-[#16191f]">{filteredClusters.length}</p>
          <p className="text-xs text-[#aab7b8] mt-1">
            {filteredClusters.filter(c => c.status === 'green').length} green
            {filteredClusters.filter(c => c.status !== 'green').length > 0 && ` · ${filteredClusters.filter(c => c.status !== 'green').length} attention`}
          </p>
        </div>
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-4">
          <p className="text-xs text-[#545b64] uppercase tracking-wide mb-1">Total VMs</p>
          <p className="text-3xl font-light text-[#16191f]">{filteredHosts.reduce((s, h) => s + h.vmCount, 0)}</p>
          <p className="text-xs text-[#aab7b8] mt-1">Across all hosts</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-[#d5dbdb]">
        <div className="flex space-x-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-[#ff9900] text-[#16191f]'
                  : 'border-transparent text-[#545b64] hover:text-[#16191f]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              <span className="px-2 py-0.5 text-xs bg-[#eaeded] rounded">{tab.count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between bg-white p-3 border border-[#d5dbdb] rounded-sm">
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
        <button className="p-1.5 text-[#545b64] hover:bg-[#f2f3f3] rounded"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* ── vCenter Servers ── */}
      {activeTab === 'vcenter' && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                {['Name', 'Hostname', 'Version / Build', 'Region', 'Status', 'Datacenters', 'Clusters', 'Hosts', 'VMs', 'Last Updated', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#545b64] font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredVC.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-[#545b64] text-sm">No vCenter servers found</td></tr>
              ) : filteredVC.map(vc => (
                <tr key={vc.id} className="border-b border-[#eaeded] hover:bg-[#f2f3f3]">
                  <td className="px-4 py-3 font-medium text-[#0073bb]">{vc.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#545b64]">{vc.hostname}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">vCenter {vc.version} · {vc.build}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{vc.region}</td>
                  <td className="px-4 py-3"><VCenterStatus status={vc.status} /></td>
                  <td className="px-4 py-3 text-[#16191f]">{vc.datacenterCount}</td>
                  <td className="px-4 py-3 text-[#16191f]">{vc.clusterCount}</td>
                  <td className="px-4 py-3 text-[#16191f]">{vc.hostCount}</td>
                  <td className="px-4 py-3 text-[#16191f]">{vc.vmCount}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{vc.lastUpdated}</td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Clusters ── */}
      {activeTab === 'clusters' && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                {['Cluster', 'Datacenter', 'Hosts', 'VMs', 'CPU', 'Memory', 'HA', 'DRS', 'vSAN', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#545b64] font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredClusters.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-[#545b64] text-sm">No clusters found</td></tr>
              ) : filteredClusters.map(cl => (
                <tr key={cl.id} className="border-b border-[#eaeded] hover:bg-[#f2f3f3]">
                  <td className="px-4 py-3 font-medium text-[#0073bb]">{cl.name}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{cl.datacenterName}</td>
                  <td className="px-4 py-3 text-[#16191f]">{cl.hostCount}</td>
                  <td className="px-4 py-3 text-[#16191f]">{cl.vmCount}</td>
                  <td className="px-4 py-3">
                    <UtilBar used={cl.cpuUsedGHz} total={cl.cpuTotalGHz} unit=" GHz" />
                  </td>
                  <td className="px-4 py-3">
                    <UtilBar used={cl.memUsedGB} total={cl.memTotalGB} unit=" GB" />
                  </td>
                  <td className="px-4 py-3">
                    {cl.haEnabled
                      ? <span className="text-xs text-green-700 flex items-center"><CheckCircle className="w-3 h-3 mr-1" />On</span>
                      : <span className="text-xs text-[#aab7b8]">Off</span>}
                  </td>
                  <td className="px-4 py-3">
                    {cl.drsEnabled
                      ? <span className="text-xs text-green-700 flex items-center"><CheckCircle className="w-3 h-3 mr-1" />On</span>
                      : <span className="text-xs text-[#aab7b8]">Off</span>}
                  </td>
                  <td className="px-4 py-3">
                    {cl.vsanEnabled
                      ? <span className="text-xs text-[#0073bb] flex items-center"><CheckCircle className="w-3 h-3 mr-1" />On</span>
                      : <span className="text-xs text-[#aab7b8]">Off</span>}
                  </td>
                  <td className="px-4 py-3"><ClusterStatus status={cl.status} /></td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ESXi Hosts ── */}
      {activeTab === 'hosts' && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                {['Host', 'IP', 'Cluster', 'Hardware', 'ESXi Ver.', 'CPU', 'Memory', 'VMs', 'Uptime', 'Status', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#545b64] font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredHosts.length === 0 ? (
                <tr><td colSpan={11} className="px-4 py-8 text-center text-[#545b64] text-sm">No hosts found</td></tr>
              ) : filteredHosts.map(h => (
                <tr key={h.id} className="border-b border-[#eaeded] hover:bg-[#f2f3f3]">
                  <td className="px-4 py-3 font-medium text-[#0073bb]">{h.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#545b64]">{h.ipAddress}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{h.clusterName}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">
                    <p>{h.vendor}</p>
                    <p className="text-[#aab7b8]">{h.model}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{h.esxiVersion}</td>
                  <td className="px-4 py-3">
                    <UtilBar used={Math.round(h.cpuUsed / 1000)} total={Math.round(h.cpuTotal / 1000)} unit=" GHz" />
                  </td>
                  <td className="px-4 py-3">
                    <UtilBar used={h.memoryUsed} total={h.memoryTotal} unit=" GB" />
                  </td>
                  <td className="px-4 py-3 text-[#16191f]">{h.vmCount}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64] flex items-center">
                    <Clock className="w-3 h-3 mr-1" />{h.uptime}
                  </td>
                  <td className="px-4 py-3"><HostStatus status={h.status} /></td>
                  <td className="px-4 py-3">
                    <button className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]"><MoreHorizontal className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Datacenters ── */}
      {activeTab === 'datacenters' && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                {['Datacenter', 'vCenter', 'Region', 'Clusters', 'Hosts', 'VMs', 'Datastores', 'Networks'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#545b64] font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDCs.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-[#545b64] text-sm">No datacenters found</td></tr>
              ) : filteredDCs.map(dc => (
                <tr key={dc.id} className="border-b border-[#eaeded] hover:bg-[#f2f3f3]">
                  <td className="px-4 py-3 font-medium text-[#0073bb]">{dc.name}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{dc.vcenter}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{dc.region}</td>
                  <td className="px-4 py-3 text-[#16191f]">{dc.clusterCount}</td>
                  <td className="px-4 py-3 text-[#16191f]">{dc.hostCount}</td>
                  <td className="px-4 py-3 text-[#16191f]">{dc.vmCount}</td>
                  <td className="px-4 py-3 text-[#16191f]">{dc.datastoreCount}</td>
                  <td className="px-4 py-3 text-[#16191f]">{dc.networkCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
