# API Reference

Complete API documentation for pressurelid.

## SafeRegex Class

### Constructor

```typescript
new SafeRegex(config?: SafeRegexConfig)
```

#### SafeRegexConfig

```typescript
interface SafeRegexConfig {
  maxLength?: number;      // Default: 500
  timeoutMs?: number;      // Default: 1000
  onBlock?: (message: string, pattern: string) => void;
  onWarning?: (message: string, pattern: string) => void;
}
```

### Methods

#### create()

Create a regex with safety checks.

```typescript
create(pattern: string, flags?: string): SafeRegexResult
```

**Parameters:**
- `pattern` - The regex pattern string
- `flags` - Optional regex flags (g, i, m, s, u, y)

**Returns:** `SafeRegexResult`

#### testWithTimeout()

Execute `regex.test()` with timeout protection.

```typescript
testWithTimeout(regex: RegExp, input: string): Promise<boolean>
```

**Parameters:**
- `regex` - The regex to test
- `input` - The string to test against

**Returns:** `Promise<boolean>` - Resolves to match result, rejects on timeout

#### globToRegex()

Convert a glob pattern to a safe regex.

```typescript
globToRegex(glob: string): SafeRegexResult
```

**Parameters:**
- `glob` - A glob pattern (e.g., `*.ts`, `**/*.md`)

**Returns:** `SafeRegexResult`

#### fromUserInput()

Escape user input for literal matching.

```typescript
fromUserInput(input: string): SafeRegexResult
```

**Parameters:**
- `input` - User-provided string to match literally

**Returns:** `SafeRegexResult`

## Types

### SafeRegexResult

```typescript
interface SafeRegexResult {
  safe: boolean;           // Was the pattern deemed safe?
  regex?: RegExp;          // The compiled regex (if safe)
  error?: string;          // Error message (if not safe)
  reason?: SafeRegexReason; // Machine-readable reason code
}
```

### SafeRegexReason

```typescript
type SafeRegexReason =
  | 'ok'                        // Pattern is safe
  | 'pattern_too_long'          // Exceeds maxLength
  | 'nested_quantifiers'        // Has nested +, *, {n,}
  | 'overlapping_alternation'   // Has overlapping alternatives
  | 'catastrophic_backtracking' // General backtracking risk
  | 'invalid_syntax'            // Invalid regex syntax
  | 'execution_timeout';        // Timed out during test
```

## Convenience Functions

### createSafeRegex()

Create a safe regex with default configuration.

```typescript
function createSafeRegex(
  pattern: string,
  flags?: string
): SafeRegexResult
```

**Example:**

```typescript
import { createSafeRegex } from '@theunwalked/pressurelid';

const { safe, regex, error } = createSafeRegex('^[a-z]+$', 'i');
```

### globToSafeRegex()

Convert a glob pattern with default configuration.

```typescript
function globToSafeRegex(glob: string): SafeRegexResult
```

**Example:**

```typescript
import { globToSafeRegex } from '@theunwalked/pressurelid';

const { safe, regex } = globToSafeRegex('**/*.md');
```

### escapeForRegex()

Escape a string for use in a regex pattern.

```typescript
function escapeForRegex(str: string): string
```

**Example:**

```typescript
import { escapeForRegex } from '@theunwalked/pressurelid';

const escaped = escapeForRegex('a.b*c');
// Returns: 'a\\.b\\*c'
```

## Exports

All exports from the main module:

```typescript
import {
  // Class
  SafeRegex,
  
  // Convenience functions
  createSafeRegex,
  globToSafeRegex,
  escapeForRegex,
  
  // Types (TypeScript)
  type SafeRegexConfig,
  type SafeRegexResult,
  type SafeRegexReason,
} from '@theunwalked/pressurelid';
```

## Pattern Detection

Pressurelid detects the following dangerous pattern types:

### Nested Quantifiers

Patterns where quantifiers are nested inside groups:

```typescript
// Detected as dangerous
/^(a+)+$/        // + inside ()+
/^(a*)*$/        // * inside ()*
/^(a{1,}){1,}$/  // {n,} inside ()+
```

### Overlapping Alternation

Patterns where alternatives can match the same input:

```typescript
// Detected as dangerous
/^(a|ab)+$/      // 'a' matches prefix of 'ab'
/^(.*|.+)+$/     // Both match everything
```

### Catastrophic Backtracking

General patterns that can cause exponential backtracking:

```typescript
// Detected as dangerous
/^(.*a){20}$/    // Repeated wildcard with specific char
/^(.+.+)+$/      // Multiple wildcards
```

## Error Handling

```typescript
import { SafeRegex } from '@theunwalked/pressurelid';

const safe = new SafeRegex();

// Pattern safety check
const result = safe.create(userPattern);
if (!result.safe) {
  switch (result.reason) {
    case 'pattern_too_long':
      throw new Error('Pattern is too long');
    case 'nested_quantifiers':
      throw new Error('Pattern has dangerous nested quantifiers');
    case 'invalid_syntax':
      throw new Error('Pattern has invalid syntax');
    default:
      throw new Error(result.error);
  }
}

// Timeout handling
try {
  const matches = await safe.testWithTimeout(result.regex!, input);
} catch (error) {
  // Timeout occurred
  console.error('Pattern execution timed out');
}
```

## Comparison with Alternatives

| Package | Approach | Pros | Cons |
|---------|----------|------|------|
| `pressurelid` | Static analysis + timeout | Fast, no native deps | Cannot interrupt |
| `safe-regex` | Backtracking estimation | Simple | High false positives |
| `safe-regex2` | AST analysis | Thorough | More complex |
| `re2` | Native RE2 engine | Truly safe | Native dependency |

