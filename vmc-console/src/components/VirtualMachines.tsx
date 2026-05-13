'use client';

import { useState, useMemo } from 'react';
import { 
  Search,
  Filter,
  RefreshCw,
  Play,
  Square,
  Trash2,
  MoreHorizontal,
  ChevronDown,
  Settings,
  Box,
  Tag,
  Eye
} from 'lucide-react';
import { vms, regions } from '../data/mockData';
import { VM } from '../types';

interface VirtualMachinesProps {
  currentRegion: string;
}

type StatusFilter = 'all' | 'running' | 'stopped' | 'error' | 'provisioning';

function StatusBadge({ status }: { status: string }) {
  const styles = {
    running: 'bg-green-100 text-green-800 border-green-200',
    stopped: 'bg-gray-100 text-gray-800 border-gray-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    provisioning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  const icons = {
    running: <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>,
    stopped: <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>,
    error: <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>,
    provisioning: <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>,
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status as keyof typeof styles] || styles.stopped}`}>
      {icons[status as keyof typeof icons]}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function VirtualMachines({ currentRegion }: VirtualMachinesProps) {
  const [selectedVMs, setSelectedVMs] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredVMs = useMemo(() => {
    return vms.filter(vm => {
      const matchesRegion = currentRegion === 'all' || vm.region === currentRegion;
      const matchesStatus = statusFilter === 'all' || vm.status === statusFilter;
      const matchesSearch = 
        vm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vm.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vm.os.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesRegion && matchesStatus && matchesSearch;
    });
  }, [currentRegion, statusFilter, searchTerm]);

  const toggleVMSelection = (vmId: string) => {
    const newSelected = new Set(selectedVMs);
    if (newSelected.has(vmId)) {
      newSelected.delete(vmId);
    } else {
      newSelected.add(vmId);
    }
    setSelectedVMs(newSelected);
  };

  const toggleAllSelection = () => {
    if (selectedVMs.size === filteredVMs.length) {
      setSelectedVMs(new Set());
    } else {
      setSelectedVMs(new Set(filteredVMs.map(vm => vm.id)));
    }
  };

  const statusCounts = useMemo(() => ({
    all: vms.length,
    running: vms.filter(vm => vm.status === 'running').length,
    stopped: vms.filter(vm => vm.status === 'stopped').length,
    error: vms.filter(vm => vm.status === 'error').length,
    provisioning: vms.filter(vm => vm.status === 'provisioning').length,
  }), []);

  return (
    <div className="bg-[#f2f3f3] min-h-[calc(100vh-84px)]">
      {/* Breadcrumb & Actions Header */}
      <div className="bg-white border-b border-[#d5dbdb]">
        <div className="px-6 py-3 flex items-center text-sm text-[#545b64]">
          <span className="hover:text-[#0073bb] cursor-pointer">Services</span>
          <span className="mx-2">›</span>
          <span className="hover:text-[#0073bb] cursor-pointer">Compute</span>
          <span className="mx-2">›</span>
          <span className="text-[#16191f] font-medium">Virtual Machines</span>
        </div>
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-normal text-[#16191f]">Virtual Machines</h1>
            <p className="text-sm text-[#545b64] mt-1">
              Manage your virtual machines across all SDDCs
            </p>
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm transition-colors flex items-center">
              <Box className="w-4 h-4 mr-2" />
              Launch Instance
            </button>
            <button className="px-3 py-2 border border-[#d5dbdb] hover:bg-[#f2f3f3] text-[#545b64] rounded-sm">
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Status Filter Tabs */}
        <div className="bg-white border border-[#d5dbdb] rounded-t-sm">
          <div className="flex border-b border-[#d5dbdb]">
            {(['all', 'running', 'stopped', 'error', 'provisioning'] as StatusFilter[]).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === status
                    ? 'border-[#ff9900] text-[#16191f]'
                    : 'border-transparent text-[#545b64] hover:text-[#16191f]'
                }`}
              >
                {status === 'all' ? 'All instances' : `${status.charAt(0).toUpperCase() + status.slice(1)}`}
                <span className="ml-2 px-2 py-0.5 bg-[#f2f3f3] rounded text-xs text-[#545b64]">
                  {statusCounts[status]}
                </span>
              </button>
            ))}
          </div>

          {/* Toolbar */}
          <div className="px-4 py-3 border-b border-[#d5dbdb] flex items-center justify-between bg-[#fafafa]">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#aab7b8]" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or OS"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-1.5 border border-[#d5dbdb] rounded-sm text-sm w-64 focus:outline-none focus:border-[#0073bb]"
                />
              </div>
              <button className="px-3 py-1.5 border border-[#d5dbdb] hover:bg-white text-[#545b64] text-sm rounded-sm flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filter
                <ChevronDown className="w-3 h-3 ml-2" />
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-[#545b64]">{selectedVMs.size} selected</span>
              <button 
                className={`px-3 py-1.5 border rounded-sm text-sm flex items-center ${
                  selectedVMs.size > 0 
                    ? 'border-[#d5dbdb] hover:bg-white text-[#545b64]' 
                    : 'border-[#eaeded] text-[#aab7b8] cursor-not-allowed'
                }`}
                disabled={selectedVMs.size === 0}
              >
                <Play className="w-4 h-4 mr-2" />
                Start
              </button>
              <button 
                className={`px-3 py-1.5 border rounded-sm text-sm flex items-center ${
                  selectedVMs.size > 0 
                    ? 'border-[#d5dbdb] hover:bg-white text-[#545b64]' 
                    : 'border-[#eaeded] text-[#aab7b8] cursor-not-allowed'
                }`}
                disabled={selectedVMs.size === 0}
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </button>
              <button 
                className={`px-3 py-1.5 border rounded-sm text-sm flex items-center ${
                  selectedVMs.size > 0 
                    ? 'border-red-300 hover:bg-red-50 text-red-600' 
                    : 'border-[#eaeded] text-[#aab7b8] cursor-not-allowed'
                }`}
                disabled={selectedVMs.size === 0}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Terminate
              </button>
              <button className="px-3 py-1.5 border border-[#d5dbdb] hover:bg-white text-[#545b64] rounded-sm">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* VM Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                  <th className="w-12 px-4 py-3 border-r border-[#d5dbdb]">
                    <input
                      type="checkbox"
                      checked={selectedVMs.size === filteredVMs.length && filteredVMs.length > 0}
                      onChange={toggleAllSelection}
                      className="rounded border-[#d5dbdb]"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium border-r border-[#d5dbdb]">Name</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium border-r border-[#d5dbdb]">Instance ID</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium border-r border-[#d5dbdb]">Status</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium border-r border-[#d5dbdb]">Region / SDDC</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium border-r border-[#d5dbdb]">OS</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium border-r border-[#d5dbdb]">vCPU / Memory</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium border-r border-[#d5dbdb]">Private IP</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium">Public IP</th>
                </tr>
              </thead>
              <tbody>
                {filteredVMs.map((vm) => (
                  <tr 
                    key={vm.id} 
                    className={`border-b border-[#eaeded] hover:bg-[#f2f3f3] ${
                      selectedVMs.has(vm.id) ? 'bg-[#fff4e6]' : ''
                    }`}
                  >
                    <td className="px-4 py-3 border-r border-[#eaeded]">
                      <input
                        type="checkbox"
                        checked={selectedVMs.has(vm.id)}
                        onChange={() => toggleVMSelection(vm.id)}
                        className="rounded border-[#d5dbdb]"
                      />
                    </td>
                    <td className="px-4 py-3 border-r border-[#eaeded]">
                      <div className="flex items-center">
                        <span className="text-[#0073bb] hover:underline cursor-pointer font-medium">
                          {vm.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 border-r border-[#eaeded] font-mono text-xs text-[#545b64]">
                      {vm.id}
                    </td>
                    <td className="px-4 py-3 border-r border-[#eaeded]">
                      <StatusBadge status={vm.status} />
                    </td>
                    <td className="px-4 py-3 border-r border-[#eaeded]">
                      <div className="text-[#16191f]">{vm.region}</div>
                      <div className="text-xs text-[#545b64]">{vm.sddc}</div>
                    </td>
                    <td className="px-4 py-3 border-r border-[#eaeded] text-[#16191f]">
                      {vm.os}
                    </td>
                    <td className="px-4 py-3 border-r border-[#eaeded] text-[#16191f]">
                      {vm.cpu} vCPU / {vm.memory} GB
                    </td>
                    <td className="px-4 py-3 border-r border-[#eaeded] font-mono text-xs text-[#545b64]">
                      {vm.privateIp}
                    </td>
                    <td className="px-4 py-3">
                      {vm.publicIp ? (
                        <span className="font-mono text-xs text-[#545b64]">{vm.publicIp}</span>
                      ) : (
                        <span className="text-[#aab7b8] text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-[#d5dbdb] flex items-center justify-between bg-[#fafafa]">
            <div className="text-sm text-[#545b64]">
              Showing {filteredVMs.length} of {vms.length} instances
            </div>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 border border-[#d5dbdb] hover:bg-white text-[#545b64] text-sm rounded-sm disabled:opacity-50" disabled>
                Previous
              </button>
              <button className="px-3 py-1 border border-[#d5dbdb] hover:bg-white text-[#545b64] text-sm rounded-sm disabled:opacity-50" disabled>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
