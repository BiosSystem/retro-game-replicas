import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    manifest: true,
    chunkSizeWarningLimit: 1500,
    rolldownOptions: { output: { codeSplitting: { groups: [
      { name: 'phaser-runtime', test: /node_modules[\\/]phaser/ },
      { name: 'audio-tracker', test: /src[\\/]audio[\\/]bgm/ },
    ] } } },
  },
});
