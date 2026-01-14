# pressurelid Guide

## Table of Contents

1. [Understanding ReDoS](#understanding-redos)
2. [Integration Patterns](#integration-patterns)
3. [Configuration Guide](#configuration-guide)
4. [Troubleshooting](#troubleshooting)

## Understanding ReDoS

### What is ReDoS?

Regular Expression Denial of Service (ReDoS) occurs when a regex pattern causes the engine to enter "catastrophic backtracking" - a state where execution time grows exponentially with input size.

### Example Attack

```typescript
// Dangerous pattern
const pattern = /^(a+)+$/;
const input = 'a'.repeat(25) + 'b';

// This will take an extremely long time
pattern.test(input); // Never returns!
```

### Why It Happens

The pattern `^(a+)+$` contains nested quantifiers. When the input doesn't match, the engine tries every possible way to match, leading to 2^n combinations.

## Integration Patterns

### File Loader

```typescript
import { SafeRegex } from '@theunwalked/pressurelid';

const safe = new SafeRegex();

function loadFiles(ignorePatterns: string[]) {
  const regexPatterns = ignorePatterns.map(pattern => {
    const result = safe.globToRegex(pattern);
    if (result.safe && result.regex) {
      return result.regex;
    }
    console.warn(`Ignoring unsafe pattern: ${pattern}`);
    return null;
  }).filter(Boolean);
  
  // Use patterns...
}
```

### Search Feature

```typescript
import { SafeRegex } from '@theunwalked/pressurelid';

async function search(userPattern: string, files: string[]) {
  const safe = new SafeRegex({ timeoutMs: 500 });
  const result = safe.create(userPattern, 'i');
  
  if (!result.safe) {
    throw new Error(`Invalid search pattern: ${result.error}`);
  }
  
  const matches = [];
  for (const file of files) {
    try {
      if (await safe.testWithTimeout(result.regex!, file)) {
        matches.push(file);
      }
    } catch (e) {
      // Timeout - skip this file
    }
  }
  
  return matches;
}
```

### With Audit Logging

```typescript
import { SafeRegex } from '@theunwalked/pressurelid';

const safe = new SafeRegex({
  onBlock: (message, pattern) => {
    auditLogger.log({
      type: 'regex_blocked',
      message,
      pattern: pattern.substring(0, 100), // Truncate for safety
    });
  },
  onWarning: (message, pattern) => {
    auditLogger.log({
      type: 'regex_warning',
      message,
    });
  },
});
```

## Configuration Guide

### Strict Mode

For maximum security:

```typescript
const safe = new SafeRegex({
  maxLength: 100,      // Short patterns only
  timeoutMs: 100,      // Fast timeout
});
```

### Permissive Mode

For trusted inputs:

```typescript
const safe = new SafeRegex({
  maxLength: 2000,     // Allow longer patterns
  timeoutMs: 5000,     // Longer timeout
});
```

## Troubleshooting

### Pattern falsely blocked

If a safe pattern is incorrectly blocked:

1. Check the `reason` code in the result
2. Consider if the pattern can be rewritten
3. Use `fromUserInput()` for literal matching
4. File an issue if it's a clear false positive

### Timeout too aggressive

If legitimate operations timeout:

1. Increase `timeoutMs` configuration
2. Consider pre-validating patterns separately
3. Use batching for large inputs

### Performance concerns

Pattern analysis is fast (<1ms typically), but if you're analyzing thousands of patterns:

1. Cache analysis results
2. Use `quickSafetyCheck()` for fast path
3. Analyze patterns at startup, not per-request

