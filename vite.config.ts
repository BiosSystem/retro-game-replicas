import { defineConfig } from 'vitest/config';
import { offlineBundlePlugin } from './build/OfflineBundlePlugin';

export default defineConfig({
  plugins: [offlineBundlePlugin()],
  test: { exclude: ['tests/**', 'node_modules/**', 'dist/**'] },
  server: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
  preview: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
  build: {
    manifest: true,
    chunkSizeWarningLimit: 1500,
    rolldownOptions: { output: { codeSplitting: { groups: [
      { name: 'phaser-runtime', test: /node_modules[\\/]phaser/ },
      { name: 'audio-tracker', test: /src[\\/]audio[\\/]bgm/ },
    ] } } },
  },
});
