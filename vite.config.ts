// SPA mode: Cloudflare plugin disabled, TanStack Start configured to output a static
// _shell.html so the app deploys to Vercel/Netlify/any static host.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    spa: {
      enabled: true,
    },
  },
});
