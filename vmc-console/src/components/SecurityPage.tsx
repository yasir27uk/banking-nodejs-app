'use client';

import { useState, useMemo } from 'react';
import {
  Shield, Users, Key, ChevronRight, Home, Plus,
  Search, Filter, MoreHorizontal, CheckCircle2, X,
  RefreshCw, Download, Eye, Trash2, Edit3, ChevronDown,
  XCircle, UserCheck, UserX, AlertTriangle
} from 'lucide-react';
import { useResources } from '../context/ResourceContext';
import { useAuth } from '../context/AuthContext';
import { SecurityGroup } from '../types';

interface SecurityPageProps { currentRegion: string; }

type SecurityTab = 'sg' | 'iam' | 'kms';

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

// ── Create Security Group Modal ───────────────────────────────────────────────
function CreateSGModal({ onClose, onCreate, currentRegion }: {
  onClose: () => void;
  onCreate: (sg: Omit<SecurityGroup, 'id'>) => void;
  currentRegion: string;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [vpcs, setVpcs] = useState(1);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) { setError('Security group name is required.'); return; }
    if (!description.trim()) { setError('Description is required.'); return; }
    onCreate({ name: name.trim(), description: description.trim(), region: currentRegion, rules: 0, vpcs });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
          <h2 className="text-lg font-medium text-[#16191f]">Create security group</h2>
          <button onClick={onClose} className="text-[#545b64] hover:text-[#16191f]"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#16191f] mb-1.5">Security group name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. web-tier-sg"
              className="w-full px-3 py-2 border border-[#aab7b8] rounded text-sm focus:outline-none focus:border-[#ff9900] focus:ring-1 focus:ring-[#ff9900]"
            />
            <p className="text-xs text-[#545b64] mt-1">Cannot start with sg-. Use letters, numbers, hyphens only.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#16191f] mb-1.5">Description <span className="text-red-500">*</span></label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of this security group"
              rows={3}
              className="w-full px-3 py-2 border border-[#aab7b8] rounded text-sm focus:outline-none focus:border-[#ff9900] focus:ring-1 focus:ring-[#ff9900] resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#16191f] mb-1.5">VPC / Segments</label>
              <input
                type="number"
                value={vpcs}
                onChange={e => setVpcs(Math.max(1, parseInt(e.target.value) || 1))}
                min={1}
                className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#16191f] mb-1.5">Region</label>
              <input value={currentRegion} readOnly className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm bg-[#f2f3f3] text-[#545b64]" />
            </div>
          </div>
          {error && <p className="text-red-500 text-sm flex items-center"><XCircle className="w-4 h-4 mr-1.5" />{error}</p>}
        </div>
        <div className="px-6 py-4 border-t border-[#eaeded] bg-[#fafafa] flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] text-[#545b64]">Cancel</button>
          <button onClick={handleSubmit} className="px-5 py-2 text-sm bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] font-medium rounded">
            Create security group
          </button>
        </div>
      </div>
    </div>
  );
}

// ── IAM Users (from allUsers in auth) ────────────────────────────────────────
function IAMTab() {
  const { allUsers } = useAuth();
  const [search, setSearch] = useState('');

  const filtered = allUsers.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role: string) => {
    if (role === 'admin') return 'bg-red-100 text-red-700 border-red-200';
    if (role === 'developer') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#d5dbdb] bg-[#fafafa]">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aab7b8]" />
            <input
              type="text"
              placeholder="Search users"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 w-64 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
            />
          </div>
        </div>
        <span className="text-sm text-[#545b64]">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
            <th className="text-left px-4 py-3 text-[#545b64] font-medium">Username</th>
            <th className="text-left px-4 py-3 text-[#545b64] font-medium">Email</th>
            <th className="text-left px-4 py-3 text-[#545b64] font-medium">Role</th>
            <th className="text-left px-4 py-3 text-[#545b64] font-medium">Account ID</th>
            <th className="text-left px-4 py-3 text-[#545b64] font-medium">Member since</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(u => (
            <tr key={u.id} className="border-b border-[#eaeded] hover:bg-[#f9f9f9]">
              <td className="px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 bg-[#ff9900] rounded-full flex items-center justify-center text-[#232f3e] font-bold text-xs">{u.avatar}</div>
                  <span className="text-[#0073bb] font-medium">{u.username}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-[#545b64]">{u.email}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${roleBadge(u.role)}`}>
                  {u.role === 'admin' ? <UserCheck className="w-3.5 h-3.5 mr-1" /> : u.role === 'readonly' ? <UserX className="w-3.5 h-3.5 mr-1" /> : <Users className="w-3.5 h-3.5 mr-1" />}
                  {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                </span>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-[#545b64]">{u.accountId}</td>
              <td className="px-4 py-3 text-[#545b64] text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SecurityPage({ currentRegion }: SecurityPageProps) {
  const { securityGroups, createSecurityGroup, deleteSecurityGroups, updateSecurityGroup } = useResources();
  const { user } = useAuth();
  const canEdit = user?.role !== 'readonly';

  const [activeTab, setActiveTab] = useState<SecurityTab>('sg');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSGs, setSelectedSGs] = useState<Set<string>>(new Set());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [editSG, setEditSG] = useState<SecurityGroup | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredSGs = useMemo(() => securityGroups.filter(sg =>
    (currentRegion === 'all' || sg.region === currentRegion) &&
    (sg.name.toLowerCase().includes(searchTerm.toLowerCase()) || sg.id.toLowerCase().includes(searchTerm.toLowerCase()) || sg.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [securityGroups, currentRegion, searchTerm]);

  const toggleSG = (id: string) => setSelectedSGs(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll = () => setSelectedSGs(prev => prev.size === filteredSGs.length ? new Set() : new Set(filteredSGs.map(sg => sg.id)));

  const handleDelete = () => {
    const ids = [...selectedSGs];
    deleteSecurityGroups(ids);
    setSelectedSGs(new Set());
    setIsActionsOpen(false);
    showToast(`Deleted ${ids.length} security group${ids.length > 1 ? 's' : ''}`, 'error');
  };

  const tabs = [
    { id: 'sg' as SecurityTab, label: 'Security Groups', count: filteredSGs.length, icon: <Shield className="w-4 h-4" /> },
    { id: 'iam' as SecurityTab, label: 'IAM Users', count: null, icon: <Users className="w-4 h-4" /> },
    { id: 'kms' as SecurityTab, label: 'Encryption Keys', count: 3, icon: <Key className="w-4 h-4" /> },
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

      <Breadcrumb items={[{ label: 'Services' }, { label: 'Security & Identity' }]} />

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-[#16191f]">Security &amp; Identity</h1>
          <p className="text-sm text-[#545b64] mt-0.5">Manage security groups, IAM users, and encryption keys</p>
        </div>
        {canEdit && activeTab === 'sg' && (
          <button onClick={() => setIsCreateOpen(true)} className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm flex items-center transition-colors">
            <Plus className="w-4 h-4 mr-2" /> Create security group
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-[#d5dbdb] rounded-t-sm border-b-0">
        <div className="flex border-b border-[#d5dbdb]">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedSGs(new Set()); }}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${activeTab === tab.id ? 'border-[#ff9900] text-[#16191f]' : 'border-transparent text-[#545b64] hover:text-[#16191f]'}`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span className="px-1.5 py-0.5 bg-[#f2f3f3] rounded text-xs text-[#545b64]">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'sg' && (
          <>
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#d5dbdb] bg-[#fafafa]">
              <div className="flex items-center space-x-3">
                {canEdit && (
                  <div className="relative">
                    <button
                      disabled={selectedSGs.size === 0}
                      onClick={() => setIsActionsOpen(!isActionsOpen)}
                      className={`px-3 py-1.5 text-sm border rounded flex items-center ${selectedSGs.size === 0 ? 'border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed' : 'border-[#d5dbdb] text-[#16191f] hover:bg-[#f2f3f3]'}`}
                    >
                      Actions <ChevronDown className="w-3.5 h-3.5 ml-2" />
                    </button>
                    {isActionsOpen && selectedSGs.size > 0 && (
                      <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-[#d5dbdb] rounded shadow-lg z-20">
                        <button
                          onClick={() => { const sg = securityGroups.find(s => s.id === [...selectedSGs][0]); if (sg) setEditSG(sg); setIsActionsOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-[#f2f3f3] flex items-center"
                        >
                          <Edit3 className="w-4 h-4 mr-3 text-[#545b64]" /> Edit rules
                        </button>
                        <div className="border-t border-[#eaeded]" />
                        <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center">
                          <Trash2 className="w-4 h-4 mr-3" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aab7b8]" />
                  <input
                    type="text"
                    placeholder="Search security groups"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-1.5 w-72 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
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

            {/* Table */}
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                  <th className="px-4 py-3 w-10">
                    <input type="checkbox" checked={selectedSGs.size === filteredSGs.length && filteredSGs.length > 0} onChange={toggleAll} className="rounded border-[#d5dbdb] accent-[#ff9900]" />
                  </th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium">Security group ID</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium">Description</th>
                  <th className="text-right px-4 py-3 text-[#545b64] font-medium">Rules</th>
                  <th className="text-right px-4 py-3 text-[#545b64] font-medium">VPCs</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium">Region</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium" />
                </tr>
              </thead>
              <tbody>
                {filteredSGs.map(sg => (
                  <tr key={sg.id} className={`border-b border-[#eaeded] hover:bg-[#f9f9f9] ${selectedSGs.has(sg.id) ? 'bg-[#fff8ee]' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedSGs.has(sg.id)} onChange={() => toggleSG(sg.id)} className="rounded border-[#d5dbdb] accent-[#ff9900]" />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#0073bb]">{sg.id}</td>
                    <td className="px-4 py-3 font-medium text-[#16191f]">{sg.name}</td>
                    <td className="px-4 py-3 text-[#545b64] max-w-xs truncate">{sg.description}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-0.5 bg-[#f2f3f3] border border-[#d5dbdb] rounded text-xs text-[#16191f]">{sg.rules}</span>
                    </td>
                    <td className="px-4 py-3 text-right text-[#16191f]">{sg.vpcs}</td>
                    <td className="px-4 py-3 text-[#545b64] text-xs">{sg.region}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-1">
                        {canEdit && (
                          <button onClick={() => setEditSG(sg)} className="px-2 py-1 text-xs border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] text-[#0073bb] flex items-center">
                            <Edit3 className="w-3 h-3 mr-1" /> Edit rules
                          </button>
                        )}
                        <button className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]"><Eye className="w-4 h-4" /></button>
                        <button className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]"><MoreHorizontal className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredSGs.length === 0 && (
              <div className="py-14 text-center">
                <Shield className="w-12 h-12 mx-auto mb-4 text-[#aab7b8]" />
                <p className="text-[#545b64] font-medium mb-1">No security groups found</p>
                {canEdit && (
                  <button onClick={() => setIsCreateOpen(true)} className="mt-3 px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm">
                    Create security group
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {activeTab === 'iam' && <IAMTab />}

        {activeTab === 'kms' && (
          <div className="py-14 text-center">
            <Key className="w-12 h-12 mx-auto mb-4 text-[#aab7b8]" />
            <p className="text-[#545b64] font-medium">Encryption Keys (KMS)</p>
            <p className="text-sm text-[#aab7b8] mt-1">3 customer managed keys active</p>
          </div>
        )}
      </div>
      {activeTab === 'sg' && filteredSGs.length > 0 && (
        <div className="bg-white border border-[#d5dbdb] border-t-0 rounded-b px-4 py-3 text-sm text-[#545b64] flex justify-between items-center">
          <span>Showing {filteredSGs.length} security group{filteredSGs.length !== 1 ? 's' : ''}</span>
          <span>{selectedSGs.size > 0 ? `${selectedSGs.size} selected` : ''}</span>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <CreateSGModal
          onClose={() => setIsCreateOpen(false)}
          onCreate={sg => { createSecurityGroup(sg); showToast('Security group created successfully'); }}
          currentRegion={currentRegion}
        />
      )}

      {/* Edit Rules Modal */}
      {editSG && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-[#16191f]">Edit inbound rules</h2>
                <p className="text-xs font-mono text-[#545b64]">{editSG.id} — {editSG.name}</p>
              </div>
              <button onClick={() => setEditSG(null)} className="text-[#545b64] hover:text-[#16191f]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6">
              <div className="bg-[#fff8ee] border border-[#ff9900]/30 rounded p-3 mb-4 text-sm text-[#545b64] flex items-start">
                <AlertTriangle className="w-4 h-4 text-[#ff9900] mr-2 flex-shrink-0 mt-0.5" />
                Security group currently has <strong className="mx-1">{editSG.rules}</strong> inbound rules across <strong className="mx-1">{editSG.vpcs}</strong> VPC segment(s).
              </div>
              <div className="space-y-3">
                {['HTTP (port 80)', 'HTTPS (port 443)', 'SSH (port 22)'].slice(0, editSG.rules > 0 ? Math.min(editSG.rules, 3) : 1).map((rule, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border border-[#d5dbdb] rounded bg-[#fafafa]">
                    <select className="px-2 py-1 border border-[#d5dbdb] rounded text-sm bg-white">
                      <option>TCP</option><option>UDP</option><option>ICMP</option><option>All traffic</option>
                    </select>
                    <input defaultValue={rule.match(/\d+/)?.[0] || '80'} className="w-24 px-2 py-1 border border-[#d5dbdb] rounded text-sm" placeholder="Port" />
                    <input defaultValue="0.0.0.0/0" className="flex-1 px-2 py-1 border border-[#d5dbdb] rounded text-sm font-mono" placeholder="CIDR" />
                    <input defaultValue={rule.split(' (')[0]} className="flex-1 px-2 py-1 border border-[#d5dbdb] rounded text-sm" placeholder="Description" />
                    <button className="text-red-500 hover:text-red-700"><X className="w-4 h-4" /></button>
                  </div>
                ))}
                <button className="text-sm text-[#0073bb] hover:underline flex items-center">
                  <Plus className="w-4 h-4 mr-1" /> Add rule
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#eaeded] bg-[#fafafa] flex justify-end space-x-3">
              <button onClick={() => setEditSG(null)} className="px-4 py-2 text-sm border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] text-[#545b64]">Cancel</button>
              <button
                onClick={() => {
                  updateSecurityGroup(editSG.id, { rules: editSG.rules + 1 });
                  setEditSG(null);
                  showToast('Security group rules updated');
                }}
                className="px-5 py-2 text-sm bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] font-medium rounded"
              >
                Save rules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
