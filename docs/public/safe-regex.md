# SafeRegex Class

The SafeRegex class is the main API for creating and validating regex patterns.

## Constructor

```typescript
import { SafeRegex } from '@theunwalked/pressurelid';

const safe = new SafeRegex({
  maxLength: 500,        // Maximum pattern length (default: 500)
  timeoutMs: 1000,       // Execution timeout in ms (default: 1000)
  onBlock: (msg, pattern) => {},   // Called when pattern is blocked
  onWarning: (msg, pattern) => {}, // Called on warnings
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxLength` | number | 500 | Maximum allowed pattern length |
| `timeoutMs` | number | 1000 | Timeout for regex operations |
| `onBlock` | function | - | Callback when pattern is blocked |
| `onWarning` | function | - | Callback for warnings |

## create()

Create a regex with safety checks.

```typescript
create(pattern: string, flags?: string): SafeRegexResult
```

### Parameters

- `pattern` - The regex pattern string
- `flags` - Optional regex flags (e.g., 'i', 'g', 'm')

### Return Value

```typescript
interface SafeRegexResult {
  safe: boolean;           // Was the pattern deemed safe?
  regex?: RegExp;          // The compiled regex (if safe)
  error?: string;          // Error message (if not safe)
  reason?: SafeRegexReason; // Machine-readable reason code
}
```

### Example

```typescript
const safe = new SafeRegex();

// Safe pattern
const result = safe.create('^hello$', 'i');
// { safe: true, regex: /^hello$/i, reason: 'ok' }

// Dangerous pattern
const badResult = safe.create('^(a+)+$');
// { safe: false, error: '...', reason: 'nested_quantifiers' }
```

## testWithTimeout()

Execute `regex.test()` with timeout protection.

```typescript
testWithTimeout(regex: RegExp, input: string): Promise<boolean>
```

### Parameters

- `regex` - The regex to test
- `input` - The string to test against

### Return Value

Promise that resolves to `true` if the regex matches, `false` otherwise.

### Example

```typescript
const safe = new SafeRegex({ timeoutMs: 100 });

try {
  const matches = await safe.testWithTimeout(/pattern/, 'input');
  console.log('Matches:', matches);
} catch (e) {
  console.error('Pattern timed out');
}
```

### Important Note

The timeout doesn't actually stop regex execution (JavaScript limitation). It only rejects the promise. The regex continues running in the background.

## globToRegex()

Convert a glob pattern to a safe regex.

```typescript
globToRegex(glob: string): SafeRegexResult
```

### Parameters

- `glob` - A glob pattern (e.g., `*.ts`, `**/*.md`)

### Example

```typescript
const safe = new SafeRegex();

const result = safe.globToRegex('*.{ts,tsx}');
result.regex?.test('file.ts'); // true
result.regex?.test('file.js'); // false

// Recursive glob
const recursive = safe.globToRegex('**/*.md');
recursive.regex?.test('docs/guide/intro.md'); // true
```

### Supported Glob Syntax

| Pattern | Description |
|---------|-------------|
| `*` | Match any characters except `/` |
| `**` | Match any characters including `/` |
| `?` | Match single character |
| `{a,b}` | Match either `a` or `b` |
| `[abc]` | Match any character in brackets |
| `[!abc]` | Match any character not in brackets |

## fromUserInput()

Escape user input for literal matching.

```typescript
fromUserInput(input: string): SafeRegexResult
```

### Parameters

- `input` - User-provided string to match literally

### Example

```typescript
const safe = new SafeRegex();

const result = safe.fromUserInput('file (1).txt');
result.regex?.test('file (1).txt'); // true
result.regex?.test('file 1.txt');   // false
```

All regex metacharacters are escaped, so the input is matched literally.

## Reason Codes

The `reason` field provides machine-readable status:

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

## Error Handling

```typescript
const safe = new SafeRegex({
  onBlock: (message, pattern) => {
    console.error(`Blocked: ${message}`);
    // Log, alert, or track blocked patterns
  },
  onWarning: (message, pattern) => {
    console.warn(`Warning: ${message}`);
  },
});

const result = safe.create(dangerousPattern);
// onBlock called automatically if pattern is dangerous
```

## Full Example

```typescript
import { SafeRegex } from '@theunwalked/pressurelid';

// Configure with audit logging
const safe = new SafeRegex({
  maxLength: 200,
  timeoutMs: 500,
  onBlock: (message, pattern) => {
    auditLog.warn('Regex blocked', { message, pattern });
  },
});

// User search feature
async function search(userPattern: string, items: string[]): Promise<string[]> {
  const result = safe.create(userPattern, 'i');
  
  if (!result.safe) {
    throw new Error(`Invalid search pattern: ${result.error}`);
  }
  
  const matches: string[] = [];
  
  for (const item of items) {
    try {
      if (await safe.testWithTimeout(result.regex!, item)) {
        matches.push(item);
      }
    } catch {
      // Item search timed out - skip
    }
  }
  
  return matches;
}
```

