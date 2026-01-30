import { describe, it, expect, vi } from 'vitest';
import { SafeRegex, createSafeRegex, globToSafeRegex, escapeForRegex } from '../src/safe-regex';
import { REDOS_VECTORS, SAFE_PATTERNS } from './fixtures/redos-vectors';

describe('SafeRegex', () => {
    describe('create()', () => {
        it('should allow safe patterns', () => {
            const safe = new SafeRegex();
            for (const { name, pattern } of SAFE_PATTERNS) {
                const result = safe.create(pattern);
                expect(result.safe, `Pattern "${name}" should be safe`).toBe(true);
                expect(result.regex).toBeInstanceOf(RegExp);
            }
        });

        it('should block known ReDoS patterns', () => {
            const safe = new SafeRegex();
            for (const { name, pattern, expectedSafe } of REDOS_VECTORS) {
                if (!expectedSafe) {
                    const result = safe.create(pattern);
                    expect(result.safe, `Pattern "${name}" should be blocked`).toBe(false);
                    expect(result.error).toBeDefined();
                }
            }
        });

        it('should respect maxLength configuration', () => {
            const safe = new SafeRegex({ maxLength: 10 });
            const result = safe.create('a'.repeat(20));
            expect(result.safe).toBe(false);
            expect(result.reason).toBe('pattern_too_long');
        });

        it('should handle invalid regex syntax', () => {
            const safe = new SafeRegex();
            const result = safe.create('[');
            expect(result.safe).toBe(false);
            expect(result.reason).toBe('invalid_syntax');
        });

        it('should pass through regex flags', () => {
            const safe = new SafeRegex();
            const result = safe.create('abc', 'gi');
            expect(result.safe).toBe(true);
            expect(result.regex?.flags).toContain('g');
            expect(result.regex?.flags).toContain('i');
        });
    });

    describe('testWithTimeout()', () => {
        it('should return match result for fast patterns', async () => {
            const safe = new SafeRegex();
            const regex = /^hello$/;
            const result = await safe.testWithTimeout(regex, 'hello');
            expect(result).toBe(true);
        });

        it('should return false for non-matching patterns', async () => {
            const safe = new SafeRegex();
            const regex = /^hello$/;
            const result = await safe.testWithTimeout(regex, 'world');
            expect(result).toBe(false);
        });

        it('should respect timeout configuration', async () => {
            // Test that testWithTimeout returns quickly when regex matches
            const safe = new SafeRegex({ timeoutMs: 5000 });
            const regex = /^hello$/;
            const start = Date.now();
            await safe.testWithTimeout(regex, 'hello');
            const duration = Date.now() - start;
            // Should be much faster than the timeout
            expect(duration).toBeLessThan(1000);
        });
    });

    describe('globToRegex()', () => {
        it('should convert * wildcard', () => {
            const safe = new SafeRegex();
            const result = safe.globToRegex('*.md');
            expect(result.safe).toBe(true);
            expect(result.regex?.test('readme.md')).toBe(true);
            expect(result.regex?.test('readme.txt')).toBe(false);
            expect(result.regex?.test('path/readme.md')).toBe(false);
        });

        it('should convert ** globstar', () => {
            const safe = new SafeRegex();
            const result = safe.globToRegex('**.md');
            expect(result.safe).toBe(true);
            expect(result.regex?.test('readme.md')).toBe(true);
            expect(result.regex?.test('docs/readme.md')).toBe(true);
        });

        it('should convert ? wildcard', () => {
            const safe = new SafeRegex();
            const result = safe.globToRegex('file?.txt');
            expect(result.safe).toBe(true);
            expect(result.regex?.test('file1.txt')).toBe(true);
            expect(result.regex?.test('file12.txt')).toBe(false);
        });

        it('should escape special regex characters', () => {
            const safe = new SafeRegex();
            const result = safe.globToRegex('file (1).txt');
            expect(result.safe).toBe(true);
            expect(result.regex?.test('file (1).txt')).toBe(true);
        });
    });

    describe('fromUserInput()', () => {
        it('should escape all regex special characters', () => {
            const safe = new SafeRegex();
            const result = safe.fromUserInput('test.*+?^${}()|[]\\');
            expect(result.safe).toBe(true);
            expect(result.regex?.test('test.*+?^${}()|[]\\')).toBe(true);
        });

        it('should create case-insensitive regex', () => {
            const safe = new SafeRegex();
            const result = safe.fromUserInput('Hello');
            expect(result.safe).toBe(true);
            expect(result.regex?.test('hello')).toBe(true);
            expect(result.regex?.test('HELLO')).toBe(true);
        });
    });

    describe('callbacks', () => {
        it('should call onBlock when pattern is blocked', () => {
            const onBlock = vi.fn();
            const safe = new SafeRegex({ onBlock });
            // codeql[js/redos]: Intentional ReDoS test vector - pattern is blocked before execution
            safe.create('^(a+)+$');
            expect(onBlock).toHaveBeenCalled();
        });

        it('should call onBlock when pattern is too long', () => {
            const onBlock = vi.fn();
            const safe = new SafeRegex({ maxLength: 5, onBlock });
            safe.create('abcdefghij');
            expect(onBlock).toHaveBeenCalled();
        });

        it('should not call onWarning when regex completes quickly', async () => {
            const onWarning = vi.fn();
            const safe = new SafeRegex({ timeoutMs: 5000, onWarning });
            await safe.testWithTimeout(/^hello$/, 'hello');
            // Fast regex should not trigger warning
            expect(onWarning).not.toHaveBeenCalled();
        });
    });

    describe('configure()', () => {
        it('should update configuration', () => {
            const safe = new SafeRegex();
            expect(safe.getConfig().maxLength).toBe(500);
            safe.configure({ maxLength: 100 });
            expect(safe.getConfig().maxLength).toBe(100);
        });
    });

    describe('getConfig()', () => {
        it('should return current configuration', () => {
            const safe = new SafeRegex({ maxLength: 200, timeoutMs: 500 });
            const config = safe.getConfig();
            expect(config.maxLength).toBe(200);
            expect(config.timeoutMs).toBe(500);
        });

        it('should return a copy not the original', () => {
            const safe = new SafeRegex();
            const config = safe.getConfig();
            config.maxLength = 999;
            expect(safe.getConfig().maxLength).toBe(500);
        });
    });
});

describe('Convenience functions', () => {
    describe('createSafeRegex()', () => {
        it('should work like SafeRegex.create()', () => {
            const result = createSafeRegex('^hello$');
            expect(result.safe).toBe(true);
        });

        it('should pass flags', () => {
            const result = createSafeRegex('hello', 'i');
            expect(result.safe).toBe(true);
            expect(result.regex?.flags).toContain('i');
        });
    });

    describe('globToSafeRegex()', () => {
        it('should work like SafeRegex.globToRegex()', () => {
            const result = globToSafeRegex('*.ts');
            expect(result.safe).toBe(true);
        });
    });

    describe('escapeForRegex()', () => {
        it('should escape special characters', () => {
            expect(escapeForRegex('a.b*c')).toBe('a\\.b\\*c');
        });

        it('should handle empty string', () => {
            expect(escapeForRegex('')).toBe('');
        });

        it('should escape all special chars', () => {
            const special = '.*+?^${}()|[]\\';
            const escaped = escapeForRegex(special);
            expect(escaped).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
        });
    });
});

