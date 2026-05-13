'use client';

import { useState, useMemo } from 'react';
import {
  HardDrive, Database, Plus, Search, Filter,
  ChevronRight, Home, MoreHorizontal, CheckCircle2, AlertCircle,
  X, RefreshCw, Download, Trash2, Copy, XCircle, ChevronDown, Link, Unlink
} from 'lucide-react';
import { useResources } from '../context/ResourceContext';
import { useAuth } from '../context/AuthContext';
import { Volume } from '../types';

interface StoragePageProps { currentRegion: string; }

type StorageTab = 'volumes' | 'vsan' | 'snapshots';

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    'in-use': 'bg-green-50 text-green-700 border-green-200',
    available: 'bg-blue-50 text-blue-700 border-blue-200',
    error: 'bg-red-50 text-red-700 border-red-200',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${cfg[status] || cfg.available}`}>
      {status === 'in-use' ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : status === 'error' ? <XCircle className="w-3.5 h-3.5 mr-1" /> : <AlertCircle className="w-3.5 h-3.5 mr-1" />}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

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

// ── Create Volume Modal ──────────────────────────────────────────────────────
function CreateVolumeModal({ onClose, onCreate, currentRegion }: {
  onClose: () => void;
  onCreate: (vol: Omit<Volume, 'id'>) => void;
  currentRegion: string;
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Volume['type']>('vSAN');
  const [size, setSize] = useState(20);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) { setError('Volume name is required.'); return; }
    if (size < 1) { setError('Size must be at least 1 GiB.'); return; }
    onCreate({ name: name.trim(), type, size, region: currentRegion, status: 'available' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
          <h2 className="text-lg font-medium text-[#16191f]">Create volume</h2>
          <button onClick={onClose} className="text-[#545b64] hover:text-[#16191f]"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#16191f] mb-1.5">Volume name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. my-data-volume"
              className="w-full px-3 py-2 border border-[#aab7b8] rounded text-sm focus:outline-none focus:border-[#ff9900] focus:ring-1 focus:ring-[#ff9900]"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#16191f] mb-1.5">Volume type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as Volume['type'])}
                className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm bg-white focus:outline-none focus:border-[#ff9900]"
              >
                <option value="vSAN">vSAN (recommended)</option>
                <option value="NFS">NFS</option>
                <option value="vVOL">vVOL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#16191f] mb-1.5">Size (GiB)</label>
              <input
                type="number"
                value={size}
                onChange={e => setSize(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                max={16384}
                className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#16191f] mb-1.5">Region</label>
            <input value={currentRegion} readOnly className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm bg-[#f2f3f3] text-[#545b64]" />
          </div>
          {error && (
            <p className="text-red-500 text-sm flex items-center"><XCircle className="w-4 h-4 mr-1.5" />{error}</p>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[#eaeded] bg-[#fafafa] flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] text-[#545b64]">Cancel</button>
          <button onClick={handleSubmit} className="px-5 py-2 text-sm bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] font-medium rounded">
            Create volume
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function StoragePage({ currentRegion }: StoragePageProps) {
  const { volumes, vms, createVolume, deleteVolumes, attachVolume, detachVolume } = useResources();
  const { user } = useAuth();
  const canEdit = user?.role !== 'readonly';

  const [activeTab, setActiveTab] = useState<StorageTab>('volumes');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVols, setSelectedVols] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [attachTarget, setAttachTarget] = useState<string | null>(null);
  const [attachVmId, setAttachVmId] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredVols = useMemo(() => volumes.filter(v =>
    (currentRegion === 'all' || v.region === currentRegion) &&
    (v.name.toLowerCase().includes(searchTerm.toLowerCase()) || v.id.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [volumes, currentRegion, searchTerm]);

  const toggleVol = (id: string) => setSelectedVols(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll = () => setSelectedVols(prev => prev.size === filteredVols.length ? new Set() : new Set(filteredVols.map(v => v.id)));

  const handleDelete = () => {
    const ids = [...selectedVols];
    deleteVolumes(ids);
    setSelectedVols(new Set());
    setIsActionsOpen(false);
    showToast(`Deleted ${ids.length} volume${ids.length > 1 ? 's' : ''}`);
  };

  const handleDetach = () => {
    const ids = [...selectedVols].filter(id => volumes.find(v => v.id === id)?.attachedTo);
    ids.forEach(id => detachVolume(id));
    setIsActionsOpen(false);
    showToast(`Detached ${ids.length} volume${ids.length > 1 ? 's' : ''}`);
  };

  const handleAttachSubmit = () => {
    if (attachTarget && attachVmId) {
      attachVolume(attachTarget, attachVmId);
      setAttachTarget(null);
      setAttachVmId('');
      showToast('Volume attached successfully');
    }
  };

  const totalSize = filteredVols.reduce((sum, v) => sum + v.size, 0);
  const inUseCount = filteredVols.filter(v => v.status === 'in-use').length;

  const tabs: { id: StorageTab; label: string; count: number }[] = [
    { id: 'volumes', label: 'Volumes', count: filteredVols.length },
    { id: 'vsan', label: 'vSAN Clusters', count: 4 },
    { id: 'snapshots', label: 'Snapshots', count: 3 },
  ];

  return (
    <div className="p-6 bg-[#f2f3f3] min-h-[calc(100vh-84px)] relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-5 py-3 rounded shadow-lg text-white text-sm flex items-center space-x-2 ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
      )}

      <Breadcrumb items={[{ label: 'Services' }, { label: 'Storage' }, { label: 'Volumes' }]} />

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-[#16191f]">Storage</h1>
          <p className="text-sm text-[#545b64] mt-0.5">Manage volumes, vSAN clusters, and snapshots</p>
        </div>
        {canEdit && (
          <button onClick={() => setIsCreateOpen(true)} className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm flex items-center transition-colors">
            <Plus className="w-4 h-4 mr-2" /> Create volume
          </button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Total volumes', value: filteredVols.length, sub: `${inUseCount} in-use`, icon: <Database className="w-5 h-5 text-[#545b64]" /> },
          { label: 'Total capacity', value: `${totalSize.toLocaleString()} GiB`, sub: 'across all types', icon: <HardDrive className="w-5 h-5 text-[#545b64]" /> },
          { label: 'Available', value: filteredVols.filter(v => v.status === 'available').length, sub: 'not attached', icon: <CheckCircle2 className="w-5 h-5 text-green-500" /> },
        ].map(card => (
          <div key={card.label} className="bg-white border border-[#d5dbdb] rounded-sm p-4 flex items-start space-x-3">
            <div className="p-2 bg-[#f2f3f3] rounded">{card.icon}</div>
            <div>
              <p className="text-xs text-[#545b64] uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-light text-[#16191f] mt-1">{card.value}</p>
              <p className="text-xs text-[#545b64]">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#d5dbdb] rounded-t-sm border-b-0">
        <div className="flex border-b border-[#d5dbdb]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id ? 'border-[#ff9900] text-[#16191f]' : 'border-transparent text-[#545b64] hover:text-[#16191f]'}`}
            >
              {tab.label}
              <span className="ml-2 px-1.5 py-0.5 bg-[#f2f3f3] rounded text-xs text-[#545b64]">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#d5dbdb] bg-[#fafafa]">
          <div className="flex items-center space-x-3">
            {canEdit && (
              <div className="relative">
                <button
                  disabled={selectedVols.size === 0}
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  className={`px-3 py-1.5 text-sm border rounded flex items-center ${selectedVols.size === 0 ? 'border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed' : 'border-[#d5dbdb] text-[#16191f] hover:bg-[#f2f3f3]'}`}
                >
                  Actions <ChevronDown className="w-3.5 h-3.5 ml-2" />
                </button>
                {isActionsOpen && selectedVols.size > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-[#d5dbdb] rounded shadow-lg z-20">
                    <button
                      onClick={() => {
                        setAttachTarget([...selectedVols][0]);
                        setIsActionsOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[#f2f3f3] flex items-center"
                    >
                      <Link className="w-4 h-4 mr-3 text-[#0073bb]" /> Attach volume
                    </button>
                    <button onClick={handleDetach} className="w-full text-left px-4 py-2 text-sm hover:bg-[#f2f3f3] flex items-center">
                      <Unlink className="w-4 h-4 mr-3 text-[#545b64]" /> Detach volume
                    </button>
                    <div className="border-t border-[#eaeded]" />
                    <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center">
                      <Trash2 className="w-4 h-4 mr-3" /> Delete volume
                    </button>
                  </div>
                )}
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aab7b8]" />
              <input
                type="text"
                placeholder="Search volumes"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 w-64 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
              />
            </div>
            <button className="px-3 py-1.5 text-sm border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] flex items-center text-[#545b64]">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-1.5 text-[#545b64] hover:bg-[#f2f3f3] rounded"><RefreshCw className="w-4 h-4" /></button>
            <button className="px-3 py-1.5 text-sm border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] flex items-center text-[#545b64]">
              <Download className="w-4 h-4 mr-2" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {activeTab === 'volumes' && (
        <div className="bg-white border border-[#d5dbdb] border-t-0 rounded-b overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={selectedVols.size === filteredVols.length && filteredVols.length > 0} onChange={toggleAll} className="rounded border-[#d5dbdb] accent-[#ff9900]" />
                </th>
                <th className="text-left px-4 py-3 text-[#545b64] font-medium">Volume ID</th>
                <th className="text-left px-4 py-3 text-[#545b64] font-medium">Name</th>
                <th className="text-left px-4 py-3 text-[#545b64] font-medium">Status</th>
                <th className="text-left px-4 py-3 text-[#545b64] font-medium">Type</th>
                <th className="text-right px-4 py-3 text-[#545b64] font-medium">Size (GiB)</th>
                <th className="text-left px-4 py-3 text-[#545b64] font-medium">Attached to</th>
                <th className="text-left px-4 py-3 text-[#545b64] font-medium">Region</th>
                <th className="text-left px-4 py-3 text-[#545b64] font-medium" />
              </tr>
            </thead>
            <tbody>
              {filteredVols.map(vol => {
                const attachedVM = vol.attachedTo ? vms.find(v => v.id === vol.attachedTo) : null;
                return (
                  <tr key={vol.id} className={`border-b border-[#eaeded] hover:bg-[#f9f9f9] ${selectedVols.has(vol.id) ? 'bg-[#fff8ee]' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedVols.has(vol.id)} onChange={() => toggleVol(vol.id)} className="rounded border-[#d5dbdb] accent-[#ff9900]" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#0073bb]">{vol.id}</td>
                    <td className="px-4 py-3 font-medium text-[#16191f]">{vol.name}</td>
                    <td className="px-4 py-3"><StatusBadge status={vol.status} /></td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-[#f2f3f3] rounded text-xs text-[#545b64] border border-[#d5dbdb]">{vol.type}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#16191f]">{vol.size.toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {attachedVM ? (
                        <span className="text-[#0073bb] text-xs font-mono">{attachedVM.name}</span>
                      ) : (
                        <span className="text-[#aab7b8] text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#545b64] text-xs">{vol.region}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        {canEdit && (
                          <>
                            {vol.status === 'available' ? (
                              <button
                                onClick={() => { setAttachTarget(vol.id); setAttachVmId(''); }}
                                className="px-2 py-1 text-xs border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] text-[#0073bb] flex items-center"
                              >
                                <Link className="w-3 h-3 mr-1" /> Attach
                              </button>
                            ) : (
                              <button
                                onClick={() => { detachVolume(vol.id); showToast('Volume detached'); }}
                                className="px-2 py-1 text-xs border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] text-[#545b64] flex items-center"
                              >
                                <Unlink className="w-3 h-3 mr-1" /> Detach
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => { navigator.clipboard?.writeText(vol.id); showToast('Volume ID copied'); }}
                          className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredVols.length === 0 && (
            <div className="py-14 text-center">
              <HardDrive className="w-12 h-12 mx-auto mb-4 text-[#aab7b8]" />
              <p className="text-[#545b64] font-medium mb-1">No volumes found</p>
              <p className="text-sm text-[#aab7b8] mb-4">Create a volume to get started</p>
              {canEdit && (
                <button onClick={() => setIsCreateOpen(true)} className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm">
                  Create volume
                </button>
              )}
            </div>
          )}
          <div className="px-4 py-3 border-t border-[#d5dbdb] bg-[#fafafa] text-sm text-[#545b64] flex justify-between items-center">
            <span>Showing {filteredVols.length} volume{filteredVols.length !== 1 ? 's' : ''}</span>
            <span>{selectedVols.size > 0 ? `${selectedVols.size} selected` : ''}</span>
          </div>
        </div>
      )}

      {activeTab !== 'volumes' && (
        <div className="bg-white border border-[#d5dbdb] border-t-0 rounded-b py-14 text-center">
          <Database className="w-12 h-12 mx-auto mb-4 text-[#aab7b8]" />
          <p className="text-[#545b64] font-medium">{activeTab === 'vsan' ? 'vSAN Clusters' : 'Snapshots'}</p>
          <p className="text-sm text-[#aab7b8] mt-1">Select the Volumes tab to manage storage volumes</p>
        </div>
      )}

      {/* Create Volume Modal */}
      {isCreateOpen && (
        <CreateVolumeModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={vol => { createVolume(vol); showToast(`Volume created successfully`); }}
          currentRegion={currentRegion}
        />
      )}

      {/* Attach Volume Modal */}
      {attachTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <h2 className="text-lg font-medium text-[#16191f]">Attach volume</h2>
              <button onClick={() => setAttachTarget(null)} className="text-[#545b64] hover:text-[#16191f]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#16191f] mb-1">Volume ID</label>
                <input value={attachTarget} readOnly className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm bg-[#f2f3f3] font-mono text-[#545b64]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#16191f] mb-1.5">Instance <span className="text-red-500">*</span></label>
                <select
                  value={attachVmId}
                  onChange={e => setAttachVmId(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm bg-white focus:outline-none focus:border-[#ff9900]"
                >
                  <option value="">Select an instance…</option>
                  {vms.filter(v => v.region === currentRegion || currentRegion === 'all').map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.id})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#eaeded] bg-[#fafafa] flex justify-end space-x-3">
              <button onClick={() => setAttachTarget(null)} className="px-4 py-2 text-sm border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] text-[#545b64]">Cancel</button>
              <button
                onClick={handleAttachSubmit}
                disabled={!attachVmId}
                className="px-5 py-2 text-sm bg-[#ff9900] hover:bg-[#e88a00] disabled:bg-[#ff9900]/50 text-[#232f3e] font-medium rounded"
              >
                Attach volume
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
