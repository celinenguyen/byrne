// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import cloudflare from '@astrojs/cloudflare';

// `npm run dev` runs under Node and reads/writes data/ on disk; the deployed
// build runs on Cloudflare Workers and uses R2 (see src/lib/storage/index.ts).
const isCloudflare = process.env.BUILD_TARGET === 'cloudflare';

/** @type {import('astro').AstroUserConfig['adapter']} */
const adapter = isCloudflare ? cloudflare() : node({ mode: 'standalone' });

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter,
  integrations: [svelte(), react()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ['**/data/**']
      }
    }
  }
});
