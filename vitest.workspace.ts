import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'apps/carfect/vitest.config.ts',
  'apps/hiservice/vitest.config.ts',
  {
    test: {
      name: 'shared-utils',
      root: 'libs/shared-utils',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  },
  {
    test: {
      name: 'in-app-hints',
      root: 'libs/in-app-hints',
      environment: 'jsdom',
      globals: true,
      setupFiles: ['../ui/src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
    resolve: {
      alias: {
        '@shared/ui': new URL('libs/ui/src/index.ts', import.meta.url).pathname,
      },
    },
  },
  {
    test: {
      name: 'ui',
      root: 'libs/ui',
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  },
]);
