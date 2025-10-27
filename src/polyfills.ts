/**
 * This file includes polyfills needed by the application.
 * Loaded before Angular and other dependencies.
 */

import { Buffer } from 'buffer';
import { EventEmitter } from 'events';
import * as process from 'process';

// Make Buffer available globally for Node.js libraries used in browser
(window as any).global = window;
(window as any).Buffer = Buffer;
(window as any).process = process;
(window as any).EventEmitter = EventEmitter;

// Polyfill process.browser
if (!(window as any).process.browser) {
  (window as any).process.browser = true;
}

// Export for module resolution
export {};

