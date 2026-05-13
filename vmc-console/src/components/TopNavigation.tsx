'use client';

import { useState } from 'react';
import { 
  TopNavigation as CloudscapeTopNav,
  Button,
  Input,
  Select,
  SpaceBetween 
} from '@cloudscape-design/components';
import { Search, Bell, HelpCircle, Cog, MapPin } from 'lucide-react';
import { regions } from '../data/mockData';

interface TopNavigationProps {
  currentRegion: string;
  onRegionChange: (region: string) => void;
}

export default function TopNavigation({ currentRegion, onRegionChange }: TopNavigationProps) {
  const [searchValue, setSearchValue] = useState('');

  const regionOptions = regions.map((r: { name: string; id: string; location: string }) => ({
    label: r.name,
    value: r.id,
    description: r.location
  }));

  return (
    <header className="bg-[#232f3e] text-white sticky top-0 z-50">
      {/* Main top bar */}
      <div className="flex items-center h-[48px] px-4">
        {/* Logo */}
        <div className="flex items-center mr-8">
          <div className="w-8 h-8 bg-white rounded mr-2 flex items-center justify-center">
            <span className="text-[#232f3e] font-bold text-xs">VMW</span>
          </div>
          <span className="font-semibold text-sm tracking-wide">VMware VMC</span>
        </div>

        {/* Search bar */}
        <div className="flex-1 max-w-2xl mx-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for services, features, marketplace products, and docs"
              className="w-full h-9 pl-3 pr-10 bg-white text-gray-900 text-sm rounded-sm focus:outline-none focus:ring-2 focus:ring-[#ff9900]"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
            <button className="absolute right-0 top-0 h-9 w-10 bg-[#ff9900] hover:bg-[#e88a00] flex items-center justify-center rounded-r-sm transition-colors">
              <Search className="w-4 h-4 text-[#232f3e]" />
            </button>
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center ml-auto space-x-1">
          {/* Region Selector */}
          <div className="flex items-center mr-4 px-3 py-1 hover:bg-[#2a3b4c] cursor-pointer rounded group">
            <MapPin className="w-4 h-4 mr-2 text-[#ff9900]" />
            <select
              value={currentRegion}
              onChange={(e) => onRegionChange(e.target.value)}
              className="bg-transparent text-white text-sm border-none outline-none cursor-pointer group-hover:text-white"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
            >
              {regions.map((region: { id: string; name: string }) => (
                <option key={region.id} value={region.id} className="text-gray-900">
                  {region.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action icons */}
          <button className="p-2 hover:bg-[#2a3b4c] rounded relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff9900] rounded-full"></span>
          </button>
          <button className="p-2 hover:bg-[#2a3b4c] rounded">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-[#2a3b4c] rounded">
            <Cog className="w-5 h-5" />
          </button>
          
          {/* User avatar */}
          <div className="ml-2 flex items-center hover:bg-[#2a3b4c] p-1 rounded cursor-pointer">
            <div className="w-8 h-8 bg-[#ff9900] rounded-full flex items-center justify-center text-[#232f3e] font-semibold text-sm">
              AD
            </div>
            <span className="ml-2 text-sm hidden lg:inline">vmc-user</span>
          </div>
        </div>
      </div>

      {/* Secondary navigation bar */}
      <div className="bg-[#16191f] h-[36px] flex items-center px-4 text-sm border-t border-[#414750]">
        <nav className="flex items-center space-x-6">
          <a href="#" className="text-white hover:text-[#ff9900] transition-colors font-medium">Services</a>
          <a href="#" className="text-[#d5dbdb] hover:text-white transition-colors">Resource Groups</a>
          <span className="text-[#687078]">|</span>
          <a href="#" className="text-[#d5dbdb] hover:text-white transition-colors flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
            New – vSAN 8 Update 3
          </a>
        </nav>
      </div>
    </header>
  );
}
