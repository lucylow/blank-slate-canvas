import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { FeatureProvider } from "./featureFlags/FeatureProvider.tsx";

// Ensure root element exists before rendering
const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found! Make sure index.html has a <div id='root'></div>");
}

// Setup MSW for development/demo mode (non-blocking)
async function enableDemoMode() {
  if (import.meta.env.MODE !== 'development') {
    return;
  }

  try {
    const { worker } = await import('./mocks/browser');
    
    // Check if demo mode is enabled in localStorage
    const isDemoMode = localStorage.getItem('pitwall_demo_mode') === 'true';
    
    if (isDemoMode) {
      await worker.start({
        onUnhandledRequest: 'bypass',
      });
      console.log('[MSW] Demo server enabled (Demo Mode)');
    }
  } catch (error) {
    // MSW not available or failed to load - continue without it
    console.warn('[MSW] Failed to enable demo mode:', error);
  }
}

// Start MSW in background (don't block app rendering)
enableDemoMode().catch((error) => {
  console.warn('[MSW] Error during initialization:', error);
});

// Render app immediately
const root = createRoot(rootElement);
root.render(
  <FeatureProvider>
    <App />
  </FeatureProvider>
);
