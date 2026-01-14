export const VERSION = '__VERSION__';

// Types
export type {
    SafeRegexConfig,
    SafeRegexResult,
    SafeRegexReason,
} from './types';

export { DEFAULT_CONFIG } from './types';

// Analysis (for advanced users)
export { analyzePattern, quickSafetyCheck } from './analyze';

// Main API
export {
    SafeRegex,
    createSafeRegex,
    globToSafeRegex,
    escapeForRegex,
} from './safe-regex';

