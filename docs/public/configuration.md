# Configuration

Tune pressurelid for your specific use case.

## Default Configuration

```typescript
import { SafeRegex } from '@theunwalked/pressurelid';

const safe = new SafeRegex({
  maxLength: 500,      // Maximum pattern length
  timeoutMs: 1000,     // Timeout for operations
  onBlock: undefined,  // Callback for blocked patterns
  onWarning: undefined // Callback for warnings
});
```

## Configuration Options

### maxLength

Maximum allowed pattern length. Patterns longer than this are rejected.

```typescript
// Strict - only short patterns
const strict = new SafeRegex({ maxLength: 100 });

// Permissive - allow longer patterns
const permissive = new SafeRegex({ maxLength: 2000 });
```

**Considerations:**

- Shorter limits = lower risk, but may reject legitimate patterns
- Very long patterns are rare in practice
- Consider your use case's typical pattern lengths

### timeoutMs

Timeout for regex operations in milliseconds.

```typescript
// Fast timeout - fail quickly
const fast = new SafeRegex({ timeoutMs: 100 });

// Longer timeout - allow more complex operations
const slow = new SafeRegex({ timeoutMs: 5000 });
```

**Important:** The timeout doesn't stop the regex (JavaScript limitation). It only controls when the promise rejects. Very dangerous patterns may continue consuming CPU.

### onBlock

Callback invoked when a pattern is blocked.

```typescript
const safe = new SafeRegex({
  onBlock: (message, pattern) => {
    // Log security event
    logger.warn('Regex pattern blocked', {
      message,
      pattern: pattern.substring(0, 100), // Truncate for safety
      timestamp: new Date().toISOString(),
    });
    
    // Alert on suspicious activity
    if (blockedCount++ > 10) {
      alertSecurityTeam();
    }
  }
});
```

**Use cases:**

- Security logging
- Rate limiting
- Alerting on suspicious patterns
- Analytics on pattern usage

### onWarning

Callback for non-blocking warnings.

```typescript
const safe = new SafeRegex({
  onWarning: (message, pattern) => {
    console.warn(`Pattern warning: ${message}`);
  }
});
```

Warnings might include:
- Pattern is close to length limit
- Pattern has complexity that's borderline
- Pattern might be slow but isn't blocked

## Preset Configurations

### Strict Mode

For maximum security (e.g., public-facing APIs):

```typescript
const strictSafe = new SafeRegex({
  maxLength: 100,
  timeoutMs: 100,
  onBlock: (msg, pattern) => {
    // Log all blocked patterns
    securityLog.warn('Pattern blocked', { msg, pattern });
  },
});
```

### Permissive Mode

For trusted inputs (e.g., internal tools):

```typescript
const permissiveSafe = new SafeRegex({
  maxLength: 2000,
  timeoutMs: 5000,
});
```

### Audit Mode

Log everything without blocking:

```typescript
const auditSafe = new SafeRegex({
  onBlock: (msg, pattern) => {
    auditLog.log('Would block', { msg, pattern });
  },
  onWarning: (msg, pattern) => {
    auditLog.log('Warning', { msg, pattern });
  },
});
```

## Per-Operation Configuration

You can create multiple instances for different contexts:

```typescript
// Strict for user input
const userInputSafe = new SafeRegex({ maxLength: 100, timeoutMs: 100 });

// Permissive for config files
const configSafe = new SafeRegex({ maxLength: 1000, timeoutMs: 2000 });

// Use appropriately
const userResult = userInputSafe.create(userProvidedPattern);
const configResult = configSafe.create(configPattern);
```

## Environment-Based Configuration

```typescript
import { SafeRegex } from '@theunwalked/pressurelid';

const config = {
  production: { maxLength: 200, timeoutMs: 100 },
  development: { maxLength: 1000, timeoutMs: 5000 },
  test: { maxLength: 500, timeoutMs: 1000 },
};

const env = process.env.NODE_ENV || 'development';
const safe = new SafeRegex(config[env] || config.development);
```

## Monitoring and Metrics

Track pattern usage for security and performance:

```typescript
const metrics = {
  blocked: 0,
  warnings: 0,
  timeouts: 0,
};

const safe = new SafeRegex({
  onBlock: () => metrics.blocked++,
  onWarning: () => metrics.warnings++,
});

// In your health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    regex: metrics,
  });
});
```

## Troubleshooting

### Pattern Falsely Blocked

If a legitimate pattern is blocked:

1. Check the `reason` code
2. Consider rewriting the pattern
3. Use `fromUserInput()` for literal matching
4. Consider increasing limits if appropriate

```typescript
const result = safe.create(pattern);
if (!result.safe) {
  console.log('Blocked because:', result.reason);
  // Decide if limits should be adjusted
}
```

### Timeouts Too Aggressive

If legitimate operations timeout:

1. Increase `timeoutMs`
2. Pre-validate patterns separately
3. Use batching for large inputs

```typescript
// Instead of one long operation
for (const item of hugeList) {
  await safe.testWithTimeout(regex, item);
}

// Consider batching
const batch = hugeList.slice(0, 100);
// Process batch, then next batch
```

### Performance Concerns

Pattern analysis is fast (<1ms typically), but for many patterns:

1. Cache analysis results
2. Analyze at startup, not per-request
3. Use a single SafeRegex instance per configuration

```typescript
// Cache at module level
const safe = new SafeRegex();
const cachedPatterns = new Map<string, SafeRegexResult>();

function getPattern(pattern: string): SafeRegexResult {
  if (!cachedPatterns.has(pattern)) {
    cachedPatterns.set(pattern, safe.create(pattern));
  }
  return cachedPatterns.get(pattern)!;
}
```

