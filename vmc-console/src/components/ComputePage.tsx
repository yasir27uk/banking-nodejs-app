'use client';

import { useState, useMemo } from 'react';
import {
  Search, Filter, RefreshCw, Play, Square, Trash2, MoreHorizontal,
  ChevronDown, Box, Plus, Download, Copy, Power, RotateCw,
  CheckCircle2, XCircle, Clock, ChevronRight, Home, X, Eye, AlertTriangle,
  Terminal, Tag, Cpu, HardDrive, Wifi, Shield,
} from 'lucide-react';
import { regions } from '../data/mockData';
import { useResources } from '../context/ResourceContext';
import { useAuth } from '../context/AuthContext';
import { useImages } from '../context/ImageContext';
import { VM } from '../types';

interface ComputePageProps { currentRegion: string; }

type StatusFilter = 'all' | 'running' | 'stopped' | 'error' | 'provisioning';

const OS_IMAGES = [
  { id: 'ubuntu-22', label: 'Ubuntu 22.04 LTS', icon: '🐧', desc: 'Free tier eligible' },
  { id: 'rhel-9', label: 'RHEL 9', icon: '🎩', desc: 'Enterprise Linux' },
  { id: 'centos-8', label: 'CentOS 8', icon: '🐧', desc: 'Community Enterprise OS' },
  { id: 'windows-2022', label: 'Windows Server 2022', icon: '🪟', desc: 'Microsoft Windows' },
  { id: 'photon', label: 'VMware Photon OS', icon: '⚡', desc: 'Optimized for VMware' },
  { id: 'suse', label: 'SUSE Linux Enterprise', icon: '🦎', desc: 'SUSE Enterprise Linux' },
];

const INSTANCE_TYPES = [
  { id: 't3.micro', label: 't3.micro', cpu: 2, memory: 1, desc: 'Free tier eligible' },
  { id: 't3.small', label: 't3.small', cpu: 2, memory: 2, desc: 'Low-traffic apps' },
  { id: 'm5.large', label: 'm5.large', cpu: 2, memory: 8, desc: 'General purpose' },
  { id: 'm5.xlarge', label: 'm5.xlarge', cpu: 4, memory: 16, desc: 'General purpose' },
  { id: 'c5.xlarge', label: 'c5.xlarge', cpu: 4, memory: 8, desc: 'Compute optimized' },
  { id: 'r5.large', label: 'r5.large', cpu: 2, memory: 16, desc: 'Memory optimized' },
  { id: 'r5.xlarge', label: 'r5.xlarge', cpu: 4, memory: 32, desc: 'Memory optimized' },
  { id: 'x1.16xlarge', label: 'x1.16xlarge', cpu: 64, memory: 976, desc: 'High memory' },
];

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; icon: React.ReactNode }> = {
    running: { cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> },
    stopped: { cls: 'bg-gray-50 text-gray-600 border-gray-200', icon: <Square className="w-3.5 h-3.5 mr-1" /> },
    error: { cls: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-3.5 h-3.5 mr-1" /> },
    provisioning: { cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <Clock className="w-3.5 h-3.5 mr-1 animate-pulse" /> },
    terminated: { cls: 'bg-gray-100 text-gray-400 border-gray-200', icon: <AlertTriangle className="w-3.5 h-3.5 mr-1" /> },
  };
  const s = cfg[status] || cfg.stopped;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${s.cls}`}>
      {s.icon}{status.charAt(0).toUpperCase() + status.slice(1)}
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

// ─── Launch Wizard ───────────────────────────────────────────────────────────
function LaunchWizard({ onClose, onLaunch, currentRegion }: { onClose: () => void; onLaunch: (vm: Omit<VM, 'id' | 'launchTime'>) => void; currentRegion: string }) {
  const { imagesForRegion } = useImages();
  const customImages = imagesForRegion(currentRegion);

  const [step, setStep] = useState(1);
  const totalSteps = 5;
  const [name, setName] = useState('');
  const [imageTab, setImageTab] = useState<'my-images' | 'catalog' | 'quick'>('my-images');
  const [selectedOS, setSelectedOS] = useState(OS_IMAGES[0]);
  const [selectedType, setSelectedType] = useState(INSTANCE_TYPES[2]);
  const [storage, setStorage] = useState(20);
  const [selectedSDDC, setSelectedSDDC] = useState('sddc-use1-prod');
  const [keyPair, setKeyPair] = useState('vmc-key-pair');
  const [sgName, setSgName] = useState('launch-wizard-sg');
  const [tags, setTags] = useState<{ key: string; value: string }[]>([{ key: 'Environment', value: 'Production' }]);
  const [error, setError] = useState('');

  const sddc = selectedSDDC;
  const privateIp = `10.${Math.floor(Math.random() * 4)}.${Math.floor(Math.random() * 254) + 1}.${Math.floor(Math.random() * 254) + 1}`;

  const canNext = () => {
    if (step === 1 && !name.trim()) { setError('Instance name is required.'); return false; }
    setError('');
    return true;
  };

  const next = () => { if (canNext()) setStep(s => Math.min(s + 1, totalSteps)); };

  const handleLaunch = () => {
    const tagMap: Record<string, string> = {};
    tags.forEach(t => { if (t.key) tagMap[t.key] = t.value; });
    onLaunch({
      name: name || 'new-instance',
      region: currentRegion,
      status: 'provisioning',
      os: selectedOS.label,
      cpu: selectedType.cpu,
      memory: selectedType.memory,
      storage,
      sddc,
      privateIp,
      tags: tagMap,
    });
    onClose();
  };

  const stepLabels = ['Name & Tags', 'OS Image', 'Instance Type', 'Storage & Network', 'Review'];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-[#16191f]">Launch an instance</h2>
            <p className="text-xs text-[#545b64] mt-0.5">Step {step} of {totalSteps}: {stepLabels[step - 1]}</p>
          </div>
          <button onClick={onClose} className="text-[#545b64] hover:text-[#16191f] p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 bg-[#fafafa] border-b border-[#eaeded]">
          <div className="flex items-center space-x-1">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${i + 1 < step ? 'bg-green-500 text-white' : i + 1 === step ? 'bg-[#ff9900] text-white' : 'bg-[#d5dbdb] text-[#545b64]'}`}>
                    {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 whitespace-nowrap ${i + 1 === step ? 'text-[#ff9900] font-medium' : 'text-[#545b64]'}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 ${i + 1 < step ? 'bg-green-500' : 'bg-[#d5dbdb]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-[#16191f] mb-1.5">Instance name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. web-server-prod"
                  className="w-full px-3 py-2 border border-[#aab7b8] rounded text-sm focus:outline-none focus:border-[#ff9900] focus:ring-1 focus:ring-[#ff9900]"
                />
                {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#16191f] mb-1.5">Tags</label>
                <div className="space-y-2">
                  {tags.map((tag, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Key"
                        value={tag.key}
                        onChange={e => setTags(prev => prev.map((t, j) => j === i ? { ...t, key: e.target.value } : t))}
                        className="flex-1 px-3 py-1.5 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={tag.value}
                        onChange={e => setTags(prev => prev.map((t, j) => j === i ? { ...t, value: e.target.value } : t))}
                        className="flex-1 px-3 py-1.5 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
                      />
                      <button onClick={() => setTags(prev => prev.filter((_, j) => j !== i))} className="text-[#545b64] hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => setTags(prev => [...prev, { key: '', value: '' }])}
                    className="text-sm text-[#0073bb] hover:underline flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Add tag
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-sm text-[#545b64] mb-3">
                Choose a base image (VMI) for your instance. Select from your custom-built images or the VMware catalog.
              </p>

              {/* Image source tabs */}
              <div className="flex space-x-1 border-b border-[#d5dbdb] mb-4">
                {[
                  { id: 'my-images' as const, label: 'My Images', count: customImages.length },
                  { id: 'catalog'   as const, label: 'VMware Catalog', count: null },
                  { id: 'quick'     as const, label: 'Quick Launch', count: null },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setImageTab(tab.id)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      imageTab === tab.id
                        ? 'border-[#ff9900] text-[#16191f]'
                        : 'border-transparent text-[#545b64] hover:text-[#16191f]'
                    }`}
                  >
                    {tab.label}
                    {tab.count !== null && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-[#eaeded] rounded">{tab.count}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* My Images — custom-built from Content Library */}
              {imageTab === 'my-images' && (
                customImages.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-[#d5dbdb] rounded">
                    <p className="text-sm text-[#545b64] mb-2">No custom images available in <span className="font-mono">{currentRegion}</span></p>
                    <p className="text-xs text-[#aab7b8]">Go to Content Library → Build Image to create one, then select it here.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customImages.map(img => {
                      const icon = img.osFamily === 'windows' ? '🪟' : img.osFamily === 'other' ? '📦' : '🐧';
                      const isSelected = selectedOS.id === img.id;
                      return (
                        <button
                          key={img.id}
                          onClick={() => {
                            setSelectedOS({ id: img.id, label: img.name, icon, desc: img.os });
                            // Pre-fill instance type defaults from image spec
                            const match = INSTANCE_TYPES.find(t => t.cpu >= img.cpu && t.memory >= img.memory);
                            if (match) setSelectedType(match);
                          }}
                          className={`w-full p-3 border rounded text-left transition-all ${isSelected ? 'border-[#ff9900] bg-[#fff8ee] ring-1 ring-[#ff9900]' : 'border-[#d5dbdb] hover:border-[#ff9900]'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="text-xl">{icon}</span>
                              <div>
                                <p className="text-sm font-medium text-[#16191f] font-mono">{img.name}</p>
                                <p className="text-xs text-[#545b64]">{img.os} · {img.cpu}vCPU · {img.memory}GB · {img.diskGB}GB</p>
                                <p className="text-xs text-[#aab7b8]">{img.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">Custom Built</span>
                              {isSelected && <Check className="w-5 h-5 text-[#ff9900]" />}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )
              )}

              {/* VMware Catalog */}
              {imageTab === 'catalog' && (
                <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
                  {[
                    { id: 'ubuntu-22-cat', label: 'Ubuntu 22.04 LTS', icon: '🐧', desc: 'VMware Official · LTS' },
                    { id: 'ubuntu-24-cat', label: 'Ubuntu 24.04 LTS', icon: '🐧', desc: 'VMware Official · Latest' },
                    { id: 'rhel-9-cat',    label: 'RHEL 9.2',          icon: '🎩', desc: 'VMware Official · Enterprise' },
                    { id: 'centos-9-cat',  label: 'CentOS Stream 9',   icon: '🐧', desc: 'VMware Official · Community' },
                    { id: 'win-2022-cat',  label: 'Windows Server 2022', icon: '🪟', desc: 'VMware Official · LTSC' },
                    { id: 'win-2019-cat',  label: 'Windows Server 2019', icon: '🪟', desc: 'VMware Official · LTSC' },
                    { id: 'photon-5-cat',  label: 'Photon OS 5.0',      icon: '⚡', desc: 'VMware Official · Container-optimized' },
                    { id: 'debian-12-cat', label: 'Debian 12 (Bookworm)', icon: '🐧', desc: 'VMware Official · Stable' },
                    { id: 'sles-15-cat',   label: 'SLES 15 SP5',        icon: '🦎', desc: 'VMware Official · Enterprise' },
                  ].map(img => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedOS(img)}
                      className={`p-3 border rounded text-left transition-all ${selectedOS.id === img.id ? 'border-[#ff9900] bg-[#fff8ee] ring-1 ring-[#ff9900]' : 'border-[#d5dbdb] hover:border-[#ff9900]'}`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{img.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#16191f] truncate">{img.label}</p>
                          <p className="text-xs text-[#545b64] truncate">{img.desc}</p>
                        </div>
                        {selectedOS.id === img.id && <Check className="w-4 h-4 text-[#ff9900] flex-shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Quick Launch */}
              {imageTab === 'quick' && (
                <div className="grid grid-cols-2 gap-3">
                  {OS_IMAGES.map(img => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedOS(img)}
                      className={`p-4 border rounded-lg text-left transition-all ${selectedOS.id === img.id ? 'border-[#ff9900] bg-[#fff8ee] ring-1 ring-[#ff9900]' : 'border-[#d5dbdb] hover:border-[#ff9900]'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{img.icon}</span>
                        <div>
                          <p className="text-sm font-medium text-[#16191f]">{img.label}</p>
                          <p className="text-xs text-[#545b64]">{img.desc}</p>
                        </div>
                        {selectedOS.id === img.id && <Check className="w-5 h-5 text-[#ff9900] ml-auto" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="text-sm text-[#545b64] mb-4">Select the hardware configuration for your instance.</p>
              <div className="border border-[#d5dbdb] rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                      <th className="w-10 px-3 py-2" />
                      <th className="text-left px-3 py-2 text-[#545b64] font-medium">Instance type</th>
                      <th className="text-right px-3 py-2 text-[#545b64] font-medium">vCPUs</th>
                      <th className="text-right px-3 py-2 text-[#545b64] font-medium">Memory (GiB)</th>
                      <th className="text-left px-3 py-2 text-[#545b64] font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {INSTANCE_TYPES.map(t => (
                      <tr
                        key={t.id}
                        onClick={() => setSelectedType(t)}
                        className={`border-b border-[#eaeded] cursor-pointer ${selectedType.id === t.id ? 'bg-[#fff8ee]' : 'hover:bg-[#f2f3f3]'}`}
                      >
                        <td className="px-3 py-2.5">
                          <input type="radio" checked={selectedType.id === t.id} onChange={() => setSelectedType(t)} className="accent-[#ff9900]" />
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs text-[#0073bb]">{t.label}</td>
                        <td className="px-3 py-2.5 text-right">{t.cpu}</td>
                        <td className="px-3 py-2.5 text-right">{t.memory}</td>
                        <td className="px-3 py-2.5 text-[#545b64] text-xs">{t.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-[#16191f] mb-3 flex items-center"><HardDrive className="w-4 h-4 mr-2" />Storage</h3>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="block text-xs text-[#545b64] mb-1">Root volume size (GiB)</label>
                    <input
                      type="number"
                      value={storage}
                      onChange={e => setStorage(Math.max(8, parseInt(e.target.value) || 8))}
                      min={8}
                      max={16384}
                      className="w-32 px-3 py-2 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-[#545b64] mb-1">Volume type</label>
                    <select className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm bg-white focus:outline-none">
                      <option>vSAN (recommended)</option>
                      <option>NFS</option>
                      <option>vVOL</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#16191f] mb-3 flex items-center"><Wifi className="w-4 h-4 mr-2" />Network Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#545b64] mb-1">SDDC</label>
                    <select value={selectedSDDC} onChange={e => setSelectedSDDC(e.target.value)} className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm bg-white focus:outline-none focus:border-[#ff9900]">
                      <option value="sddc-use1-prod">sddc-use1-prod (US East)</option>
                      <option value="sddc-use1-dev">sddc-use1-dev (US East)</option>
                      <option value="sddc-usw2-prod">sddc-usw2-prod (US West)</option>
                      <option value="sddc-euw2-prod">sddc-euw2-prod (EU London)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#545b64] mb-1">Security group</label>
                    <input type="text" value={sgName} onChange={e => setSgName(e.target.value)} className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]" />
                  </div>
                  <div>
                    <label className="block text-xs text-[#545b64] mb-1">Key pair (login)</label>
                    <select value={keyPair} onChange={e => setKeyPair(e.target.value)} className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm bg-white focus:outline-none focus:border-[#ff9900]">
                      <option value="vmc-key-pair">vmc-key-pair</option>
                      <option value="dev-key-pair">dev-key-pair</option>
                      <option value="Proceed without key pair">Proceed without key pair</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-[#545b64] mb-1">Auto-assign public IP</label>
                    <select className="w-full px-3 py-2 border border-[#d5dbdb] rounded text-sm bg-white focus:outline-none focus:border-[#ff9900]">
                      <option>Enable</option>
                      <option>Disable</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-[#fff8ee] border border-[#ff9900]/30 rounded p-4 text-sm text-[#545b64]">
                <CheckCircle2 className="w-5 h-5 text-green-500 inline mr-2" />
                Review your instance configuration below, then click <strong>Launch instance</strong>.
              </div>
              {[
                { icon: <Tag className="w-4 h-4" />, label: 'Name', value: name || '(no name)' },
                { icon: <span className="text-base">{selectedOS.icon}</span>, label: 'AMI', value: selectedOS.label },
                { icon: <Cpu className="w-4 h-4" />, label: 'Instance type', value: `${selectedType.label} (${selectedType.cpu} vCPU, ${selectedType.memory} GiB RAM)` },
                { icon: <HardDrive className="w-4 h-4" />, label: 'Storage', value: `${storage} GiB vSAN` },
                { icon: <Wifi className="w-4 h-4" />, label: 'SDDC', value: selectedSDDC },
                { icon: <Shield className="w-4 h-4" />, label: 'Security group', value: sgName },
                { icon: <Terminal className="w-4 h-4" />, label: 'Key pair', value: keyPair },
              ].map((row, i) => (
                <div key={i} className="flex items-start py-2.5 border-b border-[#eaeded] last:border-0">
                  <span className="text-[#545b64] mr-3 mt-0.5">{row.icon}</span>
                  <span className="w-32 text-sm text-[#545b64] flex-shrink-0">{row.label}</span>
                  <span className="text-sm text-[#16191f] font-medium">{row.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#eaeded] bg-[#fafafa] flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] text-[#545b64]">Cancel</button>
          <div className="flex items-center space-x-3">
            {step > 1 && (
              <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 text-sm border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] text-[#16191f] flex items-center">
                <ChevronRight className="w-4 h-4 mr-1 rotate-180" /> Previous
              </button>
            )}
            {step < totalSteps ? (
              <button onClick={next} className="px-5 py-2 text-sm bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] font-medium rounded flex items-center">
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button onClick={handleLaunch} className="px-5 py-2 text-sm bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] font-medium rounded flex items-center">
                <Play className="w-4 h-4 mr-2" /> Launch instance
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper to import Check locally without adding to outer imports
function Check({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ComputePage({ currentRegion }: ComputePageProps) {
  const { vms, updateVMStatus, terminateVMs, launchVM } = useResources();
  const { user } = useAuth();
  const canEdit = user?.role !== 'readonly';

  const [selectedVMs, setSelectedVMs] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isLaunchOpen, setIsLaunchOpen] = useState(false);
  const [detailVM, setDetailVM] = useState<VM | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredVMs = useMemo(() => vms.filter(vm => {
    if (currentRegion !== 'all' && vm.region !== currentRegion) return false;
    if (statusFilter !== 'all' && vm.status !== statusFilter) return false;
    const q = searchTerm.toLowerCase();
    return vm.name.toLowerCase().includes(q) || vm.id.toLowerCase().includes(q) || vm.os.toLowerCase().includes(q) || vm.sddc.toLowerCase().includes(q);
  }), [vms, currentRegion, statusFilter, searchTerm]);

  const stats = useMemo(() => ({
    total: filteredVMs.length,
    running: filteredVMs.filter(v => v.status === 'running').length,
    stopped: filteredVMs.filter(v => v.status === 'stopped').length,
    error: filteredVMs.filter(v => v.status === 'error').length,
    other: filteredVMs.filter(v => !['running', 'stopped', 'error'].includes(v.status)).length,
  }), [filteredVMs]);

  const toggleVM = (id: string) => {
    setSelectedVMs(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const toggleAll = () => {
    setSelectedVMs(prev => prev.size === filteredVMs.length ? new Set() : new Set(filteredVMs.map(v => v.id)));
  };

  const handleAction = (action: string) => {
    setIsActionsOpen(false);
    const ids = [...selectedVMs];
    if (action === 'Start') {
      ids.forEach(id => updateVMStatus(id, 'running'));
      showToast(`Started ${ids.length} instance${ids.length > 1 ? 's' : ''}`);
    } else if (action === 'Stop') {
      ids.forEach(id => updateVMStatus(id, 'stopped'));
      showToast(`Stopped ${ids.length} instance${ids.length > 1 ? 's' : ''}`);
    } else if (action === 'Reboot') {
      ids.forEach(id => updateVMStatus(id, 'provisioning'));
      setTimeout(() => ids.forEach(id => updateVMStatus(id, 'running')), 2000);
      showToast(`Rebooting ${ids.length} instance${ids.length > 1 ? 's' : ''}…`);
    } else if (action === 'Terminate') {
      terminateVMs(ids);
      setSelectedVMs(new Set());
      showToast(`Terminated ${ids.length} instance${ids.length > 1 ? 's' : ''}`, 'error');
    }
  };

  const handleLaunch = (vmData: Omit<VM, 'id' | 'launchTime'>) => {
    launchVM(vmData);
    showToast(`Instance "${vmData.name}" is launching…`);
  };

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

      <Breadcrumb items={[{ label: 'Services' }, { label: 'Compute' }, { label: 'Instances' }]} />

      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-[#16191f]">Instances</h1>
          <p className="text-sm text-[#545b64] mt-0.5">
            Region: <span className="font-medium text-[#16191f]">{regions.find(r => r.id === currentRegion)?.name}</span>
          </p>
        </div>
        {canEdit && (
          <button onClick={() => setIsLaunchOpen(true)} className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm flex items-center transition-colors">
            <Plus className="w-4 h-4 mr-2" /> Launch instance
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center space-x-5 mb-4 text-sm">
        {[
          { filter: 'all' as StatusFilter, label: `${stats.total} Instances`, color: 'bg-[#0073bb]' },
          { filter: 'running' as StatusFilter, label: `${stats.running} Running`, color: 'bg-green-500' },
          { filter: 'stopped' as StatusFilter, label: `${stats.stopped} Stopped`, color: 'bg-gray-400' },
          { filter: 'error' as StatusFilter, label: `${stats.error} Error`, color: 'bg-red-500' },
        ].map(({ filter, label, color }) => (
          <button key={filter} onClick={() => setStatusFilter(filter)} className={`flex items-center ${statusFilter === filter ? 'font-semibold text-[#16191f]' : 'text-[#545b64] hover:text-[#16191f]'}`}>
            <span className={`w-2 h-2 rounded-full mr-2 ${color}`} />{label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-white px-4 py-3 border border-[#d5dbdb] rounded-t">
        <div className="flex items-center space-x-3">
          {canEdit && (
            <div className="relative">
              <button
                onClick={() => setIsActionsOpen(!isActionsOpen)}
                disabled={selectedVMs.size === 0}
                className={`px-3 py-1.5 text-sm border rounded flex items-center ${selectedVMs.size === 0 ? 'border-[#d5dbdb] text-[#aab7b8] cursor-not-allowed' : 'border-[#d5dbdb] text-[#16191f] hover:bg-[#f2f3f3]'}`}
              >
                Instance actions <ChevronDown className="w-3.5 h-3.5 ml-2" />
              </button>
              {isActionsOpen && selectedVMs.size > 0 && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-[#d5dbdb] rounded shadow-lg z-20">
                  <button onClick={() => handleAction('Start')} className="w-full text-left px-4 py-2 text-sm hover:bg-[#f2f3f3] flex items-center">
                    <Play className="w-4 h-4 mr-3 text-green-600" /> Start instance
                  </button>
                  <button onClick={() => handleAction('Stop')} className="w-full text-left px-4 py-2 text-sm hover:bg-[#f2f3f3] flex items-center">
                    <Square className="w-4 h-4 mr-3 text-[#545b64]" /> Stop instance
                  </button>
                  <button onClick={() => handleAction('Reboot')} className="w-full text-left px-4 py-2 text-sm hover:bg-[#f2f3f3] flex items-center">
                    <RotateCw className="w-4 h-4 mr-3 text-[#545b64]" /> Reboot instance
                  </button>
                  <div className="border-t border-[#eaeded]" />
                  <button onClick={() => handleAction('Terminate')} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-600 flex items-center">
                    <Trash2 className="w-4 h-4 mr-3" /> Terminate instance
                  </button>
                </div>
              )}
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#aab7b8]" />
            <input
              type="text"
              placeholder="Search instances"
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
      <div className="bg-white border border-[#d5dbdb] border-t-0 rounded-b overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" checked={selectedVMs.size === filteredVMs.length && filteredVMs.length > 0} onChange={toggleAll} className="rounded border-[#d5dbdb] accent-[#ff9900]" />
              </th>
              <th className="text-left px-4 py-3 text-[#545b64] font-medium">Instance ID</th>
              <th className="text-left px-4 py-3 text-[#545b64] font-medium">Name</th>
              <th className="text-left px-4 py-3 text-[#545b64] font-medium">Status</th>
              <th className="text-left px-4 py-3 text-[#545b64] font-medium">Instance type</th>
              <th className="text-left px-4 py-3 text-[#545b64] font-medium">Availability zone</th>
              <th className="text-left px-4 py-3 text-[#545b64] font-medium">Private IP</th>
              <th className="text-left px-4 py-3 text-[#545b64] font-medium">Public IP</th>
              <th className="text-left px-4 py-3 text-[#545b64] font-medium">Launch time</th>
              <th className="text-left px-4 py-3 text-[#545b64] font-medium" />
            </tr>
          </thead>
          <tbody>
            {filteredVMs.map(vm => (
              <tr key={vm.id} className={`border-b border-[#eaeded] hover:bg-[#f9f9f9] ${selectedVMs.has(vm.id) ? 'bg-[#fff8ee]' : ''}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selectedVMs.has(vm.id)} onChange={() => toggleVM(vm.id)} className="rounded border-[#d5dbdb] accent-[#ff9900]" />
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => setDetailVM(vm)} className="font-mono text-[#0073bb] hover:underline text-xs">{vm.id}</button>
                </td>
                <td className="px-4 py-3 font-medium text-[#16191f]">{vm.name}</td>
                <td className="px-4 py-3"><StatusBadge status={vm.status} /></td>
                <td className="px-4 py-3 text-[#16191f] text-xs">{vm.cpu} vCPU / {vm.memory} GiB</td>
                <td className="px-4 py-3 text-[#545b64] text-xs font-mono">{vm.region}a</td>
                <td className="px-4 py-3 font-mono text-xs text-[#545b64]">{vm.privateIp}</td>
                <td className="px-4 py-3 font-mono text-xs text-[#545b64]">{vm.publicIp || '—'}</td>
                <td className="px-4 py-3 text-[#545b64] text-xs">{new Date(vm.launchTime).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-1">
                    <button onClick={() => setDetailVM(vm)} className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]" title="View details"><Eye className="w-4 h-4" /></button>
                    {canEdit && (
                      <button className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]" title="Connect"><Power className="w-4 h-4" /></button>
                    )}
                    <button className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]"><MoreHorizontal className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredVMs.length === 0 && (
          <div className="py-16 text-center">
            <Box className="w-12 h-12 mx-auto mb-4 text-[#aab7b8]" />
            <p className="text-[#545b64] font-medium mb-1">No instances found</p>
            <p className="text-sm text-[#aab7b8] mb-4">Try adjusting your filters or launch a new instance</p>
            {canEdit && (
              <button onClick={() => setIsLaunchOpen(true)} className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm">
                Launch instance
              </button>
            )}
          </div>
        )}
        <div className="px-4 py-3 border-t border-[#d5dbdb] bg-[#fafafa] flex items-center justify-between text-sm text-[#545b64]">
          <span>Showing {filteredVMs.length} of {vms.length} instances</span>
          <div className="flex space-x-2">
            <button disabled className="px-3 py-1 border border-[#d5dbdb] rounded disabled:opacity-40">Previous</button>
            <button disabled className="px-3 py-1 border border-[#d5dbdb] rounded disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>

      {/* Launch Wizard */}
      {isLaunchOpen && (
        <LaunchWizard
          onClose={() => setIsLaunchOpen(false)}
          onLaunch={handleLaunch}
          currentRegion={currentRegion}
        />
      )}

      {/* Detail Panel */}
      {detailVM && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-[#16191f]">{detailVM.name}</h2>
                <p className="text-xs font-mono text-[#545b64]">{detailVM.id}</p>
              </div>
              <div className="flex items-center space-x-3">
                <StatusBadge status={detailVM.status} />
                <button onClick={() => setDetailVM(null)} className="text-[#545b64] hover:text-[#16191f]"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xs font-semibold text-[#545b64] uppercase tracking-wide mb-3">Instance details</h3>
                  <dl className="space-y-2 text-sm">
                    {[
                      ['OS / AMI', detailVM.os],
                      ['vCPUs', String(detailVM.cpu)],
                      ['Memory', `${detailVM.memory} GiB`],
                      ['Storage', `${detailVM.storage} GiB`],
                      ['Launch time', new Date(detailVM.launchTime).toLocaleString()],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1 border-b border-[#eaeded] last:border-0">
                        <dt className="text-[#545b64]">{k}</dt>
                        <dd className="text-[#16191f] font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-[#545b64] uppercase tracking-wide mb-3">Network</h3>
                  <dl className="space-y-2 text-sm">
                    {[
                      ['Private IP', detailVM.privateIp],
                      ['Public IP', detailVM.publicIp || 'None'],
                      ['Region', detailVM.region],
                      ['SDDC', detailVM.sddc],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1 border-b border-[#eaeded] last:border-0">
                        <dt className="text-[#545b64]">{k}</dt>
                        <dd className="text-[#16191f] font-mono text-xs font-medium">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-xs font-semibold text-[#545b64] uppercase tracking-wide mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(detailVM.tags).map(([k, v]) => (
                    <span key={k} className="px-2 py-1 bg-[#f2f3f3] border border-[#d5dbdb] rounded text-xs">
                      <span className="text-[#545b64]">{k}:</span> <span className="text-[#16191f] font-medium">{v}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#eaeded] bg-[#fafafa] flex justify-between">
              <button onClick={() => setDetailVM(null)} className="px-4 py-2 border border-[#d5dbdb] rounded text-sm hover:bg-[#f2f3f3] text-[#545b64]">Close</button>
              <div className="space-x-2">
                <button
                  onClick={() => { navigator.clipboard?.writeText(detailVM.id); showToast('Instance ID copied'); }}
                  className="px-4 py-2 border border-[#d5dbdb] rounded text-sm hover:bg-[#f2f3f3] flex items-center inline-flex"
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy ID
                </button>
                {canEdit && (
                  <button className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded">
                    Connect
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
