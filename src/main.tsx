import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Setup MSW for development/demo mode
async function enableMocking() {
  if (import.meta.env.MODE !== 'development') {
    return;
  }

  const { worker } = await import('./mocks/browser');
  
  // Check if demo mode is enabled in localStorage
  const isDemoMode = localStorage.getItem('pitwall_demo_mode') === 'true';
  
  if (isDemoMode) {
    await worker.start({
      onUnhandledRequest: 'bypass',
    });
    console.log('[MSW] Mock server enabled (Demo Mode)');
  }
}

// Start the app after MSW is ready
enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
