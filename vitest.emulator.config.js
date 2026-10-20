import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { include: ['tests/emulator/**/*.test.js'], maxWorkers: 1, testTimeout: 30000, hookTimeout: 30000 }
});
