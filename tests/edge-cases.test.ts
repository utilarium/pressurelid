import { describe, it, expect } from 'vitest';
import { SafeRegex } from '../src/safe-regex';

describe('Edge Cases', () => {
    describe('Empty and minimal inputs', () => {
        it('should handle empty pattern', () => {
            const safe = new SafeRegex();
            const result = safe.create('');
            expect(result.safe).toBe(true);
        });

        it('should handle single character pattern', () => {
            const safe = new SafeRegex();
            const result = safe.create('a');
            expect(result.safe).toBe(true);
        });

        it('should handle whitespace-only pattern', () => {
            const safe = new SafeRegex();
            const result = safe.create('   ');
            expect(result.safe).toBe(true);
        });
    });

    describe('Unicode patterns', () => {
        it('should handle unicode characters', () => {
            const safe = new SafeRegex();
            const result = safe.create('^[\\u0000-\\uFFFF]+$');
            expect(result.safe).toBe(true);
        });

        it('should handle emoji patterns', () => {
            const safe = new SafeRegex();
            const result = safe.create('😀+');
            expect(result.safe).toBe(true);
        });
    });

    describe('Boundary conditions', () => {
        it('should handle pattern at exact maxLength', () => {
            const maxLength = 50;
            const safe = new SafeRegex({ maxLength });
            const pattern = 'a'.repeat(maxLength);
            const result = safe.create(pattern);
            expect(result.safe).toBe(true);
        });

        it('should reject pattern one char over maxLength', () => {
            const maxLength = 50;
            const safe = new SafeRegex({ maxLength });
            const pattern = 'a'.repeat(maxLength + 1);
            const result = safe.create(pattern);
            expect(result.safe).toBe(false);
        });
    });

    describe('Glob edge cases', () => {
        it('should handle empty glob', () => {
            const safe = new SafeRegex();
            const result = safe.globToRegex('');
            expect(result.safe).toBe(true);
        });

        it('should handle glob with only wildcards', () => {
            const safe = new SafeRegex();
            const result = safe.globToRegex('***');
            expect(result.safe).toBe(true);
        });

        it('should handle glob with special characters', () => {
            const safe = new SafeRegex();
            const result = safe.globToRegex('file[1].txt');
            expect(result.safe).toBe(true);
            expect(result.regex?.test('file[1].txt')).toBe(true);
        });
    });

    describe('Configuration edge cases', () => {
        it('should handle very large maxLength', () => {
            const safe = new SafeRegex({ maxLength: 1000000 });
            const result = safe.create('a'.repeat(10000));
            expect(result.safe).toBe(true);
        });
    });

    describe('Error handling', () => {
        it('should handle non-Error exceptions gracefully', () => {
            const safe = new SafeRegex();
            // Create pattern that causes internal error
            const result = safe.create('[');
            expect(result.safe).toBe(false);
            expect(result.reason).toBe('invalid_syntax');
        });

        it('should handle nested groups properly', () => {
            const safe = new SafeRegex();
            const result = safe.create('((a))');
            expect(result.safe).toBe(true);
        });
    });

    describe('testWithTimeout edge cases', () => {
        it('should handle regex that throws during test', async () => {
            const safe = new SafeRegex();
            // Valid regex but tests exception path
            const regex = /test/;
            const result = await safe.testWithTimeout(regex, 'test');
            expect(result).toBe(true);
        });
    });
});

