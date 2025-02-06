import { vitePlugin as remix } from '@remix-run/dev';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    remix({
      buildDirectory: 'build/app',
      serverModuleFormat: 'esm',
    }),
    tsconfigPaths(),
  ],
  optimizeDeps: {
    exclude: [
      'electron',
      'electron/main',
      '@electron/remote',
      'fsevents',
      'jassub',
    ],
  },
});