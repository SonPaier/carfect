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
      name: 'ui',
      root: 'libs/ui',
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  },
]);
