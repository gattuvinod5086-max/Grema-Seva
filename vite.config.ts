import path from "path";
import { existsSync } from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { mochaPlugins } from "@getmocha/vite-plugins";

const hasGenAI = existsSync(path.resolve(__dirname, "node_modules/@google/genai"));

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [...mochaPlugins(process.env as any), react(), cloudflare()],
  define: {
    __GRAMA_LOCAL_DEV__: JSON.stringify(false),
  },
  server: {
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ...(hasGenAI ? {} : { "@google/genai": path.resolve(__dirname, "src/react-app/lib/google-genai-stub.ts") }),
    },
  },
});
