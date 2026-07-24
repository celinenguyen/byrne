// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import vercel from '@astrojs/vercel';

const buildTarget = process.env.BUILD_TARGET; // 'pages' | 'vercel' | undefined (dev/server)
const isPages = buildTarget === 'pages';
const isVercel = buildTarget === 'vercel';

/** @type {import('astro').AstroUserConfig['output']} */
const output = isPages ? 'static' : isVercel ? 'static' : 'server';

/** @type {import('astro').AstroUserConfig['adapter']} */
const adapter = isPages ? undefined : isVercel ? vercel() : node({ mode: 'standalone' });

// https://astro.build/config
export default defineConfig({
  output,
  adapter,
  base: isPages ? '/byrne/' : '/',
  integrations: [svelte(), react()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.PUBLIC_STATIC_MODE': JSON.stringify(isPages || isVercel),
    },
    server: {
      watch: {
        ignored: ['**/data/**']
      }
    }
  }
});
