import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    css: true,
    // 10s pra acomodar custo de import/transform da primeira render num arquivo
    // (alguns testes simples como role-consistency batiam timeout default 5s no
    // primeiro render do RegisterForm em pipelines mais lentos).
    testTimeout: 10_000,
  },
});
