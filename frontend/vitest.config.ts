import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    exclude: ["**/e2e/**", "**/node_modules/**", "**/MonacoEditor.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    exclude: ["monaco-editor"],
  },
  server: {
    fs: {
      allow: [".."],
    },
  },
  css: {
    postcss: {
      plugins: [],
    },
  },
});
