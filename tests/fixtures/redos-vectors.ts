/**
 * Known ReDoS attack vectors for testing.
 * Each vector includes the pattern and a malicious input.
 * 
 * Note: These patterns are intentionally vulnerable to ReDoS for testing purposes.
 * They are only used to verify that SafeRegex correctly detects and blocks them.
 * codeql[js/redos]: Intentional ReDoS test vectors - patterns are blocked before execution
 */
export const REDOS_VECTORS = [
    {
        name: 'Classic nested quantifier',
        // codeql[js/redos]: Intentional ReDoS test vector
        pattern: '^(a+)+$',
        input: 'a'.repeat(25) + 'b',
        expectedSafe: false,
    },
    {
        name: 'Evil regex',
        // codeql[js/redos]: Intentional ReDoS test vector
        pattern: '^([a-zA-Z0-9])(([-.]|[_]+)?([a-zA-Z0-9]+))*(@){1}[a-z0-9]+[.]{1}(([a-z]{2,3})|([a-z]{2,3}[.]{1}[a-z]{2,3}))$',
        input: 'a]@a.a'.repeat(10),
        expectedSafe: false,
    },
    {
        name: 'Polynomial backtracking',
        pattern: '^(.*a){20}$',
        input: 'a'.repeat(25) + 'b',
        expectedSafe: false,
    },
];

/**
 * Known safe patterns that should be allowed.
 */
export const SAFE_PATTERNS = [
    { name: 'Simple literal', pattern: 'hello' },
    { name: 'Anchored word', pattern: '^\\w+$' },
    { name: 'File extension', pattern: '\\.md$' },
    { name: 'Simple email', pattern: '^[^@]+@[^@]+$' },
    { name: 'UUID', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' },
];

