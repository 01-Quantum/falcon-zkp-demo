/**
 * This file includes polyfills needed by the application.
 * Loaded before Angular and other dependencies.
 */

import { Buffer } from 'buffer';

// Make Buffer available globally for Node.js libraries used in browser
(window as any).global = window;
(window as any).Buffer = Buffer;
(window as any).process = {
  env: {},
  version: '',
  nextTick: (fn: Function) => setTimeout(fn, 0)
};

// Export for module resolution
export {};

