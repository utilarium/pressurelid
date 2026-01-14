import { PatternAnalysis, SafeRegexReason } from './types';

/**
 * Patterns known to cause exponential backtracking
 */
const DANGEROUS_PATTERNS: Array<{ regex: RegExp; reason: SafeRegexReason; message: string }> = [
    {
        // Nested quantifiers: (a+)+, (a*)+, etc.
        regex: /\([^)]*[+*][^)]*\)[+*]/,
        reason: 'nested_quantifiers',
        message: 'Pattern contains nested quantifiers which can cause exponential backtracking',
    },
    {
        // Overlapping alternations with quantifiers: (a|ab)+
        regex: /\([^)]*\|[^)]*\)[+*]/,
        reason: 'overlapping_alternation',
        message: 'Pattern contains alternation with quantifier which may cause backtracking',
    },
    {
        // Repeated groups: (a+){n} followed by quantifier
        regex: /\([^)]+\)\{[0-9,]+\}[+*]?/,
        reason: 'catastrophic_backtracking',
        message: 'Pattern contains repeated group which may cause backtracking',
    },
    {
        // Deeply nested groups with quantifiers
        regex: /\([^)]*\([^)]*[+*]\)[^)]*[+*]\)/,
        reason: 'nested_quantifiers',
        message: 'Pattern contains deeply nested quantifiers',
    },
    {
        // Character class with quantifier followed by similar class
        regex: /\[[^\]]+\][+*]\[[^\]]+\][+*]/,
        reason: 'catastrophic_backtracking',
        message: 'Pattern contains overlapping character classes with quantifiers',
    },
];

/**
 * Analyze a regex pattern for potential ReDoS vulnerabilities.
 * 
 * This performs static analysis only - it cannot catch all dangerous patterns.
 * Use testWithTimeout() for runtime protection.
 */
export function analyzePattern(pattern: string): PatternAnalysis {
    for (const dangerous of DANGEROUS_PATTERNS) {
        if (dangerous.regex.test(pattern)) {
            return {
                safe: false,
                reason: dangerous.reason,
                message: dangerous.message,
            };
        }
    }

    // Check for excessive quantifier nesting depth
    const nestingDepth = countQuantifierNesting(pattern);
    if (nestingDepth > 2) {
        return {
            safe: false,
            reason: 'nested_quantifiers',
            message: `Pattern has excessive quantifier nesting depth (${nestingDepth})`,
        };
    }

    return { safe: true, reason: 'ok' };
}

/**
 * Count the nesting depth of quantifiers in a pattern.
 */
function countQuantifierNesting(pattern: string): number {
    let maxDepth = 0;
    let currentDepth = 0;
    let inGroup = 0;

    for (let i = 0; i < pattern.length; i++) {
        const char = pattern[i];
        const prev = pattern[i - 1];

        // Track group depth
        if (char === '(' && prev !== '\\') {
            inGroup++;
        } else if (char === ')' && prev !== '\\') {
            inGroup = Math.max(0, inGroup - 1);
        }

        // Track quantifiers
        if ((char === '+' || char === '*' || char === '?') && prev !== '\\') {
            if (inGroup > 0) {
                currentDepth = inGroup;
                maxDepth = Math.max(maxDepth, currentDepth);
            }
        }
    }

    return maxDepth;
}

/**
 * Check if a pattern is likely safe without full analysis.
 * Use for quick rejection of obviously safe patterns.
 */
export function quickSafetyCheck(pattern: string): boolean {
    // No quantifiers = safe
    if (!/[+*?]/.test(pattern)) {
        return true;
    }

    // No groups = generally safe
    if (!/[()]/.test(pattern)) {
        return true;
    }

    // Simple anchored patterns are usually safe
    if (/^\^[^+*?()]+\$$/.test(pattern)) {
        return true;
    }

    return false;
}

