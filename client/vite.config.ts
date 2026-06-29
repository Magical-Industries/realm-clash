import { resolve } from "node:path";
import { defineConfig } from "vite";

const repoRoot = resolve(__dirname, "..");

// Custom domain deploys at the site root (realmclash.magical.enterprises).
// Override with BASE_PATH=/repo-name/ only for project-page subpath previews.
const base = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base,
  server: {
    port: 5173,
    open: false,
    fs: {
      // Allow the linked `file:../core` package outside `client/`.
      allow: [repoRoot],
    },
  },
  preview: {
    fs: {
      allow: [repoRoot],
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        play: resolve(__dirname, "play.html"),
        rules: resolve(__dirname, "rules.html"),
        collection: resolve(__dirname, "collection.html"),
        create: resolve(__dirname, "create.html"),
        community: resolve(__dirname, "community.html"),
      },
    },
  },
});