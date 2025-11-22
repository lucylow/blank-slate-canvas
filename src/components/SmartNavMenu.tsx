// src/components/SmartNavMenu.tsx
// Smart Navigation Menu with drag-and-drop, keyboard nav, and agent integration

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pin,
  PinOff,
  GripVertical,
  Search,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

import { useNavStore } from '@/stores/navStore';
import { computeNavOrder, groupBySection, type ScoredNavItem } from '@/lib/navOrder';
import AgentBadge from '@/components/AgentBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SortableItemProps {
  item: ScoredNavItem;
  index: number;
  onPin?: (id: string) => void;
  onUnpin?: (id: string) => void;
  onNavigate?: (id: string) => void;
  isSearching?: boolean;
  searchQuery?: string;
  compact?: boolean;
}

function SortableItem({
  item,
  index,
  onPin,
  onUnpin,
  onNavigate,
  isSearching = false,
  searchQuery = '',
  compact = false,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const navigate = useNavigate();
  const location = useLocation();
  const isActive = item.route && location.pathname === item.route;

  // Highlight search matches
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-primary/30 text-primary font-medium">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleClick = (e: React.MouseEvent) => {
    if (item.route) {
      e.preventDefault();
      onNavigate?.(item.id);
      navigate(item.route);
      useNavStore.getState().visitItem(item.id);
    }
  };

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.pinned) {
      onUnpin?.(item.id);
      useNavStore.getState().unpinItem(item.id);
    } else {
      onPin?.(item.id);
      useNavStore.getState().pinItem(item.id);
    }
  };

  // Keyboard shortcut hint (1-9)
  const shortcutHint = index < 9 ? String(index + 1) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-center gap-2 p-2 rounded-lg transition-all duration-200",
        "hover:bg-accent/50 cursor-pointer",
        isActive && "bg-primary/10 border border-primary/30",
        isDragging && "shadow-lg z-50"
      )}
      onClick={handleClick}
      role="menuitem"
      tabIndex={0}
      aria-pressed={item.pinned || undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        } else if (e.key === 'p' || e.key === 'P') {
          e.preventDefault();
          handlePinToggle(e as any);
        }
      }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Keyboard shortcut hint */}
      {shortcutHint && !compact && (
        <div className="absolute -left-8 w-6 h-6 rounded bg-muted text-muted-foreground text-xs flex items-center justify-center font-mono">
          {shortcutHint}
        </div>
      )}

      {/* Pin button */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handlePinToggle}
        aria-label={item.pinned ? 'Unpin' : 'Pin'}
      >
        {item.pinned ? (
          <Pin className="w-4 h-4 text-primary fill-primary" />
        ) : (
          <PinOff className="w-4 h-4" />
        )}
      </Button>

      {/* Item content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-medium truncate",
            isActive && "text-primary"
          )}>
            {isSearching && searchQuery
              ? highlightMatch(item.title, searchQuery)
              : item.title}
          </span>
          
          {/* Alert indicator */}
          {item.alertScore && item.alertScore > 0.6 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </div>
        
        {/* Agent badge */}
        {item.section === 'agent' && (
          <div className="mt-1">
            <AgentBadge agentId={item.id} compact={compact} />
          </div>
        )}
      </div>

      {/* Active indicator */}
      {isActive && (
        <ArrowRight className="w-4 h-4 text-primary" />
      )}
    </div>
  );
}

interface SmartNavMenuProps {
  compact?: boolean;
  className?: string;
}

export default function SmartNavMenu({ compact = false, className }: SmartNavMenuProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const items = useNavStore((state) => state.items);
  const agents = useNavStore((state) => state.agents);
  const alertBumps = useNavStore((state) => state.alertBumps);
  const setItems = useNavStore((state) => state.setItems);

  // Compute ordered items
  const orderedItems = useMemo(() => {
    const scored = computeNavOrder(items, agents, alertBumps);
    const { staticItems, agentItems } = groupBySection(scored);
    
    // Filter by search if active
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filteredStatic = staticItems.filter(it => 
        it.title.toLowerCase().includes(query) ||
        it.id.toLowerCase().includes(query)
      );
      const filteredAgent = agentItems.filter(it =>
        it.title.toLowerCase().includes(query) ||
        it.id.toLowerCase().includes(query) ||
        agents[it.id]?.alert?.summary?.toLowerCase().includes(query)
      );
      return { staticItems: filteredStatic, agentItems: filteredAgent };
    }
    
    return { staticItems, agentItems };
  }, [items, agents, alertBumps, searchQuery]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Track navigation for analytics
  useEffect(() => {
    const currentItem = items.find(it => it.route === location.pathname);
    if (currentItem) {
      useNavStore.getState().visitItem(currentItem.id);
    }
  }, [location.pathname, items]);

  // Keyboard navigation (numeric shortcuts 1-9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with "/"
      if (e.key === '/' && !isSearchOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsSearchOpen(true);
        searchInputRef.current?.focus();
      }
      
      // Close search with Escape
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
        setSearchQuery('');
      }
      
      // Numeric shortcuts (1-9) for top items
      if (!isSearchOpen && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        const allItems = [...orderedItems.staticItems, ...orderedItems.agentItems];
        const targetItem = allItems[index];
        if (targetItem?.route) {
          e.preventDefault();
          navigate(targetItem.route);
          useNavStore.getState().visitItem(targetItem.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, orderedItems, navigate]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = items.findIndex((it) => it.id === active.id);
    const newIndex = items.findIndex((it) => it.id === over.id);
    
    if (oldIndex !== -1 && newIndex !== -1) {
      const newItems = arrayMove(items, oldIndex, newIndex);
      // Update manualOrder for persistence
      const updatedItems = newItems.map((it, idx) => ({
        ...it,
        manualOrder: idx,
      }));
      setItems(updatedItems);
      useNavStore.getState().persist();
    }
  };

  const handleNavigate = (id: string) => {
    useNavStore.getState().visitItem(id);
  };

  const handlePin = (id: string) => {
    useNavStore.getState().pinItem(id);
  };

  const handleUnpin = (id: string) => {
    useNavStore.getState().unpinItem(id);
  };

  const allItemIds = [...orderedItems.staticItems, ...orderedItems.agentItems].map(it => it.id);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search bar */}
      <div className="relative">
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search navigation..."
                  className="pl-9 pr-9"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!isSearchOpen && (
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="w-4 h-4 mr-2" />
            Search... <span className="ml-auto text-xs">/</span>
          </Button>
        )}
      </div>

      {/* Navigation menu */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-6" role="menu">
          {/* Static App-level sections */}
          {orderedItems.staticItems.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                App Sections
              </h3>
              <SortableContext items={orderedItems.staticItems.map(it => it.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {orderedItems.staticItems.map((item, index) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={index}
                      onPin={handlePin}
                      onUnpin={handleUnpin}
                      onNavigate={handleNavigate}
                      isSearching={!!searchQuery}
                      searchQuery={searchQuery}
                      compact={compact}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          )}

          {/* Dynamic Agent Cards */}
          {orderedItems.agentItems.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2 px-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  AI Agents
                </h3>
              </div>
              <SortableContext items={orderedItems.agentItems.map(it => it.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1">
                  {orderedItems.agentItems.map((item, index) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      index={orderedItems.staticItems.length + index}
                      onPin={handlePin}
                      onUnpin={handleUnpin}
                      onNavigate={handleNavigate}
                      isSearching={!!searchQuery}
                      searchQuery={searchQuery}
                      compact={compact}
                    />
                  ))}
                </div>
              </SortableContext>
            </div>
          )}
        </div>
      </DndContext>

      {/* Empty state */}
      {searchQuery && orderedItems.staticItems.length === 0 && orderedItems.agentItems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No matches found for "{searchQuery}"
        </div>
      )}
    </div>
  );
}

