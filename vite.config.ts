import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import tsconfigPaths from "vite-tsconfig-paths";
import envOnly from "vite-env-only";

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    remix({
      buildDirectory: "electron/build",
    }),
    tsconfigPaths(),
    envOnly(),
  ],
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]',
      }
    }
  },
  optimizeDeps: {
    exclude: [
      "electron",
      "electron/main",
      "fsevents",
      "jassub",
    ]
  }
});
