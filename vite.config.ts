import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: parseInt(process.env.PORT || "8080", 10),
    strictPort: false,
    proxy: {
      // Forward agent API routes to agent API server (port 3001)
      '/api/agents': {
        target: process.env.VITE_AGENT_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/insights': {
        target: process.env.VITE_AGENT_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/telemetry': {
        target: process.env.VITE_AGENT_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/system': {
        target: process.env.VITE_AGENT_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
      // Forward other /api/* to backend during dev
      // Backend runs on port 8000 by default (pitwall-backend)
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
      },
      // Forward /health to backend
      '/health': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
      // Proxy WebSocket connections
      '/ws': {
        target: process.env.VITE_BACKEND_WS_URL || 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
  },
}));
