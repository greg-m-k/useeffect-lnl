import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "cloudflare:workers": resolve(import.meta.dirname, "test/cloudflare-workers-stub.js") } },
  test: { environment: "jsdom", include: ["test/**/*.test.{js,jsx}"] },
});
