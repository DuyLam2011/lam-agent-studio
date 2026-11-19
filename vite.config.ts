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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@monaco-editor')) return 'vendor-monaco';
            if (id.includes('@xterm')) return 'vendor-xterm';
            if (id.includes('lucide-react')) return 'vendor-icons';
            if (id.includes('react-markdown') || id.includes('remark') || id.includes('micromark') || id.includes('mdast') || id.includes('unist') || id.includes('vfile')) {
              return 'vendor-markdown';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
});
