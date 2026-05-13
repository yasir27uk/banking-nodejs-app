'use client';

import { useState, useMemo } from 'react';
import {
  Search, Star, Download, ChevronRight, Home, ShoppingBag,
  ExternalLink, Tag, Cpu, HardDrive, MemoryStick,
} from 'lucide-react';
import { marketplaceItems } from '../data/mockData';
import type { MarketplaceItem } from '../types';

const CATEGORIES = ['All', 'Security', 'Backup & Recovery', 'Networking', 'Databases', 'DevOps', 'Monitoring', 'Web & Apps'];
const PRICING_FILTERS = ['All Pricing', 'Free', 'BYOL', 'Paid', 'Freemium'];

function Breadcrumb() {
  return (
    <nav className="flex items-center text-sm text-[#545b64] mb-4">
      <Home className="w-4 h-4 mr-2" />
      <ChevronRight className="w-4 h-4 mx-2" />
      <span className="text-[#16191f]">VMware Marketplace</span>
    </nav>
  );
}

function PricingBadge({ pricing, label }: { pricing: MarketplaceItem['pricing']; label: string }) {
  const map: Record<string, string> = {
    free:     'bg-green-100 text-green-700',
    byol:     'bg-blue-100 text-blue-700',
    paid:     'bg-purple-100 text-purple-700',
    freemium: 'bg-orange-100 text-orange-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[pricing] ?? 'bg-gray-100 text-gray-700'}`}>
      {label}
    </span>
  );
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= Math.round(rating) ? 'fill-[#ff9900] text-[#ff9900]' : 'text-[#d5dbdb]'}`} />
      ))}
      <span className="ml-1 text-xs text-[#545b64]">{rating.toFixed(1)}</span>
    </span>
  );
}

function ItemCard({ item, onDeploy }: { item: MarketplaceItem; onDeploy: (item: MarketplaceItem) => void }) {
  return (
    <div className="bg-white border border-[#d5dbdb] rounded-sm hover:border-[#ff9900] hover:shadow-md transition-all flex flex-col">
      {(item.isNew || item.isFeatured) && (
        <div className="flex">
          {item.isFeatured && (
            <span className="px-2 py-0.5 bg-[#232f3e] text-white text-xs font-medium rounded-tl-sm">Featured</span>
          )}
          {item.isNew && (
            <span className="px-2 py-0.5 bg-[#ff9900] text-[#232f3e] text-xs font-medium">New</span>
          )}
        </div>
      )}
      <div className="p-4 flex-1">
        <div className="flex items-start space-x-3 mb-3">
          <div className="w-10 h-10 rounded bg-[#232f3e] flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-bold">{item.vendorLogo}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-[#16191f] truncate">{item.name}</h3>
            <p className="text-xs text-[#545b64]">{item.vendor}</p>
          </div>
          <PricingBadge pricing={item.pricing} label={item.priceLabel} />
        </div>

        <p className="text-xs text-[#545b64] mb-3 line-clamp-2">{item.shortDesc}</p>

        <div className="flex items-center justify-between mb-3">
          <RatingStars rating={item.rating} />
          <span className="text-xs text-[#aab7b8]">
            <Download className="w-3 h-3 inline mr-1" />{item.downloads.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-wrap gap-1 mb-3">
          {item.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-1.5 py-0.5 bg-[#f2f3f3] text-[#545b64] text-xs rounded">{tag}</span>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs text-[#545b64] border-t border-[#eaeded] pt-3">
          <span className="flex items-center"><Cpu className="w-3 h-3 mr-1" />{item.requiredCPU} vCPU</span>
          <span className="flex items-center"><MemoryStick className="w-3 h-3 mr-1" />{item.requiredMemGB} GB</span>
          <span className="flex items-center"><HardDrive className="w-3 h-3 mr-1" />{item.requiredDiskGB} GB</span>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-[#eaeded] flex items-center justify-between">
        <span className="text-xs text-[#545b64] capitalize">{item.deploymentType}</span>
        <button
          onClick={() => onDeploy(item)}
          className="px-3 py-1.5 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-xs font-medium rounded-sm transition-colors"
        >
          Deploy
        </button>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePricing, setActivePricing] = useState('All Pricing');
  const [deployTarget, setDeployTarget] = useState<MarketplaceItem | null>(null);

  const filtered = useMemo(() => {
    return marketplaceItems.filter(item => {
      const matchSearch = !searchTerm ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.vendor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = activeCategory === 'All' || item.category === activeCategory;
      const matchPrice = activePricing === 'All Pricing' || item.pricing === activePricing.toLowerCase();
      return matchSearch && matchCat && matchPrice;
    });
  }, [searchTerm, activeCategory, activePricing]);

  const featured = marketplaceItems.filter(i => i.isFeatured);

  return (
    <div className="p-6 bg-[#f2f3f3] min-h-[calc(100vh-84px)]">
      <Breadcrumb />

      {/* Hero */}
      <div className="bg-[#232f3e] rounded-sm p-8 mb-6 text-white">
        <div className="flex items-center mb-4">
          <ShoppingBag className="w-8 h-8 text-[#ff9900] mr-3" />
          <div>
            <h1 className="text-2xl font-normal">VMware Marketplace</h1>
            <p className="text-[#aab7b8] text-sm">Deploy enterprise-ready software directly to your VMC infrastructure</p>
          </div>
        </div>
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#545b64]" />
          <input
            type="text"
            placeholder="Search software, vendors, categories…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-sm text-[#16191f] text-sm focus:outline-none focus:ring-2 focus:ring-[#ff9900]"
          />
        </div>
      </div>

      {/* Featured */}
      {!searchTerm && activeCategory === 'All' && activePricing === 'All Pricing' && featured.length > 0 && (
        <div className="mb-6">
          <h2 className="text-base font-normal text-[#16191f] mb-3">Featured Solutions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featured.map(item => (
              <div key={item.id} className="bg-white border border-[#ff9900] rounded-sm p-4 flex items-start space-x-3">
                <div className="w-10 h-10 rounded bg-[#232f3e] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">{item.vendorLogo}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#16191f]">{item.name}</h3>
                  <p className="text-xs text-[#545b64] mb-1">{item.vendor}</p>
                  <p className="text-xs text-[#545b64] line-clamp-2">{item.shortDesc}</p>
                  <div className="flex items-center justify-between mt-2">
                    <RatingStars rating={item.rating} />
                    <PricingBadge pricing={item.pricing} label={item.priceLabel} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-52 flex-shrink-0 space-y-6">
          <div>
            <h3 className="text-xs font-semibold text-[#545b64] uppercase tracking-wide mb-2">Categories</h3>
            <div className="space-y-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    activeCategory === cat
                      ? 'bg-[#ff9900] text-[#232f3e] font-medium'
                      : 'text-[#545b64] hover:bg-white hover:text-[#16191f]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#545b64] uppercase tracking-wide mb-2">Pricing</h3>
            <div className="space-y-1">
              {PRICING_FILTERS.map(p => (
                <button
                  key={p}
                  onClick={() => setActivePricing(p)}
                  className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
                    activePricing === p
                      ? 'bg-[#ff9900] text-[#232f3e] font-medium'
                      : 'text-[#545b64] hover:bg-white hover:text-[#16191f]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[#545b64]">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</p>
            <div className="flex items-center space-x-2 text-sm text-[#545b64]">
              <Tag className="w-4 h-4" />
              <span>Sort: Popularity</span>
            </div>
          </div>
          {filtered.length === 0 ? (
            <div className="bg-white border border-[#d5dbdb] rounded-sm p-12 text-center">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-[#aab7b8]" />
              <p className="text-sm text-[#545b64]">No solutions match your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => (
                <ItemCard key={item.id} item={item} onDeploy={setDeployTarget} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Deploy Modal */}
      {deployTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-[520px]">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between">
              <h2 className="text-lg font-medium text-[#16191f]">Deploy: {deployTarget.name}</h2>
              <button onClick={() => setDeployTarget(null)} className="text-[#545b64] hover:text-[#16191f] text-xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-[#f2f3f3] rounded">
                <div className="w-10 h-10 rounded bg-[#232f3e] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">{deployTarget.vendorLogo}</span>
                </div>
                <div>
                  <p className="font-medium text-[#16191f] text-sm">{deployTarget.name}</p>
                  <p className="text-xs text-[#545b64]">{deployTarget.vendor} · v{deployTarget.version}</p>
                  <p className="text-xs text-[#545b64] mt-1">{deployTarget.description}</p>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#545b64] mb-1">Target SDDC / Cluster</label>
                <select className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]">
                  <option>sddc-use1-prod / cluster-use1-prod-01</option>
                  <option>sddc-usw2-prod / cluster-usw2-prod-01</option>
                  <option>sddc-euw2-prod / cluster-euw2-prod-01</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#545b64] mb-1">Target Segment</label>
                <select className="w-full border border-[#d5dbdb] rounded px-3 py-2 text-sm focus:outline-none focus:border-[#ff9900]">
                  <option>prod-web (10.0.1.0/24)</option>
                  <option>prod-app (10.0.10.0/24)</option>
                  <option>mgmt (10.0.100.0/24)</option>
                </select>
              </div>
              <div className="text-xs text-[#545b64] p-3 bg-[#fff4e6] border border-[#ff9900] rounded">
                Requires: {deployTarget.requiredCPU} vCPU · {deployTarget.requiredMemGB} GB RAM · {deployTarget.requiredDiskGB} GB disk
              </div>
            </div>
            <div className="px-6 py-4 border-t border-[#eaeded] bg-[#fafafa] flex justify-end space-x-3">
              <button onClick={() => setDeployTarget(null)} className="px-4 py-2 border border-[#d5dbdb] rounded text-sm hover:bg-[#f2f3f3]">Cancel</button>
              <button onClick={() => setDeployTarget(null)} className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm flex items-center">
                <ExternalLink className="w-4 h-4 mr-2" />Deploy Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
