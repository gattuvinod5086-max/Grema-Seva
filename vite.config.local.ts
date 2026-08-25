import path from "path";
import { existsSync } from "fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const hasGenAI = existsSync(path.resolve(__dirname, "node_modules/@google/genai"));

/** Local dev only: no Cloudflare/Mocha. Use to view the Grama Seva app at /app */
export default defineConfig({
  plugins: [react()],
  define: {
    __GRAMA_LOCAL_DEV__: JSON.stringify(true),
  },
  server: {
    port: 5173,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      ...(hasGenAI ? {} : { "@google/genai": path.resolve(__dirname, "src/react-app/lib/google-genai-stub.ts") }),
    },
  },
});
