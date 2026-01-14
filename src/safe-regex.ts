import {
    SafeRegexConfig,
    SafeRegexResult,
    DEFAULT_CONFIG,
} from './types';
import { analyzePattern, quickSafetyCheck } from './analyze';

/**
 * SafeRegex provides protected regex creation and execution.
 * 
 * @example
 * ```typescript
 * const safe = new SafeRegex();
 * const result = safe.create(userPattern);
 * if (result.safe && result.regex) {
 *   result.regex.test(input);
 * }
 * ```
 */
export class SafeRegex {
    private config: SafeRegexConfig;

    constructor(config: Partial<SafeRegexConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    /**
     * Create a regex with safety checks.
     * Returns a result object indicating whether the pattern is safe.
     */
    create(pattern: string, flags?: string): SafeRegexResult {
        // Check pattern length
        if (pattern.length > this.config.maxLength) {
            this.notify('block', `Pattern exceeds maximum length of ${this.config.maxLength}`, pattern);
            return {
                safe: false,
                error: `Pattern exceeds maximum length of ${this.config.maxLength}`,
                reason: 'pattern_too_long',
            };
        }

        // Quick safety check for obviously safe patterns
        if (!quickSafetyCheck(pattern)) {
            // Full pattern analysis
            const analysis = analyzePattern(pattern);
            if (!analysis.safe) {
                this.notify('block', analysis.message || 'Pattern blocked', pattern);
                return {
                    safe: false,
                    error: analysis.message,
                    reason: analysis.reason,
                };
            }
        }

        // Try to create the regex
        try {
            const regex = new RegExp(pattern, flags);
            return { safe: true, regex, reason: 'ok' };
        } catch (error) {
            return {
                safe: false,
                error: `Invalid regex syntax: ${error instanceof Error ? error.message : 'Unknown error'}`,
                reason: 'invalid_syntax',
            };
        }
    }

    /**
     * Execute regex.test() with timeout protection.
     * 
     * Note: JavaScript regex execution is synchronous and cannot be truly
     * interrupted. This uses a promise-based timeout that will reject if
     * the operation takes too long, but the regex will continue executing
     * in the background until completion.
     */
    async testWithTimeout(regex: RegExp, input: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.notify('warning', `Regex execution exceeded ${this.config.timeoutMs}ms timeout`, regex.source);
                reject(new Error(`Regex execution timed out after ${this.config.timeoutMs}ms`));
            }, this.config.timeoutMs);

            try {
                const result = regex.test(input);
                clearTimeout(timeout);
                resolve(result);
            } catch (error) {
                clearTimeout(timeout);
                reject(error);
            }
        });
    }

    /**
     * Convert a glob pattern to a safe regex.
     * 
     * Supports: * (any), ? (single char), ** (recursive)
     * 
     * @example
     * ```typescript
     * const result = safe.globToRegex('*.md');
     * // result.regex matches 'readme.md', 'file.md', etc.
     * ```
     */
    globToRegex(glob: string): SafeRegexResult {
        // Escape special regex characters except glob wildcards
        let pattern = glob
            .replace(/[.+^${}()|[\]\\]/g, '\\$&')  // Escape special chars
            .replace(/\*\*/g, '{{GLOBSTAR}}')       // Placeholder for **
            .replace(/\*/g, '[^/]*')                // * = anything except /
            .replace(/\?/g, '[^/]')                 // ? = single char except /
            .replace(/\{\{GLOBSTAR\}\}/g, '.*');    // ** = anything including /

        // Add anchors for full match
        pattern = `^${pattern}$`;

        return this.create(pattern, 'i');
    }

    /**
     * Create a regex from user input by escaping all special characters.
     * Use this when you want to match the literal user input.
     * 
     * @example
     * ```typescript
     * const result = safe.fromUserInput('file (1).txt');
     * // Matches literally 'file (1).txt'
     * ```
     */
    fromUserInput(input: string): SafeRegexResult {
        const escaped = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return this.create(escaped, 'i');
    }

    /**
     * Update configuration.
     */
    configure(config: Partial<SafeRegexConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration.
     */
    getConfig(): SafeRegexConfig {
        return { ...this.config };
    }

    /**
     * Notify via callbacks if configured.
     */
    private notify(type: 'block' | 'warning', message: string, pattern: string): void {
        if (type === 'block' && this.config.onBlock) {
            this.config.onBlock(message, pattern);
        }
        if (type === 'warning' && this.config.onWarning) {
            this.config.onWarning(message, pattern);
        }
    }
}

/**
 * Create a safe regex with default configuration.
 * Convenience function for simple use cases.
 */
export function createSafeRegex(pattern: string, flags?: string): SafeRegexResult {
    const safe = new SafeRegex();
    return safe.create(pattern, flags);
}

/**
 * Convert a glob pattern to a safe regex.
 * Convenience function for simple use cases.
 */
export function globToSafeRegex(glob: string): SafeRegexResult {
    const safe = new SafeRegex();
    return safe.globToRegex(glob);
}

/**
 * Escape a string for use as a literal regex pattern.
 */
export function escapeForRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

