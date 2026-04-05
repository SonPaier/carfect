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
    port: 8080,
    proxy: {
      '/api': {
        target: 'https://carfect-bk87-git-feature-offer-print-view-sonpaiers-projects.vercel.app',
        changeOrigin: true,
      },
    },
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
        name: 'Carfect - System Rezerwacji',
        short_name: 'Carfect',
        description: 'System rezerwacji usług myjni samochodowej',
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
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB limit
      },
      devOptions: {
        enabled: false,
      },
    }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'scheduler'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-sentry': ['@sentry/react'],
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-toast',
            '@radix-ui/react-navigation-menu',
            'vaul',
            'sonner',
            'cmdk',
          ],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-date': ['date-fns', 'react-day-picker'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@shared/pdf': path.resolve(__dirname, '../../libs/pdf/src/index.ts'),
      '@shared/ui': path.resolve(__dirname, '../../libs/ui/src/index.ts'),
      '@shared/utils': path.resolve(__dirname, '../../libs/shared-utils/src/index.ts'),
      '@shared/invoicing': path.resolve(__dirname, '../../libs/shared-invoicing/src/index.ts'),
      '@shared/ai': path.resolve(__dirname, '../../libs/ai/src/index.ts'),
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
