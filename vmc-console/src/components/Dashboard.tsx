'use client';

import { useMemo, useState } from 'react';
import {
  Server,
  Database,
  Shield,
  DollarSign,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Plus,
  Activity,
} from 'lucide-react';
import { regions } from '../data/mockData';
import { useResources } from '../context/ResourceContext';
import { useAuth } from '../context/AuthContext';

interface DashboardProps { currentRegion: string; onNavigate?: (item: string) => void; }

function StatusDot({ status }: { status: string }) {
  const cls: Record<string, string> = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unhealthy: 'bg-red-500',
    running: 'bg-green-500',
    stopped: 'bg-gray-400',
    error: 'bg-red-500',
    provisioning: 'bg-yellow-500 animate-pulse',
  };
  return <span className={`inline-block w-2 h-2 rounded-full mr-2 flex-shrink-0 ${cls[status] || 'bg-gray-400'}`} />;
}

function StatCard({
  title, value, sub, icon: Icon, trend, trendUp, alert, link, accent,
}: {
  title: string; value: string | number; sub: string; icon: React.ElementType;
  trend?: string; trendUp?: boolean; alert?: boolean; link?: string; accent?: boolean;
}) {
  return (
    <div className={`bg-white border rounded-sm p-4 hover:shadow-sm transition-shadow cursor-pointer ${accent ? 'border-[#ff9900]' : 'border-[#d5dbdb]'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-[#545b64] text-xs font-medium uppercase tracking-wide mb-2">{title}</h3>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-light text-[#16191f]">{value}</span>
            {alert && <AlertTriangle className="w-4 h-4 text-[#ff9900]" />}
          </div>
          <p className="text-[#545b64] text-xs mt-1">{sub}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-xs ${trendUp ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingDown className="w-3 h-3 mr-1" />{trend}
            </div>
          )}
        </div>
        <div className="p-2 bg-[#f2f3f3] rounded ml-3">
          <Icon className="w-5 h-5 text-[#545b64]" />
        </div>
      </div>
      {link && (
        <div className="mt-3 pt-3 border-t border-[#eaeded]">
          <span className="text-[#0073bb] text-xs hover:underline">{link} →</span>
        </div>
      )}
    </div>
  );
}

export default function Dashboard({ currentRegion, onNavigate }: DashboardProps) {
  const { vms, volumes, securityGroups, recentActivity } = useResources();
  const { user } = useAuth();
  const [alertDismissed, setAlertDismissed] = useState(false);

  const regionVMs = useMemo(() => vms.filter(v => v.region === currentRegion), [vms, currentRegion]);
  const regionVolumes = useMemo(() => volumes.filter(v => v.region === currentRegion), [volumes, currentRegion]);
  const regionSGs = useMemo(() => securityGroups.filter(sg => sg.region === currentRegion), [securityGroups, currentRegion]);

  const running = regionVMs.filter(v => v.status === 'running').length;
  const stopped = regionVMs.filter(v => v.status === 'stopped').length;
  const errored = regionVMs.filter(v => v.status === 'error').length;
  const provisioning = regionVMs.filter(v => v.status === 'provisioning').length;

  const allSDDCs = useMemo(() => regions.flatMap(r => r.sddcs), []);
  const degraded = allSDDCs.find(s => s.status === 'degraded');

  const currentRegionData = regions.find(r => r.id === currentRegion);

  return (
    <div className="p-6 bg-[#f2f3f3] min-h-[calc(100vh-84px)]">
      {/* Alert banner */}
      {!alertDismissed && degraded && (
        <div className="mb-5 bg-[#fff4e6] border border-[#ff9900] rounded-sm p-4 flex items-start">
          <AlertTriangle className="w-5 h-5 text-[#ff9900] mr-3 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[#16191f] text-sm">
              <span className="font-semibold">Action required</span> — {degraded.region} SDDC degraded.
              CPU utilization is at {degraded.cpu}% for 22 minutes. Auto-remediation has been queued.{' '}
              <a href="#" className="text-[#0073bb] hover:underline">View alarm details →</a>
            </p>
          </div>
          <button onClick={() => setAlertDismissed(true)} className="text-[#545b64] hover:text-[#16191f] ml-3 text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-[#16191f]">Console Home</h1>
          <p className="text-sm text-[#545b64] mt-0.5">
            Region: <span className="font-medium text-[#16191f]">{currentRegionData?.name}</span>
            {user && <span className="ml-3 text-[#aab7b8]">Signed in as <span className="text-[#16191f]">{user.username}</span></span>}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onNavigate?.('virtual-machines')}
            className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm transition-colors flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Launch instance
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Instances"
          value={regionVMs.length}
          sub={`${running} running · ${stopped} stopped${errored ? ` · ${errored} error` : ''}${provisioning ? ` · ${provisioning} provisioning` : ''}`}
          icon={Server}
          link="View all instances"
        />
        <StatCard
          title="Volumes"
          value={regionVolumes.length}
          sub={`${regionVolumes.filter(v => v.status === 'in-use').length} in-use · ${regionVolumes.reduce((s, v) => s + v.size, 0).toLocaleString()} GiB`}
          icon={Database}
          link="View volumes"
        />
        <StatCard
          title="Security Groups"
          value={regionSGs.length}
          sub={`${regionSGs.reduce((s, sg) => s + sg.rules, 0)} rules · ${regionSGs.reduce((s, sg) => s + sg.vpcs, 0)} VPCs`}
          icon={Shield}
          link="View security groups"
        />
        <StatCard
          title="Cost (this month)"
          value="$183k"
          sub="Across all SDDCs"
          icon={DollarSign}
          trend="12% from last month"
          trendUp={false}
          alert
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SDDC Health */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm">
          <div className="px-4 py-3 border-b border-[#d5dbdb] flex items-center justify-between">
            <h2 className="text-base font-normal text-[#16191f]">SDDC Health by Region</h2>
            <button onClick={() => onNavigate?.('monitoring')} className="text-[#0073bb] text-xs hover:underline">View Health Dashboard →</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                  <th className="text-left px-4 py-2 text-[#545b64] font-medium text-xs">Region</th>
                  <th className="text-left px-4 py-2 text-[#545b64] font-medium text-xs">SDDC</th>
                  <th className="text-left px-4 py-2 text-[#545b64] font-medium text-xs">Status</th>
                  <th className="text-right px-4 py-2 text-[#545b64] font-medium text-xs">VMs</th>
                  <th className="text-right px-4 py-2 text-[#545b64] font-medium text-xs">CPU%</th>
                  <th className="text-right px-4 py-2 text-[#545b64] font-medium text-xs">Mem%</th>
                </tr>
              </thead>
              <tbody>
                {allSDDCs.map(sddc => (
                  <tr key={sddc.id} className="border-b border-[#eaeded] hover:bg-[#f2f3f3]">
                    <td className="px-4 py-2.5 text-xs text-[#545b64]">{sddc.region}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-[#0073bb]">{sddc.name}</td>
                    <td className="px-4 py-2.5">
                      <span className="flex items-center text-xs">
                        <StatusDot status={sddc.status} />
                        <span className={sddc.status === 'degraded' ? 'text-yellow-700 font-medium' : sddc.status === 'unhealthy' ? 'text-red-700' : 'text-green-700'}>
                          {sddc.status.charAt(0).toUpperCase() + sddc.status.slice(1)}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-[#16191f]">{sddc.vms}</td>
                    <td className={`px-4 py-2.5 text-right text-xs ${sddc.cpu > 85 ? 'text-red-600 font-semibold' : 'text-[#16191f]'}`}>
                      {sddc.cpu}%
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-[#16191f]">{sddc.memory}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-[#d5dbdb] rounded-sm">
          <div className="px-4 py-3 border-b border-[#d5dbdb] flex items-center justify-between">
            <h2 className="text-base font-normal text-[#16191f]">Recent Activity</h2>
            <button onClick={() => onNavigate?.('activity-log')} className="text-[#0073bb] text-xs hover:underline">View all events →</button>
          </div>
          <div className="divide-y divide-[#eaeded] max-h-80 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <div className="py-10 text-center">
                <Activity className="w-8 h-8 mx-auto mb-3 text-[#aab7b8]" />
                <p className="text-sm text-[#545b64]">No recent activity</p>
              </div>
            ) : (
              recentActivity.map(a => (
                <div key={a.id} className="px-4 py-3 hover:bg-[#f2f3f3]">
                  <div className="flex items-start space-x-3">
                    <span className="flex-shrink-0 mt-1">
                      {a.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                        a.status === 'warning' ? <AlertTriangle className="w-4 h-4 text-[#ff9900]" /> :
                          <XCircle className="w-4 h-4 text-red-500" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#16191f]">{a.action}</p>
                      <p className="text-xs text-[#0073bb] truncate">{a.resource}</p>
                      <div className="flex items-center mt-1 text-xs text-[#aab7b8] space-x-2">
                        <span>{new Date(a.time).toLocaleString()}</span>
                        <span>·</span>
                        <span className="font-mono">{a.region}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="mt-6 bg-white border border-[#d5dbdb] rounded-sm">
        <div className="px-4 py-3 border-b border-[#d5dbdb] flex items-center justify-between">
          <h2 className="text-base font-normal text-[#16191f]">Cost Breakdown by Region</h2>
          <button onClick={() => onNavigate?.('cost-management')} className="text-[#0073bb] text-xs hover:underline">View Cost Management →</button>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'US East (N. Virginia)', cost: '$56k', pct: 31 },
            { label: 'US West (Oregon)', cost: '$47k', pct: 26 },
            { label: 'EU (London)', cost: '$52k', pct: 28 },
            { label: 'AP (Singapore)', cost: '$28k', pct: 15 },
          ].map(r => (
            <div key={r.label} className="p-3 bg-[#f2f3f3] rounded border border-[#eaeded]">
              <p className="text-xs text-[#545b64] truncate">{r.label}</p>
              <p className="text-lg font-medium text-[#16191f] mt-1">{r.cost}</p>
              <div className="mt-2 h-1.5 bg-[#d5dbdb] rounded-full">
                <div className="h-1.5 bg-[#ff9900] rounded-full" style={{ width: `${r.pct}%` }} />
              </div>
              <p className="text-xs text-[#545b64] mt-1">{r.pct}% of total</p>
            </div>
          ))}
        </div>
      </div>

      {/* Live instance summary for current region */}
      {regionVMs.length > 0 && (
        <div className="mt-6 bg-white border border-[#d5dbdb] rounded-sm">
          <div className="px-4 py-3 border-b border-[#d5dbdb]">
            <h2 className="text-base font-normal text-[#16191f]">Instances in {currentRegionData?.name}</h2>
          </div>
          <div className="divide-y divide-[#eaeded]">
            {regionVMs.slice(0, 5).map(vm => (
              <div key={vm.id} className="px-4 py-3 flex items-center justify-between hover:bg-[#f2f3f3]">
                <div className="flex items-center space-x-3">
                  <StatusDot status={vm.status} />
                  <div>
                    <p className="text-sm font-medium text-[#0073bb]">{vm.name}</p>
                    <p className="text-xs font-mono text-[#aab7b8]">{vm.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-xs text-[#545b64]">
                  <span>{vm.cpu} vCPU / {vm.memory} GiB</span>
                  <span className="font-mono">{vm.privateIp}</span>
                  {vm.status === 'provisioning' && <Clock className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />}
                </div>
              </div>
            ))}
            {regionVMs.length > 5 && (
              <button onClick={() => onNavigate?.('virtual-machines')} className="px-4 py-2 text-xs text-[#0073bb] hover:underline">
                View all {regionVMs.length} instances →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
