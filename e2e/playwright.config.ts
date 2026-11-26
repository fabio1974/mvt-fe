import { defineConfig } from '@playwright/test';

/**
 * Sanity check E2E do front-end (Zapi10) — roda contra o backend LOCAL (localhost:8080).
 *
 * Uso:
 *   npx playwright test -c e2e/playwright.config.ts
 *
 * Porta do Vite: E2E_PORT (default 5173). Se a 5173 estiver ocupada por outro projeto
 * local, rode com E2E_PORT=5180 (senão o `reuseExistingServer` reaproveitaria o servidor ERRADO).
 * NUNCA rode com `--mode production` (o .env.production aponta para produção).
 */
const PORT = Number(process.env.E2E_PORT || 5173);
const BASE_URL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: '.',
  timeout: 240_000,
  expect: { timeout: 15_000 },
  fullyParallel: true,
  workers: Number(process.env.E2E_WORKERS || 4),
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: './test-results',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    headless: true,
    actionTimeout: 15_000,
    viewport: { width: 1600, height: 1000 },
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
    },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 60_000,
    cwd: '..',
  },
});
