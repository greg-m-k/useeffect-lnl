// The site is a multi-page Vite app under app/; every page and asset lives below /effects/
// so the whole topic can be served at lnl.example.com/effects/ next to other topics.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import { globSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "app");
const pages = Object.fromEntries(globSync("**/index.html", { cwd: root }).map((p) => [p.replace(/\/g, "/"), resolve(root, p)]));

export default defineConfig({
  root,
  plugins: [react(), cloudflare({ configPath: resolve(import.meta.dirname, "wrangler.jsonc") })],
  build: { outDir: resolve(import.meta.dirname, "dist"), emptyOutDir: true, assetsDir: "effects/assets", rollupOptions: { input: pages } },
});
