import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            minify: true,
            sourcemap: false,
          },
        },
      },
      preload: {
        input: 'electron/preload.ts',
        vite: {
          build: {
            minify: true,
            sourcemap: false,
          },
        },
      },
      renderer: {},
    }),
  ],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-monaco': ['@monaco-editor/react'],
          'vendor-xterm': ['@xterm/xterm', '@xterm/addon-fit'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
});
