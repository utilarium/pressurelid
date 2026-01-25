# Getting Started

Safe regex handling with ReDoS protection. Keeps dangerous patterns under pressure.

## Why Pressurelid?

Regular expressions are powerful but dangerous. User-provided patterns can freeze your application via **ReDoS (Regular Expression Denial of Service)** attacks. `pressurelid` provides:

- 🔍 **Pattern Analysis** - Detects dangerous regex constructs before execution
- ⏱️ **Timeout Protection** - Limits execution time for regex operations
- 🔒 **Safe Conversions** - Safely converts glob patterns and user input
- ⚙️ **Configurable** - Tune limits and callbacks for your use case

## Installation

```bash
npm install @theunwalked/pressurelid
```

Or with your preferred package manager:

```bash
yarn add @theunwalked/pressurelid
pnpm add @theunwalked/pressurelid
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

## Example: Protecting User Search

```typescript
import { SafeRegex } from '@theunwalked/pressurelid';

const safe = new SafeRegex();

function searchFiles(userPattern: string, files: string[]): string[] {
  const result = safe.create(userPattern, 'i');
  
  if (!result.safe) {
    throw new Error(`Invalid pattern: ${result.error}`);
  }
  
  return files.filter(file => result.regex!.test(file));
}

// Safe - pattern is analyzed before use
const matches = searchFiles('^test.*\\.ts$', ['test.ts', 'app.ts']);
// Returns: ['test.ts']

// Blocked - pattern has nested quantifiers
const badResult = safe.create('^(a+)+$');
// badResult.safe === false
// badResult.reason === 'nested_quantifiers'
```

## What Patterns Are Blocked?

Pressurelid detects these dangerous patterns:

| Pattern Type | Example | Risk |
|-------------|---------|------|
| Nested quantifiers | `(a+)+` | Exponential backtracking |
| Overlapping alternation | `(a\|ab)+` | Polynomial backtracking |
| Repeated groups | `(.*a){20}` | Catastrophic backtracking |
| Deep nesting | `((a+)+)+` | Exponential backtracking |

## Next Steps

- Learn about [Understanding ReDoS](./understanding-redos.md)
- Explore the [SafeRegex Class](./safe-regex.md) API
- Set up [Glob Patterns](./glob-patterns.md) for file matching
- Check [Configuration](./configuration.md) for tuning

