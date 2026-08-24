import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/regression', timeout: 30000, workers: 1, retries: 0,
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1280, height: 900 }, colorScheme: 'dark', reducedMotion: 'reduce' },
  webServer: { command: 'npm run preview -- --host 127.0.0.1 --port 4173', url: 'http://127.0.0.1:4173', reuseExistingServer: false, timeout: 30000 },
  reporter: [['list']],
});
