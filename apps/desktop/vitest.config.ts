import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    pool: "forks"
  },
  resolve: {
    alias: {
      "@": path.join(__dirname, "src/renderer"),
      "@shared": path.join(__dirname, "src/shared")
    }
  }
});
