# Glob Patterns

Pressurelid provides safe conversion of glob patterns to regex, commonly used for file matching.

## Basic Usage

```typescript
import { SafeRegex, globToSafeRegex } from '@theunwalked/pressurelid';

// Using the class
const safe = new SafeRegex();
const result = safe.globToRegex('**/*.ts');

// Using the convenience function
const { safe: isSafe, regex } = globToSafeRegex('*.md');
```

## Supported Patterns

### Wildcards

| Pattern | Description | Example Match |
|---------|-------------|---------------|
| `*` | Match any characters except `/` | `*.ts` matches `file.ts` |
| `**` | Match any characters including `/` | `**/*.ts` matches `src/file.ts` |
| `?` | Match single character | `file?.ts` matches `file1.ts` |

### Character Classes

| Pattern | Description | Example Match |
|---------|-------------|---------------|
| `[abc]` | Match any character in set | `[abc].ts` matches `a.ts` |
| `[!abc]` | Match any character not in set | `[!abc].ts` matches `d.ts` |
| `[a-z]` | Match character range | `[a-z].ts` matches `x.ts` |

### Brace Expansion

| Pattern | Description | Example Match |
|---------|-------------|---------------|
| `{a,b}` | Match either `a` or `b` | `*.{ts,tsx}` matches `file.tsx` |
| `{a,b,c}` | Match any of the options | `*.{js,ts,jsx,tsx}` |

## Common Patterns

### File Extensions

```typescript
const safe = new SafeRegex();

// Single extension
safe.globToRegex('*.ts');

// Multiple extensions
safe.globToRegex('*.{ts,tsx,js,jsx}');

// Any file
safe.globToRegex('*');
```

### Directory Patterns

```typescript
// Files in any subdirectory
safe.globToRegex('**/*.ts');

// Files in specific directory
safe.globToRegex('src/*.ts');

// Files in any src directory
safe.globToRegex('**/src/*.ts');
```

### Exclusion Patterns

```typescript
// Combined with your file listing logic
const includePattern = safe.globToRegex('**/*.ts');
const excludePattern = safe.globToRegex('**/*.test.ts');

const files = allFiles.filter(f => 
  includePattern.regex?.test(f) && 
  !excludePattern.regex?.test(f)
);
```

## Real-World Examples

### File Loader

```typescript
import { SafeRegex } from '@theunwalked/pressurelid';
import { readdirSync } from 'fs';

const safe = new SafeRegex();

function loadFiles(dir: string, ignorePatterns: string[]): string[] {
  const patterns = ignorePatterns.map(pattern => {
    const result = safe.globToRegex(pattern);
    if (result.safe && result.regex) {
      return result.regex;
    }
    console.warn(`Invalid ignore pattern: ${pattern}`);
    return null;
  }).filter(Boolean) as RegExp[];
  
  const files = readdirSync(dir, { recursive: true });
  
  return files.filter(file => {
    const path = String(file);
    return !patterns.some(p => p.test(path));
  });
}

const files = loadFiles('./src', [
  'node_modules/**',
  '**/*.test.ts',
  '**/dist/**',
]);
```

### Configuration Loading

```typescript
import { SafeRegex } from '@theunwalked/pressurelid';

const safe = new SafeRegex();

interface Config {
  include: string[];
  exclude: string[];
}

function createFileMatcher(config: Config) {
  const includes = config.include.map(p => safe.globToRegex(p));
  const excludes = config.exclude.map(p => safe.globToRegex(p));
  
  // Validate all patterns
  const invalid = [...includes, ...excludes].filter(r => !r.safe);
  if (invalid.length > 0) {
    throw new Error(`Invalid patterns: ${invalid.map(r => r.error).join(', ')}`);
  }
  
  return (path: string): boolean => {
    const matchesInclude = includes.some(r => r.regex?.test(path));
    const matchesExclude = excludes.some(r => r.regex?.test(path));
    return matchesInclude && !matchesExclude;
  };
}
```

## Glob vs Regex

Sometimes you might need actual regex instead of glob. Here's when to use each:

| Use Glob | Use Regex |
|----------|-----------|
| File path matching | Complex text patterns |
| User-facing file selectors | Validation patterns |
| Configuration files | Search patterns |
| Simple wildcard needs | Character class patterns |

## Safety Considerations

Glob patterns are converted to regex, so they're subject to the same safety analysis:

```typescript
// This is safe - glob syntax limits complexity
safe.globToRegex('**/*.ts');

// Complex nested braces are checked
const result = safe.globToRegex('{a,{b,{c,d}}}');
// Will be checked for safety
```

The conversion process generates regex patterns that are typically safe, but the safety analysis still runs to catch edge cases.

## Convenience Function

For simple usage, use the standalone function:

```typescript
import { globToSafeRegex } from '@theunwalked/pressurelid';

const { safe, regex, error } = globToSafeRegex('**/*.md');

if (safe && regex) {
  const markdownFiles = files.filter(f => regex.test(f));
}
```

