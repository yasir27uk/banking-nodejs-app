'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Terminal, 
  X, 
  Maximize2, 
  Minimize2, 
  Play,
  Copy,
  Trash2,
  ChevronRight,
  ChevronDown,
  Settings,
  Plus,
  Wifi,
  WifiOff,
  Download,
  Upload,
  Clock
} from 'lucide-react';
import { cliTools } from '../data/mockData';

interface Tab {
  id: string;
  name: string;
  command: string;
}

interface CommandHistory {
  command: string;
  output: string;
  timestamp: Date;
}

const initialTabs: Tab[] = [
  { id: '1', name: 'vmc-cli', command: 'vmc' },
  { id: '2', name: 'govc', command: 'govc' },
  { id: '3', name: 'nsx-cli', command: 'nsx' },
  { id: '4', name: 'powercli', command: 'powercli' },
];

const mockResponses: Record<string, (cmd: string) => string> = {
  'vmc': (cmd) => {
    if (cmd.includes('help') || cmd === 'vmc') {
      return `VMware Cloud CLI (vmc-cli) version 2.3.0

Usage: vmc [command] [options]

Available Commands:
  login       Authenticate with VMware Cloud
  sddc        Manage SDDCs
  vm          Manage virtual machines
  org         Manage organizations
  vpc         Manage VPCs
  version     Display version information

Flags:
  -h, --help      Help for vmc
  -v, --verbose   Verbose output
  --debug         Debug mode

Use "vmc [command] --help" for more information about a command.`;
    }
    if (cmd.includes('sddc list')) {
      return `SDDC ID          NAME              REGION       VERSION   STATE
───────────────  ────────────────  ───────────  ────────  ───────
sddc-use1-prod   sddc-use1-prod      us-east-1    1.24      READY
sddc-use1-dev    sddc-use1-dev       us-east-1    1.24      READY
sddc-usw2-prod   sddc-usw2-prod      us-west-2    1.24      READY
sddc-euw2-prod   sddc-euw2-prod      eu-west-2    1.23      READY
sddc-apse1-prod  sddc-apse1-prod     ap-southeast-1 1.24    READY`;
    }
    if (cmd.includes('vm list')) {
      return `INSTANCE ID          NAME              STATUS    SDDC            REGION
───────────────────  ────────────────  ────────  ──────────────  ────────────
i-0a1b2c3d4e5f6789a  web-server-01     RUNNING   sddc-use1-prod  us-east-1
i-0b2c3d4e5f6789ab1  app-server-02     RUNNING   sddc-use1-prod  us-east-1
i-0c3d4e5f6789ab12c db-primary        RUNNING   sddc-use1-prod  us-east-1
i-0d4e5f6789ab12c3d dev-workstation-01 STOPPED   sddc-use1-dev   us-east-1
i-0e5f6789ab12c3d4e cache-cluster-01  RUNNING   sddc-usw2-prod  us-west-2`;
    }
    return `Command executed: ${cmd}\nOperation completed successfully.`;
  },
  'govc': (cmd) => {
    if (cmd.includes('help') || cmd === 'govc') {
      return `govc v0.30.0
Usage: govc [OPTIONS] COMMAND [ARGS]

Available commands:
  about           vCenter about info
  cluster         Cluster management
  datastore       Datastore management
  device          Device management
  events          Event manager
  host            Host management
  ls              List items
  vm              Virtual machine management
  pool            Resource pool management
  network         Network management
  version         Display version

Run 'govc COMMAND -h' for command specific help.`;
    }
    if (cmd.includes('ls')) {
      return `/dc1
/dc1/vm
/dc1/host
/dc1/datastore
/dc1/network
/dc1/vm/web-server-01
/dc1/vm/app-server-02
/dc1/vm/db-primary`;
    }
    if (cmd.includes('vm.info')) {
      return `Name:           web-server-01
  Path:         /dc1/vm/web-server-01
  Guest:        Ubuntu 22.04 LTS
  UUID:         421f2c3d-4e5f-6789-ab12-c3d4e5f6789a
  Memory:       16384 MB
  CPU:          4 vCPU
  Power state:  poweredOn
  IP Address:   10.0.1.10
  Uptime:       45d 12h 33m`;
    }
    return `govc: completed successfully`;
  },
  'nsx': (cmd) => {
    if (cmd.includes('help') || cmd === 'nsx') {
      return `NSX CLI - VMware NSX-T Data Center

Usage: nsx [command] [options]

Available Commands:
  get firewall    Get firewall configuration
  set firewall    Configure firewall rules
  get segments    List network segments
  get t1-gateways List Tier-1 gateways
  get t0-gateways List Tier-0 gateways
  traceflow       Run traceflow

Flags:
  -h, --help      Help for nsx
  --debug         Debug mode

Use "nsx [command] --help" for more information about a command.`;
    }
    if (cmd.includes('get segments')) {
      return `SEGMENT ID          NAME              GATEWAY          SUBNET
──────────────────  ────────────────  ───────────────  ────────────
seg-001             prod-segment-01   10.0.1.1         10.0.1.0/24
seg-002             prod-segment-02   10.0.2.1         10.0.2.0/24
seg-003             dev-segment-01    10.1.1.1         10.1.1.0/24`;
    }
    return `NSX command executed: ${cmd}`;
  },
  'powercli': (cmd) => {
    if (cmd === 'powercli') {
      return `VMware PowerCLI 13.2.0 build 22851661

Mode                LastWriteTime         Length Name
----                -------------         ------ ----
d----        05/01/2024   8:30 AM                VMware.Vim
-a---        05/01/2024   8:30 AM          12580 VMware.VimAutomation.Core

Available modules:
- VMware.VimAutomation.Core
- VMware.VimAutomation.Vmc
- VMware.VimAutomation.Nsxt
- VMware.VimAutomation.Srm

Type 'Get-Command -Module VMware*' to see available commands.`;
    }
    if (cmd.includes('Connect-VmcServer')) {
      return `Server                          User                           Version
------                          ----                           -------
vapi.vmc.vmware.com             api-token                      1.0.0`;
    }
    if (cmd.includes('Get-VMCSDDC')) {
      return `Name            : sddc-use1-prod
Id              : a1b2c3d4-e5f6-7890-abcd-ef1234567890
Region          : US_EAST_1
NumHosts        : 4
State           : READY
VmcVersion      : 1.24.0`;
    }
    return `PS /cloudshell> ${cmd}`;
  },
};

interface CloudShellProps {
  forceOpen?: boolean;
}

export default function CloudShell({ forceOpen }: CloudShellProps) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    if (forceOpen) setIsOpen(true);
  }, [forceOpen]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('1');
  const [tabs, setTabs] = useState<Tab[]>(initialTabs);
  const [histories, setHistories] = useState<Record<string, CommandHistory[]>>({
    '1': [{ command: 'vmc login --api-token $VMC_TOKEN', output: 'Successfully authenticated with VMware Cloud.', timestamp: new Date() }],
    '2': [{ command: 'govc about', output: 'Name:    VMware vCenter Server\nVersion: 8.0.2\nOS Type: linux-x64', timestamp: new Date() }],
    '3': [{ command: 'nsx get segments', output: `SEGMENT ID          NAME              GATEWAY          SUBNET
──────────────────  ────────────────  ───────────────  ────────────
seg-001             prod-segment-01   10.0.1.1         10.0.1.0/24
seg-002             prod-segment-02   10.0.2.1         10.0.2.0/24`, timestamp: new Date() }],
    '4': [{ command: 'Connect-VmcServer -RefreshToken $env:VMC_TOKEN', output: 'Connected to VMware Cloud successfully.', timestamp: new Date() }],
  });
  const [currentCommand, setCurrentCommand] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isConnected] = useState(true);
  const [sessionTime, setSessionTime] = useState(0);
  const [suggestion, setSuggestion] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Session timer
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setSessionTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const formatSessionTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const updateSuggestion = useCallback((value: string) => {
    if (!value.trim()) { setSuggestion(''); return; }
    const allCommands = [
      'vmc login', 'vmc sddc list', 'vmc sddc get', 'vmc vm list', 'vmc vm start', 'vmc vm stop', 'vmc org list',
      'govc about', 'govc ls', 'govc vm.info', 'govc vm.power', 'govc datastore.ls', 'govc host.info',
      'nsx get segments', 'nsx get firewall', 'nsx get t1-gateways', 'nsx get t0-gateways', 'nsx traceflow',
      'Get-VMCSDDC', 'Get-VM', 'Connect-VmcServer', 'Get-Datastore', 'Get-VMHost', 'Start-VM', 'Stop-VM',
    ];
    const match = allCommands.find(cmd => cmd.startsWith(value) && cmd !== value);
    setSuggestion(match ? match.slice(value.length) : '');
  }, []);

  const scrollToBottom = () => {
    terminalRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [histories, activeTab]);

  const executeCommand = () => {
    if (!currentCommand.trim()) return;

    const tab = tabs.find(t => t.id === activeTab);
    if (!tab) return;

    // Handle built-in commands
    if (currentCommand.trim() === 'clear') {
      clearTerminal();
      setCurrentCommand('');
      setSuggestion('');
      return;
    }
    if (currentCommand.trim() === 'help') {
      const helpOutput = `Available tools in VMC CloudShell:
  vmc       VMware Cloud CLI
  govc      Go vCenter CLI
  nsx       NSX-T CLI
  powercli  VMware PowerShell

Built-in commands:
  clear     Clear terminal
  help      Show this help

Tip: Use ↑/↓ arrows to navigate command history. Press Tab to autocomplete.`;
      setHistories(prev => ({
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), { command: currentCommand, output: helpOutput, timestamp: new Date() }],
      }));
      setCommandHistory(prev => [...prev, currentCommand]);
      setCurrentCommand('');
      setSuggestion('');
      return;
    }

    const toolKey = tab.command;
    const responseFn = mockResponses[toolKey];
    const output = responseFn ? responseFn(currentCommand) : `Command not found: ${currentCommand.split(' ')[0]}: command not found`;

    const newHistory: CommandHistory = {
      command: currentCommand,
      output,
      timestamp: new Date(),
    };

    setHistories(prev => ({
      ...prev,
      [activeTab]: [...(prev[activeTab] || []), newHistory],
    }));

    setCommandHistory(prev => [...prev, currentCommand]);
    setCurrentCommand('');
    setSuggestion('');
    setHistoryIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (suggestion) {
        setCurrentCommand(prev => prev + suggestion);
        setSuggestion('');
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        const cmd = commandHistory[commandHistory.length - 1 - newIndex];
        setCurrentCommand(cmd);
        updateSuggestion(cmd);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        const cmd = commandHistory[commandHistory.length - 1 - newIndex];
        setCurrentCommand(cmd);
        updateSuggestion(cmd);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
        setSuggestion('');
      }
    }
  };

  const clearTerminal = () => {
    setHistories(prev => ({
      ...prev,
      [activeTab]: [],
    }));
  };

  const addNewTab = () => {
    const newId = (tabs.length + 1).toString();
    const newTab: Tab = { id: newId, name: `terminal-${newId}`, command: 'bash' };
    setTabs([...tabs, newTab]);
    setActiveTab(newId);
    setHistories(prev => ({
      ...prev,
      [newId]: [{ command: '', output: 'Welcome to VMC CloudShell Terminal\nType "help" for available commands.', timestamp: new Date() }],
    }));
  };

  const removeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    
    if (activeTab === tabId) {
      setActiveTab(newTabs[0].id);
    }
    
    const newHistories = { ...histories };
    delete newHistories[tabId];
    setHistories(newHistories);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-[#232f3e] text-white px-4 py-2 rounded-sm shadow-lg hover:bg-[#2a3b4c] flex items-center space-x-2 z-50 border border-[#414750]"
      >
        <Terminal className="w-4 h-4 text-[#ff9900]" />
        <span className="text-sm font-medium">CloudShell</span>
        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
      </button>
    );
  }

  return (
    <div className={`fixed bottom-0 right-0 bg-[#16191f] text-white z-50 transition-all duration-300 ${
      isExpanded ? 'inset-4 rounded-lg' : 'w-[900px] h-[350px] rounded-t-lg'
    }`} style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.3)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#232f3e] border-b border-[#414750] rounded-t-lg">
        <div className="flex items-center space-x-4">
          <Terminal className="w-4 h-4 text-[#ff9900]" />
          <span className="text-sm font-medium">VMC CloudShell</span>
          <span className="text-xs text-[#414750]">|</span>
          {/* Connection status */}
          <span className="flex items-center text-xs">
            {isConnected 
              ? <><Wifi className="w-3 h-3 text-green-400 mr-1" /><span className="text-green-400">Connected</span></>
              : <><WifiOff className="w-3 h-3 text-red-400 mr-1" /><span className="text-red-400">Disconnected</span></>
            }
          </span>
          <span className="text-xs text-[#414750]">|</span>
          <span className="flex items-center text-xs text-[#aab7b8]">
            <Clock className="w-3 h-3 mr-1" />
            {formatSessionTime(sessionTime)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-[#2a3b4c] rounded text-[#d5dbdb] transition-colors"
            title={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-[#2a3b4c] rounded text-[#d5dbdb] transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center bg-[#16191f] border-b border-[#414750]">
        <div className="flex-1 flex">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm border-r border-[#414750] flex items-center space-x-2 transition-colors cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-[#16191f] text-white border-t-2 border-t-[#ff9900]' 
                  : 'bg-[#232f3e] text-[#aab7b8] hover:bg-[#2a3b4c]'
              }`}
            >
              <span>{tab.name}</span>
              <span
                onClick={(e) => removeTab(tab.id, e)}
                className="ml-2 p-0.5 hover:bg-[#414750] rounded text-xs cursor-pointer"
                role="button"
                tabIndex={0}
              >
                <X className="w-3 h-3" />
              </span>
            </div>
          ))}
        </div>
        <button
          onClick={addNewTab}
          className="px-3 py-2 hover:bg-[#2a3b4c] text-[#d5dbdb]"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={clearTerminal}
          className="px-3 py-2 hover:bg-[#2a3b4c] text-[#d5dbdb]"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Terminal Content */}
      <div className="flex h-[calc(100%-100px)]">
        {/* Sidebar with quick commands */}
        <div className="w-48 bg-[#232f3e] border-r border-[#414750] overflow-y-auto">
          <div className="p-3">
            <p className="text-xs text-[#aab7b8] uppercase font-medium mb-2">Quick Commands</p>
            <div className="space-y-1">
              {[
                { cmd: 'vmc sddc list', desc: 'List SDDCs' },
                { cmd: 'vmc vm list', desc: 'List VMs' },
                { cmd: 'govc ls', desc: 'Browse inventory' },
                { cmd: 'govc vm.info', desc: 'VM details' },
                { cmd: 'nsx get segments', desc: 'List networks' },
                { cmd: 'nsx get firewall', desc: 'Firewall config' },
                { cmd: 'Get-VMCSDDC', desc: 'Get SDDCs' },
                { cmd: 'Get-VM', desc: 'List VMs' },
              ].map((item) => (
                <button
                  key={item.cmd}
                  onClick={() => {
                    setCurrentCommand(item.cmd);
                  }}
                  className="w-full text-left px-2 py-1.5 text-xs text-[#d5dbdb] hover:bg-[#2a3b4c] rounded truncate"
                  title={item.cmd}
                >
                  <Play className="w-3 h-3 inline mr-2 text-[#ff9900]" />
                  {item.desc}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Terminal Output */}
        <div className="flex-1 bg-[#16191f] overflow-y-auto p-4 font-mono text-sm">
          <div ref={terminalRef}>
            {(histories[activeTab] || []).map((entry, index) => (
              <div key={index} className="mb-4">
                {entry.command && (
                  <div className="flex items-start">
                    <span className="text-[#ff9900] mr-2">➜</span>
                    <span className="text-[#7ee787]">~</span>
                    <span className="text-white ml-2">{entry.command}</span>
                  </div>
                )}
                <pre className="text-[#d5dbdb] mt-1 whitespace-pre-wrap text-xs leading-relaxed">
                  {entry.output}
                </pre>
                <div className="text-[#545b64] text-xs mt-1">
                  {entry.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Command Input */}
      <div className="absolute bottom-0 left-0 right-0 bg-[#232f3e] border-t border-[#414750] px-4 py-2">
        <div className="flex items-center">
          <span className="text-[#ff9900] mr-1 text-sm">➜</span>
          <span className="text-[#7ee787] mr-2 text-sm font-mono">~</span>
          <span className="text-[#569cd6] mr-2 text-sm font-mono">{tabs.find(t => t.id === activeTab)?.name}</span>
          <div className="flex-1 relative">
            {/* Ghost suggestion */}
            <div className="absolute inset-0 flex items-center pointer-events-none">
              <span className="text-transparent font-mono text-sm">{currentCommand}</span>
              <span className="text-[#414750] font-mono text-sm">{suggestion}</span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={currentCommand}
              onChange={(e) => { setCurrentCommand(e.target.value); updateSuggestion(e.target.value); }}
              onKeyDown={handleKeyDown}
              placeholder={currentCommand ? '' : 'Type a command... (Tab to autocomplete, ↑↓ for history)'}
              className="w-full bg-transparent text-white font-mono text-sm outline-none placeholder-[#414750] relative z-10"
              autoFocus
            />
          </div>
          {suggestion && (
            <span className="text-xs text-[#545b64] ml-2 flex-shrink-0">[Tab] complete</span>
          )}
        </div>
      </div>
    </div>
  );
}
