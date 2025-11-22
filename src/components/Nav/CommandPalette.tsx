import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useUIStore } from '@/stores/uiStore';
import {
  Gauge,
  Zap,
  Cpu,
  Database,
  Settings,
  Flag,
  TrendingUp,
  Map,
  Target,
  Info,
  FileText,
} from 'lucide-react';

interface CommandItemType {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  keywords?: string[];
  group: string;
}

const commands: CommandItemType[] = [
  // Main Navigation
  { id: 'home', label: 'Home', icon: Flag, to: '/', group: 'Navigation' },
  { id: 'dashboard', label: 'Dashboard', icon: Gauge, to: '/dashboard', group: 'Navigation' },
  { id: 'telemetry', label: 'Telemetry', icon: Zap, to: '/telemetry', group: 'Navigation' },
  { id: 'insights', label: 'AI Insights', icon: Cpu, to: '/agents', group: 'Navigation' },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp, to: '/analytics', group: 'Navigation' },
  { id: 'tracks', label: 'Tracks', icon: Map, to: '/tracks', group: 'Navigation' },
  { id: 'strategy', label: 'Strategy', icon: Target, to: '/pitwall', group: 'Navigation' },
  { id: 'about', label: 'About', icon: Info, to: '/about', group: 'Navigation' },
  { id: 'settings', label: 'Settings', icon: Settings, to: '/settings', group: 'Navigation' },
  
  // Additional Pages
  { id: 'comprehensive', label: 'Comprehensive Dashboard', icon: Gauge, to: '/comprehensive', group: 'Dashboards' },
  { id: 'ai-summaries', label: 'AI Summary Reports', icon: FileText, to: '/ai-summaries', group: 'Dashboards' },
  { id: 'agent-integration', label: 'Agent Integration', icon: Cpu, to: '/agent-integration', group: 'Dashboards' },
];

export function CommandPalette() {
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  const handleSelect = (command: CommandItemType) => {
    navigate(command.to);
    setCommandPaletteOpen(false);
  };

  // Group commands by category
  const groupedCommands = commands.reduce((acc, cmd) => {
    if (!acc[cmd.group]) {
      acc[cmd.group] = [];
    }
    acc[cmd.group].push(cmd);
    return acc;
  }, {} as Record<string, CommandItemType[]>);

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groupedCommands).map(([group, items]) => (
          <CommandGroup key={group} heading={group}>
            {items.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <CommandItem
                  key={cmd.id}
                  value={cmd.label}
                  keywords={cmd.keywords}
                  onSelect={() => handleSelect(cmd)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{cmd.label}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

