import { defineConfig } from 'vite';
import { resolve } from 'path';

// Library build — outputs a single agent-ui.js module (no HTML)
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: 'agent-ui',
    },
    outDir: 'dist-lib',
    rollupOptions: {},
  },
});
