import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': import.meta.dirname,
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching or ignore ledger file updates to prevent flashing loops
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/ledger-cache.json', '**/ledger.json', '**/data/**'],
      },
    },
  };
});
