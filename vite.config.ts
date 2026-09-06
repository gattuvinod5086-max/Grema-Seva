import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL ?? "http://localhost:3000",
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
