import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: false,
        environment: 'node',
        setupFiles: ['tests/setup.ts'],
        include: ['tests/**/*.test.ts'],
        exclude: ['node_modules/**/*'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'lcov'],
            include: ['src/**/*'],
            exclude: ['node_modules/**/*'],
            thresholds: {
                lines: 80,
                statements: 80,
                branches: 75,
                functions: 80,
            },
        },
    },
});

