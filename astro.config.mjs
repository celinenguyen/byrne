// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import cloudflare from '@astrojs/cloudflare';

const buildTarget = process.env.BUILD_TARGET; // 'cloudflare' | undefined (dev/server)
const isCloudflare = buildTarget === 'cloudflare';

/** @type {import('astro').AstroUserConfig['output']} */
const output = isCloudflare ? 'static' : 'server';

/** @type {import('astro').AstroUserConfig['adapter']} */
const adapter = isCloudflare ? cloudflare() : node({ mode: 'standalone' });

// https://astro.build/config
export default defineConfig({
  output,
  adapter,
  integrations: [svelte(), react()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.PUBLIC_STATIC_MODE': JSON.stringify(isCloudflare),
    },
    server: {
      watch: {
        ignored: ['**/data/**']
      }
    }
  }
});
