import type { Config } from "tailwindcss";
import sharedConfig from "../../libs/ui/tailwind.config";

export default {
  ...sharedConfig,
  content: [
    "./src/**/*.{ts,tsx}",
    "../../libs/ui/src/**/*.{ts,tsx}",
    "../../libs/shared-invoicing/src/**/*.{ts,tsx}",
  ],
} satisfies Config;
