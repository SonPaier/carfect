import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    watch: false,
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      '../../libs/ui/src/**/*.{test,spec}.{ts,tsx}',
      '../../libs/shared-utils/src/**/*.{test,spec}.{ts,tsx}',
      '../../libs/billing/src/**/*.{test,spec}.{ts,tsx}',
      '../../libs/custom-fields/src/**/*.{test,spec}.{ts,tsx}',
      '../../libs/protocol-config/src/**/*.{test,spec}.{ts,tsx}',
    ],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/lib/**', 'src/hooks/**', 'src/components/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared/ui': path.resolve(__dirname, '../../libs/ui/src/index.ts'),
      '@shared/utils': path.resolve(__dirname, '../../libs/shared-utils/src/index.ts'),
      '@shared/billing': path.resolve(__dirname, '../../libs/billing/src'),
      '@shared/invoicing': path.resolve(__dirname, '../../libs/shared-invoicing/src/index.ts'),
      '@shared/in-app-hints': path.resolve(__dirname, '../../libs/in-app-hints/src/index.ts'),
      '@shared/custom-fields': path.resolve(__dirname, '../../libs/custom-fields/src/index.ts'),
      '@shared/protocol-config': path.resolve(__dirname, '../../libs/protocol-config/src/index.ts'),
    },
  },
});
