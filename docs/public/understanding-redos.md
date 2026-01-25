# Understanding ReDoS

Regular Expression Denial of Service (ReDoS) is a type of attack that exploits the way regex engines process certain patterns.

## What is ReDoS?

When a regex pattern causes the engine to enter "catastrophic backtracking," execution time grows exponentially with input size. This can freeze your application for minutes, hours, or effectively forever.

## Example Attack

```typescript
// Dangerous pattern with nested quantifiers
const pattern = /^(a+)+$/;
const input = 'a'.repeat(25) + 'b';

// This will take an extremely long time
pattern.test(input); // Never returns!
```

### Why Does This Happen?

The pattern `^(a+)+$` contains nested quantifiers (`+` inside `()+`). When the input doesn't match (ends with `b` instead of `a`), the engine tries every possible way to match:

1. First `a+` matches 25 a's, outer `+` matches once - fails at `b`
2. First `a+` matches 24 a's, outer group again - fails
3. ...and so on through 2^25 combinations

## Types of Dangerous Patterns

### 1. Nested Quantifiers

```typescript
// DANGEROUS
/^(a+)+$/        // Nested +
/^(a*)*$/        // Nested *
/^(a{1,}){1,}$/  // Nested {n,}

// SAFE alternatives
/^a+$/           // No nesting
/^(?:a)+$/       // Non-capturing, but still be careful
```

### 2. Overlapping Alternation

```typescript
// DANGEROUS
/^(a|ab)+$/      // 'a' and 'ab' overlap
/^(.*|.+)+$/     // Everything overlaps

// SAFE alternatives
/^a+b?$/         // Clearer intent
/^(?:ab|a)+$/    // Still overlapping - avoid
```

### 3. Repeated Groups with Wildcards

```typescript
// DANGEROUS
/^(.*a){20}$/    // Repeated wildcard group
/^(.+.+)+$/      // Multiple wildcards

// SAFE alternatives
/^(?:.*?a){20}$/ // Lazy quantifier (still risky)
/^[^a]*a(?:[^a]*a){19}$/ // Explicit non-a matching
```

## Real-World Vulnerabilities

ReDoS has affected major projects:

- **Cloudflare** (2019): A single regex pattern in their WAF caused a global outage
- **Stack Overflow** (2016): A regex in their markdown parser caused service degradation
- **npm packages**: Many popular packages have had ReDoS vulnerabilities

## How Pressurelid Helps

Pressurelid provides multiple layers of protection:

### 1. Static Analysis

Before a pattern is used, pressurelid analyzes its structure:

```typescript
import { SafeRegex } from '@theunwalked/pressurelid';

const safe = new SafeRegex();

// Blocked immediately
const result = safe.create('^(a+)+$');
// result.safe === false
// result.reason === 'nested_quantifiers'
```

### 2. Timeout Protection

For patterns that pass static analysis, runtime timeouts provide a safety net:

```typescript
const safe = new SafeRegex({ timeoutMs: 100 });

try {
  const matches = await safe.testWithTimeout(pattern, input);
} catch (e) {
  // Pattern took too long - possibly dangerous
}
```

### 3. Safe Conversions

Convert user input to safe patterns:

```typescript
// User input is escaped - no regex syntax interpreted
const result = safe.fromUserInput('file (1).txt');
// Creates: /file \(1\)\.txt/

// Glob patterns are safely converted
const glob = safe.globToRegex('*.{ts,tsx}');
```

## Limitations

### Static Analysis

No static analysis can catch all ReDoS patterns:

- Novel attack patterns may not be detected
- Some safe patterns may be incorrectly flagged (false positives)
- Complex patterns may evade detection

### Timeout Limitations

JavaScript regex execution is synchronous and cannot be truly interrupted:

1. The timeout starts a timer
2. The regex executes
3. If the timer fires first, the promise rejects

**But the regex continues running in the background until completion.**

For truly interruptible execution, consider the `re2` package which uses Google's RE2 engine.

## Best Practices

1. **Never trust user-provided regex** - Always validate with SafeRegex
2. **Use timeouts** - Even for "safe" patterns
3. **Prefer specific patterns** - Avoid `.*` when possible
4. **Test with malicious input** - Use known ReDoS payloads in testing
5. **Consider alternatives** - Sometimes string methods are safer than regex

