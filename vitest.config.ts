import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'infra/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'json-summary'],
      reportsDirectory: 'coverage',
      // Lógica de negócio pura (regras, analytics, validações, saúde, processo).
      include: ['src/lib/**/*.ts'],
      exclude: [
        'src/lib/**/*.test.ts',
        'src/lib/prisma.ts',
        'src/lib/auth.ts',
        'src/lib/auth.config.ts',
        'src/lib/kafka.ts',
        'src/lib/email.ts',
        'src/lib/gemini.ts',
        'src/lib/gemini-insights.ts',
        'src/lib/utils.ts',
      ],
      thresholds: { lines: 70, functions: 70, branches: 70, statements: 70 },
    },
  },
});
