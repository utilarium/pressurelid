# @theunwalked/pressurelid

Safe regex handling with ReDoS protection. Keeps dangerous patterns under pressure.

[![npm version](https://img.shields.io/npm/v/@theunwalked/pressurelid.svg)](https://www.npmjs.com/package/@theunwalked/pressurelid)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

## Why pressurelid?

Regular expressions are powerful but dangerous. User-provided patterns can freeze your application via **ReDoS (Regular Expression Denial of Service)** attacks. `pressurelid` provides:

- 🔍 **Pattern Analysis** - Detects dangerous regex constructs before execution
- ⏱️ **Timeout Protection** - Limits execution time for regex operations
- 🔒 **Safe Conversions** - Safely converts glob patterns and user input
- ⚙️ **Configurable** - Tune limits and callbacks for your use case

## Installation

```bash
npm install @theunwalked/pressurelid
```

## Quick Start

```typescript
import { SafeRegex, createSafeRegex, globToSafeRegex } from '@theunwalked/pressurelid';

// Basic usage
const safe = new SafeRegex();
const result = safe.create(userPattern);

if (result.safe && result.regex) {
  result.regex.test(input);
} else {
  console.error('Unsafe pattern:', result.error);
}

// Convenience function
const { safe: isSafe, regex, error } = createSafeRegex('^[a-z]+$');

// Convert glob patterns safely
const globResult = globToSafeRegex('**/*.md');
```

## API

### `SafeRegex` Class

```typescript
const safe = new SafeRegex({
  maxLength: 500,        // Maximum pattern length (default: 500)
  timeoutMs: 1000,       // Execution timeout in ms (default: 1000)
  onBlock: (msg, pattern) => {},   // Called when pattern is blocked
  onWarning: (msg, pattern) => {}, // Called on warnings
});
```

#### `create(pattern: string, flags?: string): SafeRegexResult`

Create a regex with safety checks.

```typescript
const result = safe.create('^hello$', 'i');
// { safe: true, regex: /^hello$/i, reason: 'ok' }

const badResult = safe.create('^(a+)+$');
// { safe: false, error: '...', reason: 'nested_quantifiers' }
```

#### `testWithTimeout(regex: RegExp, input: string): Promise<boolean>`

Execute `regex.test()` with timeout protection.

```typescript
try {
  const matches = await safe.testWithTimeout(/pattern/, 'input');
} catch (e) {
  // Timed out
}
```

#### `globToRegex(glob: string): SafeRegexResult`

Convert glob pattern to safe regex.

```typescript
const result = safe.globToRegex('*.{ts,tsx}');
result.regex?.test('file.ts'); // true
```

#### `fromUserInput(input: string): SafeRegexResult`

Escape user input for literal matching.

```typescript
const result = safe.fromUserInput('file (1).txt');
result.regex?.test('file (1).txt'); // true
```

### Convenience Functions

```typescript
// Create safe regex with defaults
const result = createSafeRegex(pattern, flags);

// Convert glob with defaults
const result = globToSafeRegex(glob);

// Escape string for regex
const escaped = escapeForRegex('a.b*c'); // 'a\\.b\\*c'
```

### Result Types

```typescript
interface SafeRegexResult {
  safe: boolean;           // Was the pattern deemed safe?
  regex?: RegExp;          // The compiled regex (if safe)
  error?: string;          // Error message (if not safe)
  reason?: SafeRegexReason; // Machine-readable reason code
}

type SafeRegexReason =
  | 'ok'
  | 'pattern_too_long'
  | 'nested_quantifiers'
  | 'overlapping_alternation'
  | 'catastrophic_backtracking'
  | 'invalid_syntax'
  | 'execution_timeout';
```

## Patterns Detected

`pressurelid` detects these dangerous patterns:

| Pattern Type | Example | Risk |
|-------------|---------|------|
| Nested quantifiers | `(a+)+` | Exponential backtracking |
| Overlapping alternation | `(a\|ab)+` | Polynomial backtracking |
| Repeated groups | `(.*a){20}` | Catastrophic backtracking |
| Deep nesting | `((a+)+)+` | Exponential backtracking |

## Limitations

### Static Analysis

Static analysis cannot catch all ReDoS patterns. Some limitations:

- Novel attack patterns may not be detected
- Some safe patterns may be incorrectly flagged (false positives)
- Complex patterns may evade detection

Always use `testWithTimeout()` for runtime protection.

### Timeout Behavior

JavaScript regex execution is synchronous and cannot be truly interrupted. The timeout:

1. Starts a timer
2. Executes the regex
3. Rejects the promise if timer fires first

The regex continues running in the background until completion. For truly interruptible execution, consider the `re2` package.

## Alternatives

| Package | Approach | Pros | Cons |
|---------|----------|------|------|
| `pressurelid` | Static analysis + timeout | Fast, no native deps | Cannot interrupt |
| `safe-regex` | Backtracking estimation | Simple | High false positives |
| `safe-regex2` | AST analysis | Thorough | More complex |
| `re2` | Native RE2 engine | Truly safe | Native dependency |

## License

Apache-2.0
TEST
