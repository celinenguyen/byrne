// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';

const isPages = process.env.BUILD_TARGET === 'pages';

// https://astro.build/config
export default defineConfig({
  output: isPages ? 'static' : 'server',
  adapter: isPages ? undefined : node({ mode: 'standalone' }),
  base: isPages ? '/byrne/' : '/',
  integrations: [svelte(), react()],
  vite: {
    plugins: [tailwindcss()],
    define: {
      'import.meta.env.PUBLIC_STATIC_MODE': JSON.stringify(isPages),
    },
    server: {
      watch: {
        ignored: ['**/data/**']
      }
    }
  }
});
