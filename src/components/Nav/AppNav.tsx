import React, { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, Zap, Gauge, Database, Cpu, Flag } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', to: '/dashboard', icon: Gauge },
  { key: 'telemetry', label: 'Telemetry', to: '/telemetry', icon: Zap },
  { key: 'insights', label: 'AI Insights', to: '/agents', icon: Cpu },
  { key: 'ops', label: 'Operations', to: '/tracks', icon: Database, admin: false },
];

interface NavLinkProps {
  item: typeof NAV_ITEMS[0];
  active: boolean;
  sidebarOpen: boolean;
}

function NavLink({ item, active, sidebarOpen }: NavLinkProps) {
  const Icon = item.icon;
  return (
    <Link
      to={item.to}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800',
        active
          ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 font-semibold'
          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
      )}
      aria-current={active ? 'page' : undefined}
      aria-label={sidebarOpen ? undefined : item.label}
    >
      <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
      {sidebarOpen && <span className="truncate">{item.label}</span>}
      {active && sidebarOpen && (
        <ChevronRight className="ml-auto w-4 h-4 text-red-400 flex-shrink-0" aria-hidden="true" />
      )}
    </Link>
  );
}

interface AppNavProps {
  isAdmin?: boolean;
  carOptions?: Array<{ id: string; label: string }>;
  children?: React.ReactNode;
}

export default function AppNav({ isAdmin = false, carOptions = [], children }: AppNavProps) {
  const location = useLocation();
  const path = location.pathname;
  const { sidebarOpen, toggleSidebar, selectedCar, setSelectedCar, setCommandPaletteOpen } = useUIStore();

  const visibleNav = useMemo(
    () => NAV_ITEMS.filter((i) => !(i.admin && !isAdmin)),
    [isAdmin]
  );

  // Mock car options if none provided
  const defaultCarOptions = carOptions.length > 0 
    ? carOptions 
    : [
        { id: 'car-1', label: 'Car #1' },
        { id: 'car-2', label: 'Car #2' },
        { id: 'car-3', label: 'Car #3' },
      ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={cn(
          'bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 transition-all duration-200 flex flex-col',
          sidebarOpen ? 'w-64' : 'w-16'
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <Flag className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                PitWall A.I.
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? 'Collapse navigation' : 'Open navigation'}
            className="p-1 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800 flex-shrink-0"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        <nav className="mt-4 px-2 flex-1 overflow-y-auto" aria-label="Main navigation">
          <ul className="space-y-1">
            {visibleNav.map((item) => {
              const active = path.startsWith(item.to);
              return (
                <li key={item.key}>
                  <NavLink item={item} active={active} sidebarOpen={sidebarOpen} />
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Quick actions at bottom */}
        {sidebarOpen && (
          <div className="mt-auto px-3 py-4 border-t border-gray-100 dark:border-gray-800">
            <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              Quick
            </div>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  // Quick pit call action
                  console.log('Quick pit call');
                }}
              >
                <Zap className="w-4 h-4 mr-2" />
                Quick Pit Call
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  // Demo seeds action
                  console.log('Demo seeds');
                }}
              >
                <Database className="w-4 h-4 mr-2" />
                Demo Seeds
              </Button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-4 min-w-0">
            {/* Mobile collapse button */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={toggleSidebar}
              aria-label="Toggle navigation"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumbs */}
            <div className="hidden md:block min-w-0">
              <Breadcrumbs />
            </div>
          </div>

          {/* Controls: car selector + global actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <select
              value={selectedCar || ''}
              onChange={(e) => setSelectedCar(e.target.value || null)}
              className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-200 dark:focus:ring-red-800"
              aria-label="Select car"
            >
              <option value="">Select car</option>
              {defaultCarOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                // Run simulation action
                console.log('Run simulation');
              }}
            >
              Run Simulation
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCommandPaletteOpen(true)}
              className="hidden sm:flex"
            >
              Command (⌘K)
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

