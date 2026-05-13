'use client';

import { useState, useMemo } from 'react';
import { 
  BarChart3, Activity, FileText, Settings, ChevronRight, Home, 
  Search, Filter, MoreHorizontal, AlertTriangle, CheckCircle,
  Clock, TrendingUp, TrendingDown, RefreshCw, Download, Calendar,
  X, Bell
} from 'lucide-react';
import { regions } from '../data/mockData';

interface MonitoringPageProps {
  currentRegion: string;
}

type MonitoringTab = 'dashboard' | 'alarms' | 'logs' | 'events';

interface Alarm {
  id: string;
  name: string;
  state: 'ALARM' | 'OK' | 'INSUFFICIENT_DATA';
  metric: string;
  threshold: string;
  current: string;
  lastUpdated: string;
}

const mockAlarms: Alarm[] = [
  { id: 'alarm-001', name: 'High CPU Utilization - EU SDDC', state: 'ALARM', metric: 'CPUUtilization', threshold: '> 80%', current: '91%', lastUpdated: '2024-05-05T13:45:00Z' },
  { id: 'alarm-002', name: 'Memory Usage - US-East Prod', state: 'OK', metric: 'MemoryUsage', threshold: '> 85%', current: '62%', lastUpdated: '2024-05-05T13:30:00Z' },
  { id: 'alarm-003', name: 'Storage Capacity - VSAN-01', state: 'ALARM', metric: 'StorageUsed', threshold: '> 90%', current: '93%', lastUpdated: '2024-05-05T12:00:00Z' },
  { id: 'alarm-004', name: 'Network Latency', state: 'OK', metric: 'NetworkLatency', threshold: '> 100ms', current: '45ms', lastUpdated: '2024-05-05T13:50:00Z' },
];

function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex items-center text-sm text-[#545b64] mb-4">
      <Home className="w-4 h-4 mr-2" />
      {items.map((item, index) => (
        <span key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
          {item.href ? (
            <a href={item.href} className="hover:text-[#0073bb] hover:underline">{item.label}</a>
          ) : (
            <span className="text-[#16191f]">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function MetricChart({ title, value, trend, trendValue, data }: { 
  title: string; 
  value: string; 
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  data: number[];
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  return (
    <div className="bg-white border border-[#d5dbdb] rounded p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[#545b64]">{title}</h3>
        <div className="flex items-center space-x-1">
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-green-500" />}
          <span className={`text-xs ${trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-[#545b64]'}`}>
            {trendValue}
          </span>
        </div>
      </div>
      <div className="text-2xl font-light text-[#16191f] mb-4">{value}</div>
      <div className="h-16 flex items-end space-x-1">
        {data.map((point, i) => (
          <div 
            key={i}
            className="flex-1 bg-[#0073bb] rounded-t"
            style={{ height: `${((point - min) / range) * 100}%`, opacity: 0.3 + (i / data.length) * 0.7 }}
          ></div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-[#aab7b8] mt-2">
        <span>-1h</span>
        <span>Now</span>
      </div>
    </div>
  );
}

export default function MonitoringPage({ currentRegion }: MonitoringPageProps) {
  const [activeTab, setActiveTab] = useState<MonitoringTab>('dashboard');
  const [timeRange, setTimeRange] = useState('1h');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAlarms = useMemo(() => {
    return mockAlarms.filter(alarm => 
      alarm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alarm.metric.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const alarmStats = useMemo(() => ({
    alarm: mockAlarms.filter(a => a.state === 'ALARM').length,
    ok: mockAlarms.filter(a => a.state === 'OK').length,
    insufficient: mockAlarms.filter(a => a.state === 'INSUFFICIENT_DATA').length,
  }), []);

  return (
    <div className="p-6 bg-[#f2f3f3] min-h-[calc(100vh-84px)]">
      <Breadcrumb items={[
        { label: 'Services', href: '#' },
        { label: 'Management & Governance', href: '#' },
        { label: 'VMC Monitor' }
      ]} />

      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-normal text-[#16191f] mb-1">VMC Monitor</h1>
            <p className="text-[#545b64] text-sm">
              Region: <span className="text-[#16191f] font-medium">{regions.find(r => r.id === currentRegion)?.name}</span> — 
              Monitor resources, set alarms, and analyze logs
            </p>
          </div>
          <div className="flex space-x-2">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
            >
              <option value="1h">Last hour</option>
              <option value="3h">Last 3 hours</option>
              <option value="12h">Last 12 hours</option>
              <option value="1d">Last day</option>
              <option value="7d">Last 7 days</option>
            </select>
            <button className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Create Alarm
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 border-b border-[#d5dbdb]">
        <div className="flex space-x-1">
          {[
            { id: 'dashboard', label: 'Dashboards', icon: BarChart3 },
            { id: 'alarms', label: 'Alarms', icon: AlertTriangle, count: alarmStats.alarm },
            { id: 'logs', label: 'Logs', icon: FileText },
            { id: 'events', label: 'Events', icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MonitoringTab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center ${
                activeTab === tab.id 
                  ? 'border-[#ff9900] text-[#16191f]' 
                  : 'border-transparent text-[#545b64] hover:text-[#16191f]'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-2 px-2 py-0.5 text-xs rounded ${
                  tab.count > 0 ? 'bg-red-100 text-red-700' : 'bg-[#eaeded]'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border border-[#d5dbdb] rounded p-4">
              <p className="text-xs text-[#545b64] uppercase mb-1">CPU Utilization (Avg)</p>
              <p className="text-2xl font-light text-[#16191f]">67.4%</p>
              <span className="text-xs text-red-500 flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                +12% from last hour
              </span>
            </div>
            <div className="bg-white border border-[#d5dbdb] rounded p-4">
              <p className="text-xs text-[#545b64] uppercase mb-1">Memory Usage (Avg)</p>
              <p className="text-2xl font-light text-[#16191f]">58.2%</p>
              <span className="text-xs text-green-500 flex items-center mt-1">
                <TrendingDown className="w-3 h-3 mr-1" />
                -5% from last hour
              </span>
            </div>
            <div className="bg-white border border-[#d5dbdb] rounded p-4">
              <p className="text-xs text-[#545b64] uppercase mb-1">Network In</p>
              <p className="text-2xl font-light text-[#16191f]">1.2 Gbps</p>
              <span className="text-xs text-[#545b64] mt-1">Across all VMs</span>
            </div>
            <div className="bg-white border border-[#d5dbdb] rounded p-4">
              <p className="text-xs text-[#545b64] uppercase mb-1">Active Alarms</p>
              <p className="text-2xl font-light text-red-600">{alarmStats.alarm}</p>
              <span className="text-xs text-[#545b64] mt-1">{alarmStats.ok} OK</span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-4">
            <MetricChart 
              title="CPU Utilization" 
              value="67.4%" 
              trend="up" 
              trendValue="+12%"
              data={[45, 52, 48, 61, 55, 67, 72, 69, 74, 67, 64, 67]}
            />
            <MetricChart 
              title="Memory Usage" 
              value="58.2%" 
              trend="down" 
              trendValue="-5%"
              data={[62, 61, 64, 63, 62, 60, 59, 58, 59, 57, 58, 58]}
            />
            <MetricChart 
              title="Network In (MB/s)" 
              value="145 MB/s" 
              trend="neutral" 
              trendValue="0%"
              data={[120, 135, 128, 142, 138, 145, 152, 148, 140, 145, 142, 145]}
            />
            <MetricChart 
              title="Disk IOPS" 
              value="2,847" 
              trend="up" 
              trendValue="+8%"
              data={[2100, 2300, 2450, 2600, 2500, 2750, 2800, 2900, 2750, 2850, 2750, 2847]}
            />
          </div>

          {/* Recent Alarms Summary */}
          <div className="bg-white border border-[#d5dbdb] rounded">
            <div className="px-4 py-3 border-b border-[#d5dbdb] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#16191f]">Recent Alarms</h3>
              <button 
                onClick={() => setActiveTab('alarms')}
                className="text-xs text-[#0073bb] hover:underline"
              >
                View all
              </button>
            </div>
            <div className="divide-y divide-[#eaeded]">
              {mockAlarms.slice(0, 3).map(alarm => (
                <div key={alarm.id} className="px-4 py-3 flex items-center justify-between hover:bg-[#f2f3f3]">
                  <div className="flex items-center">
                    {alarm.state === 'ALARM' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500 mr-3" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-[#16191f]">{alarm.name}</p>
                      <p className="text-xs text-[#545b64]">{alarm.metric}: {alarm.current} (threshold: {alarm.threshold})</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    alarm.state === 'ALARM' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {alarm.state}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Alarms Tab */}
      {activeTab === 'alarms' && (
        <div className="space-y-4">
          {/* Alarm Stats */}
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-red-50 border border-red-200 rounded text-sm font-medium text-red-700">
              In alarm ({alarmStats.alarm})
            </button>
            <button className="px-4 py-2 bg-green-50 border border-green-200 rounded text-sm font-medium text-green-700">
              OK ({alarmStats.ok})
            </button>
            <button className="px-4 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-medium text-gray-700">
              Insufficient data ({alarmStats.insufficient})
            </button>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between bg-white p-3 border border-[#d5dbdb] rounded">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#545b64]" />
                <input
                  type="text"
                  placeholder="Search alarms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-1.5 w-64 border border-[#d5dbdb] rounded text-sm focus:outline-none focus:border-[#ff9900]"
                />
              </div>
              <button className="px-3 py-1.5 text-sm border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-1.5 text-[#545b64] hover:bg-[#f2f3f3] rounded">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button className="px-3 py-1.5 text-sm border border-[#d5dbdb] rounded hover:bg-[#f2f3f3] flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Alarms Table */}
          <div className="bg-white border border-[#d5dbdb] rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#d5dbdb]">
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium">Alarm Name</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium">State</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium">Metric</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium">Threshold</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium">Current</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium">Last Updated</th>
                  <th className="text-left px-4 py-3 text-[#545b64] font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAlarms.map((alarm) => (
                  <tr key={alarm.id} className="border-b border-[#eaeded] hover:bg-[#f2f3f3]">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        {alarm.state === 'ALARM' ? (
                          <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        )}
                        <span className="text-[#16191f] font-medium">{alarm.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        alarm.state === 'ALARM' ? 'bg-red-100 text-red-700' : 
                        alarm.state === 'OK' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {alarm.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#545b64]">{alarm.metric}</td>
                    <td className="px-4 py-3 text-[#545b64]">{alarm.threshold}</td>
                    <td className="px-4 py-3 text-[#16191f] font-medium">{alarm.current}</td>
                    <td className="px-4 py-3 text-[#545b64]">
                      {new Date(alarm.lastUpdated).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 hover:bg-[#eaeded] rounded text-[#545b64]">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-[#d5dbdb] rounded p-8">
          <div className="text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-[#aab7b8]" />
            <h3 className="text-lg font-medium text-[#16191f] mb-2">VMC Logs</h3>
            <p className="text-sm text-[#545b64] mb-4">Monitor, store, and access log files from VMware Cloud</p>
            <button className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm">
              View Log Groups
            </button>
          </div>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="bg-white border border-[#d5dbdb] rounded p-8">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-4 text-[#aab7b8]" />
            <h3 className="text-lg font-medium text-[#16191f] mb-2">VMC Events</h3>
            <p className="text-sm text-[#545b64] mb-4">Respond to state changes in your VMware resources</p>
            <button className="px-4 py-2 bg-[#ff9900] hover:bg-[#e88a00] text-[#232f3e] text-sm font-medium rounded-sm">
              Create Rule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
