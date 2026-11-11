import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "/qingming-lu/",
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      pixelfx: resolve(__dirname, "vendor/pixelfx/src/core/index.js"),
    },
  },
  server: { host: "0.0.0.0", port: 5173 },
  preview: { host: "0.0.0.0", port: 4173 },
  build: {
    target: "es2022",
    sourcemap: false,
  },
});
