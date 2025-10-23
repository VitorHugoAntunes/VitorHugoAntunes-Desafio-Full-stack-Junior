import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
    
    // Configuração para testes E2E
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
  plugins: [
    tsConfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});