'use client';

import { useState } from 'react';
import {
  X, CheckCircle2, ChevronRight, Cpu, MemoryStick, HardDrive,
  Globe, Lock, Code, Plus, Trash2, Loader2, Layers,
} from 'lucide-react';
import { vmTemplates } from '../data/mockData';
import { useImages } from '../context/ImageContext';
import { useAuth } from '../context/AuthContext';
import type { BuildImagePayload } from '../services/imageService';

const ALL_REGIONS = [
  { id: 'us-east-1',      label: 'US East (N. Virginia)' },
  { id: 'us-west-2',      label: 'US West (Oregon)' },
  { id: 'eu-west-2',      label: 'EU (London)' },
  { id: 'ap-southeast-1', label: 'AP (Singapore)' },
];

const DEFAULT_CLOUD_INIT = `#!/bin/bash
# Cloud-Init script runs once on first boot
apt-get update -y
apt-get upgrade -y
# Add your customisations below…
`;

const LIBRARY_OPTIONS = ['custom-images', 'internal-images', 'database-images', 'security-images', 'dev-images'];

interface Props {
  onClose: () => void;
  initialRegion?: string;
}

export default function ImageBuilderWizard({ onClose, initialRegion = 'us-east-1' }: Props) {
  const { buildImage, isBuilding } = useImages();
  const { user } = useAuth();

  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;
  const STEP_LABELS = ['Base Image', 'Configure', 'Regions', 'Review & Build'];

  // Step 1 — base image selection
  const [selectedTemplateId, setSelectedTemplateId] = useState(vmTemplates[0]?.id ?? '');

  // Step 2 — configuration
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cpu, setCpu] = useState(2);
  const [memory, setMemory] = useState(4);
  const [diskGB, setDiskGB] = useState(40);
  const [cloudInit, setCloudInit] = useState(DEFAULT_CLOUD_INIT);
  const [library, setLibrary] = useState('custom-images');
  const [tags, setTags] = useState<{ key: string; value: string }[]>([
    { key: 'ManagedBy', value: 'VMC-Console' },
    { key: 'Environment', value: 'Production' },
  ]);

  // Step 3 — regions
  const [selectedRegions, setSelectedRegions] = useState<string[]>([initialRegion]);

  const [error, setError] = useState('');

  const baseTemplate = vmTemplates.find(t => t.id === selectedTemplateId) ?? vmTemplates[0];

  const toggleRegion = (id: string) => {
    setSelectedRegions(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const canNext = () => {
    if (step === 1 && !selectedTemplateId) { setError('Please select a base image.'); return false; }
    if (step === 2) {
      if (!name.trim()) { setError('Image name is required.'); return false; }
      if (!/^[a-z0-9-]+$/.test(name.trim())) { setError('Name must be lowercase letters, numbers, and hyphens only.'); return false; }
    }
    if (step === 3 && selectedRegions.length === 0) { setError('Select at least one region.'); return false; }
    setError('');
    return true;
  };

  const next = () => { if (canNext()) setStep(s => Math.min(s + 1, TOTAL_STEPS)); };
  const back = () => { setError(''); setStep(s => Math.max(s - 1, 1)); };

  const handleBuild = async () => {
    if (!canNext()) return;

    const tagMap: Record<string, string> = {};
    tags.forEach(t => { if (t.key.trim()) tagMap[t.key.trim()] = t.value; });

    const payload: BuildImagePayload = {
      name: name.trim(),
      description: description.trim(),
      baseTemplateId: selectedTemplateId,
      baseTemplateName: baseTemplate.name,
      osFamily: baseTemplate.osFamily,
      os: baseTemplate.os,
      cpu,
      memory,
      diskGB,
      cloudInitScript: cloudInit,
      targetRegions: selectedRegions,
      tags: tagMap,
      library,
    };

    await buildImage(payload, user?.email ?? 'unknown');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-[#16191f]">Build Base Image</h2>
            <p className="text-xs text-[#545b64] mt-0.5">
              Step {step} of {TOTAL_STEPS}: <span className="font-medium">{STEP_LABELS[step - 1]}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-[#545b64] hover:text-[#16191f]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 bg-[#fafafa] border-b border-[#eaeded]">
          <div className="flex items-center">
            {STEP_LABELS.map((label, i) => (
              <div key={i} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    i + 1 < step  ? 'bg-green-500 text-white' :
                    i + 1 === step ? 'bg-[#ff9900] text-white' :
                    'bg-[#d5dbdb] text-[#545b64]'
                  }`}>
                    {i + 1 < step ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] mt-1 whitespace-nowrap ${i + 1 === step ? 'text-[#ff9900] font-medium' : 'text-[#545b64]'}`}>
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 ${i + 1 < step ? 'bg-green-500' : 'bg-[#d5dbdb]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* ── Step 1: Base Image ── */}
          {step === 1 && (
            <div>
              <p className="text-sm text-[#545b64] mb-4">
                Choose a base image from the Content Library. Your new image will be built on top of this template
                and available to select when launching VMs.
              </p>

              {/* Tab: Official / Partner / Custom */}
              {(['vmware', 'partner', 'custom', 'marketplace'] as const).map(source => {
                const items = vmTemplates.filter(t => t.source === source);
                if (items.length === 0) return null;
                return (
                  <div key={source} className="mb-5">
                    <h3 className="text-xs font-semibold text-[#545b64] uppercase tracking-wide mb-2 capitalize">
                      {source === 'vmware' ? 'VMware Official' : source}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map(t => (
                        <button
                          key={t.id}
                          onClick={() => { setSelectedTemplateId(t.id); setCpu(t.cpu); setMemory(t.memory); setDiskGB(t.diskGB); }}
                          className={`p-3 border rounded text-left transition-all ${
                            selectedTemplateId === t.id
                              ? 'border-[#ff9900] bg-[#fff8ee] ring-1 ring-[#ff9900]'
                              : 'border-[#d5dbdb] hover:border-[#ff9900]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Layers className="w-4 h-4 text-[#0073bb]" />
                              <div>
                                <p className="text-sm font-medium text-[#16191f]">{t.name}</p>
                                <p className="text-xs text-[#545b64]">{t.os} · {t.version}</p>
                              </div>
                            </div>
                            {selectedTemplateId === t.id && <CheckCircle2 className="w-4 h-4 text-[#ff9900]" />}
                          </div>
                          <div className="flex items-center space-x-3 mt-2 text-xs text-[#aab7b8]">
                            <span className="flex items-center"><Cpu className="w-3 h-3 mr-1" />{t.cpu}vCPU</span>
                            <span className="flex items-center"><MemoryStick className="w-3 h-3 mr-1" />{t.memory}GB</span>
                            <span className="flex items-center"><HardDrive className="w-3 h-3 mr-1" />{t.diskGB}GB</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Step 2: Configure ── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="p-3 bg-[#f2f3f3] rounded flex items-center space-x-3">
                <Layers className="w-5 h-5 text-[#0073bb]" />
                <div>
                  <p className="text-sm font-medium text-[#16191f]">Base: {baseTemplate.name}</p>
                  <p className="text-xs text-[#545b64]">{baseTemplate.os} · {baseTemplate.version}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#545b64] mb-1">
                    Image Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="e.g. web-server-hardened"
                    className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]"
                  />
                  <p className="text-xs text-[#aab7b8] mt-1">Lowercase letters, numbers, and hyphens only</p>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-[#545b64] mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={2}
                    placeholder="What does this image do? Who should use it?"
                    className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#545b64] mb-1">vCPUs</label>
                  <input type="number" value={cpu} onChange={e => setCpu(+e.target.value)} min={1} max={64}
                    className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#545b64] mb-1">Memory (GB)</label>
                  <input type="number" value={memory} onChange={e => setMemory(+e.target.value)} min={1} max={512}
                    className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#545b64] mb-1">Disk (GB)</label>
                  <input type="number" value={diskGB} onChange={e => setDiskGB(+e.target.value)} min={10} max={16384}
                    className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#545b64] mb-1">Content Library</label>
                  <select value={library} onChange={e => setLibrary(e.target.value)}
                    className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#ff9900]">
                    {LIBRARY_OPTIONS.map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-medium text-[#545b64] mb-2">Tags</label>
                <div className="space-y-2">
                  {tags.map((tag, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <input
                        placeholder="Key"
                        value={tag.key}
                        onChange={e => setTags(prev => prev.map((t, j) => j === i ? { ...t, key: e.target.value } : t))}
                        className="flex-1 border border-[#d5dbdb] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#ff9900]"
                      />
                      <input
                        placeholder="Value"
                        value={tag.value}
                        onChange={e => setTags(prev => prev.map((t, j) => j === i ? { ...t, value: e.target.value } : t))}
                        className="flex-1 border border-[#d5dbdb] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[#ff9900]"
                      />
                      <button onClick={() => setTags(prev => prev.filter((_, j) => j !== i))}
                        className="text-[#545b64] hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setTags(prev => [...prev, { key: '', value: '' }])}
                    className="text-sm text-[#0073bb] hover:underline flex items-center">
                    <Plus className="w-4 h-4 mr-1" />Add tag
                  </button>
                </div>
              </div>

              {/* Cloud-Init */}
              <div>
                <label className="block text-xs font-medium text-[#545b64] mb-1 flex items-center">
                  <Code className="w-3 h-3 mr-1" />Cloud-Init / User Data Script
                </label>
                <textarea
                  value={cloudInit}
                  onChange={e => setCloudInit(e.target.value)}
                  rows={8}
                  className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-[#ff9900] resize-y bg-[#16191f] text-green-400"
                  spellCheck={false}
                />
                <p className="text-xs text-[#aab7b8] mt-1">
                  This script runs once on first boot. Baked into the image during the build process.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Regions ── */}
          {step === 3 && (
            <div>
              <p className="text-sm text-[#545b64] mb-4">
                Select which regional datacenters this image will be available in. The image is built in the
                primary region first, then replicated to additional regions via Content Library subscriptions.
              </p>
              <div className="space-y-3">
                {ALL_REGIONS.map(r => {
                  const isSelected = selectedRegions.includes(r.id);
                  const isPrimary = selectedRegions[0] === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        if (selectedRegions.length === 1 && isSelected) return;
                        if (!isSelected) {
                          setSelectedRegions(prev => prev.includes(r.id) ? prev : [...prev, r.id]);
                        } else {
                          setSelectedRegions(prev => prev.filter(x => x !== r.id));
                        }
                      }}
                      className={`w-full flex items-center justify-between p-4 border rounded transition-all ${
                        isSelected
                          ? 'border-[#ff9900] bg-[#fff8ee] ring-1 ring-[#ff9900]'
                          : 'border-[#d5dbdb] hover:border-[#ff9900]'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${isSelected ? 'border-[#ff9900] bg-[#ff9900]' : 'border-[#d5dbdb]'}`}>
                          {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-[#16191f]">{r.label}</p>
                          <p className="text-xs text-[#545b64]">{r.id}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {isPrimary && isSelected && (
                          <span className="px-2 py-0.5 bg-[#0073bb] text-white text-xs rounded font-medium">Primary Build</span>
                        )}
                        {isSelected && !isPrimary && (
                          <span className="px-2 py-0.5 bg-[#f2f3f3] text-[#545b64] text-xs rounded">Replicated</span>
                        )}
                        {isSelected
                          ? <Globe className="w-4 h-4 text-[#ff9900]" />
                          : <Lock className="w-4 h-4 text-[#d5dbdb]" />
                        }
                      </div>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[#aab7b8] mt-3">
                Replication uses Content Library subscriptions and adds ~2 minutes per additional region.
                Images are immutable — a new build is required to update them.
              </p>
            </div>
          )}

          {/* ── Step 4: Review ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="bg-[#f2f3f3] rounded p-4 space-y-3">
                <h3 className="text-sm font-semibold text-[#16191f]">Image Summary</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div><span className="text-[#545b64]">Name:</span> <span className="font-mono font-medium">{name}</span></div>
                  <div><span className="text-[#545b64]">Library:</span> <span className="font-medium">{library}</span></div>
                  <div><span className="text-[#545b64]">Base Image:</span> <span className="font-medium">{baseTemplate.name}</span></div>
                  <div><span className="text-[#545b64]">OS:</span> <span className="font-medium">{baseTemplate.os}</span></div>
                  <div><span className="text-[#545b64]">vCPU:</span> <span className="font-medium">{cpu}</span></div>
                  <div><span className="text-[#545b64]">Memory:</span> <span className="font-medium">{memory} GB</span></div>
                  <div><span className="text-[#545b64]">Disk:</span> <span className="font-medium">{diskGB} GB</span></div>
                  <div><span className="text-[#545b64]">Regions:</span> <span className="font-medium">{selectedRegions.length}</span></div>
                </div>
                {description && (
                  <div><span className="text-xs text-[#545b64]">Description:</span> <p className="text-sm mt-0.5">{description}</p></div>
                )}
              </div>

              <div>
                <h4 className="text-xs font-semibold text-[#545b64] uppercase tracking-wide mb-2">Target Regions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRegions.map((r, i) => (
                    <span key={r} className={`px-3 py-1 rounded text-xs font-medium ${i === 0 ? 'bg-[#0073bb] text-white' : 'bg-[#f2f3f3] text-[#545b64]'}`}>
                      {ALL_REGIONS.find(x => x.id === r)?.label ?? r}
                      {i === 0 ? ' (primary)' : ''}
                    </span>
                  ))}
                </div>
              </div>

              {Object.keys(tags.filter(t => t.key.trim())).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-[#545b64] uppercase tracking-wide mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {tags.filter(t => t.key.trim()).map((t, i) => (
                      <span key={i} className="px-2 py-1 bg-[#f2f3f3] text-[#545b64] text-xs rounded">
                        {t.key}={t.value}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 border border-[#ff9900] bg-[#fff4e6] rounded text-sm text-[#16191f]">
                <strong>What happens next:</strong> The image will be queued for build in {selectedRegions[0]}.
                You can track progress in the Content Library. Once available, it will appear in the OS Image
                selector when launching VMs in the selected regions.
              </div>
            </div>
          )}

          {error && (
            <p className="mt-3 text-sm text-red-600 flex items-center">
              <span className="mr-1">⚠</span> {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#eaeded] bg-[#fafafa] flex items-center justify-between">
          <button
            onClick={step === 1 ? onClose : back}
            className="px-4 py-2 border border-[#d5dbdb] rounded text-sm hover:bg-[#f2f3f3] transition-colors"
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>

          <div className="flex items-center space-x-3">
            <span className="text-xs text-[#aab7b8]">{step} / {TOTAL_STEPS}</span>
            {step < TOTAL_STEPS ? (
              <button
                onClick={next}
                className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm transition-colors flex items-center"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleBuild}
                disabled={isBuilding}
                className="px-5 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-semibold rounded-sm transition-colors flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isBuilding ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Building…</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" />Start Build</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
