import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
/** Igual que en GitHub Pages: la app vive bajo /copia-segura/ (ADR-0006). */
const BASE_PATH = '/copia-segura/';

/**
 * Los e2e corren contra el build de producción servido por `vite preview`: así se prueba también
 * la CSP inyectada en el HTML publicado (ADR-0005), no solo la lógica.
 */
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    trace: 'retain-on-failure',
    locale: 'es-ES',
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } }
      : {}),
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE_PATH}`,
    env: { BASE_PATH },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
