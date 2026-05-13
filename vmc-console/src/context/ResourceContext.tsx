'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { VM, Volume, SecurityGroup } from '../types';
import { vms as initialVMs, volumes as initialVolumes, securityGroups as initialSGs, recentActivity as initialActivity } from '../data/mockData';
import { RecentActivity } from '../types';

interface ResourceContextType {
  vms: VM[];
  volumes: Volume[];
  securityGroups: SecurityGroup[];
  recentActivity: RecentActivity[];
  // VM operations
  launchVM: (vm: Omit<VM, 'id' | 'launchTime'>) => VM;
  updateVMStatus: (id: string, status: VM['status']) => void;
  terminateVMs: (ids: string[]) => void;
  // Volume operations
  createVolume: (vol: Omit<Volume, 'id'>) => Volume;
  deleteVolumes: (ids: string[]) => void;
  attachVolume: (volId: string, vmId: string) => void;
  detachVolume: (volId: string) => void;
  // Security group operations
  createSecurityGroup: (sg: Omit<SecurityGroup, 'id'>) => SecurityGroup;
  deleteSecurityGroups: (ids: string[]) => void;
  updateSecurityGroup: (id: string, updates: Partial<SecurityGroup>) => void;
}

const ResourceContext = createContext<ResourceContextType | null>(null);

function generateId(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2, 12)}`;
}

function addActivity(prev: RecentActivity[], action: string, resource: string, status: 'success' | 'warning' | 'error', region: string): RecentActivity[] {
  const entry: RecentActivity = {
    id: `act-${Date.now()}`,
    action,
    resource,
    time: new Date().toISOString(),
    status,
    region,
  };
  return [entry, ...prev].slice(0, 20);
}

export function ResourceProvider({ children }: { children: ReactNode }) {
  const [vms, setVMs] = useState<VM[]>(initialVMs);
  const [volumes, setVolumes] = useState<Volume[]>(initialVolumes);
  const [securityGroups, setSGs] = useState<SecurityGroup[]>(initialSGs);
  const [recentActivity, setActivity] = useState<RecentActivity[]>(initialActivity);

  const launchVM = (vmData: Omit<VM, 'id' | 'launchTime'>): VM => {
    const vm: VM = {
      ...vmData,
      id: generateId('i'),
      launchTime: new Date().toISOString(),
      status: 'provisioning',
    };
    setVMs(prev => [vm, ...prev]);
    setActivity(prev => addActivity(prev, 'Instance launched', `${vm.id} (${vm.name})`, 'success', vm.region));
    // Transition to running after 3s
    setTimeout(() => {
      setVMs(prev => prev.map(v => v.id === vm.id ? { ...v, status: 'running' } : v));
    }, 3000);
    return vm;
  };

  const updateVMStatus = (id: string, status: VM['status']) => {
    setVMs(prev => prev.map(v => v.id === id ? { ...v, status } : v));
    const vm = vms.find(v => v.id === id);
    const action = status === 'running' ? 'Instance started' : status === 'stopped' ? 'Instance stopped' : 'Instance rebooted';
    setActivity(prev => addActivity(prev, action, `${id} (${vm?.name || ''})`, 'success', vm?.region || 'global'));
  };

  const terminateVMs = (ids: string[]) => {
    setVMs(prev => prev.map(v => ids.includes(v.id) ? { ...v, status: 'error' as VM['status'] } : v));
    ids.forEach(id => {
      const vm = vms.find(v => v.id === id);
      setActivity(prev => addActivity(prev, 'Instance terminated', `${id} (${vm?.name || ''})`, 'error', vm?.region || 'global'));
    });
    setTimeout(() => {
      setVMs(prev => prev.filter(v => !ids.includes(v.id)));
    }, 1500);
  };

  const createVolume = (volData: Omit<Volume, 'id'>): Volume => {
    const vol: Volume = { ...volData, id: generateId('vol') };
    setVolumes(prev => [vol, ...prev]);
    setActivity(prev => addActivity(prev, 'Volume created', `${vol.id} (${vol.name})`, 'success', vol.region));
    return vol;
  };

  const deleteVolumes = (ids: string[]) => {
    setVolumes(prev => prev.filter(v => !ids.includes(v.id)));
    setActivity(prev => addActivity(prev, `Deleted ${ids.length} volume(s)`, ids.join(', '), 'success', 'global'));
  };

  const attachVolume = (volId: string, vmId: string) => {
    setVolumes(prev => prev.map(v => v.id === volId ? { ...v, attachedTo: vmId, status: 'in-use' } : v));
    setActivity(prev => addActivity(prev, 'Volume attached', `${volId} → ${vmId}`, 'success', 'global'));
  };

  const detachVolume = (volId: string) => {
    setVolumes(prev => prev.map(v => v.id === volId ? { ...v, attachedTo: undefined, status: 'available' } : v));
    setActivity(prev => addActivity(prev, 'Volume detached', volId, 'success', 'global'));
  };

  const createSecurityGroup = (sgData: Omit<SecurityGroup, 'id'>): SecurityGroup => {
    const sg: SecurityGroup = { ...sgData, id: generateId('sg') };
    setSGs(prev => [sg, ...prev]);
    setActivity(prev => addActivity(prev, 'Security group created', `${sg.id} (${sg.name})`, 'success', sg.region));
    return sg;
  };

  const deleteSecurityGroups = (ids: string[]) => {
    setSGs(prev => prev.filter(sg => !ids.includes(sg.id)));
    setActivity(prev => addActivity(prev, `Deleted ${ids.length} security group(s)`, ids.join(', '), 'success', 'global'));
  };

  const updateSecurityGroup = (id: string, updates: Partial<SecurityGroup>) => {
    setSGs(prev => prev.map(sg => sg.id === id ? { ...sg, ...updates } : sg));
  };

  return (
    <ResourceContext.Provider value={{
      vms, volumes, securityGroups, recentActivity,
      launchVM, updateVMStatus, terminateVMs,
      createVolume, deleteVolumes, attachVolume, detachVolume,
      createSecurityGroup, deleteSecurityGroups, updateSecurityGroup,
    }}>
      {children}
    </ResourceContext.Provider>
  );
}

export function useResources() {
  const ctx = useContext(ResourceContext);
  if (!ctx) throw new Error('useResources must be used within ResourceProvider');
  return ctx;
}
