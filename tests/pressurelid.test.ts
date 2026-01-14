import { describe, it, expect } from 'vitest';
import {
    VERSION,
    DEFAULT_CONFIG,
    analyzePattern,
    quickSafetyCheck,
    SafeRegex,
    createSafeRegex,
    globToSafeRegex,
    escapeForRegex,
} from '../src/pressurelid';

describe('pressurelid exports', () => {
    it('should export VERSION', () => {
        expect(typeof VERSION).toBe('string');
    });

    it('should export DEFAULT_CONFIG', () => {
        expect(DEFAULT_CONFIG).toBeDefined();
        expect(DEFAULT_CONFIG.maxLength).toBe(500);
    });

    it('should export analyzePattern', () => {
        expect(typeof analyzePattern).toBe('function');
        const result = analyzePattern('hello');
        expect(result.safe).toBe(true);
    });

    it('should export quickSafetyCheck', () => {
        expect(typeof quickSafetyCheck).toBe('function');
        expect(quickSafetyCheck('hello')).toBe(true);
    });

    it('should export SafeRegex class', () => {
        expect(SafeRegex).toBeDefined();
        const instance = new SafeRegex();
        expect(instance).toBeInstanceOf(SafeRegex);
    });

    it('should export createSafeRegex', () => {
        expect(typeof createSafeRegex).toBe('function');
        const result = createSafeRegex('^test$');
        expect(result.safe).toBe(true);
    });

    it('should export globToSafeRegex', () => {
        expect(typeof globToSafeRegex).toBe('function');
        const result = globToSafeRegex('*.md');
        expect(result.safe).toBe(true);
    });

    it('should export escapeForRegex', () => {
        expect(typeof escapeForRegex).toBe('function');
        expect(escapeForRegex('a.b')).toBe('a\\.b');
    });
});

