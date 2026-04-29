import type { Config } from 'tailwindcss';
import sharedConfig from '../../libs/ui/tailwind.config';

export default {
  ...sharedConfig,
  content: [
    './src/**/*.{ts,tsx}',
    '../../libs/ui/src/**/*.{ts,tsx}',
    '../../libs/shared-invoicing/src/**/*.{ts,tsx}',
    '../../libs/shared-utils/src/**/*.{ts,tsx}',
    '../../libs/custom-fields/src/**/*.{ts,tsx}',
    '../../libs/post-sale-instructions/src/**/*.{ts,tsx}',
    '../../libs/protocol-config/src/**/*.{ts,tsx}',
    '../../libs/in-app-hints/src/**/*.{ts,tsx}',
    '../../libs/ai/src/**/*.{ts,tsx}',
    '../../libs/billing/src/**/*.{ts,tsx}',
  ],
} satisfies Config;
