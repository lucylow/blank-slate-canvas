import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  isExpanded: boolean;
  setIsExpanded: (expanded: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Default to expanded on larger screens, collapsed on mobile
  // Also check localStorage for user preference
  const [isExpanded, setIsExpanded] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebar_expanded');
      if (saved !== null) {
        return saved === 'true';
      }
      // Default to expanded on desktop, collapsed on mobile
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // Save to localStorage when expanded state changes
  const handleSetExpanded = (expanded: boolean) => {
    setIsExpanded(expanded);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebar_expanded', String(expanded));
    }
  };

  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded: handleSetExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}


