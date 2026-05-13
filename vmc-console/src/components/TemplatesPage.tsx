'use client';

import { useState, useMemo } from 'react';
import {
  Search, Star, ChevronRight, Home, Layers,
  Cpu, HardDrive, MemoryStick, Calendar, CheckCircle, X,
  Globe, Lock, Plus, Clock, AlertCircle, Loader2, RefreshCw, Copy, Trash2,
} from 'lucide-react';
import { vmTemplates } from '../data/mockData';
import type { VMTemplate } from '../types';
import { useAuth } from '../context/AuthContext';
import { useImages } from '../context/ImageContext';
import type { CustomImage } from '../context/ImageContext';
import ImageBuilderWizard from './ImageBuilderWizard';

const SOURCE_FILTERS = ['all', 'vmware', 'partner', 'marketplace', 'custom'] as const;
const OS_FAMILIES = ['all', 'linux', 'windows', 'other'] as const;

const ALL_REGIONS = [
  { id: 'us-east-1',      label: 'US East (N. Virginia)' },
  { id: 'us-west-2',      label: 'US West (Oregon)' },
  { id: 'eu-west-2',      label: 'EU (London)' },
  { id: 'ap-southeast-1', label: 'AP (Singapore)' },
];

function Breadcrumb() {
  return (
    <nav className="flex items-center text-sm text-[#545b64] mb-4">
      <Home className="w-4 h-4 mr-2" />
      <ChevronRight className="w-4 h-4 mx-2" />
      <span className="text-[#16191f]">Content Library &amp; Templates</span>
    </nav>
  );
}

function SourceBadge({ source }: { source: VMTemplate['source'] | 'custom-built' }) {
  const map: Record<string, string> = {
    vmware:       'bg-[#0073bb] text-white',
    partner:      'bg-purple-100 text-purple-700',
    marketplace:  'bg-[#ff9900] text-[#232f3e]',
    custom:       'bg-gray-100 text-gray-700',
    'custom-built': 'bg-green-100 text-green-700',
  };
  const labels: Record<string, string> = {
    vmware:       'VMware Official',
    partner:      'Partner',
    marketplace:  'Marketplace',
    custom:       'Custom',
    'custom-built': 'Custom Built',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[source] ?? 'bg-gray-100 text-gray-700'}`}>
      {labels[source] ?? source}
    </span>
  );
}

function TypeBadge({ type }: { type: VMTemplate['type'] }) {
  const map: Record<string, string> = {
    template: 'bg-blue-100 text-blue-700',
    ovf:  'bg-green-100 text-green-700',
    ova:  'bg-green-100 text-green-700',
    iso:  'bg-gray-100 text-gray-600',
  };
  return <span className={`px-1.5 py-0.5 rounded text-xs font-medium uppercase ${map[type] ?? ''}`}>{type}</span>;
}

function BuildStatusBadge({ status }: { status: CustomImage['buildStatus'] }) {
  const map = {
    queued:    { cls: 'bg-gray-100 text-gray-600',     icon: <Clock className="w-3 h-3 mr-1" />,            label: 'Queued' },
    building:  { cls: 'bg-blue-100 text-blue-700',     icon: <Loader2 className="w-3 h-3 mr-1 animate-spin" />, label: 'Building' },
    available: { cls: 'bg-green-100 text-green-700',   icon: <CheckCircle className="w-3 h-3 mr-1" />,      label: 'Available' },
    failed:    { cls: 'bg-red-100 text-red-700',       icon: <AlertCircle className="w-3 h-3 mr-1" />,      label: 'Failed' },
  };
  const { cls, icon, label } = map[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {icon}{label}
    </span>
  );
}

function RatingStars({ rating }: { rating?: number }) {
  if (!rating) return null;
  return (
    <span className="flex items-center">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'fill-[#ff9900] text-[#ff9900]' : 'text-[#d5dbdb]'}`} />
      ))}
    </span>
  );
}

interface DeployTarget { id: string; name: string; os: string; cpu: number; memory: number; diskGB: number }

export default function TemplatesPage() {
  const { user } = useAuth();
  const canEdit = user?.role !== 'readonly';
  const { images, replicateToRegion, deleteImage } = useImages();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeSource, setActiveSource] = useState<typeof SOURCE_FILTERS[number]>('all');
  const [activeOS, setActiveOS] = useState<typeof OS_FAMILIES[number]>('all');
  const [activeTab, setActiveTab] = useState<'catalog' | 'my-images'>('catalog');
  const [deployTarget, setDeployTarget] = useState<DeployTarget | null>(null);
  const [showBuilder, setShowBuilder] = useState(false);
  const [replicateTarget, setReplicateTarget] = useState<CustomImage | null>(null);
  const [replicateRegion, setReplicateRegion] = useState('');

  const filteredTemplates = useMemo(() => {
    return vmTemplates.filter(t => {
      const matchSearch = !searchTerm ||
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchSource = activeSource === 'all' || t.source === activeSource;
      const matchOS = activeOS === 'all' || t.osFamily === activeOS;
      return matchSearch && matchSource && matchOS;
    });
  }, [searchTerm, activeSource, activeOS]);

  const filteredImages = useMemo(() => {
    return images.filter(img => {
      return !searchTerm ||
        img.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.os.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [images, searchTerm]);

  const handleDeploy = (t: { id: string; name: string; os: string; cpu: number; memory: number; diskGB: number }) => {
    setDeployTarget(t);
  };

  return (
    <div className="p-6 bg-[#f2f3f3] min-h-[calc(100vh-84px)]">
      <Breadcrumb />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-[#16191f] mb-1">Content Library &amp; VM Images</h1>
          <p className="text-sm text-[#545b64]">
            Build, manage, and deploy VM base images — available across all regional datacenters
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowBuilder(true)}
            className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm flex items-center transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />Build Image
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Catalog Templates', value: vmTemplates.length, sub: 'VMware + Partner + Custom' },
          { label: 'My Built Images', value: images.length, sub: `${images.filter(i => i.buildStatus === 'available').length} available` },
          { label: 'Regions Covered', value: 4, sub: 'All regional DCs' },
          { label: 'Total Deployments', value: images.reduce((s, i) => s + i.downloads, 0) + vmTemplates.reduce((s, t) => s + (t.downloads ?? 0), 0), sub: 'Across all images' },
        ].map(c => (
          <div key={c.label} className="bg-white border border-[#d5dbdb] rounded-sm p-4">
            <p className="text-xs text-[#545b64] uppercase tracking-wide mb-1">{c.label}</p>
            <p className="text-3xl font-light text-[#16191f]">{c.value}</p>
            <p className="text-xs text-[#aab7b8] mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-[#d5dbdb]">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'catalog' ? 'border-[#ff9900] text-[#16191f]' : 'border-transparent text-[#545b64] hover:text-[#16191f]'}`}
          >
            Catalog Templates
            <span className="ml-2 px-2 py-0.5 text-xs bg-[#eaeded] rounded">{vmTemplates.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('my-images')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my-images' ? 'border-[#ff9900] text-[#16191f]' : 'border-transparent text-[#545b64] hover:text-[#16191f]'}`}
          >
            My Built Images
            <span className="ml-2 px-2 py-0.5 text-xs bg-[#eaeded] rounded">{images.length}</span>
            {images.filter(i => i.buildStatus === 'building' || i.buildStatus === 'queued').length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded animate-pulse">
                Building…
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filters row */}
      {activeTab === 'catalog' && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-4 mb-4 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#545b64]" />
            <input
              type="text"
              placeholder="Search templates…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-1.5 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
            />
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-[#545b64] mr-1">Source:</span>
            {SOURCE_FILTERS.map(src => (
              <button key={src} onClick={() => setActiveSource(src)}
                className={`px-3 py-1.5 text-xs rounded transition-colors capitalize ${activeSource === src ? 'bg-[#232f3e] text-white' : 'bg-[#f2f3f3] text-[#545b64] hover:bg-[#eaeded]'}`}>
                {src === 'all' ? 'All' : src === 'vmware' ? 'VMware Official' : src}
              </button>
            ))}
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-xs text-[#545b64] mr-1">OS:</span>
            {OS_FAMILIES.map(os => (
              <button key={os} onClick={() => setActiveOS(os)}
                className={`px-3 py-1.5 text-xs rounded transition-colors capitalize ${activeOS === os ? 'bg-[#0073bb] text-white' : 'bg-[#f2f3f3] text-[#545b64] hover:bg-[#eaeded]'}`}>
                {os === 'all' ? 'All OS' : os}
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'my-images' && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm p-3 mb-4 flex items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#545b64]" />
            <input
              type="text"
              placeholder="Search my images…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-1.5 w-64 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
            />
          </div>
          <button className="p-1.5 text-[#545b64] hover:bg-[#f2f3f3] rounded"><RefreshCw className="w-4 h-4" /></button>
        </div>
      )}

      {/* ── Catalog Templates table ── */}
      {activeTab === 'catalog' && (
        <>
          <p className="text-sm text-[#545b64] mb-3">{filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} found</p>
          <div className="bg-white border border-[#d5dbdb] rounded-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                  {['Name', 'OS', 'Version', 'Type', 'Source', 'Resources', 'Size', 'Rating', 'Visibility', 'Modified', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[#545b64] font-medium text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-12 text-center">
                      <Layers className="w-10 h-10 mx-auto mb-3 text-[#aab7b8]" />
                      <p className="text-sm text-[#545b64]">No templates match your filters</p>
                    </td>
                  </tr>
                ) : filteredTemplates.map(t => (
                  <tr key={t.id} className="border-b border-[#eaeded] hover:bg-[#f2f3f3]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#0073bb]">{t.name}</p>
                      <p className="text-xs text-[#aab7b8] font-mono">{t.id}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#545b64]">{t.os}</td>
                    <td className="px-4 py-3 text-xs text-[#545b64]">{t.version}</td>
                    <td className="px-4 py-3"><TypeBadge type={t.type} /></td>
                    <td className="px-4 py-3"><SourceBadge source={t.source} /></td>
                    <td className="px-4 py-3 text-xs text-[#545b64]">
                      <span className="flex items-center"><Cpu className="w-3 h-3 mr-1" />{t.cpu}c</span>
                      <span className="flex items-center"><MemoryStick className="w-3 h-3 mr-1" />{t.memory}GB</span>
                      <span className="flex items-center"><HardDrive className="w-3 h-3 mr-1" />{t.diskGB}GB</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#545b64]">{t.size}</td>
                    <td className="px-4 py-3"><RatingStars rating={t.rating} /></td>
                    <td className="px-4 py-3">
                      {t.isPublic
                        ? <span className="flex items-center text-xs text-green-700"><Globe className="w-3 h-3 mr-1" />Public</span>
                        : <span className="flex items-center text-xs text-[#545b64]"><Lock className="w-3 h-3 mr-1" />Private</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-xs text-[#545b64]">
                      <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />{t.lastModified}</span>
                    </td>
                    <td className="px-4 py-3">
                      {canEdit && (
                        <button
                          onClick={() => handleDeploy({ id: t.id, name: t.name, os: t.os, cpu: t.cpu, memory: t.memory, diskGB: t.diskGB })}
                          className="px-3 py-1 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-xs font-medium rounded-sm whitespace-nowrap"
                        >
                          Deploy
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── My Built Images table ── */}
      {activeTab === 'my-images' && (
        <div className="bg-white border border-[#d5dbdb] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                {['Name', 'Base Image', 'OS', 'Resources', 'Library', 'Regions', 'Build Status', 'Built By', 'Built At', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[#545b64] font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredImages.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <Layers className="w-12 h-12 mx-auto mb-4 text-[#aab7b8]" />
                    <p className="text-sm font-medium text-[#16191f] mb-2">No custom images yet</p>
                    <p className="text-xs text-[#545b64] mb-4">Build a base image to make it available when launching VMs across your regional datacenters.</p>
                    {canEdit && (
                      <button
                        onClick={() => setShowBuilder(true)}
                        className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm"
                      >
                        Build your first image
                      </button>
                    )}
                  </td>
                </tr>
              ) : filteredImages.map(img => (
                <tr key={img.id} className="border-b border-[#eaeded] hover:bg-[#f2f3f3]">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0073bb] font-mono">{img.name}</p>
                    <p className="text-xs text-[#aab7b8]">{img.id}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{img.baseTemplateName}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{img.os}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">
                    <span className="flex items-center"><Cpu className="w-3 h-3 mr-1" />{img.cpu}c</span>
                    <span className="flex items-center"><MemoryStick className="w-3 h-3 mr-1" />{img.memory}GB</span>
                    <span className="flex items-center"><HardDrive className="w-3 h-3 mr-1" />{img.diskGB}GB</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{img.library}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {img.availableRegions.map(r => (
                        <span key={r} className="px-1.5 py-0.5 bg-[#f2f3f3] text-[#545b64] text-xs rounded font-mono">{r}</span>
                      ))}
                      {canEdit && img.buildStatus === 'available' && img.availableRegions.length < ALL_REGIONS.length && (
                        <button
                          onClick={() => { setReplicateTarget(img); setReplicateRegion(''); }}
                          className="px-1.5 py-0.5 bg-[#eaeded] text-[#0073bb] text-xs rounded hover:bg-[#d5dbdb] flex items-center"
                        >
                          <Plus className="w-3 h-3 mr-0.5" />Region
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3"><BuildStatusBadge status={img.buildStatus} /></td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">{img.builtBy}</td>
                  <td className="px-4 py-3 text-xs text-[#545b64]">
                    <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" />
                      {new Date(img.builtAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1">
                      {canEdit && img.buildStatus === 'available' && (
                        <button
                          onClick={() => handleDeploy({ id: img.id, name: img.name, os: img.os, cpu: img.cpu, memory: img.memory, diskGB: img.diskGB })}
                          className="px-2 py-1 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-xs font-medium rounded-sm"
                        >
                          Deploy
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => deleteImage(img.id)}
                          className="p-1.5 hover:bg-red-50 rounded text-[#545b64] hover:text-red-600"
                          title="Delete image"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Image Builder Wizard */}
      {showBuilder && (
        <ImageBuilderWizard onClose={() => { setShowBuilder(false); setActiveTab('my-images'); }} />
      )}

      {/* Deploy Modal */}
      {deployTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-[560px]">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <h2 className="text-lg font-medium text-[#16191f]">Deploy from Image</h2>
              <button onClick={() => setDeployTarget(null)} className="text-[#545b64] hover:text-[#16191f]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#f2f3f3] rounded flex items-center space-x-3">
                <div className="w-10 h-10 rounded bg-[#0073bb] flex items-center justify-center flex-shrink-0">
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-[#16191f] text-sm font-mono">{deployTarget.name}</p>
                  <p className="text-xs text-[#545b64]">{deployTarget.os} · {deployTarget.cpu}vCPU · {deployTarget.memory}GB · {deployTarget.diskGB}GB</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#545b64] mb-1">VM Name</label>
                  <input className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]"
                    placeholder={`${deployTarget.name}-01`} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#545b64] mb-1">Target Cluster</label>
                  <select className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]">
                    <option>cluster-use1-prod-01</option>
                    <option>cluster-use1-dev-01</option>
                    <option>cluster-usw2-prod-01</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#545b64] mb-1">vCPUs</label>
                  <input type="number" defaultValue={deployTarget.cpu} className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#545b64] mb-1">Memory (GB)</label>
                  <input type="number" defaultValue={deployTarget.memory} className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#545b64] mb-1">Target Segment</label>
                  <select className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]">
                    <option>prod-web (10.0.1.0/24)</option>
                    <option>prod-app (10.0.10.0/24)</option>
                    <option>dev-01 (10.1.0.0/24)</option>
                    <option>mgmt (10.0.100.0/24)</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#eaeded] bg-[#fafafa] flex justify-end space-x-3">
              <button onClick={() => setDeployTarget(null)} className="px-4 py-2 border border-[#d5dbdb] rounded text-sm hover:bg-[#f2f3f3]">Cancel</button>
              <button onClick={() => setDeployTarget(null)} className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />Deploy VM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replicate to Region Modal */}
      {replicateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-[440px]">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <h2 className="text-lg font-medium text-[#16191f]">Replicate to Region</h2>
              <button onClick={() => setReplicateTarget(null)} className="text-[#545b64] hover:text-[#16191f]"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#545b64]">
                Copy <strong>{replicateTarget.name}</strong> to an additional regional datacenter via Content Library subscription.
              </p>
              <div className="space-y-2">
                {ALL_REGIONS.filter(r => !replicateTarget.availableRegions.includes(r.id)).map(r => (
                  <button
                    key={r.id}
                    onClick={() => setReplicateRegion(r.id)}
                    className={`w-full flex items-center p-3 border rounded transition-all ${replicateRegion === r.id ? 'border-[#ff9900] bg-[#fff8ee]' : 'border-[#d5dbdb] hover:border-[#ff9900]'}`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${replicateRegion === r.id ? 'border-[#ff9900] bg-[#ff9900]' : 'border-[#d5dbdb]'}`} />
                    <div className="text-left">
                      <p className="text-sm font-medium text-[#16191f]">{r.label}</p>
                      <p className="text-xs text-[#545b64]">{r.id}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#eaeded] bg-[#fafafa] flex justify-end space-x-3">
              <button onClick={() => setReplicateTarget(null)} className="px-4 py-2 border border-[#d5dbdb] rounded text-sm hover:bg-[#f2f3f3]">Cancel</button>
              <button
                disabled={!replicateRegion}
                onClick={async () => {
                  if (replicateRegion) {
                    await replicateToRegion(replicateTarget.id, replicateRegion);
                    setReplicateTarget(null);
                  }
                }}
                className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Copy className="w-4 h-4 mr-2" />Replicate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
