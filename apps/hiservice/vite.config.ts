import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { execSync } from 'child_process';
import fs from 'fs';

import { VitePWA } from 'vite-plugin-pwa';

// Auto-generate version.json at build time from git SHA + timestamp
function autoVersionPlugin(): Plugin {
  return {
    name: 'auto-version',
    buildStart() {
      let gitSha = 'unknown';
      try {
        gitSha = execSync('git rev-parse --short HEAD').toString().trim();
      } catch {
        gitSha = process.env.COMMIT_SHA?.slice(0, 7) ?? 'unknown';
      }
      const buildTime = new Date().toISOString();
      const version = `${gitSha}-${buildTime.slice(0, 10)}`;
      fs.writeFileSync(
        path.resolve(__dirname, 'public/version.json'),
        JSON.stringify({ version, buildTime }, null, 2) + '\n',
      );
      console.log(`[version] Generated version.json: ${version}`);
    },
  };
}

export default defineConfig(({ mode }) => ({
  envDir: path.resolve(__dirname, '../..'),
  server: {
    host: '::',
    port: 8082,
  },
  plugins: [
    react(),
    mode === 'production' && autoVersionPlugin(),

    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'HiService - System Zarządzania',
        short_name: 'HiService',
        description: 'System zarządzania serwisantami',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'scheduler'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-toast',
            'vaul',
            'sonner',
            'cmdk',
          ],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-date': ['date-fns', 'react-day-picker'],
          'vendor-query': ['@tanstack/react-query'],
        },
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@shared/ui': path.resolve(__dirname, '../../libs/ui/src/index.ts'),
      '@shared/utils': path.resolve(__dirname, '../../libs/shared-utils/src/index.ts'),
      '@shared/invoicing': path.resolve(__dirname, '../../libs/shared-invoicing/src/index.ts'),
      '@shared/billing': path.resolve(__dirname, '../../libs/billing/src'),
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
