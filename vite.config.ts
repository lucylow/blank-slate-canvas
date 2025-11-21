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
      // Forward all /api/* to backend during dev
      // Backend runs on port 8000 by default (pitwall-backend)
      // This includes /api/agents, /api/insights, /api/telemetry, etc.
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
      // Proxy realtime server API (pitwall-dist on port 8081)
      '/api/realtime': {
        target: process.env.VITE_REALTIME_URL || 'http://localhost:8081',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/realtime/, '/api'),
      },
      // Proxy WebSocket connections (includes agent decisions WebSocket)
      '/ws': {
        target: process.env.VITE_BACKEND_WS_URL || 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
      // Proxy realtime server WebSocket (pitwall-dist on port 8081)
      '/ws/realtime': {
        target: process.env.VITE_REALTIME_WS_URL || 'ws://localhost:8081',
        ws: true,
        changeOrigin: true,
      },
      // Proxy agent decisions WebSocket endpoint
      '/api/agents/decisions/ws': {
        target: process.env.VITE_BACKEND_WS_URL || 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
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
