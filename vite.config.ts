import { defineConfig } from 'vitest/config';
import { finalMinifyPlugin } from './build/FinalMinifyPlugin';
import { offlineBundlePlugin } from './build/OfflineBundlePlugin';

export default defineConfig({
  plugins: [finalMinifyPlugin(), offlineBundlePlugin()],
  test: { exclude: ['tests/**', 'node_modules/**', 'dist/**'] },
  server: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
  preview: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
  build: {
    // The offline plugin builds its own precache manifest. Avoid emitting Vite's unused JSON manifest.
    manifest: false,
    target: 'esnext',
    modulePreload: false,
    chunkSizeWarningLimit: 1500,
    rolldownOptions: {
      treeshake: { propertyReadSideEffects: false },
      output: { minify: { compress: { dropConsole: true } }, codeSplitting: { groups: [
      { name: 'phaser-runtime', test: /node_modules[\\/]phaser/ },
      { name: 'audio-tracker', test: /src[\\/]audio[\\/]bgm/ },
    ] } },
    },
  },
});
