/**
 * Configuration for SafeRegex behavior
 */
export interface SafeRegexConfig {
    /** Maximum allowed pattern length (default: 500) */
    maxLength: number;
  
    /** Timeout in milliseconds for regex execution (default: 1000) */
    timeoutMs: number;
  
    /** Maximum backtrack depth estimate (default: 100000) */
    maxBacktrackDepth: number;
  
    /** Optional callback when a pattern is blocked */
    onBlock?: (message: string, pattern: string) => void;
  
    /** Optional callback for warnings */
    onWarning?: (message: string, pattern: string) => void;
}

/**
 * Default configuration with secure defaults
 */
export const DEFAULT_CONFIG: SafeRegexConfig = {
    maxLength: 500,
    timeoutMs: 1000,
    maxBacktrackDepth: 100000,
};

/**
 * Result of attempting to create a safe regex
 */
export interface SafeRegexResult {
    /** Whether the pattern was deemed safe */
    safe: boolean;
  
    /** The compiled regex if safe */
    regex?: RegExp;
  
    /** Error message if not safe */
    error?: string;
  
    /** Specific reason code for the result */
    reason?: SafeRegexReason;
}

/**
 * Reason codes for SafeRegexResult
 */
export type SafeRegexReason =
    | 'ok'
    | 'pattern_too_long'
    | 'nested_quantifiers'
    | 'overlapping_alternation'
    | 'catastrophic_backtracking'
    | 'invalid_syntax'
    | 'execution_timeout';

/**
 * Result of pattern analysis (internal)
 */
export interface PatternAnalysis {
    safe: boolean;
    reason?: SafeRegexReason;
    message?: string;
}

