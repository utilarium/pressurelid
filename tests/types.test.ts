import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG } from '../src/types';

describe('Types', () => {
    describe('DEFAULT_CONFIG', () => {
        it('should have secure defaults', () => {
            expect(DEFAULT_CONFIG.maxLength).toBe(500);
            expect(DEFAULT_CONFIG.timeoutMs).toBe(1000);
            expect(DEFAULT_CONFIG.maxBacktrackDepth).toBe(100000);
        });
    });
});

