import React from 'react';
import { useLocation } from 'react-router-dom';
import { AppLayout } from './AppLayout';

interface RouteLayoutProps {
  children: React.ReactNode;
}

// Routes that should NOT use the AppLayout (full-page layouts)
const NO_LAYOUT_ROUTES = ['/'];

export function RouteLayout({ children }: RouteLayoutProps) {
  const location = useLocation();
  const shouldUseLayout = !NO_LAYOUT_ROUTES.includes(location.pathname);

  if (shouldUseLayout) {
    return <AppLayout>{children}</AppLayout>;
  }

  return <>{children}</>;
}


