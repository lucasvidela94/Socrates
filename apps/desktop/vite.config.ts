import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import * as path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: __dirname,
  base: "./",
  build: {
    outDir: path.join(__dirname, "dist/renderer"),
    emptyOutDir: true,
    target: "es2020"
  },
  resolve: {
    alias: {
      "@": path.join(__dirname, "src/renderer"),
      "@shared": path.join(__dirname, "src/shared")
    }
  }
});
