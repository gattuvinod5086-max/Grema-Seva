import path from "path";
import "dotenv/config";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const apiTarget = process.env.API_PROXY_TARGET ?? `http://localhost:${process.env.PORT ?? 3000}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist/web",
    chunkSizeWarningLimit: 2000,
  },
  resolve: {
    alias: {
      "@web": path.resolve(__dirname, "./web"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
});
