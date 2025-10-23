import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    include: ['**/*.e2e-spec.ts'],
    globals: true,
    root: './',
    setupFiles: ['./test/setup-e2e.ts'],
    
    // CRÍTICO: Configura para rodar testes sequencialmente
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Força um único processo para todos os testes
      },
    },
    
    // Aumenta timeouts para testes E2E
    testTimeout: 15000,
    hookTimeout: 15000,
    
    // Desabilita paralelismo de arquivos
    fileParallelism: false,
  },
  plugins: [
    tsConfigPaths(),
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
});