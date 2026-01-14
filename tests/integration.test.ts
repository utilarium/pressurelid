import { describe, it, expect } from 'vitest';
import { SafeRegex, createSafeRegex, globToSafeRegex } from '../src/safe-regex';
import { analyzePattern } from '../src/analyze';

describe('Integration', () => {
    describe('Real-world use cases', () => {
        it('should handle file ignore patterns', () => {
            const safe = new SafeRegex();
            const ignorePatterns = [
                'node_modules',
                '*.log',
                '.git',
                'dist/**',
            ];

            for (const pattern of ignorePatterns) {
                const result = safe.globToRegex(pattern);
                expect(result.safe, `Pattern "${pattern}" should be safe`).toBe(true);
            }
        });

        it('should handle search patterns safely', () => {
            const safe = new SafeRegex();
            const userSearches = [
                'function',
                'export.*default',
                'import.*from',
            ];

            for (const search of userSearches) {
                const result = safe.create(search, 'i');
                expect(result.safe, `Search "${search}" should be safe`).toBe(true);
            }
        });

        it('should protect against malicious user input', () => {
            const safe = new SafeRegex();
            const maliciousInputs = [
                '^(a+)+$',
                '([a-zA-Z]+)*',
                '(a|aa)+',
            ];

            for (const input of maliciousInputs) {
                const result = safe.create(input);
                expect(result.safe, `Malicious "${input}" should be blocked`).toBe(false);
            }
        });

        it('should work with callback integration', () => {
            const blocked: string[] = [];
            const safe = new SafeRegex({
                onBlock: (_msg, pattern) => blocked.push(pattern),
            });

            safe.create('^(a+)+$');
            safe.create('^hello$');
            safe.create('([a-z]+)*');

            expect(blocked).toHaveLength(2);
        });
    });

    describe('Pattern analysis integration', () => {
        it('should analyze patterns correctly with various inputs', () => {
            const testCases = [
                { pattern: 'hello', expectedSafe: true },
                { pattern: '^(a+)+$', expectedSafe: false },
                { pattern: '[a-z]+', expectedSafe: true },
                { pattern: '(a|b)+', expectedSafe: false },
            ];

            for (const { pattern, expectedSafe } of testCases) {
                const result = analyzePattern(pattern);
                expect(result.safe, `Pattern "${pattern}"`).toBe(expectedSafe);
            }
        });
    });

    describe('Full workflow', () => {
        it('should handle complete validation workflow', () => {
            const safe = new SafeRegex({ maxLength: 100 });
            
            // 1. Create pattern from user input
            const result = safe.create('^[a-z]+$');
            expect(result.safe).toBe(true);
            
            // 2. Use the regex
            if (result.safe && result.regex) {
                expect(result.regex.test('hello')).toBe(true);
                expect(result.regex.test('HELLO')).toBe(false);
            }
        });

        it('should handle glob to regex workflow', () => {
            const safe = new SafeRegex();
            
            // Convert multiple globs
            const globs = ['*.ts', '*.js', '*.md'];
            const regexes: RegExp[] = [];
            
            for (const glob of globs) {
                const result = safe.globToRegex(glob);
                if (result.safe && result.regex) {
                    regexes.push(result.regex);
                }
            }
            
            expect(regexes).toHaveLength(3);
            expect(regexes[0].test('file.ts')).toBe(true);
        });

        it('should handle user input escaping workflow', () => {
            const safe = new SafeRegex();
            const userInput = 'file (1).txt';
            
            const result = safe.fromUserInput(userInput);
            expect(result.safe).toBe(true);
            expect(result.regex?.test(userInput)).toBe(true);
            expect(result.regex?.test('file 1.txt')).toBe(false);
        });
    });

    describe('Convenience functions integration', () => {
        it('should work together with main class', () => {
            // Using convenience functions
            const result1 = createSafeRegex('^test$');
            const result2 = globToSafeRegex('*.md');
            
            expect(result1.safe).toBe(true);
            expect(result2.safe).toBe(true);
            
            // Compare with class usage
            const safe = new SafeRegex();
            const result3 = safe.create('^test$');
            
            expect(result1.safe).toBe(result3.safe);
        });
    });
});

