import { describe, it, expect } from 'vitest';
import { analyzePattern, quickSafetyCheck } from '../src/analyze';

describe('analyzePattern', () => {
    describe('should block dangerous patterns', () => {
        it('blocks nested quantifiers (a+)+', () => {
            const result = analyzePattern('^(a+)+$');
            expect(result.safe).toBe(false);
            expect(result.reason).toBe('nested_quantifiers');
        });

        it('blocks overlapping alternations (a|ab)+', () => {
            const result = analyzePattern('(a|ab)+');
            expect(result.safe).toBe(false);
        });

        it('blocks repeated groups with quantifiers', () => {
            const result = analyzePattern('(a+){10}');
            expect(result.safe).toBe(false);
            expect(result.reason).toBe('catastrophic_backtracking');
        });

        it('blocks deeply nested quantifiers', () => {
            const result = analyzePattern('((a+)+)');
            expect(result.safe).toBe(false);
        });
    });

    describe('should allow safe patterns', () => {
        it('allows simple literal patterns', () => {
            const result = analyzePattern('hello');
            expect(result.safe).toBe(true);
        });

        it('allows anchored alphanumeric patterns', () => {
            const result = analyzePattern('^[a-z]+$');
            expect(result.safe).toBe(true);
        });

        it('allows file extension patterns', () => {
            const result = analyzePattern('^.*\\.md$');
            expect(result.safe).toBe(true);
        });

        it('allows email-like patterns', () => {
            const result = analyzePattern('^[^@]+@[^@]+\\.[a-z]+$');
            expect(result.safe).toBe(true);
        });

        it('allows UUID patterns', () => {
            const result = analyzePattern('^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');
            expect(result.safe).toBe(true);
        });
    });
});

describe('quickSafetyCheck', () => {
    it('returns true for patterns without quantifiers', () => {
        expect(quickSafetyCheck('hello')).toBe(true);
        expect(quickSafetyCheck('^abc$')).toBe(true);
    });

    it('returns true for patterns without groups', () => {
        expect(quickSafetyCheck('a+')).toBe(true);
        expect(quickSafetyCheck('[a-z]*')).toBe(true);
    });

    it('returns false for patterns with groups and quantifiers', () => {
        expect(quickSafetyCheck('(a+)+')).toBe(false);
    });

    it('returns true for simple anchored patterns', () => {
        expect(quickSafetyCheck('^hello$')).toBe(true);
    });
});

